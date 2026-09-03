'use strict';

/**
 * Rebuild course-pdfs.json from the PDFs already present in DATA_DIR and the
 * document_id values already stored in course_lessons.
 *
 * Use this when the manifest is lost or corrupted but uploads/course-pdfs/ and
 * the database are intact. Unlike seed-pdfs.js this never copies files, never
 * renders PDFs and never writes to the database: every manifest id is taken
 * from the existing course_lessons.document_id so current links keep working.
 *
 * Matching: uploads/course-pdfs/<timestamp>-<course_id>__chNN_lNN.pdf is mapped
 * through scripts/chapter-catalog.json to a lesson_id, then to the
 * course_lessons row for that (course_id, lesson_id) pair.
 *
 * Entries already in the manifest are preserved when their filePath still
 * exists on disk and they do not collide with a rebuilt (course, lessonId) key.
 *
 * Usage:
 *   node scripts/repair-pdf-manifest.js --dry-run
 *   node scripts/repair-pdf-manifest.js
 *
 * Flags:
 *   --dry-run  Report what would be written without touching any file
 *   --no-backup  Skip writing course-pdfs.json.broken-backup
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { dataDirectory, getDb } = require('../config/database');

const ROOT = path.join(__dirname, '..');
const CHAPTER_CATALOG_PATH = path.join(ROOT, 'scripts', 'chapter-catalog.json');
const COURSE_CATALOG_PATH = path.join(ROOT, 'scripts', 'course-catalog.json');
const METADATA_PATH = path.join(dataDirectory, 'course-pdfs.json');
const BACKUP_PATH = `${METADATA_PATH}.broken-backup`;
const UPLOAD_DIR = path.join(dataDirectory, 'uploads', 'course-pdfs');

function loadJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readMetadata() {
	try {
		return JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
	} catch {
		return [];
	}
}

function writeMetadata(rows) {
	fs.writeFileSync(METADATA_PATH, JSON.stringify(rows, null, 2));
}

function pad2(n) {
	return String(n).padStart(2, '0');
}

function lessonKey(courseId, lessonId) {
	return `${courseId}\0${lessonId}`;
}

function parseUploadName(name) {
	const match = /^(\d+)-(.+)__ch(\d+)_l(\d+)\.pdf$/i.exec(name);
	if (!match) return null;
	return {
		courseId: match[2],
		chapterOrder: parseInt(match[3], 10),
		lessonOrder: parseInt(match[4], 10),
		originalName: `${match[2]}__ch${match[3]}_l${match[4]}.pdf`,
		uploadedAt: parseInt(match[1], 10),
	};
}

function buildLessonIndex(chapterCatalog) {
	const index = new Map();

	for (const course of chapterCatalog) {
		const courseId = String(course.course_id || '').trim();
		for (const chapter of course.chapters || []) {
			const chapterOrder = parseInt(chapter.chapter_order, 10) || 1;
			for (const lesson of chapter.lessons || []) {
				if (String(lesson.type || 'doc').toLowerCase() !== 'doc') continue;
				const lessonOrder = parseInt(lesson.lesson_order, 10) || 1;
				const key = `${courseId}__ch${pad2(chapterOrder)}_l${pad2(lessonOrder)}`;
				index.set(key, {
					courseId,
					lessonId: String(lesson.lesson_id || '').trim(),
					lessonTitle: String(lesson.title || '').trim(),
					chapterTitle: String(chapter.title || '').trim(),
				});
			}
		}
	}

	return index;
}

function buildDocument({ documentId, parsed, courseMeta, lesson, destPath, stat }) {
	return {
		id: documentId,
		course: parsed.courseId,
		courseTitle: String(courseMeta.title || parsed.courseId),
		university: String(courseMeta.university || parsed.courseId.split('_')[0].toUpperCase()),
		lessonId: lesson.lessonId,
		lessonTitle: `${lesson.chapterTitle} - ${lesson.lessonTitle}`,
		originalName: parsed.originalName,
		filePath: destPath,
		size: stat.size,
		createdAt: new Date(parsed.uploadedAt).toISOString(),
	};
}

async function main() {
	const dryRun = process.argv.includes('--dry-run');
	const noBackup = process.argv.includes('--no-backup');

	if (!fs.existsSync(UPLOAD_DIR)) {
		throw new Error(`Không tìm thấy thư mục upload: ${UPLOAD_DIR}`);
	}

	const chapterCatalog = loadJson(CHAPTER_CATALOG_PATH);
	const courseCatalog = loadJson(COURSE_CATALOG_PATH);
	const courseMap = new Map(courseCatalog.map((c) => [String(c.course_id).trim(), c]));
	const lessonIndex = buildLessonIndex(chapterCatalog);

	const db = await getDb();
	const lessonRows = await db.all(
		`SELECT course_id, lesson_id, document_id FROM course_lessons WHERE document_id IS NOT NULL AND document_id != ''`
	);
	const documentIdByLesson = new Map(
		lessonRows.map((row) => [lessonKey(row.course_id, row.lesson_id), String(row.document_id)])
	);

	const uploadFiles = fs.readdirSync(UPLOAD_DIR).filter((f) => f.toLowerCase().endsWith('.pdf')).sort();

	const stats = {
		rebuilt: 0,
		preserved: 0,
		droppedStale: 0,
		skippedUnparsed: 0,
		skippedNoCatalog: 0,
		skippedNoDocumentId: 0,
	};

	const rebuilt = [];
	const rebuiltKeys = new Set();
	const claimedFiles = new Set();

	for (const filename of uploadFiles) {
		const parsed = parseUploadName(filename);
		if (!parsed) {
			stats.skippedUnparsed += 1;
			continue;
		}

		const catalogKey = `${parsed.courseId}__ch${pad2(parsed.chapterOrder)}_l${pad2(parsed.lessonOrder)}`;
		const lesson = lessonIndex.get(catalogKey);
		if (!lesson) {
			console.warn(`Không khớp catalog: ${filename}`);
			stats.skippedNoCatalog += 1;
			continue;
		}

		const lk = lessonKey(parsed.courseId, lesson.lessonId);
		const documentId = documentIdByLesson.get(lk);
		if (!documentId) {
			console.warn(`Không có document_id trong DB: ${filename} (${lk.replace('\0', '/')})`);
			stats.skippedNoDocumentId += 1;
			continue;
		}

		const destPath = path.join(UPLOAD_DIR, filename);
		rebuilt.push(
			buildDocument({
				documentId,
				parsed,
				courseMeta: courseMap.get(parsed.courseId) || {},
				lesson,
				destPath,
				stat: fs.statSync(destPath),
			})
		);
		rebuiltKeys.add(lk);
		claimedFiles.add(filename);
		stats.rebuilt += 1;
	}

	// Keep pre-existing entries that still point at a real file and do not
	// duplicate a rebuilt lesson — those are genuine manual uploads.
	const preserved = [];
	for (const doc of readMetadata()) {
		const lk = lessonKey(String(doc.course || '').trim(), String(doc.lessonId || '').trim());
		const filePresent = Boolean(doc.filePath) && fs.existsSync(doc.filePath);
		if (!filePresent || rebuiltKeys.has(lk)) {
			console.log(
				`Bỏ entry hỏng: ${doc.id} (${doc.course}/${doc.lessonId})` +
					`${filePresent ? ' — trùng bài đã dựng lại' : ' — file không tồn tại'}`
			);
			stats.droppedStale += 1;
			continue;
		}
		preserved.push(doc);
		stats.preserved += 1;
	}

	const finalMetadata = [...preserved, ...rebuilt];

	if (!dryRun) {
		if (!noBackup && fs.existsSync(METADATA_PATH)) {
			fs.copyFileSync(METADATA_PATH, BACKUP_PATH);
		}
		writeMetadata(finalMetadata);
	}

	const orphanFiles = uploadFiles.filter((f) => !claimedFiles.has(f));

	console.log(dryRun ? 'Dry run complete.' : 'Repair complete.');
	console.log(`  Upload files:             ${uploadFiles.length}`);
	console.log(`  Rebuilt entries:          ${stats.rebuilt}`);
	console.log(`  Preserved entries:        ${stats.preserved}`);
	console.log(`  Dropped stale entries:    ${stats.droppedStale}`);
	console.log(`  Skipped (invalid name):   ${stats.skippedUnparsed}`);
	console.log(`  Skipped (no catalog):     ${stats.skippedNoCatalog}`);
	console.log(`  Skipped (no document_id): ${stats.skippedNoDocumentId}`);
	console.log(`  Unreferenced upload files: ${orphanFiles.length}`);
	console.log(`  Metadata entries:         ${finalMetadata.length}`);
	console.log(`  Metadata path:            ${METADATA_PATH}`);
	if (!dryRun && !noBackup) console.log(`  Backup path:              ${BACKUP_PATH}`);
	console.log(`  Upload dir:               ${UPLOAD_DIR}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
