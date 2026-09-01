'use strict';

/**
 * Copy generated PDFs into the app's DATA_DIR and register metadata.
 * Uses config/database.js for DATA_DIR only — does NOT generate PDF content.
 *
 * Upserts on (course_id, lessonId): existing entries are replaced (old upload
 * file removed when safe, metadata row updated, course_lessons.document_id set).
 * Entries for courses/lessons outside the batch are preserved.
 *
 * Usage:
 *   node scripts/seed-pdfs.js --dry-run
 *   node scripts/seed-pdfs.js
 *   node scripts/seed-pdfs.js --prune-orphans
 *
 * Flags:
 *   --dry-run        Show would-insert / would-replace / would-delete-old-file counts
 *   --force          Alias for default upsert (always replace; re-copy even if unchanged)
 *   --prune-orphans  After seeding, remove stale metadata/files for batch courses
 *                    and unreferenced PDFs under uploads/course-pdfs/
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { dataDirectory } = require('../config/database');
const { getDb } = require('../config/database');

const ROOT = path.join(__dirname, '..');
const CHAPTER_CATALOG_PATH = path.join(ROOT, 'scripts', 'chapter-catalog.json');
const COURSE_CATALOG_PATH = path.join(ROOT, 'scripts', 'course-catalog.json');
const SOURCE_DIR = path.join(__dirname, 'output', 'pdfs');
const METADATA_PATH = path.join(dataDirectory, 'course-pdfs.json');
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

function parseFilename(name) {
	const match = /^(.+)__ch(\d+)_l(\d+)\.pdf$/i.exec(name);
	if (!match) return null;
	return { courseId: match[1], chapterOrder: parseInt(match[2], 10), lessonOrder: parseInt(match[3], 10) };
}

function buildLessonIndex(chapterCatalog) {
	const index = new Map();
	const docLessonsByCourse = new Map();

	for (const course of chapterCatalog) {
		const courseId = String(course.course_id || '').trim();
		const docLessons = new Set();

		for (const chapter of course.chapters || []) {
			const chapterOrder = parseInt(chapter.chapter_order, 10) || 1;
			for (const lesson of chapter.lessons || []) {
				if (String(lesson.type || 'doc').toLowerCase() !== 'doc') continue;
				const lessonOrder = parseInt(lesson.lesson_order, 10) || 1;
				const lessonId = String(lesson.lesson_id || '').trim();
				docLessons.add(lessonId);
				const key = `${courseId}__ch${pad2(chapterOrder)}_l${pad2(lessonOrder)}`;
				index.set(key, {
					courseId,
					chapterOrder,
					lessonOrder,
					lessonId,
					lessonTitle: String(lesson.title || '').trim(),
					chapterTitle: String(chapter.title || '').trim(),
				});
			}
		}

		docLessonsByCourse.set(courseId, docLessons);
	}

	return { index, docLessonsByCourse };
}

function normalizePath(filePath) {
	return path.resolve(filePath).replace(/\\/g, '/').toLowerCase();
}

function isUnderUploadDir(filePath) {
	if (!filePath) return false;
	const resolved = normalizePath(filePath);
	const uploadResolved = normalizePath(UPLOAD_DIR);
	return resolved === uploadResolved || resolved.startsWith(`${uploadResolved}/`);
}

function safeDeleteUploadFile(filePath, dryRun, stats) {
	if (!filePath || !isUnderUploadDir(filePath)) {
		return false;
	}
	if (!fs.existsSync(filePath)) {
		return false;
	}
	if (dryRun) {
		stats.wouldDeleteOldFile += 1;
		return true;
	}
	fs.unlinkSync(filePath);
	stats.deletedOldFile += 1;
	return true;
}

function makeDocumentId() {
	return `pdf-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function makeDestPath(filename) {
	const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
	const destName = `${Date.now()}-${safeName}`;
	return path.join(UPLOAD_DIR, destName);
}

function buildDocument({ documentId, parsed, courseMeta, lesson, filename, destPath, stat }) {
	return {
		id: documentId,
		course: parsed.courseId,
		courseTitle: String(courseMeta.title || parsed.courseId),
		university: String(courseMeta.university || parsed.courseId.split('_')[0].toUpperCase()),
		lessonId: lesson.lessonId,
		lessonTitle: `${lesson.chapterTitle} - ${lesson.lessonTitle}`,
		originalName: filename,
		filePath: destPath,
		size: stat.size,
		createdAt: new Date().toISOString(),
	};
}

function indexMetadata(metadata) {
	const byLesson = new Map();
	const duplicates = [];

	metadata.forEach((doc, idx) => {
		if (!doc.course || !doc.lessonId) return;
		const key = lessonKey(doc.course, doc.lessonId);
		if (byLesson.has(key)) {
			duplicates.push(idx);
			return;
		}
		byLesson.set(key, { doc, idx });
	});

	return { byLesson, duplicates };
}

function pruneOrphanEntries({ metadata, batchCourses, seededKeys, docLessonsByCourse, dryRun, stats }) {
	const referencedPaths = new Set(
		metadata.map((doc) => doc.filePath).filter(Boolean).map((p) => normalizePath(p))
	);
	const kept = [];
	const removedDocs = [];

	for (const doc of metadata) {
		const courseId = String(doc.course || '').trim();
		const lid = String(doc.lessonId || '').trim();
		const key = lessonKey(courseId, lid);

		if (!batchCourses.has(courseId)) {
			kept.push(doc);
			continue;
		}

		if (seededKeys.has(key)) {
			kept.push(doc);
			continue;
		}

		const catalogDocLessons = docLessonsByCourse.get(courseId);
		if (catalogDocLessons && catalogDocLessons.has(lid)) {
			removedDocs.push(doc);
			stats.prunedMetadata += 1;
			if (doc.filePath && isUnderUploadDir(doc.filePath)) {
				const resolved = normalizePath(doc.filePath);
				referencedPaths.delete(resolved);
				safeDeleteUploadFile(doc.filePath, dryRun, stats);
			}
			continue;
		}

		kept.push(doc);
	}

	let orphanFiles = 0;
	if (fs.existsSync(UPLOAD_DIR)) {
		for (const name of fs.readdirSync(UPLOAD_DIR)) {
			if (!name.toLowerCase().endsWith('.pdf')) continue;
			const fullPath = normalizePath(path.join(UPLOAD_DIR, name));
			if (referencedPaths.has(fullPath)) continue;
			orphanFiles += 1;
			if (dryRun) {
				stats.wouldDeleteOrphanFile += 1;
			} else {
				fs.unlinkSync(fullPath);
				stats.deletedOrphanFile += 1;
			}
		}
	}

	return kept;
}

async function main() {
	const dryRun = process.argv.includes('--dry-run');
	const force = process.argv.includes('--force');
	const pruneOrphansFlag = process.argv.includes('--prune-orphans');

	if (!fs.existsSync(SOURCE_DIR)) {
		throw new Error(
			`Chưa có PDF nguồn. Chạy render trước:\n` +
				`  node scripts/render-pdfs.js\n` +
				`  Thư mục: ${SOURCE_DIR}`
		);
	}

	const chapterCatalog = loadJson(CHAPTER_CATALOG_PATH);
	const courseCatalog = loadJson(COURSE_CATALOG_PATH);
	const courseMap = new Map(courseCatalog.map((c) => [String(c.course_id).trim(), c]));
	const { index: lessonIndex, docLessonsByCourse } = buildLessonIndex(chapterCatalog);

	const pdfFiles = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith('.pdf')).sort();
	if (!pdfFiles.length) {
		throw new Error(`Không có file PDF trong ${SOURCE_DIR}`);
	}

	if (!dryRun) {
		fs.mkdirSync(UPLOAD_DIR, { recursive: true });
	}

	const metadata = readMetadata();
	let { byLesson: existingByLesson, duplicates } = indexMetadata(metadata);
	const db = dryRun ? null : await getDb();

	const stats = {
		wouldInsert: 0,
		wouldReplace: 0,
		wouldDeleteOldFile: 0,
		inserted: 0,
		replaced: 0,
		deletedOldFile: 0,
		skippedInvalid: 0,
		skippedNoCatalog: 0,
		updatedLessons: 0,
		prunedMetadata: 0,
		wouldDeleteOrphanFile: 0,
		deletedOrphanFile: 0,
		errors: [],
	};

	const seededKeys = new Set();
	const batchCourses = new Set();

	for (const filename of pdfFiles) {
		const parsed = parseFilename(filename);
		if (!parsed) {
			console.warn(`Bỏ qua tên file không hợp lệ: ${filename}`);
			stats.skippedInvalid += 1;
			continue;
		}

		batchCourses.add(parsed.courseId);

		const key = `${parsed.courseId}__ch${pad2(parsed.chapterOrder)}_l${pad2(parsed.lessonOrder)}`;
		const lesson = lessonIndex.get(key);
		if (!lesson) {
			console.warn(`Không khớp catalog: ${filename}`);
			stats.skippedNoCatalog += 1;
			continue;
		}

		const lk = lessonKey(parsed.courseId, lesson.lessonId);
		seededKeys.add(lk);

		const courseMeta = courseMap.get(parsed.courseId) || {};
		const sourcePath = path.join(SOURCE_DIR, filename);
		const existing = existingByLesson.get(lk);
		const stat = fs.statSync(sourcePath);
		const documentId = makeDocumentId();
		const destPath = makeDestPath(filename);

		const document = buildDocument({
			documentId,
			parsed,
			courseMeta,
			lesson,
			filename,
			destPath,
			stat,
		});

		if (existing) {
			stats.wouldReplace += 1;
			const oldDoc = existing.doc;
			const oldPath = oldDoc.filePath;
			const sameDest = oldPath && normalizePath(oldPath) === normalizePath(destPath);
			const shouldDeleteOld = oldPath && !sameDest;
			const shouldCopy = force || !sameDest;

			if (shouldDeleteOld) {
				safeDeleteUploadFile(oldPath, dryRun, stats);
			}

			console.log(`Replace ${parsed.courseId}/${lesson.lessonId}: ${oldDoc.id} → ${documentId}`);

			if (!dryRun) {
				try {
					if (shouldCopy) {
						fs.copyFileSync(sourcePath, destPath);
					}
					metadata[existing.idx] = document;
					existingByLesson.set(lk, { doc: document, idx: existing.idx });

					const result = await db.run(
						`UPDATE course_lessons SET document_id = ? WHERE course_id = ? AND lesson_id = ?`,
						[documentId, parsed.courseId, lesson.lessonId]
					);
					if (result.changes) stats.updatedLessons += 1;
					stats.replaced += 1;
				} catch (err) {
					stats.errors.push(`${filename}: ${err.message}`);
				}
			}
		} else {
			stats.wouldInsert += 1;

			if (!dryRun) {
				try {
					fs.copyFileSync(sourcePath, destPath);
					metadata.push(document);
					existingByLesson.set(lk, { doc: document, idx: metadata.length - 1 });
					stats.inserted += 1;

					const result = await db.run(
						`UPDATE course_lessons SET document_id = ? WHERE course_id = ? AND lesson_id = ?`,
						[documentId, parsed.courseId, lesson.lessonId]
					);
					if (result.changes) stats.updatedLessons += 1;
				} catch (err) {
					stats.errors.push(`${filename}: ${err.message}`);
				}
			}
		}
	}

	if (duplicates.length && !dryRun) {
		for (const idx of duplicates.sort((a, b) => b - a)) {
			const doc = metadata[idx];
			safeDeleteUploadFile(doc.filePath, false, stats);
			metadata.splice(idx, 1);
		}
	}

	let finalMetadata = metadata;
	if (pruneOrphansFlag) {
		finalMetadata = pruneOrphanEntries({
			metadata,
			batchCourses,
			seededKeys,
			docLessonsByCourse,
			dryRun,
			stats,
		});
	}

	if (!dryRun) {
		writeMetadata(finalMetadata);
	}

	console.log(dryRun ? 'Dry run complete.' : 'Seed complete.');
	console.log(`  Source PDFs:              ${pdfFiles.length}`);
	console.log(`  Batch courses:            ${batchCourses.size}`);
	if (dryRun) {
		console.log(`  Would insert:             ${stats.wouldInsert}`);
		console.log(`  Would replace:            ${stats.wouldReplace}`);
		console.log(`  Would delete old file:    ${stats.wouldDeleteOldFile}`);
		if (pruneOrphansFlag) {
			console.log(`  Would prune metadata:     ${stats.prunedMetadata}`);
			console.log(`  Would delete orphan file: ${stats.wouldDeleteOrphanFile}`);
		}
	} else {
		console.log(`  Inserted:                 ${stats.inserted}`);
		console.log(`  Replaced:                 ${stats.replaced}`);
		console.log(`  Deleted old file:         ${stats.deletedOldFile}`);
		if (pruneOrphansFlag) {
			console.log(`  Pruned metadata:          ${stats.prunedMetadata}`);
			console.log(`  Deleted orphan file:      ${stats.deletedOrphanFile}`);
		}
		console.log(`  Skipped (invalid name):   ${stats.skippedInvalid}`);
		console.log(`  Skipped (no catalog):     ${stats.skippedNoCatalog}`);
		console.log(`  Metadata entries:         ${finalMetadata.length}`);
		console.log(`  Metadata path:            ${METADATA_PATH}`);
		console.log(`  Upload dir:               ${UPLOAD_DIR}`);
		console.log(`  Lessons updated (document_id): ${stats.updatedLessons}`);
	}

	if (stats.errors.length) {
		console.log(`  Errors (${stats.errors.length}):`);
		for (const err of stats.errors) {
			console.log(`    - ${err}`);
		}
		process.exitCode = 1;
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
