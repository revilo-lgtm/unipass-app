'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CATALOG_PATH = path.join(__dirname, 'chapter-catalog.json');
const INSERT_SQL = `
	INSERT INTO course_lessons (course_id, chapter_id, lesson_order, lesson_id, title, type, document_id, meta_text)
	VALUES (?, ?, ?, ?, ?, ?, NULL, '')
`;

function loadCatalog() {
	if (!fs.existsSync(CATALOG_PATH)) {
		throw new Error(`Không tìm thấy catalog: ${CATALOG_PATH}`);
	}
	const courses = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
	if (!Array.isArray(courses) || courses.length === 0) {
		throw new Error('Catalog chương học trống.');
	}
	return courses;
}

function parseArgs(argv) {
	const args = { email: 'admin', password: process.env.ADMIN_PASSWORD || '', api: '', db: true };
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		if (token === '--api') {
			const value = argv[++i];
			if (!value || value.startsWith('--')) throw new Error('Thiếu <baseUrl> sau --api.');
			args.api = String(value).replace(/\/+$/, '');
			args.db = false;
		} else if (token === '--db') {
			args.db = true;
			args.api = '';
		} else if (token === '--password') {
			const value = argv[++i];
			if (!value || value.startsWith('--')) throw new Error('Thiếu mật khẩu sau --password.');
			args.password = String(value);
		} else if (token === '--email') {
			const value = argv[++i];
			if (!value || value.startsWith('--')) throw new Error('Thiếu email sau --email.');
			args.email = String(value);
		} else if (token === '--help' || token === '-h') {
			args.help = true;
		} else {
			throw new Error(`Tham số không hợp lệ: ${token}`);
		}
	}
	return args;
}

function printCounts(inserted, skipped, missingChapters) {
	console.log(`Seeded ${inserted + skipped} lessons: ${inserted} inserted, ${skipped} already present.`);
	if (missingChapters.length) {
		console.warn(`Bỏ qua ${missingChapters.length} chương chưa có trong DB (chạy seed-chapters trước): ${missingChapters.slice(0, 8).join(', ')}${missingChapters.length > 8 ? '…' : ''}`);
	}
}

function chapterKey(courseId, title) {
	return `${courseId}\0${String(title || '').trim().toLowerCase()}`;
}

function lessonKey(courseId, lessonId, chapterId, title) {
	if (lessonId) return `${courseId}\0id:${String(lessonId).trim().toLowerCase()}`;
	return `${courseId}\0ch:${chapterId}\0${String(title || '').trim().toLowerCase()}`;
}

function flattenCatalog(courses) {
	const rows = [];
	for (const course of courses) {
		const courseId = String(course.course_id || '').trim();
		if (!courseId) continue;
		const chapters = Array.isArray(course.chapters) ? course.chapters : [];
		chapters.forEach((ch, chIdx) => {
			const chapterTitle = String((ch && ch.title) || '').trim();
			if (!chapterTitle) return;
			const chapterOrder = parseInt(ch.chapter_order, 10);
			const lessons = Array.isArray(ch.lessons) ? ch.lessons : [];
			lessons.forEach((les, lesIdx) => {
				if (les && les.type === 'quiz') return;
				const title = String((les && les.title) || '').trim();
				if (!title) return;
				const order = parseInt(les.lesson_order, 10);
				const resolvedOrder = Number.isFinite(order) && order > 0 ? order : (lesIdx + 1);
				const resolvedChapterOrder = Number.isFinite(chapterOrder) && chapterOrder > 0 ? chapterOrder : (chIdx + 1);
				rows.push({
					course_id: courseId,
					chapter_title: chapterTitle,
					lesson_order: resolvedOrder,
					lesson_id: String((les && les.lesson_id) || `chapter-${resolvedChapterOrder}-lesson-${resolvedOrder}`).trim(),
					title,
					type: 'doc',
				});
			});
		});
	}
	return rows;
}

