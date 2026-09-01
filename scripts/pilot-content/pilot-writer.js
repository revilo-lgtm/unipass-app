'use strict';

/**
 * Helpers for pilot-quality lesson content (400–700 words, 4 sections).
 * Used by rewrite-pilot-content.js — NOT template filler.
 */

const SECTION_TITLES = ['GIỚI THIỆU', 'LÝ THUYẾT CỐT LÕI', 'VÍ DỤ', 'TÓM TẮT'];

function wordCount(text) {
	return String(text || '')
		.split(/\s+/)
		.filter(Boolean).length;
}

function topicFromLesson(lesson) {
	const generic = /^Bài\s*[12]:/i.test(lesson.lesson_title || '');
	if (generic) {
		const ch = String(lesson.chapter_title || '').replace(/^Chương\s*\d+:\s*/i, '').trim();
		return ch || lesson.lesson_title;
	}
	return lesson.lesson_title;
}

function chapterShort(chapterTitle) {
	return String(chapterTitle || '').replace(/^Chương\s*\d+:\s*/i, '').trim();
}

function isExamChapter(chapterTitle, lessonTitle) {
	const c = String(chapterTitle || '');
	const l = String(lessonTitle || '');
	return /đề thi|ôn tập|bộ câu hỏi|ôn thi/i.test(c) || /tài liệu ôn tập|đề thi/i.test(l);
}

function isPracticeLesson(lessonTitle) {
	return /bài tập|vận dụng/i.test(lessonTitle || '');
}

function isTheoryLesson(lessonTitle) {
	return /lý thuyết/i.test(lessonTitle || '');
}

function buildSections(bodies) {
	return SECTION_TITLES.map((title, i) => ({
		title,
		body: bodies[i] || '',
	}));
}

function applySections(lesson, bodies) {
	return {
		...lesson,
		sections: buildSections(bodies),
	};
}

function courseType(courseId) {
	if (/^(bk_|hcmus_)/.test(courseId)) return 'stem';
	if (/english|comm/i.test(courseId)) return 'english';
	return 'business';
}

module.exports = {
	SECTION_TITLES,
	wordCount,
	topicFromLesson,
	chapterShort,
	isExamChapter,
	isPracticeLesson,
	isTheoryLesson,
	buildSections,
	applySections,
	courseType,
};
