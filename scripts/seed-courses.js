'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CATALOG_PATH = path.join(__dirname, 'course-catalog.json');
const UPSERT_SQL = `
	INSERT INTO course_details (course_id, title, university, description, updated_at)
	VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
	ON CONFLICT(course_id) DO UPDATE SET
		title = excluded.title,
		university = COALESCE(excluded.university, course_details.university),
		description = excluded.description,
		updated_at = CURRENT_TIMESTAMP
`;

function loadCatalog() {
	if (!fs.existsSync(CATALOG_PATH)) {
		throw new Error(`Không tìm thấy catalog: ${CATALOG_PATH}`);
	}
	const courses = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
	if (!Array.isArray(courses) || courses.length === 0) {
		throw new Error('Catalog môn học trống.');
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

function printCounts(total, inserted, updated) {
	console.log(`Seeded ${total} courses: ${inserted} inserted, ${updated} already present/updated.`);
}

async function seedViaDb(courses) {
	const { getDb } = require('../config/database');
	const db = await getDb();
	let inserted = 0;
	let updated = 0;

	for (const course of courses) {
		const courseId = String(course.course_id || '').trim();
		const title = String(course.title || '').trim();
		const university = String(course.university || '').trim();
		const description = String(course.description || '').trim();
		if (!courseId || !title) {
			console.warn(`Bỏ qua bản ghi thiếu course_id/title.`);
			continue;
		}

		const existing = await db.get('SELECT course_id FROM course_details WHERE course_id = ?', [courseId]);
		await db.run(UPSERT_SQL, [courseId, title, university, description]);
		if (existing) updated += 1;
		else inserted += 1;
	}

	printCounts(inserted + updated, inserted, updated);
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
	const existingIds = new Set((existingRes.courses || []).map(c => c.course_id));

	let inserted = 0;
	let updated = 0;
	for (const course of courses) {
		const courseId = String(course.course_id || '').trim();
		const title = String(course.title || '').trim();
		const university = String(course.university || '').trim();
		const description = String(course.description || '').trim();
		if (!courseId || !title) {
			console.warn(`Bỏ qua bản ghi thiếu course_id/title.`);
			continue;
		}

		await requestJson(`${baseUrl}/api/admin/course-details/${encodeURIComponent(courseId)}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ title, university, description }),
		});

		if (existingIds.has(courseId)) updated += 1;
		else inserted += 1;
	}

	printCounts(inserted + updated, inserted, updated);
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
		console.log('  node scripts/seed-courses.js');
		console.log('  node scripts/seed-courses.js --db');
		console.log('  railway run node scripts/seed-courses.js');
		console.log('  node scripts/seed-courses.js --api <baseUrl> [--password <pwd>]');
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
	console.error('Seed courses failed:', err.message || err);
	process.exit(1);
});
