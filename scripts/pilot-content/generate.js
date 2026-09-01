'use strict';

const { courseType } = require('./pilot-writer');
const generateStemLesson = require('./generate-stem');
const generateBusinessLesson = require('./generate-business');
const generateEnglishLesson = require('./generate-english');

function generate(lesson) {
	const type = courseType(lesson.course_id);
	if (type === 'stem') return generateStemLesson(lesson);
	if (type === 'english') return generateEnglishLesson(lesson);
	return generateBusinessLesson(lesson);
}

module.exports = generate;
