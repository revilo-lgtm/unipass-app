'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CATALOG_PATH = path.join(__dirname, 'chapter-catalog.json');
const INSERT_SQL = `
	INSERT INTO course_chapters (course_id, chapter_order, title, meta)
	VALUES (?, ?, ?, ?)
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

function printCounts(total, inserted, skipped, missingCourses) {
	console.log(`Seeded ${total} chapters: ${inserted} inserted, ${skipped} already present.`);
	if (missingCourses.length) {
		console.warn(`Bỏ qua ${missingCourses.length} môn chưa có trong course_details: ${missingCourses.join(', ')}`);
	}
}

function chapterKey(courseId, title) {
	return `${courseId}\0${String(title || '').trim().toLowerCase()}`;
}

function flattenCatalog(courses) {
	const rows = [];
	for (const course of courses) {
		const courseId = String(course.course_id || '').trim();
		const chapters = Array.isArray(course.chapters) ? course.chapters : [];
		if (!courseId) {
			console.warn('Bỏ qua bản ghi thiếu course_id.');
			continue;
		}
		chapters.forEach((ch, idx) => {
			const title = String((ch && ch.title) || '').trim();
			if (!title) {
				console.warn(`Bỏ qua chương thiếu title trong ${courseId}.`);
				return;
			}
			const order = parseInt(ch.chapter_order, 10);
			rows.push({
				course_id: courseId,
				chapter_order: Number.isFinite(order) && order > 0 ? order : (idx + 1),
				title,
				meta: String((ch && ch.meta) || '').trim(),
			});
		});
	}
	return rows;
}

async function seedViaDb(courses) {
	const { getDb } = require('../config/database');
	const db = await getDb();
	const rows = flattenCatalog(courses);
	const existingCourses = new Set(
		(await db.all('SELECT course_id FROM course_details')).map(r => r.course_id)
	);
	const existingChapters = new Set(
		(await db.all('SELECT course_id, title FROM course_chapters')).map(r => chapterKey(r.course_id, r.title))
	);

	let inserted = 0;
	let skipped = 0;
	const missingCourses = [];
	const warnedMissing = new Set();

	for (const row of rows) {
		if (!existingCourses.has(row.course_id)) {
			if (!warnedMissing.has(row.course_id)) {
				warnedMissing.add(row.course_id);
				missingCourses.push(row.course_id);
			}
			continue;
		}
		if (existingChapters.has(chapterKey(row.course_id, row.title))) {
			skipped += 1;
			continue;
		}
		await db.run(INSERT_SQL, [row.course_id, row.chapter_order, row.title, row.meta]);
		existingChapters.add(chapterKey(row.course_id, row.title));
		inserted += 1;
	}

	printCounts(inserted + skipped, inserted, skipped, missingCourses);
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

	const existingRes = await requestJson(`${baseUrl}/api/admin/courses-list`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	const existingCourses = new Set((existingRes.courses || []).map(c => c.course_id));

	const rows = flattenCatalog(courses);
	let inserted = 0;
	let skipped = 0;
	const missingCourses = [];
	const warnedMissing = new Set();
	const existingByCourse = new Map();

	async function existingTitles(courseId) {
		if (existingByCourse.has(courseId)) return existingByCourse.get(courseId);
		const syllabus = await requestJson(`${baseUrl}/api/courses/syllabus/${encodeURIComponent(courseId)}`);
		const titles = new Set((syllabus.chapters || []).map(ch => String(ch.title || '').trim().toLowerCase()));
		existingByCourse.set(courseId, titles);
		return titles;
	}

	for (const row of rows) {
		if (!existingCourses.has(row.course_id)) {
			if (!warnedMissing.has(row.course_id)) {
				warnedMissing.add(row.course_id);
				missingCourses.push(row.course_id);
			}
			continue;
		}

		const titles = await existingTitles(row.course_id);
		if (titles.has(row.title.toLowerCase())) {
			skipped += 1;
			continue;
		}

		await requestJson(`${baseUrl}/api/admin/course-chapters`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				course_id: row.course_id,
				title: row.title,
				chapter_order: row.chapter_order,
				meta: row.meta,
			}),
		});
		titles.add(row.title.toLowerCase());
		inserted += 1;
	}

	printCounts(inserted + skipped, inserted, skipped, missingCourses);
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
		console.log('  node scripts/seed-chapters.js');
		console.log('  node scripts/seed-chapters.js --db');
		console.log('  railway run node scripts/seed-chapters.js');
		console.log('  node scripts/seed-chapters.js --api <baseUrl> [--password <pwd>]');
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
	console.error('Seed chapters failed:', err.message || err);
	process.exit(1);
});