async function seedViaDb(courses) {
	const { getDb } = require('../config/database');
	const db = await getDb();
	const rows = flattenCatalog(courses);

	const chapterMap = new Map();
	for (const ch of await db.all('SELECT id, course_id, title FROM course_chapters')) {
		chapterMap.set(chapterKey(ch.course_id, ch.title), ch);
	}

	const existing = new Set();
	for (const les of await db.all('SELECT course_id, chapter_id, lesson_id, title FROM course_lessons')) {
		existing.add(lessonKey(les.course_id, les.lesson_id));
		existing.add(lessonKey(les.course_id, '', les.chapter_id, les.title));
	}

	let inserted = 0;
	let skipped = 0;
	const missingChapters = [];
	const warnedMissing = new Set();

	for (const row of rows) {
		const chapter = chapterMap.get(chapterKey(row.course_id, row.chapter_title));
		if (!chapter) {
			const label = `${row.course_id} / ${row.chapter_title}`;
			if (!warnedMissing.has(label)) {
				warnedMissing.add(label);
				missingChapters.push(label);
			}
			continue;
		}
		if (
			existing.has(lessonKey(row.course_id, row.lesson_id)) ||
			existing.has(lessonKey(row.course_id, '', chapter.id, row.title))
		) {
			skipped += 1;
			continue;
		}
		await db.run(INSERT_SQL, [row.course_id, chapter.id, row.lesson_order, row.lesson_id, row.title, row.type]);
		existing.add(lessonKey(row.course_id, row.lesson_id));
		existing.add(lessonKey(row.course_id, '', chapter.id, row.title));
		inserted += 1;
	}

	printCounts(inserted, skipped, missingChapters);
}

async function requestJson(url, options) {
	const response = await fetch(url, options);
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(data.message || `HTTP ${response.status} ${url}`);
	}
	return data;
}

async function seedViaApi(courses, baseUrl, email, password) {
	if (!password) {
		throw new Error('Thiếu mật khẩu admin. Dùng --password <pwd> hoặc biến môi trường ADMIN_PASSWORD.');
	}

	const deviceId = crypto.randomUUID();
	const login = await requestJson(`${baseUrl}/api/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password, deviceId }),
	});
	const token = login.token;
	if (!token) throw new Error('Đăng nhập admin thất bại (không nhận được token).');

	const authHeaders = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`,
	};

	const rows = flattenCatalog(courses);
	let inserted = 0;
	let skipped = 0;
	const missingChapters = [];
	const warnedMissing = new Set();
	const syllabusCache = new Map();

	async function loadSyllabus(courseId) {
		if (syllabusCache.has(courseId)) return syllabusCache.get(courseId);
		const data = await requestJson(`${baseUrl}/api/courses/syllabus/${encodeURIComponent(courseId)}`);
		const chapters = new Map();
		const lessons = new Set();
		for (const ch of data.chapters || []) {
			chapters.set(String(ch.title || '').trim().toLowerCase(), ch);
			for (const les of ch.lessons || []) {
				if (les.lesson_id) lessons.add(String(les.lesson_id).trim().toLowerCase());
				if (les.title) lessons.add(`title:${ch.id}:${String(les.title).trim().toLowerCase()}`);
			}
		}
		const packed = { chapters, lessons };
		syllabusCache.set(courseId, packed);
		return packed;
	}

	for (const row of rows) {
		let syllabus;
		try {
			syllabus = await loadSyllabus(row.course_id);
		} catch (err) {
			const label = `${row.course_id} / ${row.chapter_title}`;
			if (!warnedMissing.has(label)) {
				warnedMissing.add(label);
				missingChapters.push(label);
			}
			continue;
		}

		const chapter = syllabus.chapters.get(row.chapter_title.toLowerCase());
		if (!chapter) {
			const label = `${row.course_id} / ${row.chapter_title}`;
			if (!warnedMissing.has(label)) {
				warnedMissing.add(label);
				missingChapters.push(label);
			}
			continue;
		}

		if (
			syllabus.lessons.has(row.lesson_id.toLowerCase()) ||
			syllabus.lessons.has(`title:${chapter.id}:${row.title.toLowerCase()}`)
		) {
			skipped += 1;
			continue;
		}

		await requestJson(`${baseUrl}/api/admin/course-lessons`, {
			method: 'POST',
			headers: authHeaders,
			body: JSON.stringify({
				course_id: row.course_id,
				chapter_id: chapter.id,
				title: row.title,
				type: 'doc',
				lesson_id: row.lesson_id,
				lesson_order: row.lesson_order,
			}),
		});
		syllabus.lessons.add(row.lesson_id.toLowerCase());
		syllabus.lessons.add(`title:${chapter.id}:${row.title.toLowerCase()}`);
		inserted += 1;
	}

	printCounts(inserted, skipped, missingChapters);
}

async function main() {
	let args;
	try {
		args = parseArgs(process.argv.slice(2));
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}

	if (args.help) {
		console.log('Usage:');
		console.log('  node scripts/seed-lessons.js');
		console.log('  node scripts/seed-lessons.js --db');
		console.log('  railway run node scripts/seed-lessons.js');
		console.log('  node scripts/seed-lessons.js --api <baseUrl> [--password <pwd>]');
		process.exit(0);
	}

	const courses = loadCatalog();
	if (args.api) {
		await seedViaApi(courses, args.api, args.email, args.password);
	} else {
		await seedViaDb(courses);
	}
}

main().catch((err) => {
	console.error('Seed lessons failed:', err.message || err);
	process.exit(1);
});
