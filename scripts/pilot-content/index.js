'use strict';

const fs = require('fs');
const path = require('path');
const { applySections, topicFromLesson, wordCount } = require('./pilot-writer');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const PILOT_DIR = path.join(__dirname);
const SKIP = new Set(['bk_calculus_1', 'ftu_english']);

/** @type {Record<string, Record<string, string[]>>} */
const OVERRIDES = {};

for (const file of fs.readdirSync(PILOT_DIR).filter((f) => f.endsWith('.js') && f !== 'generate.js' && f !== 'index.js')) {
	const mod = require(path.join(PILOT_DIR, file));
	const courseId = file.replace('.js', '');
	OVERRIDES[courseId] = mod;
}

function loadGenerator() {
	return require('./generate');
}

function rewriteCourse(courseId, generate) {
	const filePath = path.join(CONTENT_DIR, `${courseId}.json`);
	if (!fs.existsSync(filePath)) {
		console.warn(`Skip missing: ${courseId}`);
		return null;
	}
	const lessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
	const override = OVERRIDES[courseId] || {};
	const rewritten = lessons.map((lesson) => {
		if (override[lesson.lesson_id]) {
			return applySections(lesson, override[lesson.lesson_id]);
		}
		const bodies = generate(lesson);
		return applySections(lesson, bodies);
	});
	fs.writeFileSync(filePath, JSON.stringify(rewritten, null, 2) + '\n');
	const stats = rewritten.map((l) => {
		const total = l.sections.reduce((s, sec) => s + wordCount(sec.body), 0);
		return { id: l.lesson_id, words: total };
	});
	return { courseId, lessons: rewritten.length, stats };
}

function main() {
	const args = process.argv.slice(2);
	const only = args.length ? args : null;
	const generate = loadGenerator();

	const files = fs
		.readdirSync(CONTENT_DIR)
		.filter((f) => f.endsWith('.json'))
		.map((f) => f.replace('.json', ''))
		.filter((id) => !SKIP.has(id))
		.filter((id) => !only || only.includes(id));

	const results = [];
	for (const courseId of files) {
		const r = rewriteCourse(courseId, generate);
		if (r) {
			const minW = Math.min(...r.stats.map((s) => s.words));
			const maxW = Math.max(...r.stats.map((s) => s.words));
			const avgW = Math.round(r.stats.reduce((a, s) => a + s.words, 0) / r.stats.length);
			console.log(`${courseId}: ${r.lessons} lessons, words ${minW}-${maxW} (avg ${avgW})`);
			results.push(r);
		}
	}
	console.log(`\nDone: ${results.length} courses rewritten.`);
}

if (require.main === module) main();

module.exports = { rewriteCourse };
