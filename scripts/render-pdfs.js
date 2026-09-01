'use strict';

/**
 * Layout-only PDF renderer for pre-authored lesson JSON.
 * Reads scripts/content/{course_id}.json — no content generation.
 *
 * Usage:
 *   node scripts/render-pdfs.js                    # all courses in content/
 *   node scripts/render-pdfs.js bk_calculus_1      # single course
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(__dirname, 'content');
const OUTPUT_DIR = path.join(__dirname, 'output', 'pdfs');
const FONT_REGULAR = path.join(ROOT, 'node_modules', 'dejavu-fonts-ttf', 'ttf', 'DejaVuSans.ttf');
const FONT_BOLD = path.join(ROOT, 'node_modules', 'dejavu-fonts-ttf', 'ttf', 'DejaVuSans-Bold.ttf');

function pad2(n) {
	return String(n).padStart(2, '0');
}

function outputFilename(courseId, chapterOrder, lessonOrder) {
	return `${courseId}__ch${pad2(chapterOrder)}_l${pad2(lessonOrder)}.pdf`;
}

function ensureSpace(doc, needed) {
	if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
		doc.addPage();
	}
}

function drawSection(doc, title, body, options = {}) {
	const { bullet = false, gap = 14 } = options;
	ensureSpace(doc, 40);
	doc.font('Bold').fontSize(12).fillColor('#1a365d').text(title, { continued: false });
	doc.moveDown(0.3);
	doc.font('Body').fontSize(10.5).fillColor('#1a202c');

	const lines = Array.isArray(body) ? body : [String(body || '')];
	if (bullet) {
		for (const line of lines) {
			const trimmed = String(line).trim();
			if (!trimmed) continue;
			ensureSpace(doc, 18);
			const text = trimmed.startsWith('•') ? trimmed : `• ${trimmed}`;
			doc.text(text, { indent: 12, paragraphGap: 4, align: 'justify' });
		}
	} else {
		const text = lines.join('\n\n');
		doc.text(text, { align: 'justify', paragraphGap: 6, lineGap: 2 });
	}
	doc.moveDown(gap / 14);
}

function writeLessonPdf(lesson, outputPath) {
	return new Promise((resolve, reject) => {
		fs.mkdirSync(path.dirname(outputPath), { recursive: true });
		const doc = new PDFDocument({ size: 'A4', margins: { top: 56, bottom: 56, left: 56, right: 56 } });
		const stream = fs.createWriteStream(outputPath);
		doc.pipe(stream);

		doc.registerFont('Body', FONT_REGULAR);
		doc.registerFont('Bold', FONT_BOLD);

		doc.font('Bold').fontSize(9).fillColor('#718096').text('UNIPASS — TÀI LIỆU HỌC TẬP', { align: 'center' });
		doc.moveDown(0.4);
		doc.font('Bold').fontSize(14).fillColor('#2d3748').text(lesson.course_title, { align: 'center' });
		doc.moveDown(0.2);
		doc.font('Body').fontSize(11).fillColor('#4a5568').text(lesson.chapter_title, { align: 'center' });
		doc.moveDown(0.2);
		doc.font('Bold').fontSize(12).fillColor('#1a365d').text(lesson.lesson_title, { align: 'center' });
		doc.moveDown(0.8);
		doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor('#cbd5e0').stroke();
		doc.moveDown(0.6);

		const sections = Array.isArray(lesson.sections) ? lesson.sections : [];
		for (let i = 0; i < sections.length; i += 1) {
			const section = sections[i];
			const isSummary = String(section.title || '').toUpperCase().includes('TÓM TẮT');
			drawSection(doc, section.title || '', section.body || '', {
				bullet: isSummary,
				gap: i === sections.length - 1 ? 8 : 14,
			});
		}

		doc.font('Body').fontSize(8).fillColor('#a0aec0').text(
			`Tài liệu học tập — ${new Date().toLocaleDateString('vi-VN')}`,
			{ align: 'center' }
		);

		doc.end();
		stream.on('finish', () => resolve(outputPath));
		stream.on('error', reject);
		doc.on('error', reject);
	});
}

function loadCourseLessons(filePath) {
	const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
	if (Array.isArray(data)) return data;
	if (Array.isArray(data.lessons)) return data.lessons;
	return [data];
}

function listContentFiles(filterCourseId) {
	if (!fs.existsSync(CONTENT_DIR)) {
		throw new Error(`Thư mục content không tồn tại: ${CONTENT_DIR}`);
	}
	const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'));
	if (!filterCourseId) return files.map((f) => path.join(CONTENT_DIR, f));
	const target = `${filterCourseId}.json`;
	const match = files.find((f) => f === target);
	if (!match) {
		throw new Error(`Không tìm thấy file content: ${path.join(CONTENT_DIR, target)}`);
	}
	return [path.join(CONTENT_DIR, match)];
}

async function main() {
	const filterCourseId = process.argv[2] ? String(process.argv[2]).trim() : null;

	if (!fs.existsSync(FONT_REGULAR) || !fs.existsSync(FONT_BOLD)) {
		throw new Error('Thiếu font DejaVu. Chạy: npm install dejavu-fonts-ttf pdfkit');
	}

	const contentFiles = listContentFiles(filterCourseId);
	const allLessons = [];
	for (const filePath of contentFiles) {
		const lessons = loadCourseLessons(filePath);
		for (const lesson of lessons) {
			allLessons.push({ lesson, filePath });
		}
	}

	if (!allLessons.length) {
		console.error('Không có bài học nào trong file content.');
		process.exit(1);
	}

	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
	console.log(`Rendering ${allLessons.length} PDF(s) → ${OUTPUT_DIR}`);

	const results = [];
	for (const { lesson } of allLessons) {
		const courseId = String(lesson.course_id || '').trim();
		const chapterOrder = parseInt(lesson.chapter_order, 10) || 1;
		const lessonOrder = parseInt(lesson.lesson_order, 10) || 1;
		const outputPath = path.join(OUTPUT_DIR, outputFilename(courseId, chapterOrder, lessonOrder));
		await writeLessonPdf(lesson, outputPath);
		const stat = fs.statSync(outputPath);
		results.push({ outputPath, bytes: stat.size, lesson });
		console.log(`  ✓ ${path.basename(outputPath)} (${(stat.size / 1024).toFixed(1)} KB)`);
	}

	console.log('\nDone.');
	console.log(`  Rendered: ${results.length} PDF(s)`);
	console.log(`  Output:   ${OUTPUT_DIR}`);
	const totalBytes = results.reduce((sum, r) => sum + r.bytes, 0);
	console.log(`  Total:    ${(totalBytes / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
