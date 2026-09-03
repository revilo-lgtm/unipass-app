
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');
const { getDb, dataDirectory } = require('../config/database');
const { requireActiveSession, requireAdmin, requireStaff, getAdminFromToken, getActiveUserFromRequest, jwtSecret } = require('../middlewares/auth');
const authController = require('../controllers/authController');
const { resolveCourseTitle } = require('../controllers/courseController');
const { logForensicEvent, forensicSubscribers } = require('../middlewares/tracking');
const { GoogleGenAI, Type } = require('@google/genai');
const { validators, handleValidationErrors } = require('../middlewares/validators');

function formatHumanReadableLogAction(actionStr) {
	if (!actionStr) return actionStr;
	const match = actionStr.match(/(?:Xem tài liệu|Xem tài liệu PDF|Xem bài học):\s*(pdf-[0-9a-zA-Z\-_]+)/i);
	if (match) {
		const docId = match[1];
		try {
			const metaPath = path.join(dataDirectory, 'course-pdfs.json');
			if (fs.existsSync(metaPath)) {
				const list = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
				const found = list.find(d => d.id === docId);
				if (found) {
					const cTitle = resolveCourseTitle(found.course, found.courseTitle);
					let lTitle = found.lessonTitle || found.originalName || docId;
					lTitle = lTitle.replace(/^Mục \d+:\s*Tài liệu Giáo trình Học tập\s*-\s*Bài \d+:\s*/i, '');
					return `Xem bài học: ${cTitle} - ${lTitle}`;
				}
			}
		} catch (e) { }
	}
	const slugMatch = String(actionStr).match(/^(Xem bài học:\s*)([a-z]{2,8}[_-][a-z0-9_-]+)(\s*-\s*)/i);
	if (slugMatch) {
		const resolved = resolveCourseTitle(slugMatch[2], slugMatch[2]);
		if (resolved && resolved !== slugMatch[2]) {
			return actionStr.replace(slugMatch[0], `${slugMatch[1]}${resolved}${slugMatch[3]}`);
		}
	}
	return actionStr;
}

const GEMINI_QUOTA_MESSAGE = 'Quota Gemini đã hết. Vui lòng thử lại sau hoặc đổi mô hình LLM trong Cài đặt.';
const DEFAULT_LLM_MODEL = 'gemini-3.6-flash';
const GEMINI_FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.7-flash'];
const LEGACY_GEMINI_MODEL_MAP = {
	'gemini-2.5-flash': DEFAULT_LLM_MODEL,
	'gemini-2.5-flash-lite': DEFAULT_LLM_MODEL
};

function normalizeLlmModel(model) {
	if (!model) return DEFAULT_LLM_MODEL;
	const trimmed = String(model).trim().replace(/^models\//i, '');
	return LEGACY_GEMINI_MODEL_MAP[trimmed] || trimmed || DEFAULT_LLM_MODEL;
}

async function getActiveLlmModel(db) {
	try {
		const row = await db.get("SELECT value FROM settings WHERE key = 'llm_model'");
		if (row && row.value && row.value.trim()) {
			return normalizeLlmModel(row.value);
		}
	} catch (e) { }
	return DEFAULT_LLM_MODEL;
}

function isGeminiQuotaExceededError(error) {
	const message = error && (error.message || String(error));
	return /429|quota|exceeded your current quota|resource exhausted|rate limit|too many requests/i.test(message || '');
}

function isGeminiUnavailableModelError(error) {
	const status = error && (error.status || error.statusCode || error.code);
	if (status === 404 || status === '404' || status === 'NOT_FOUND') return true;
	const message = error && (error.message || String(error));
	return /404|no longer available|not found|NOT_FOUND|is not found|model .* not (found|available)/i.test(message || '');
}

function isGeminiFallbackSkippableError(error) {
	return isGeminiQuotaExceededError(error) || isGeminiUnavailableModelError(error);
}

async function resolveGeminiApiKey(db) {
	let apiKey = process.env.GEMINI_API_KEY;
	try {
		const conn = db || await getDb();
		const row = await conn.get("SELECT value FROM settings WHERE key = 'gemini_api_key'");
		if (row && row.value) apiKey = row.value;
	} catch (e) { }
	return apiKey || '';
}

async function runGeminiWithFallback(apiKey, preferredModel, requestFn) {
	const preferredModels = [];
	if (preferredModel) preferredModels.push(normalizeLlmModel(preferredModel));
	for (const candidate of GEMINI_FALLBACK_MODELS) {
		if (!preferredModels.includes(candidate)) preferredModels.push(candidate);
	}

	let lastError = null;
	for (const model of preferredModels) {
		try {
			return await requestFn(model);
		} catch (error) {
			lastError = error;
			if (!isGeminiFallbackSkippableError(error)) throw error;
			const reason = isGeminiUnavailableModelError(error) ? 'unavailable/404' : 'quota/rate limit';
			console.warn(`[GeminiFallback] Model ${model} hit ${reason}, retrying with next fallback model.`);
		}
	}
	throw lastError || new Error(GEMINI_QUOTA_MESSAGE);
}

async function runActiveGemini(apiKey, db, requestFn) {
	const ai = new GoogleGenAI({ apiKey });
	const preferredModel = await getActiveLlmModel(db);
	return runGeminiWithFallback(apiKey, preferredModel, (model) => requestFn(ai, model));
}

function sendGeminiFailure(res, error, logLabel, genericMessage) {
	console.error(logLabel, error);
	if (isGeminiQuotaExceededError(error)) {
		return res.status(429).json({ message: GEMINI_QUOTA_MESSAGE });
	}
	return res.status(500).json({ message: genericMessage });
}

async function auditAdminAction(adminId, action, details) {
	try {
		const db = await getDb();
		await db.run('INSERT INTO admin_audit_logs (admin_id, action, details) VALUES (?, ?, ?)', [adminId, action, details]);
	} catch (err) {
		console.error('Audit Log Error:', err);
	}
}

const router = express.Router();
const metadataPath = path.join(dataDirectory, 'course-pdfs.json');
const uploadDirectory = path.join(dataDirectory, 'uploads', 'course-pdfs');
fs.mkdirSync(uploadDirectory, { recursive: true });

const pdfStorage = multer.diskStorage({
	destination: uploadDirectory,
	filename: (req, file, callback) => callback(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
});

const uploadPdf = multer({
	storage: pdfStorage,
	limits: { fileSize: 100 * 1024 * 1024 },
	fileFilter: (req, file, callback) => {
		// Chỉ cho phép định dạng PDF chuẩn (ngăn chặn XSS, mã độc thực thi)
		const isPdf = file.mimetype === 'application/pdf' && file.originalname && file.originalname.toLowerCase().endsWith('.pdf');
		if (isPdf) {
			callback(null, true);
		} else {
			callback(new Error('Chỉ chấp nhận file có định dạng PDF.'));
		}
	}
});

function readPdfMetadata() {
	try { return JSON.parse(fs.readFileSync(metadataPath, 'utf8')); } catch (error) { return []; }
}
function decoratePdfDocument(doc) {
	if (!doc) return doc;
	return { ...doc, courseTitle: resolveCourseTitle(doc.course, doc.courseTitle) };
}
function writePdfMetadata(metadata) {
	fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

// Auth Routes
router.post('/login', validators.login, handleValidationErrors, authController.login);
router.post('/logout', requireActiveSession, authController.logout);
router.get('/verify-token', authController.verifyToken);
router.post('/register', validators.register, handleValidationErrors, authController.register);
router.get('/auth/sessions', requireActiveSession, authController.getUserSessions);
router.get('/sessions', requireActiveSession, authController.getUserSessions);
router.post('/auth/logout-other-devices', requireActiveSession, authController.logoutOtherDevices);
router.post('/logout-other-devices', requireActiveSession, authController.logoutOtherDevices);

// Đổi mật khẩu cá nhân
router.post('/user/change-password', validators.changePassword, handleValidationErrors, requireActiveSession, async (req, res) => {
	const { oldPassword, newPassword } = req.body || {};
	if ((oldPassword === undefined || oldPassword === null) || !newPassword) return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu cũ và mới.' });

	const db = await require('../config/database').getDb();
	const user = await db.get('SELECT * FROM accounts WHERE User_ID = ?', [req.user.User_ID]);
	if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });

	const bcrypt = require('bcrypt');
	const isMatch = await bcrypt.compare(String(oldPassword), user.password);
	if (!isMatch) return res.status(401).json({ message: 'Mật khẩu cũ không chính xác.' });

	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
	if (!passwordRegex.test(String(newPassword))) {
		return res.status(400).json({ message: 'Mật khẩu mới phải dài ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (VD: Pass@123).' });
	}

	const hashedPassword = await bcrypt.hash(String(newPassword), 10);
	await db.run('UPDATE accounts SET password = ?, reset_requested = 0 WHERE User_ID = ?', [hashedPassword, user.User_ID]);

	// Tuỳ chọn: Có thể xoá tất cả session khác khi đổi mật khẩu để bắt đăng nhập lại, hoặc giữ nguyên phiên hiện tại.
	// await db.run('DELETE FROM sessions WHERE user_id = ? AND token != ?', [user.User_ID, req.user.token]);

	return res.status(200).json({ message: 'Đổi mật khẩu thành công.' });
});

router.post('/forgot-password', validators.forgotPassword, handleValidationErrors, async (req, res) => {
	const { email } = req.body || {};
	if (!email) return res.status(400).json({ message: 'Email là bắt buộc.' });

	const db = await getDb();
	const user = await db.get('SELECT * FROM accounts WHERE Email = ?', [email.trim().toLowerCase()]);

	if (!user) {
		return res.status(404).json({ message: 'Tài khoản không tồn tại trong hệ thống.' });
	}

	await db.run('UPDATE accounts SET reset_requested = 1 WHERE User_ID = ?', [user.User_ID]);

	const clientIp = req.ip ? req.ip.replace(/^::ffff:/, '') : 'Unknown';
	await logForensicEvent({
		email: user.Email,
		action: 'Yêu cầu cấp lại mật khẩu (Forgot Password)',
		ip: clientIp,
		status: 403 // Status >= 400 sẽ hiện màu Đỏ (Cảnh báo) trên Dashboard
	});

	return res.status(200).json({ message: 'Yêu cầu đặt lại mật khẩu đã được ghi nhận.' });
});

// Forensic Event
router.post('/forensic-events', requireActiveSession, async (req, res) => {
	const allowedActions = new Set([
		'Cố gắng lưu tài liệu bằng phím tắt (Ctrl/Cmd+S)',
		'Cố gắng in tài liệu bằng phím tắt (Ctrl/Cmd+P)',
		'Cố gắng sao chép nội dung tài liệu (Ctrl/Cmd+C)',
		'Cố gắng mở Developer Tools (F12/Inspect Element)',
		'Cố gắng mở menu chuột phải trên tài liệu',
	]);
	const action = String(req.body && req.body.action || '');
	if (!allowedActions.has(action)) return res.status(400).json({ message: 'Hành vi forensic không hợp lệ.' });
	await logForensicEvent({ email: req.user.Email, action: `${action} (Bị chặn)`, ip: req.clientIp, status: 200 });
	return res.status(201).json({ message: 'Đã ghi nhận hành vi bảo mật.' });
});

const courseController = require("../controllers/courseController");
router.get("/courses", requireActiveSession, courseController.getCourses);
router.get("/public/courses", courseController.getPublicCourses);
router.get("/public/pricing-plans", courseController.getPricingPlans);

// Course Progress
router.post('/ai/gap-analysis', requireActiveSession, async (req, res) => {
	try {
		const { course, university } = req.body || {};
		if (!course || !university) return res.status(400).json({ message: 'Thiếu thông tin môn học hoặc trường đại học.' });

		const db = await getDb();
		const apiKey = await resolveGeminiApiKey(db);

		if (!apiKey) {
			// FALLBACK SANG DỮ LIỆU GIẢ LẬP (MOCK DATA) NẾU CHƯA CÓ API KEY
			return res.status(200).json({
				skills: [
					{ chapter: "Chương 1: Tổng quan khái niệm cơ bản", percentage: 85, status: "success" },
					{ chapter: "Chương 2: Phân tích chuyên sâu (Mock)", percentage: 35, status: "danger" },
					{ chapter: "Chương 3: Ứng dụng thực tiễn (Mock)", percentage: 55, status: "warning" },
					{ chapter: "Chương 4: Ôn tập tổng hợp", percentage: 75, status: "success" }
				],
				gaps: [
					{ title: "Lỗ hổng: Phân tích chuyên sâu (Dữ liệu Mock AI)", description: "Bạn thường xuyên trả lời sai hoặc bỏ qua các câu hỏi tình huống phức tạp ở phần này.", severity: "danger" },
					{ title: "Tốc độ chậm: Ứng dụng thực tiễn (Dữ liệu Mock AI)", description: "Bạn cần trung bình 4 phút cho mỗi bài tập thực hành, chậm hơn 50% so với tốc độ chuẩn.", severity: "warning" }
				],
				timeline: [
					{ title: "Đọc lại lý thuyết (AI Tóm tắt)", duration: "10 Phút", description: "AI đã trích xuất các ý chính quan trọng nhất từ giáo trình của trường.", actionType: "pdf" },
					{ title: "Luyện bài tập tình huống", duration: "25 Phút", description: "Làm 5 bài test nhỏ để tăng tốc độ phản xạ.", actionType: "test" },
					{ title: "Thi đánh giá lại lỗ hổng", duration: "15 Phút", description: "Làm bài kiểm tra chéo để AI cập nhật lại biểu đồ năng lực của bạn.", actionType: "rotate" }
				],
				gapTitle: `${course} (${university})`
			});
		}

		const schema = {
			type: "object",
			properties: {
				skills: {
					type: "array",
					items: {
						type: "object",
						properties: {
							chapter: { type: "string", description: "Tên chương, VD: 'Chương 1: Tổng quan'" },
							percentage: { type: "integer", description: "Tỉ lệ % nắm vững từ 20 đến 90" },
							status: { type: "string", description: "Giá trị: 'success', 'warning', 'danger'" }
						},
						required: ["chapter", "percentage", "status"]
					}
				},
				gaps: {
					type: "array",
					items: {
						type: "object",
						properties: {
							title: { type: "string", description: "Tiêu đề, VD: 'Nhầm lẫn: Mô hình XYZ'" },
							description: { type: "string", description: "Mô tả chi tiết lỗ hổng" },
							severity: { type: "string", description: "Giá trị: 'warning', 'danger'" }
						},
						required: ["title", "description", "severity"]
					}
				},
				timeline: {
					type: "array",
					items: {
						type: "object",
						properties: {
							title: { type: "string", description: "Tiêu đề bước học" },
							duration: { type: "string", description: "Thời gian ước tính, VD: '15 Phút'" },
							description: { type: "string", description: "Mô tả hành động" },
							actionType: { type: "string", description: "Giá trị: 'pdf', 'test', 'video', 'rotate'" }
						},
						required: ["title", "duration", "description", "actionType"]
					}
				},
				gapTitle: { type: "string", description: "Tên môn học và tóm tắt nhanh, VD: 'Môn Hành vi người tiêu dùng'" }
			},
			required: ["skills", "gaps", "timeline", "gapTitle"]
		};

		const prompt = `Bạn là trợ lý AI phân tích năng lực sinh viên tại ${university}. Môn học: "${course}". Hãy sinh ra 1 kịch bản đánh giá lỗ hổng kiến thức ngẫu nhiên nhưng đúng thực tế học thuật của môn này. Yêu cầu có 4 chương (skills), 2 điểm mù (gaps) và 3 bước ôn tập cấp tốc (timeline). Không được dùng Markdown formatting codeblock (như \`\`\`json), trả về JSON thuần.`;

		const interaction = await runActiveGemini(apiKey, db, (ai, model) => ai.interactions.create({
			model,
			input: prompt,
			response_format: {
				type: "text",
				mime_type: "application/json",
				schema: schema,
			}
		}));

		let rawText = interaction.output_text;
		// Xoá markdown code block nếu AI lỡ sinh ra
		rawText = rawText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
		const data = JSON.parse(rawText);
		return res.status(200).json(data);
	} catch (error) {
		return sendGeminiFailure(res, error, 'Gemini API Error:', 'Lỗi tạo nội dung từ AI: ' + (error && error.message ? error.message : ''));
	}
});

const handleCourseProgressUpdate = async (req, res) => {
	const courseId = String(req.params.courseId || '').trim();
	const lessonId = String(req.body?.lessonId || '').trim();
	const completed = Boolean(req.body?.completed);
	if (!/^[a-z0-9_-]+$/i.test(courseId) || !/^[a-z0-9_-]+$/i.test(lessonId)) {
		return res.status(400).json({ message: 'Thông tin bài học không hợp lệ.' });
	}
	const db = await getDb();
	if (completed) {
		await db.run('INSERT OR REPLACE INTO course_progress (user_id, course_id, lesson_id, completed_at) VALUES (?, ?, ?, ?)', [req.user.User_ID, courseId, lessonId, new Date().toISOString()]);
	} else {
		await db.run('DELETE FROM course_progress WHERE user_id = ? AND course_id = ? AND lesson_id = ?', [req.user.User_ID, courseId, lessonId]);
	}
	return res.status(200).json({ courseId, lessonId, completed });
};

router.get('/course-progress/:courseId', requireActiveSession, async (req, res) => {
	const courseId = String(req.params.courseId || '').trim();
	if (!/^[a-z0-9_-]+$/i.test(courseId)) return res.status(400).json({ message: 'Mã khóa học không hợp lệ.' });
	const db = await getDb();
	const rows = await db.all('SELECT lesson_id AS lessonId, completed_at AS completedAt FROM course_progress WHERE user_id = ? AND course_id = ? ORDER BY lesson_id', [req.user.User_ID, courseId]);
	return res.status(200).json({ courseId, completedLessonIds: rows.map(row => row.lessonId), progress: rows });
});

// Thông tin khóa học và tiến độ ôn tập gần nhất của học viên
router.get('/user/active-progress', requireActiveSession, async (req, res) => {
	try {
		const db = await getDb();
		const userId = req.user.User_ID;
		const userEmail = req.user.Email || '';

		const coursesCatalog = {
			'bk_giai_tich': { title: 'Đại số Tuyến tính', university: 'BK', link: 'course-bk.html', defaultChapter: 'Mục 1: Tài liệu Giáo trình Học tập - Chương 1: Ma trận' },
			'bk_physics': { title: 'Vật lý Đại cương 1', university: 'BK', link: 'course-bk-physics.html', defaultChapter: 'Chương 1: Động học & Động lực học chất điểm' },
			'bk_calculus_1': { title: 'Giải tích 1', university: 'BK', link: 'course-bk-calculus.html', defaultChapter: 'Chương 1: Phép tính vi phân hàm một biến' },
			'bk_chemistry': { title: 'Hóa học Đại cương', university: 'BK', link: 'course-bk-chemistry.html', defaultChapter: 'Chương 1: Cấu tạo nguyên tử & Bảng tuần hoàn' },
			'bk_programming': { title: 'Nhập môn Lập trình (C/C++)', university: 'BK', link: 'course-bk-programming.html', defaultChapter: 'Chương 1: Con trỏ & Cấp phát động' },

			'ueh_hvntd': { title: 'Hành vi người tiêu dùng', university: 'UEH', link: 'course-ueh.html', defaultChapter: 'Chương 2: Quá trình ra quyết định của người tiêu dùng' },
			'ueh_marketing': { title: 'Quản trị Marketing', university: 'UEH', link: 'course-ueh-marketing.html', defaultChapter: 'Chương 1: Bản chất của Marketing' },
			'ueh_macro': { title: 'Kinh tế Vĩ mô', university: 'UEH', link: 'course-ueh-macro.html', defaultChapter: 'Chương 1: Tổng quan về Kinh tế Vĩ mô' },
			'ueh_accounting': { title: 'Nguyên lý Kế toán', university: 'UEH', link: 'course-ueh-accounting.html', defaultChapter: 'Chương 1: Bản chất của Kế toán' },
			'ueh_math': { title: 'Toán Tài chính', university: 'UEH', link: 'course-ueh-math.html', defaultChapter: 'Chương 1: Ma trận & Định thức' },
			'ueh_hr': { title: 'Quản trị Nguồn nhân lực', university: 'UEH', link: 'course-ueh-hr.html', defaultChapter: 'Chương 1: Tổng quan về Quản trị Nhân sự' },

			'ftu_vamo': { title: 'Kinh tế Vi mô', university: 'FTU', link: 'course-ftu.html', defaultChapter: 'Chương 3: Cấu trúc thị trường & Độc quyền bán' },
			'ftu_international-payment': { title: 'Thanh toán Quốc tế', university: 'FTU', link: 'course-ftu-payment.html', defaultChapter: 'Chương 1: Phương thức tín dụng chứng từ (L/C)' },
			'ftu_logistics': { title: 'Logistics & Chuỗi cung ứng', university: 'FTU', link: 'course-ftu-logistics.html', defaultChapter: 'Chương 1: Tổng quan về Vận tải & Logistics' },
			'ftu_trade': { title: 'Giao dịch Thương mại Quốc tế', university: 'FTU', link: 'course-ftu-trade.html', defaultChapter: 'Chương 1: Incoterms 2020' },
			'ftu_english': { title: 'Tiếng Anh Chuyên ngành Kinh tế', university: 'FTU', link: 'course-ftu-english.html', defaultChapter: 'Chương 1: Business Correspondence' },

			'neu_basic-economics': { title: 'Kinh tế học cơ bản', university: 'NEU', link: 'course-neu-economics.html', defaultChapter: 'Chương 1: Cung và cầu' },
			'neu_econometrics': { title: 'Toán Kinh tế', university: 'NEU', link: 'course-neu-math.html', defaultChapter: 'Chương 1: Mô hình hồi quy tuyến tính cổ điển' },
			'neu_corporate_finance': { title: 'Tài chính Doanh nghiệp', university: 'NEU', link: 'course-neu-finance.html', defaultChapter: 'Chương 1: Giá trị thời gian của tiền' },
			'neu_statistics': { title: 'Xác suất & Thống kê Toán', university: 'NEU', link: 'course-neu-stats.html', defaultChapter: 'Chương 1: Thu thập và trình bày dữ liệu thống kê' },
			'neu_managerial_accounting': { title: 'Kế toán Quản trị', university: 'NEU', link: 'course-neu-accounting.html', defaultChapter: 'Chương 1: Phân loại chi phí' },

			'hcmus_programming': { title: 'Lập trình Cơ bản (C++)', university: 'HCMUS', link: 'course-hcmus-programming.html', defaultChapter: 'Chương 1: Lưu đồ thuật toán & Cú pháp C/C++' },
			'hcmus_discrete-math': { title: 'Toán Rời rạc', university: 'HCMUS', link: 'course-hcmus-discrete.html', defaultChapter: 'Chương 1: Logic mệnh đề & Vị từ' },
			'hcmus_dsa': { title: 'Cấu trúc Dữ liệu & Giải thuật', university: 'HCMUS', link: 'course-hcmus-dsa.html', defaultChapter: 'Chương 1: Danh sách liên kết' },
			'hcmus_database': { title: 'Hệ Cơ sở Dữ liệu', university: 'HCMUS', link: 'course-hcmus-db.html', defaultChapter: 'Chương 1: Mô hình thực thể kết hợp (ERD)' },
			'hcmus_networks': { title: 'Mạng Máy tính', university: 'HCMUS', link: 'course-hcmus-networks.html', defaultChapter: 'Chương 1: Mô hình OSI & TCP/IP' },

			'tdtu_study-skills': { title: 'Kỹ năng Học đại học', university: 'TDTU', link: 'course-tdtu-skills.html', defaultChapter: 'Chương 1: Phương pháp tự học & Quản lý thời gian' },
			'tdtu_applied-it': { title: 'Tin học Ứng dụng', university: 'TDTU', link: 'course-tdtu-it.html', defaultChapter: 'Chương 1: Xử lý dữ liệu nâng cao với Excel' },
			'tdtu_english_comm': { title: 'Anh văn Giao tiếp Quốc tế', university: 'TDTU', link: 'course-tdtu-english.html', defaultChapter: 'Chương 1: Daily Conversations' },
			'tdtu_startup': { title: 'Khởi nghiệp & ĐMST', university: 'TDTU', link: 'course-tdtu-startup.html', defaultChapter: 'Chương 1: Tư duy khởi nghiệp & Business Model Canvas' },
			'tdtu_pe': { title: 'Giáo dục Thể chất & Thể thao', university: 'TDTU', link: 'course-tdtu-pe.html', defaultChapter: 'Chương 1: Kiến thức dinh dưỡng & Tập luyện cơ bản' }
		};

		// Xác định trường mặc định theo email
		let defaultUni = 'BK';
		if (userEmail.includes('@st.ueh.edu.vn')) defaultUni = 'UEH';
		else if (userEmail.includes('@ftu.edu.vn')) defaultUni = 'FTU';
		else if (userEmail.includes('@st.neu.edu.vn')) defaultUni = 'NEU';
		else if (userEmail.includes('@hcmus.edu.vn')) defaultUni = 'HCMUS';
		else if (userEmail.includes('@tdtu.edu.vn')) defaultUni = 'TDTU';

		// 1. Kiểm tra khóa học có tương tác tiến độ gần nhất
		let lastCourse = await db.get(`
			SELECT course_id, lesson_id, completed_at
			FROM course_progress
			WHERE user_id = ?
			ORDER BY datetime(completed_at) DESC
			LIMIT 1
		`, [userId]);

		// 2. Nếu chưa có tiến độ bài học, kiểm tra tài liệu vừa đọc gần nhất
		if (!lastCourse) {
			const lastRead = await db.get(`
				SELECT course_id, course_title, lesson_title, last_read_at
				FROM reading_history
				WHERE user_id = ?
				ORDER BY datetime(last_read_at) DESC
				LIMIT 1
			`, [userId]);
			if (lastRead && lastRead.course_id) {
				lastCourse = {
					course_id: lastRead.course_id,
					lesson_id: null,
					completed_at: lastRead.last_read_at,
					lesson_title: lastRead.lesson_title
				};
			}
		}

		// 3. Nếu vẫn chưa có gì, chọn khóa học đầu tiên của trường học viên
		let activeCourseId = lastCourse ? lastCourse.course_id : (defaultUni === 'BK' ? 'bk_giai_tich' : (defaultUni === 'UEH' ? 'ueh_hvntd' : 'ftu_vamo'));
		let courseInfo = coursesCatalog[activeCourseId] || coursesCatalog['bk_giai_tich'];

		// Lấy số bài học thực tế từ database
		const countRow = await db.get('SELECT COUNT(*) as count FROM course_lessons WHERE course_id = ?', [activeCourseId]);
		const dbDetail = await db.get('SELECT title, university FROM course_details WHERE course_id = ?', [activeCourseId]);

		const totalLessons = (countRow && countRow.count > 0) ? countRow.count : (courseInfo.totalLessons || 1);
		const completedRows = await db.all('SELECT lesson_id FROM course_progress WHERE user_id = ? AND course_id = ?', [userId, activeCourseId]);
		const completedCount = Math.min(completedRows.length, totalLessons);
		const percentage = Math.min(100, Math.round((completedCount / totalLessons) * 100));

		let chapterDisplay = (lastCourse && lastCourse.lesson_title) ? lastCourse.lesson_title : courseInfo.defaultChapter;
		if (percentage === 100) {
			chapterDisplay = '🎉 Đã hoàn thành tất cả bài học trong khóa';
		}

		return res.status(200).json({
			courseId: activeCourseId,
			courseTitle: resolveCourseTitle(activeCourseId, dbDetail?.title || courseInfo.title),
			university: dbDetail?.university || courseInfo.university,
			chapterTitle: chapterDisplay,
			completedCount,
			totalLessons,
			percentage,
			link: `course.html?id=${encodeURIComponent(activeCourseId)}`
		});
	} catch (err) {
		console.error('Error getting active progress:', err);
		return res.status(500).json({ message: 'Lỗi tải tiến độ học tập.' });
	}
});

router.put('/course-progress/:courseId', requireActiveSession, handleCourseProgressUpdate);
router.post('/course-progress/:courseId', requireActiveSession, handleCourseProgressUpdate);


// API: Ghi nhận truy cập khóa học gần nhất
router.post('/user/course-access/:courseId', requireActiveSession, async (req, res) => {
	try {
		const db = await getDb();
		const courseId = String(req.params.courseId || '').trim();
		const userId = req.user.User_ID;
		const now = new Date().toISOString();

		const dbDetail = await db.get('SELECT title FROM course_details WHERE course_id = ?', [courseId]);
		const courseTitle = dbDetail ? dbDetail.title : courseId;

		await db.run(`
			INSERT INTO reading_history (user_id, document_id, document_title, course_id, course_title, lesson_title, last_read_at)
			VALUES (?, '', '', ?, ?, 'Đang ôn tập môn học', ?)
		`, [userId, courseId, courseTitle, now]);

		return res.status(200).json({ success: true });
	} catch (e) {
		return res.status(200).json({ success: false });
	}
});

// API: Lấy 2 phiên học / khóa học truy cập gần nhất của học viên
router.get('/user/recent-courses', requireActiveSession, async (req, res) => {
	try {
		const db = await getDb();
		const userId = req.user.User_ID;
		const userEmail = req.user.Email || '';

		const coursesCatalog = {
			'bk_giai_tich': { title: 'Đại số Tuyến tính', university: 'BK', link: 'course-bk.html', icon: 'fa-bullseye', defaultChapter: 'Chương 1: Ma trận & Định thức' },
			'bk_physics': { title: 'Vật lý Đại cương 1', university: 'BK', link: 'course-bk-physics.html', icon: 'fa-atom', defaultChapter: 'Chương 1: Động học & Động lực học chất điểm' },
			'bk_calculus_1': { title: 'Giải tích 1', university: 'BK', link: 'course-bk-calculus.html', icon: 'fa-square-root-variable', defaultChapter: 'Chương 1: Phép tính vi phân hàm một biến' },
			'bk_chemistry': { title: 'Hóa học Đại cương', university: 'BK', link: 'course-bk-chemistry.html', icon: 'fa-flask-vial', defaultChapter: 'Chương 1: Cấu tạo nguyên tử & Bảng tuần hoàn' },
			'bk_programming': { title: 'Nhập môn Lập trình (C/C++)', university: 'BK', link: 'course-bk-programming.html', icon: 'fa-code', defaultChapter: 'Chương 1: Con trỏ & Cấp phát động' },

			'ueh_hvntd': { title: 'Hành vi người tiêu dùng', university: 'UEH', link: 'course-ueh.html', icon: 'fa-users', defaultChapter: 'Chương 2: Quá trình ra quyết định của người tiêu dùng' },
			'ueh_marketing': { title: 'Quản trị Marketing', university: 'UEH', link: 'course-ueh-marketing.html', icon: 'fa-bullhorn', defaultChapter: 'Chương 1: Bản chất của Marketing' },
			'ueh_macro': { title: 'Kinh tế Vĩ mô', university: 'UEH', link: 'course-ueh-macro.html', icon: 'fa-chart-line', defaultChapter: 'Chương 1: Tổng quan về Kinh tế Vĩ mô' },
			'ueh_accounting': { title: 'Nguyên lý Kế toán', university: 'UEH', link: 'course-ueh-accounting.html', icon: 'fa-file-invoice-dollar', defaultChapter: 'Chương 1: Bản chất của Kế toán' },
			'ueh_math': { title: 'Toán Tài chính', university: 'UEH', link: 'course-ueh-math.html', icon: 'fa-calculator', defaultChapter: 'Chương 1: Ma trận & Định thức' },
			'ueh_hr': { title: 'Quản trị Nguồn nhân lực', university: 'UEH', link: 'course-ueh-hr.html', icon: 'fa-user-tie', defaultChapter: 'Chương 1: Tổng quan về Quản trị Nhân sự' },

			'ftu_vamo': { title: 'Kinh tế Vi mô', university: 'FTU', link: 'course-ftu.html', icon: 'fa-coins', defaultChapter: 'Chương 3: Cấu trúc thị trường & Độc quyền bán' },
			'ftu_international-payment': { title: 'Thanh toán Quốc tế', university: 'FTU', link: 'course-ftu-payment.html', icon: 'fa-credit-card', defaultChapter: 'Chương 1: Phương thức tín dụng chứng từ (L/C)' },
			'ftu_logistics': { title: 'Logistics & Chuỗi cung ứng', university: 'FTU', link: 'course-ftu-logistics.html', icon: 'fa-truck-fast', defaultChapter: 'Chương 1: Tổng quan về Vận tải & Logistics' },
			'ftu_trade': { title: 'Giao dịch Thương mại Quốc tế', university: 'FTU', link: 'course-ftu-trade.html', icon: 'fa-handshake', defaultChapter: 'Chương 1: Incoterms 2020' },
			'ftu_english': { title: 'Tiếng Anh Chuyên ngành Kinh tế', university: 'FTU', link: 'course-ftu-english.html', icon: 'fa-language', defaultChapter: 'Chương 1: Business Correspondence' },

			'neu_basic-economics': { title: 'Kinh tế học cơ bản', university: 'NEU', link: 'course-neu-economics.html', icon: 'fa-scale-balanced', defaultChapter: 'Chương 1: Cung và cầu' },
			'neu_econometrics': { title: 'Toán Kinh tế', university: 'NEU', link: 'course-neu-math.html', icon: 'fa-chart-simple', defaultChapter: 'Chương 1: Mô hình hồi quy tuyến tính cổ điển' },
			'neu_corporate_finance': { title: 'Tài chính Doanh nghiệp', university: 'NEU', link: 'course-neu-finance.html', icon: 'fa-money-bill-trend-up', defaultChapter: 'Chương 1: Giá trị thời gian của tiền' },
			'neu_statistics': { title: 'Xác suất & Thống kê Toán', university: 'NEU', link: 'course-neu-stats.html', icon: 'fa-chart-pie', defaultChapter: 'Chương 1: Thu thập và trình bày dữ liệu thống kê' },
			'neu_managerial_accounting': { title: 'Kế toán Quản trị', university: 'NEU', link: 'course-neu-accounting.html', icon: 'fa-receipt', defaultChapter: 'Chương 1: Phân loại chi phí' },

			'hcmus_programming': { title: 'Lập trình Cơ bản (C++)', university: 'HCMUS', link: 'course-hcmus-programming.html', icon: 'fa-laptop-code', defaultChapter: 'Chương 1: Lưu đồ thuật toán & Cú pháp C/C++' },
			'hcmus_discrete-math': { title: 'Toán Rời rạc', university: 'HCMUS', link: 'course-hcmus-discrete.html', icon: 'fa-project-diagram', defaultChapter: 'Chương 1: Logic mệnh đề & Vị từ' },
			'hcmus_dsa': { title: 'Cấu trúc Dữ liệu & Giải thuật', university: 'HCMUS', link: 'course-hcmus-dsa.html', icon: 'fa-sitemap', defaultChapter: 'Chương 1: Danh sách liên kết' },
			'hcmus_database': { title: 'Hệ Cơ sở Dữ liệu', university: 'HCMUS', link: 'course-hcmus-db.html', icon: 'fa-database', defaultChapter: 'Chương 1: Mô hình thực thể kết hợp (ERD)' },
			'hcmus_networks': { title: 'Mạng Máy tính', university: 'HCMUS', link: 'course-hcmus-networks.html', icon: 'fa-network-wired', defaultChapter: 'Chương 1: Mô hình OSI & TCP/IP' },

			'tdtu_study-skills': { title: 'Kỹ năng Học đại học', university: 'TDTU', link: 'course-tdtu-skills.html', icon: 'fa-graduation-cap', defaultChapter: 'Chương 1: Phương pháp tự học & Quản lý thời gian' },
			'tdtu_applied-it': { title: 'Tin học Ứng dụng', university: 'TDTU', link: 'course-tdtu-it.html', icon: 'fa-desktop', defaultChapter: 'Chương 1: Xử lý dữ liệu nâng cao với Excel' },
			'tdtu_english_comm': { title: 'Anh văn Giao tiếp Quốc tế', university: 'TDTU', link: 'course-tdtu-english.html', icon: 'fa-comments', defaultChapter: 'Chương 1: Daily Conversations' },
			'tdtu_startup': { title: 'Khởi nghiệp & ĐMST', university: 'TDTU', link: 'course-tdtu-startup.html', icon: 'fa-lightbulb', defaultChapter: 'Chương 1: Tư duy khởi nghiệp & Business Model Canvas' },
			'tdtu_pe': { title: 'Giáo dục Thể chất & Thể thao', university: 'TDTU', link: 'course-tdtu-pe.html', icon: 'fa-person-running', defaultChapter: 'Chương 1: Kiến thức dinh dưỡng & Tập luyện cơ bản' }
		};

		// Xác định trường mặc định theo email
		let defaultUni = 'BK';
		if (userEmail.includes('@st.ueh.edu.vn')) defaultUni = 'UEH';
		else if (userEmail.includes('@ftu.edu.vn')) defaultUni = 'FTU';
		else if (userEmail.includes('@st.neu.edu.vn')) defaultUni = 'NEU';
		else if (userEmail.includes('@hcmus.edu.vn')) defaultUni = 'HCMUS';
		else if (userEmail.includes('@tdtu.edu.vn')) defaultUni = 'TDTU';

		// 1. Thu thập tất cả các mốc thời gian hoạt động theo từng môn học
		const progressEvents = await db.all(`
			SELECT course_id, completed_at AS active_at, 'progress' AS type, lesson_id
			FROM course_progress
			WHERE user_id = ?
		`, [userId]);

		const readingEvents = await db.all(`
			SELECT course_id, last_read_at AS active_at, 'reading' AS type, lesson_title
			FROM reading_history
			WHERE user_id = ?
		`, [userId]);

		// Tổng hợp & sắp xếp theo thời gian mới nhất
		const allEvents = [...progressEvents, ...readingEvents]
			.filter(e => e.course_id && coursesCatalog[e.course_id])
			.sort((a, b) => new Date(b.active_at) - new Date(a.active_at));

		const recentCourseIds = [];
		for (const ev of allEvents) {
			if (!recentCourseIds.includes(ev.course_id)) {
				recentCourseIds.push(ev.course_id);
			}
			if (recentCourseIds.length >= 2) break;
		}

		// Nếu chưa đủ 2 môn gần nhất, bù thêm các môn thuộc trường của học viên
		const uniCourseKeys = Object.keys(coursesCatalog).filter(k => coursesCatalog[k].university === defaultUni);
		for (const k of uniCourseKeys) {
			if (!recentCourseIds.includes(k)) {
				recentCourseIds.push(k);
			}
			if (recentCourseIds.length >= 2) break;
		}

		// Xây dựng chi tiết thông tin cho đúng 2 môn học gần nhất
		const resultCourses = [];
		for (const cId of recentCourseIds.slice(0, 2)) {
			const cInfo = coursesCatalog[cId];
			const docCountRow = await db.get("SELECT COUNT(*) as count FROM course_lessons WHERE course_id = ? AND type != 'quiz'", [cId]);
			const chCountRow = await db.get('SELECT COUNT(*) as count FROM course_chapters WHERE course_id = ?', [cId]);
			const dbDetail = await db.get('SELECT title, university FROM course_details WHERE course_id = ?', [cId]);
			const totalLessons = ((docCountRow?.count || 0) + (chCountRow?.count || 0)) || 1;

			const completedRows = await db.all('SELECT lesson_id FROM course_progress WHERE user_id = ? AND course_id = ?', [userId, cId]);
			const completedCount = Math.min(completedRows.length, totalLessons);
			const percentage = Math.min(100, Math.round((completedCount / totalLessons) * 100));

			const lastEvent = allEvents.find(e => e.course_id === cId);
			let chapterDisplay = (lastEvent && lastEvent.lesson_title) ? lastEvent.lesson_title : cInfo.defaultChapter;
			if (percentage === 100) {
				chapterDisplay = '🎉 Đã hoàn thành 100% môn học';
			} else if (completedCount > 0) {
				chapterDisplay = `Đã hoàn thành ${completedCount}/${totalLessons} bài • Học tiếp bài sau`;
			}

			resultCourses.push({
				courseId: cId,
				courseTitle: dbDetail?.title || cInfo.title,
				university: dbDetail?.university || cInfo.university,
				icon: cInfo.icon || 'fa-book',
				chapterTitle: chapterDisplay,
				completedCount,
				totalLessons,
				percentage,
				link: `course.html?id=${encodeURIComponent(cId)}`
			});
		}

		return res.status(200).json({ courses: resultCourses });
	} catch (err) {
		console.error('Error getting recent courses:', err);
		return res.status(500).json({ message: 'Lỗi nạp phiên học gần nhất.' });
	}
});

// === COURSE SYLLABUS & DETAILS MANAGEMENT APIs ===

// Lấy khung chương trình chi tiết của môn học (cho cả học viên & admin)
router.get('/courses/syllabus/:courseId', async (req, res) => {
	try {
		const db = await getDb();
		const courseId = String(req.params.courseId || '').trim();
		if (!courseId) return res.status(400).json({ message: 'Thiếu mã môn học.' });

		const course = await db.get('SELECT * FROM course_details WHERE course_id = ?', [courseId]);
		const chapters = await db.all('SELECT * FROM course_chapters WHERE course_id = ? ORDER BY chapter_order ASC, id ASC', [courseId]);
		const lessons = await db.all('SELECT * FROM course_lessons WHERE course_id = ? ORDER BY chapter_id ASC, lesson_order ASC, id ASC', [courseId]);

		const structuredChapters = chapters.map(ch => ({
			...ch,
			lessons: lessons.filter(l => l.chapter_id === ch.id)
		}));

		return res.status(200).json({
			course: course || { course_id: courseId, title: courseId, university: '', description: '' },
			chapters: structuredChapters
		});
	} catch (err) {
		console.error('Error fetching course syllabus:', err);
		return res.status(500).json({ message: 'Lỗi tải khung chương trình môn học.' });
	}
});

// Admin: Danh sách tất cả môn học kèm thống kê
router.get('/admin/courses-list', requireStaff, async (req, res) => {
	try {
		const db = await getDb();
		const courses = await db.all('SELECT * FROM course_details ORDER BY university ASC, title ASC');
		const chapters = await db.all('SELECT course_id, COUNT(*) as count FROM course_chapters GROUP BY course_id');
		const lessons = await db.all('SELECT course_id, COUNT(*) as count FROM course_lessons GROUP BY course_id');

		const chMap = Object.fromEntries(chapters.map(c => [c.course_id, c.count]));
		const lesMap = Object.fromEntries(lessons.map(l => [l.course_id, l.count]));

		const result = courses.map(c => ({
			...c,
			chapterCount: chMap[c.course_id] || 0,
			lessonCount: lesMap[c.course_id] || 0
		}));

		return res.status(200).json({ courses: result });
	} catch (err) {
		console.error('Error fetching admin courses list:', err);
		return res.status(500).json({ message: 'Lỗi nạp danh sách môn học.' });
	}
});

// Admin: Tạo môn học mới
router.post('/admin/courses', validators.createCourse, handleValidationErrors, requireStaff, async (req, res) => {
	try {
		const db = await getDb();
		let { course_id, title, university, description, chapters } = req.body || {};
		if (!title || !university) return res.status(400).json({ message: 'Tên môn học và trường đại học là bắt buộc.' });

		title = String(title).trim();
		university = String(university).trim().toUpperCase();
		description = String(description || '').trim();

		if (!course_id || !String(course_id).trim()) {
			const slug = title.toLowerCase()
				.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
				.replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
			course_id = `${university.toLowerCase()}_${slug || Date.now()}`;
		} else {
			course_id = String(course_id).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
		}

		const existing = await db.get('SELECT course_id FROM course_details WHERE course_id = ?', [course_id]);
		if (existing) {
			return res.status(409).json({ message: `Mã môn học "${course_id}" đã tồn tại. Vui lòng nhập mã môn khác.` });
		}

		await db.run(`
			INSERT INTO course_details (course_id, title, university, description, updated_at)
			VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
		`, [course_id, title, university, description]);

		if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
			chapters = ['Chương 1: Tổng quan & Khái niệm trọng tâm'];
		}

		let order = 1;
		for (const chapTitle of chapters) {
			const chapName = String(chapTitle).trim() || `Chương ${order}`;
			const chapResult = await db.run(`
				INSERT INTO course_chapters (course_id, chapter_order, title, meta)
				VALUES (?, ?, ?, '1 Bài học')
			`, [course_id, order, chapName]);

			await db.run(`
				INSERT INTO course_lessons (course_id, chapter_id, lesson_order, lesson_id, title, type, meta_text)
				VALUES (?, ?, 1, ?, 'Bài 1: Giới thiệu', 'doc', 'Tài liệu')
			`, [course_id, chapResult.lastID, `${course_id}_les_${Date.now()}_${order}`]);

			order++;
		}

		const staffId = req.admin ? req.admin.User_ID : (req.user ? req.user.User_ID : 'Staff');
		await auditAdminAction(staffId, 'CREATE_COURSE', `Created course ${title} (${course_id}) for ${university}`);

		return res.status(201).json({
			success: true,
			course_id,
			title,
			university,
			message: `Đã tạo thành công môn học "${title}"!`
		});
	} catch (err) {
		console.error('Error creating course:', err);
		return res.status(500).json({ message: 'Lỗi tạo môn học: ' + err.message });
	}
});

// Admin: Tự động sinh mô tả tóm tắt môn học bằng AI (Gemini)
router.post('/admin/courses/generate-desc', requireStaff, async (req, res) => {
	try {
		const { title, university, chapters } = req.body || {};
		if (!title || !String(title).trim()) {
			return res.status(400).json({ message: 'Vui lòng nhập tên môn học trước khi sinh mô tả.' });
		}

		const uniNameMap = {
			'BK': 'Đại học Bách Khoa TP.HCM (HCMUT)',
			'UEH': 'Đại học Kinh tế TP.HCM (UEH)',
			'FTU': 'Đại học Ngoại thương (FTU)',
			'NEU': 'Đại học Kinh tế Quốc dân (NEU)',
			'HCMUS': 'Đại học Khoa học Tự nhiên (HCMUS)',
			'TDTU': 'Đại học Tôn Đức Thắng (TDTU)',
		};
		const fullUni = uniNameMap[university] || university || 'Đại học';
		const chapListText = (chapters && Array.isArray(chapters) && chapters.length > 0)
			? chapters.filter(c => c && c.trim()).join(', ')
			: 'Kiến thức cốt lõi và bài tập thực hành';

		const db = await getDb();
		const apiKey = await resolveGeminiApiKey(db);
		if (!apiKey) {
			const chapsSummary = (chapters && Array.isArray(chapters) && chapters.length > 0)
				? chapters.map(c => `- ${c}`).join('\n')
				: '- Kiến thức nền tảng và phương pháp luận chuyên sâu\n- Kỹ năng ứng dụng thực tiễn và chuẩn đầu ra học phần';
			const fallbackDesc = `Môn học ${title} thuộc chương trình đào tạo của ${fullUni}, cung cấp cho sinh viên hệ thống kiến thức toàn diện, chuẩn học thuật cao cấp và phương pháp tư duy giải quyết vấn đề thực tế. Giáo trình bao gồm các trọng tâm:\n${chapsSummary}\nMôn học trang bị nền tảng vững chắc phục vụ học phần chuyên ngành và bài thi đánh giá kết quả học tập.`;
			return res.status(200).json({ description: fallbackDesc });
		}

		const prompt = `Bạn là chuyên gia thiết kế giáo trình đại học chuẩn quốc gia và quốc tế.
Hãy viết một đoạn MÔ TẢ TÓM TẮT MÔN HỌC (Course Description) cô đọng, chuyên nghiệp và chuẩn học thuật (Academic Standard) cho:
- Tên môn học: ${title}
- Trường: ${fullUni}
- Các nội dung/chương dự kiến: ${chapListText}

Yêu cầu:
1. Độ dài khoảng 2 - 4 câu (hoặc 1 đoạn văn súc tích 60-120 từ tiếng Việt).
2. Nêu bật mục tiêu môn học, kiến thức cốt lõi, phương pháp ứng dụng thực tiễn và giá trị chuẩn đầu ra cho sinh viên.
3. Không chào hỏi, không dùng ký hiệu markdown rườm rà hay tiêu đề thừa, trả về duy nhất nội dung mô tả thuần văn bản tiếng Việt chuẩn mực.`;

		const interaction = await runActiveGemini(apiKey, db, (ai, model) => ai.interactions.create({ model, input: prompt }));
		const description = interaction.output_text ? interaction.output_text.trim() : '';
		return res.status(200).json({ description });
	} catch (err) {
		console.error('Error generating course description:', err);
		const fullUni = req.body?.university || 'Đại học';
		const fallbackDesc = `Môn học ${req.body?.title || ''} thuộc chương trình đào tạo của ${fullUni}, cung cấp cho sinh viên hệ thống kiến thức toàn diện, chuẩn học thuật và phương pháp ứng dụng thực tiễn giải quyết bài toán chuyên ngành.`;
		return res.status(200).json({ description: fallbackDesc });
	}
});

// Admin: Cập nhật thông tin môn học (Tên, mô tả, trường)
router.put('/admin/course-details/:courseId', requireStaff, async (req, res) => {
	try {
		const db = await getDb();
		const courseId = String(req.params.courseId || '').trim();
		const { title, description, university } = req.body || {};
		if (!/^[a-z0-9_-]+$/i.test(courseId)) {
			return res.status(400).json({ message: 'Mã môn học không hợp lệ (chỉ dùng chữ, số, _ và -).' });
		}
		if (!title) return res.status(400).json({ message: 'Tên môn học không được để trống.' });

		await db.run(`
			INSERT INTO course_details (course_id, title, university, description, updated_at)
			VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
			ON CONFLICT(course_id) DO UPDATE SET
				title = excluded.title,
				university = COALESCE(excluded.university, course_details.university),
				description = excluded.description,
				updated_at = CURRENT_TIMESTAMP
		`, [courseId, String(title).trim(), String(university || '').trim(), String(description || '').trim()]);

		return res.status(200).json({ success: true, message: 'Đã cập nhật thông tin môn học thành công.' });
	} catch (err) {
		console.error('Error updating course details:', err);
		return res.status(500).json({ message: 'Lỗi cập nhật môn học.' });
	}
});

const handleDeleteCourse = async (req, res) => {
	try {
		const db = await getDb();
		const courseId = String(req.params.courseId || '').trim();
		if (!/^[a-z0-9_-]+$/i.test(courseId)) {
			return res.status(400).json({ message: 'Mã môn học không hợp lệ.' });
		}

		const existing = await db.get('SELECT course_id, title FROM course_details WHERE course_id = ?', [courseId]);
		if (!existing) {
			return res.status(404).json({ message: 'Không tìm thấy môn học.' });
		}

		await db.run('DELETE FROM course_lessons WHERE course_id = ?', [courseId]);
		await db.run('DELETE FROM course_chapters WHERE course_id = ?', [courseId]);
		await db.run('DELETE FROM course_progress WHERE course_id = ?', [courseId]);
		await db.run('DELETE FROM course_details WHERE course_id = ?', [courseId]);

		const staffId = req.admin ? req.admin.User_ID : (req.user ? req.user.User_ID : 'Staff');
		await auditAdminAction(staffId, 'DELETE_COURSE', `Deleted course ${existing.title} (${courseId})`);

		return res.status(200).json({ success: true, message: 'Đã xóa môn học và toàn bộ chương, bài học liên quan.' });
	} catch (err) {
		console.error('Error deleting course:', err);
		return res.status(500).json({ message: 'Lỗi xóa môn học.' });
	}
};

router.delete('/admin/course-details/:courseId', requireStaff, handleDeleteCourse);
router.delete('/admin/courses/:courseId', requireStaff, handleDeleteCourse);

// Admin: Tạo chương mới
router.post('/admin/course-chapters', requireStaff, async (req, res) => {
	try {
		const db = await getDb();
		const { course_id, title, meta, chapter_order } = req.body || {};
		if (!course_id || !title) return res.status(400).json({ message: 'Thiếu thông tin chương học.' });

		let order = parseInt(chapter_order);
		if (isNaN(order)) {
			const maxOrder = await db.get('SELECT MAX(chapter_order) as maxOrder FROM course_chapters WHERE course_id = ?', [course_id]);
			order = (maxOrder && maxOrder.maxOrder ? maxOrder.maxOrder : 0) + 1;
		}

		const result = await db.run(`
			INSERT INTO course_chapters (course_id, chapter_order, title, meta)
			VALUES (?, ?, ?, ?)
		`, [String(course_id).trim(), order, String(title).trim(), String(meta || '').trim()]);

		return res.status(201).json({ success: true, id: result.lastID, message: 'Đã thêm chương học mới.' });
	} catch (err) {
		console.error('Error creating chapter:', err);
		return res.status(500).json({ message: 'Lỗi tạo chương học.' });
	}
});

// Admin: Sửa chương
router.put('/admin/course-chapters/:id', requireStaff, async (req, res) => {
	try {
		const db = await getDb();
		const chapterId = parseInt(req.params.id);
		const { title, meta, chapter_order } = req.body || {};
		if (!title) return res.status(400).json({ message: 'Tiêu đề chương không được để trống.' });

		await db.run(`
			UPDATE course_chapters
			SET title = ?, meta = ?, chapter_order = COALESCE(?, chapter_order)
			WHERE id = ?
		`, [String(title).trim(), String(meta || '').trim(), chapter_order ? parseInt(chapter_order) : null, chapterId]);

		return res.status(200).json({ success: true, message: 'Đã cập nhật chương học.' });
	} catch (err) {
		console.error('Error updating chapter:', err);
		return res.status(500).json({ message: 'Lỗi cập nhật chương.' });
	}
});

// Admin: Xóa chương
router.delete('/admin/course-chapters/:id', requireStaff, async (req, res) => {
	try {
		const db = await getDb();
		const chapterId = parseInt(req.params.id);

		// Xóa các bài học thuộc chương
		await db.run('DELETE FROM course_lessons WHERE chapter_id = ?', [chapterId]);
		await db.run('DELETE FROM course_chapters WHERE id = ?', [chapterId]);

		return res.status(200).json({ success: true, message: 'Đã xóa chương học và các bài học liên quan.' });
	} catch (err) {
		console.error('Error deleting chapter:', err);
		return res.status(500).json({ message: 'Lỗi xóa chương học.' });
	}
});

// Admin: Tạo bài học mới trong chương
router.post('/admin/course-lessons', requireStaff, async (req, res) => {
	try {
		const db = await getDb();
		const { course_id, chapter_id, title, type, lesson_id, document_id, meta_text, lesson_order } = req.body || {};
		if (!course_id || !chapter_id || !title) return res.status(400).json({ message: 'Thiếu thông tin bài học.' });

		let order = parseInt(lesson_order);
		if (isNaN(order)) {
			const maxOrder = await db.get('SELECT MAX(lesson_order) as maxOrder FROM course_lessons WHERE chapter_id = ?', [chapter_id]);
			order = (maxOrder && maxOrder.maxOrder ? maxOrder.maxOrder : 0) + 1;
		}

		const autoLessonId = lesson_id ? String(lesson_id).trim() : `lesson_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

		const result = await db.run(`
			INSERT INTO course_lessons (course_id, chapter_id, lesson_order, lesson_id, title, type, document_id, meta_text)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`, [
			String(course_id).trim(),
			parseInt(chapter_id),
			order,
			autoLessonId,
			String(title).trim(),
			type === 'quiz' ? 'quiz' : 'doc',
			document_id ? String(document_id).trim() : null,
			String(meta_text || '').trim()
		]);

		return res.status(201).json({ success: true, id: result.lastID, lesson_id: autoLessonId, message: 'Đã thêm bài học mới.' });
	} catch (err) {
		console.error('Error creating lesson:', err);
		return res.status(500).json({ message: 'Lỗi tạo bài học.' });
	}
});

// Admin: Sửa chi tiết bài học
router.put('/admin/course-lessons/:id', requireStaff, async (req, res) => {
	try {
		const db = await getDb();
		const lessonPk = parseInt(req.params.id);
		const { title, type, document_id, meta_text, lesson_order, lesson_id } = req.body || {};
		if (!title) return res.status(400).json({ message: 'Tiêu đề bài học không được để trống.' });

		await db.run(`
			UPDATE course_lessons
			SET title = ?,
				type = ?,
				document_id = ?,
				meta_text = ?,
				lesson_order = COALESCE(?, lesson_order),
				lesson_id = COALESCE(?, lesson_id)
			WHERE id = ?
		`, [
			String(title).trim(),
			type === 'quiz' ? 'quiz' : 'doc',
			document_id ? String(document_id).trim() : null,
			String(meta_text || '').trim(),
			lesson_order ? parseInt(lesson_order) : null,
			lesson_id ? String(lesson_id).trim() : null,
			lessonPk
		]);

		return res.status(200).json({ success: true, message: 'Đã cập nhật chi tiết bài học.' });
	} catch (err) {
		console.error('Error updating lesson:', err);
		return res.status(500).json({ message: 'Lỗi cập nhật bài học.' });
	}
});

// Admin: Xóa bài học
router.delete('/admin/course-lessons/:id', requireStaff, async (req, res) => {
	try {
		const db = await getDb();
		const lessonPk = parseInt(req.params.id);
		await db.run('DELETE FROM course_lessons WHERE id = ?', [lessonPk]);
		return res.status(200).json({ success: true, message: 'Đã xóa bài học.' });
	} catch (err) {
		console.error('Error deleting lesson:', err);
		return res.status(500).json({ message: 'Lỗi xóa bài học.' });
	}
});

// Admin Routes
router.get('/admin/accounts', requireStaff, async (req, res) => {
	const db = await getDb();
	let query = 'SELECT User_ID, Email, Fullname, Role, Status, Expiry_Date, failed_login_attempts, reset_requested FROM accounts ORDER BY User_ID';
	if (req.admin && req.admin.Role === 'Giảng viên') {
		query = "SELECT User_ID, Email, Fullname, Role, Status, Expiry_Date, failed_login_attempts, reset_requested FROM accounts WHERE Role != 'admin' ORDER BY User_ID";
	}
	const accounts = await db.all(query);
	return res.status(200).json({ count: accounts.length, accounts });
});

router.get('/admin/dashboard-stats', requireAdmin, async (req, res) => {
	const db = await getDb();
	const stats = await db.get(`
		SELECT
			(SELECT COUNT(*) FROM accounts) AS accountCount,
			(SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'success') AS revenue,
			(SELECT COUNT(*) FROM rag_queries WHERE created_at >= datetime('now', '-1 day')) AS ragQueries,
			(SELECT COALESCE(SUM(amount), 0) FROM operating_costs WHERE created_at >= date('now', 'start of month')) AS operatingCost
	`);
	return res.status(200).json({ stats });
});

router.get('/admin/forensic-logs', requireAdmin, async (req, res) => {
	const db = await getDb();
	const logs = await db.all(`
		SELECT f.id, f.email, f.action, f.ip, f.created_at AS time, f.status, a.User_ID
		FROM forensic_logs f
		LEFT JOIN accounts a ON f.email = a.Email
		WHERE f.email != 'admin'
		  AND NOT EXISTS (SELECT 1 FROM accounts a2 WHERE a2.Email = f.email AND a2.Role = 'admin')
		ORDER BY f.id DESC
	`);
	const mappedLogs = (logs || []).map(l => ({
		...l,
		action: formatHumanReadableLogAction(l.action)
	}));
	return res.status(200).json({ logs: mappedLogs });
});

router.post('/admin/accounts', requireAdmin, async (req, res) => {
	const { email, password, fullname, role = 'Học viên' } = req.body || {};
	const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
	if (!normalizedEmail || !password || !String(fullname || '').trim()) return res.status(400).json({ message: 'Thông tin không hợp lệ.' });

	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
	if (!passwordRegex.test(String(password))) {
		return res.status(400).json({ message: 'Mật khẩu phải dài ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (VD: Pass@123).' });
	}

	const db = await getDb();
	const existing = await db.get('SELECT * FROM accounts WHERE Email = ?', [normalizedEmail]);
	if (existing) return res.status(409).json({ message: 'Email đã tồn tại.' });

	const row = await db.get(`SELECT COALESCE(MAX(CAST(SUBSTR(User_ID, 3) AS INTEGER)), 0) + 1 AS nextNumber FROM accounts WHERE User_ID LIKE 'SV%'`);
	const userId = `SV${String(row.nextNumber).padStart(3, '0')}`;
	const hashedPassword = await bcrypt.hash(String(password), 10);
	const finalRole = role === 'admin' ? 'admin' : (role === 'Giảng viên' ? 'Giảng viên' : 'Học viên');
	const initialStatus = 'pending';
	await db.run('INSERT INTO accounts (User_ID, Email, Fullname, password, Role, Status, Expiry_Date) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, normalizedEmail, String(fullname).trim(), hashedPassword, finalRole, initialStatus, null]);
	return res.status(201).json({ account: { User_ID: userId, Email: normalizedEmail, Role: finalRole, Status: initialStatus, Expiry_Date: null } });
});

router.patch('/admin/accounts/:userId/status', requireAdmin, async (req, res) => {
	const status = req.body && req.body.status;
	if (!['active', 'pending'].includes(status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
	const db = await getDb();

	let expiryDateIso = null;
	if (status === 'active') {
		const thirtyDaysFromNow = new Date();
		thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
		expiryDateIso = thirtyDaysFromNow.toISOString();
	}

	await db.run('UPDATE accounts SET Status = ?, Expiry_Date = ? WHERE User_ID = ?', [status, expiryDateIso, req.params.userId]);
	return res.status(200).json({ message: 'Đã cập nhật trạng thái tài khoản.', status, Expiry_Date: expiryDateIso });
});

router.post('/admin/accounts/:userId/reset-password', requireStaff, async (req, res) => {
	const db = await getDb();

	// Security: BOLA Check
	const targetAccount = await db.get('SELECT Role FROM accounts WHERE User_ID = ?', [req.params.userId]);
	if (!targetAccount) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });

	if (req.admin.Role === 'Giảng viên' && targetAccount.Role !== 'Học viên') {
		return res.status(403).json({ message: 'Giảng viên chỉ có quyền đổi mật khẩu cho Học viên.' });
	}

	const bcrypt = require('bcrypt');
	const hashedPassword = await bcrypt.hash('', 10); // Hash chuỗi rỗng
	await db.run('UPDATE accounts SET password = ?, reset_requested = 1, failed_login_attempts = 0, lockout_until = NULL WHERE User_ID = ?', [hashedPassword, req.params.userId]);
	return res.status(200).json({ message: 'Đã reset mật khẩu thành Trống (Blank).' });
});

router.delete('/admin/accounts/:userId', requireAdmin, async (req, res) => {
	if (req.params.userId === req.admin.User_ID) return res.status(400).json({ message: 'Không thể xóa tài khoản admin đang đăng nhập.' });
	const db = await getDb();
	await db.run('DELETE FROM accounts WHERE User_ID = ?', [req.params.userId]);
	await db.run('DELETE FROM sessions WHERE user_id = ?', [req.params.userId]);
	await auditAdminAction(req.admin.User_ID, 'DELETE_ACCOUNT', `Deleted user account: ${req.params.userId}`);
	return res.status(200).json({ message: 'Đã xóa account thành công.' });
});

// PDF & RAG KPI Stats
router.get('/admin/rag-kpis', requireStaff, async (req, res) => {
	try {
		const db = await getDb();
		const courseCountRow = await db.get('SELECT COUNT(*) as totalCourses FROM course_details');
		const docs = readPdfMetadata();

		const rateResult = await db.get(`
			SELECT 
				COUNT(*) as total_rated,
				SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as total_likes
			FROM rag_queries 
			WHERE rating IN (1, -1)
		`);

		let accuracy = 100.0;
		if (rateResult && rateResult.total_rated > 0) {
			accuracy = (rateResult.total_likes / rateResult.total_rated) * 100;
		}

		return res.status(200).json({
			totalDocs: docs.length,
			totalCourses: courseCountRow ? (courseCountRow.totalCourses || 0) : 0,
			totalUnis: 6,
			accuracy: parseFloat(accuracy.toFixed(1))
		});
	} catch (err) {
		console.error('Error getting RAG KPIs:', err);
		return res.status(500).json({ message: 'Lỗi nạp thống kê.' });
	}
});

router.get('/admin/rag-accuracy', requireStaff, async (req, res) => {
	try {
		const db = await getDb();
		const result = await db.get(`
			SELECT 
				COUNT(*) as total_rated,
				SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as total_likes
			FROM rag_queries 
			WHERE rating IN (1, -1)
		`);

		let accuracy = 100.0;
		if (result && result.total_rated > 0) {
			accuracy = (result.total_likes / result.total_rated) * 100;
		}
		return res.status(200).json({ accuracy: parseFloat(accuracy.toFixed(1)) });
	} catch (error) {
		console.error('Lỗi tính độ chính xác RAG:', error);
		return res.status(500).json({ accuracy: 100.0 });
	}
});
router.get('/course-pdfs', (req, res) => {
	let docs = readPdfMetadata();
	if (req.query.course) {
		docs = docs.filter(doc => doc.course === String(req.query.course));
	}
	if (req.query.university) {
		docs = docs.filter(doc => (doc.university || (doc.course && doc.course.split('_')[0]) || '').toUpperCase() === String(req.query.university).toUpperCase());
	}
	return res.status(200).json({ documents: docs });
});
router.get('/course-pdfs/:documentId/download', requireStaff, async (req, res) => {
	const doc = readPdfMetadata().find(item => item.id === req.params.documentId);
	if (!doc || !fs.existsSync(doc.filePath)) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' });

	try {
		const fileBuffer = fs.readFileSync(doc.filePath);

		// PDF Watermarking using pdf-lib (DRM protection)
		const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
		const pdfDoc = await PDFDocument.load(fileBuffer);
		const pages = pdfDoc.getPages();
		const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

		const timestamp = new Intl.DateTimeFormat('vi-VN', {
			dateStyle: 'short',
			timeStyle: 'short',
		}).format(new Date());

		const watermarkText = `UniPass Protected - ${req.user.Email} | IP: ${req.clientIp || 'Unknown'} | ${timestamp}`;

		pages.forEach(page => {
			const { width, height } = page.getSize();
			const fontSize = 18;
			const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
			const textHeight = font.heightAtSize(fontSize);

			const angle = 35;
			const angleRad = angle * Math.PI / 180;

			const startX = (width / 2) - (textWidth / 2) * Math.cos(angleRad) + (textHeight / 2) * Math.sin(angleRad);
			const startY = (height / 2) - (textWidth / 2) * Math.sin(angleRad) - (textHeight / 2) * Math.cos(angleRad);

			page.drawText(watermarkText, {
				x: startX,
				y: startY,
				size: fontSize,
				font: font,
				color: rgb(0.7, 0.7, 0.7),
				opacity: 0.5,
				rotate: require('pdf-lib').degrees(angle),
			});
		});

		const pdfBytes = await pdfDoc.save();

		res.type('application/pdf');
		res.set('Content-Disposition', `attachment; filename="${doc.originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}"`);
		return res.send(Buffer.from(pdfBytes));
	} catch (error) {
		console.error('Error watermarking PDF for download:', error);
		return res.status(500).json({ message: 'Lỗi khi chuẩn bị file tải về.' });
	}
});
router.get('/documents/stream/:id', requireActiveSession, async (req, res) => {
	const doc = readPdfMetadata().find(item => item.id === req.params.id);
	if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' });

	try {
		const fileBuffer = fs.readFileSync(doc.filePath);

		// Watermark: chữ lớn xéo 45° giữa trang, tự co giãn vừa khít
		const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
		const pdfDoc = await PDFDocument.load(fileBuffer);
		const pages = pdfDoc.getPages();
		const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

		const now = new Date();
		const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
		const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
		const watermarkText = `UniPass | ${req.user.Email} | IP: ${req.clientIp || 'N/A'} | ${dateStr} ${timeStr}`;

		const angle = 45;
		const angleRad = angle * Math.PI / 180;

		pages.forEach(page => {
			const { width, height } = page.getSize();

			// Tính đường chéo trang và chọn fontSize vừa khít ~80% đường chéo
			const diagonal = Math.sqrt(width * width + height * height);
			const targetTextWidth = diagonal * 0.75;
			const fontSize = Math.min(targetTextWidth / font.widthOfTextAtSize(watermarkText, 1), 28);

			const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
			const textHeight = font.heightAtSize(fontSize);

			// Tính toạ độ để tâm chữ nằm chính giữa trang
			const centerX = width / 2;
			const centerY = height / 2;
			const x = centerX - (textWidth / 2) * Math.cos(angleRad) + (textHeight / 2) * Math.sin(angleRad);
			const y = centerY - (textWidth / 2) * Math.sin(angleRad) - (textHeight / 2) * Math.cos(angleRad);

			page.drawText(watermarkText, {
				x: x,
				y: y,
				size: fontSize,
				font: font,
				color: rgb(0.7, 0.7, 0.7),
				opacity: 0.3,
				rotate: degrees(angle),
			});
		});

		const pdfBytes = await pdfDoc.save();

		// Tự động ghi nhận lịch sử đọc tài liệu (Recent Reading) cho học viên
		try {
			const db = await getDb();
			const courseNames = {
				bk_giai_tich: 'Đại số Tuyến tính',
				bk_physics: 'Vật lý Đại cương 1',
				ueh_hvntd: 'Hành vi người tiêu dùng',
				ftu_vamo: 'Kinh tế Vi mô'
			};
			const courseTitle = doc.courseTitle || courseNames[doc.course] || doc.course || 'Khóa học';
			const lessonTitle = doc.lessonTitle || doc.originalName || 'Tài liệu học tập';
			const nowIso = new Date().toISOString();
			await db.run(`
				INSERT INTO reading_history (user_id, document_id, document_title, course_id, course_title, lesson_title, last_read_at)
				VALUES (?, ?, ?, ?, ?, ?, ?)
				ON CONFLICT(user_id, document_id) DO UPDATE SET
					document_title = excluded.document_title,
					course_id = excluded.course_id,
					course_title = excluded.course_title,
					lesson_title = excluded.lesson_title,
					last_read_at = excluded.last_read_at
			`, [req.user.User_ID, doc.id, doc.originalName, doc.course, courseTitle, lessonTitle, nowIso]);
		} catch (historyErr) {
			console.error('Error logging reading history:', historyErr);
		}

		res.set({ 'Content-Type': 'application/pdf', 'Cache-Control': 'no-store, max-age=0', 'X-Viewer-IP': req.clientIp });
		return res.send(Buffer.from(pdfBytes));
	} catch (error) {
		console.error('PDF Stream Error:', error);
		return res.status(500).json({ message: 'Lỗi xử lý tài liệu.' });
	}
});

// Lấy danh sách tài liệu đọc gần đây của học viên (Tủ sách gần đây)
router.get('/user/recent-reads', requireActiveSession, async (req, res) => {
	try {
		const db = await getDb();
		const rows = await db.all(`
			SELECT document_id AS id, document_title, course_id, course_title, lesson_title, last_read_at
			FROM reading_history
			WHERE user_id = ?
			ORDER BY datetime(last_read_at) DESC
			LIMIT 12
		`, [req.user.User_ID]);

		const allDocs = readPdfMetadata();
		const docMap = new Map();
		allDocs.forEach(d => docMap.set(d.id, d));

		let recentList = [];
		for (const r of rows) {
			const meta = docMap.get(r.id);
			recentList.push({
				id: r.id,
				originalName: meta ? meta.originalName : (r.document_title || 'Tài liệu'),
				course: (meta && meta.course) || r.course_id,
				courseTitle: (meta && meta.courseTitle) || r.course_title || 'Khóa học',
				lessonTitle: (meta && meta.lessonTitle) || r.lesson_title || 'Bài học',
				university: (meta && meta.university) || (r.course_id && r.course_id.split('_')[0].toUpperCase()) || 'BK',
				lastReadAt: r.last_read_at,
				isRecent: true
			});
		}

		// Nếu học viên chưa đọc tài liệu nào, lấy gợi ý tài liệu mới nhất phù hợp với trường / môn học
		if (recentList.length === 0) {
			const userUni = (req.user.Email && req.user.Email.includes('@st.ueh.edu.vn') ? 'UEH' : (req.user.Email && req.user.Email.includes('@ftu.edu.vn') ? 'FTU' : 'BK'));
			let fallbackDocs = allDocs.filter(d => (d.university || '').toUpperCase() === userUni || (d.course && d.course.startsWith(userUni.toLowerCase())));
			if (fallbackDocs.length === 0) fallbackDocs = allDocs;
			recentList = fallbackDocs.map(d => ({
				id: d.id,
				originalName: d.originalName,
				course: d.course,
				courseTitle: d.courseTitle || (d.course === 'bk_giai_tich' ? 'Đại số Tuyến tính' : (d.course === 'bk_physics' ? 'Vật lý Đại cương 1' : 'Khóa học')),
				lessonTitle: d.lessonTitle || d.originalName,
				university: d.university || userUni,
				lastReadAt: null,
				isRecent: false
			}));
		}

		return res.status(200).json({ documents: recentList });
	} catch (error) {
		console.error('Error fetching recent reads:', error);
		return res.status(500).json({ message: 'Lỗi tải danh sách tài liệu gần đây.', documents: [] });
	}
});

// Ghi nhận chủ động khi học viên click mở hoặc xem tài liệu
router.post('/user/recent-reads', requireActiveSession, async (req, res) => {
	const { documentId, documentTitle, courseId, courseTitle, lessonTitle } = req.body || {};
	if (!documentId) return res.status(400).json({ message: 'Mã tài liệu là bắt buộc.' });

	try {
		const db = await getDb();
		const allDocs = readPdfMetadata();
		const meta = allDocs.find(d => d.id === documentId);

		const finalDocTitle = documentTitle || (meta && meta.originalName) || 'Tài liệu';
		const finalCourseId = courseId || (meta && meta.course) || 'bk_giai_tich';
		const finalCourseTitle = courseTitle || (meta && meta.courseTitle) || (finalCourseId === 'bk_giai_tich' ? 'Đại số Tuyến tính' : (finalCourseId === 'bk_physics' ? 'Vật lý Đại cương 1' : 'Khóa học'));
		const finalLessonTitle = lessonTitle || (meta && meta.lessonTitle) || 'Tài liệu học tập';
		const nowIso = new Date().toISOString();

		await db.run(`
			INSERT INTO reading_history (user_id, document_id, document_title, course_id, course_title, lesson_title, last_read_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(user_id, document_id) DO UPDATE SET
				document_title = excluded.document_title,
				course_id = excluded.course_id,
				course_title = excluded.course_title,
				lesson_title = excluded.lesson_title,
				last_read_at = excluded.last_read_at
		`, [req.user.User_ID, documentId, finalDocTitle, finalCourseId, finalCourseTitle, finalLessonTitle, nowIso]);

		return res.status(200).json({ success: true, message: 'Đã lưu lịch sử đọc tài liệu.' });
	} catch (error) {
		console.error('Error saving recent read:', error);
		return res.status(500).json({ message: 'Lỗi ghi nhận lịch sử đọc.' });
	}
});

// Payment Config & Gateway Settings
router.get('/payment/config', async (req, res) => {
	const db = await getDb();
	const settings = await db.all('SELECT key, value FROM settings WHERE key IN ("vietqr_active", "momo_active", "momo_phone", "system_name")');
	const config = {
		vietqr_active: 'true',
		momo_active: 'true',
		momo_phone: '0903768871'
	};
	for (const row of settings) {
		config[row.key] = row.value;
	}
	return res.status(200).json(config);
});

router.post('/payment/mock-verify', async (req, res) => {
	const authorization = req.get('Authorization') || '';
	const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
	try {
		const payload = jwt.verify(token, jwtSecret);
		const db = await getDb();
		const session = await db.get('SELECT * FROM sessions WHERE user_id = ? AND token = ?', [payload.User_ID, token]);
		if (!session) return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });

		const { planId, planName, amount, method, isTrial } = req.body || {};

		// 1. Trường hợp kích hoạt DÙNG THỬ 1 NGÀY
		if (isTrial) {
			const expiryDate = new Date();
			expiryDate.setDate(expiryDate.getDate() + 1); // 1 ngày
			const expiryDateIso = expiryDate.toISOString();
			await db.run('UPDATE accounts SET Status = ?, Expiry_Date = ? WHERE User_ID = ?', ['active', expiryDateIso, payload.User_ID]);

			// Ghi nhận giao dịch 0đ
			const txId = `TXN_TRIAL_${Date.now().toString().slice(-6)}`;
			await db.run(
				'INSERT INTO transactions (id, account_id, amount, status, plan, method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
				[txId, payload.User_ID, 0, 'success', 'Dùng thử 1 ngày', 'Khuyến mãi / Trial', new Date().toISOString()]
			);

			// Ghi nhật ký Forensic Logs
			try {
				const clientIp = req.clientIp || (await getClientIp(req)) || '127.0.0.1';
				await logForensicEvent(payload.User_ID, payload.Email, clientIp, 'Kích hoạt dùng thử', 'Kích hoạt gói trải nghiệm 1 ngày miễn phí');
			} catch (e) { }

			return res.status(200).json({
				success: true,
				message: 'Kích hoạt dùng thử 1 ngày thành công!',
				Status: 'active',
				Expiry_Date: expiryDateIso
			});
		}

		// 2. Kiểm tra nếu giao dịch thực tế đã được Admin duyệt hoặc qua Webhook
		const confirmedTx = await db.get(
			'SELECT * FROM transactions WHERE (account_id = ? OR id LIKE ?) AND status = "success" ORDER BY created_at DESC LIMIT 1',
			[payload.User_ID, `%${payload.User_ID}%`]
		);

		if (confirmedTx) {
			let days = 30;
			if (planId === 'yearly' || String(confirmedTx.plan).includes('Năm VIP') || String(confirmedTx.plan).includes('1 Năm')) {
				days = 365;
			} else if (planId === 'semester' || String(confirmedTx.plan).includes('Học Kỳ') || String(confirmedTx.plan).includes('Nửa Năm')) {
				days = 180;
			} else if (planId === 'monthly') {
				days = 30;
			}

			const expiryDate = new Date();
			expiryDate.setDate(expiryDate.getDate() + days);
			const expiryDateIso = expiryDate.toISOString();

			await db.run('UPDATE accounts SET Status = ?, Expiry_Date = ? WHERE User_ID = ?', ['active', expiryDateIso, payload.User_ID]);
			return res.status(200).json({
				success: true,
				message: 'Giao dịch đã được phê duyệt thành công! Tài khoản đã được kích hoạt.',
				Status: 'active',
				Expiry_Date: expiryDateIso
			});
		}

		// Nếu chỉ kiểm tra trạng thái tự động (checkOnly) mà chưa được duyệt
		const { checkOnly, submitPending } = req.body || {};
		if (checkOnly && !submitPending) {
			const hasPending = await db.get('SELECT * FROM transactions WHERE (account_id = ? OR id = ?) AND status = "pending"', [payload.User_ID, `UNIPASS_${payload.User_ID}`]);
			return res.status(200).json({
				success: false,
				isPending: !!hasPending,
				message: hasPending ? 'Giao dịch đang chờ Quản trị viên duyệt.' : 'Hệ thống ngân hàng chưa ghi nhận tiền tự động.'
			});
		}

		// Kiểm tra trạng thái đóng/mở của các cổng thanh toán
		const paymentSettings = await db.all('SELECT key, value FROM settings WHERE key IN ("vietqr_active", "momo_active")');
		const pCfg = {};
		for (const row of paymentSettings) pCfg[row.key] = row.value;
		const isVietQR = (pCfg.vietqr_active === 'true' || pCfg.vietqr_active === undefined);
		const isMomo = (pCfg.momo_active === 'true');

		if (!isVietQR && !isMomo) {
			return res.status(503).json({
				success: false,
				message: 'Hệ thống đang bảo trì thanh toán. Vui lòng quay lại sau hoặc sử dụng tính năng dùng thử miễn phí!'
			});
		}

		// 3. Nếu chưa duyệt và người dùng bấm "Gửi yêu cầu xác thực": Ghi nhận giao dịch "Chờ duyệt" (pending) vào bảng transactions để Admin thấy và duyệt!
		const txId = `UNIPASS_${payload.User_ID}`;
		const planLabel = planName || (planId === 'yearly' ? 'Gói 1 Năm VIP' : planId === 'semester' ? 'Gói Nửa Năm (Học Kỳ)' : 'Gói 1 Tháng');
		const numAmount = parseInt(amount) || (planId === 'yearly' ? 249000 : planId === 'semester' ? 149000 : 79000);
		const payMethod = method || 'VietQR 24/7';

		const existingPending = await db.get('SELECT * FROM transactions WHERE id = ?', [txId]);
		if (existingPending) {
			await db.run(
				'UPDATE transactions SET amount = ?, plan = ?, method = ?, status = "pending", created_at = ? WHERE id = ?',
				[numAmount, planLabel, payMethod, new Date().toISOString(), txId]
			);
		} else {
			await db.run(
				'INSERT INTO transactions (id, account_id, amount, status, plan, method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
				[txId, payload.User_ID, numAmount, 'pending', planLabel, payMethod, new Date().toISOString()]
			);
		}

		return res.status(202).json({
			success: false,
			isPending: true,
			txId: txId,
			amount: numAmount,
			message: `Đã gửi thông tin chuyển khoản (${txId} - ${numAmount.toLocaleString('vi-VN')}đ) tới Quản lý thanh toán. Vui lòng chờ Quản trị viên duyệt!`
		});
	} catch (error) {
		return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
	}
});

router.post('/payment/check-transfer', async (req, res) => {
	const { email, memoCode } = req.body || {};
	const db = await getDb();
	const normalizedEmail = String(email || '').trim().toLowerCase();
	const memo = String(memoCode || '').trim();

	// Kiểm tra xem giao dịch này đã được Admin duyệt hoặc Webhook xử lý thành công chưa
	const tx = await db.get(`
		SELECT t.*, a.User_ID, a.Email, a.Fullname, a.Role, a.Status, a.Expiry_Date 
		FROM transactions t 
		LEFT JOIN accounts a ON a.User_ID = t.account_id 
		WHERE (a.Email = ? OR t.id = ? OR t.id LIKE ?) AND t.status = 'success' 
		ORDER BY t.created_at DESC LIMIT 1
	`, [normalizedEmail, memo, `%${memo}%`]);

	if (tx && tx.User_ID && tx.Status === 'active') {
		// Tạo phiên đăng nhập chính thức
		const token = jwt.sign({
			User_ID: tx.User_ID,
			Email: tx.Email,
			Role: tx.Role || 'Học viên',
			Fullname: tx.Fullname
		}, jwtSecret, { expiresIn: '7d' });

		const sessionId = (crypto.randomUUID ? crypto.randomUUID() : `SES_${Date.now()}`);
		await db.run('INSERT INTO sessions (id, user_id, token, device_id, created_at) VALUES (?, ?, ?, ?, ?)',
			[sessionId, tx.User_ID, token, null, new Date().toISOString()]);

		return res.status(200).json({
			success: true,
			message: 'Đã xác nhận thanh toán thành công, tài khoản đã được kích hoạt!',
			token,
			user: {
				User_ID: tx.User_ID,
				Email: tx.Email,
				Fullname: tx.Fullname,
				Role: tx.Role,
				Status: tx.Status,
				Expiry_Date: tx.Expiry_Date
			}
		});
	}

	return res.status(402).json({
		success: false,
		code: 'PAYMENT_NOT_RECEIVED',
		message: `Hệ thống ngân hàng chưa ghi nhận giao dịch thành công cho mã ${memo || 'thanh toán'}. Vui lòng kiểm tra lại tiền trong tài khoản hoặc chọn "Kích hoạt dùng thử 1 ngày miễn phí".`
	});
});

// Webhook thanh toán thực tế (MoMo / VNPay)
const PAYMENT_SECRET_KEY = process.env.PAYMENT_SECRET_KEY || 'unipass-secret-webhook-key';

router.post('/webhook/payment', async (req, res) => {
	const signature = req.headers['x-signature'];
	if (!signature) return res.status(401).json({ message: 'Missing signature' });

	const payload = JSON.stringify(req.body);
	const expectedSignature = crypto.createHmac('sha256', PAYMENT_SECRET_KEY).update(payload).digest('hex');

	if (signature !== expectedSignature) {
		return res.status(403).json({ message: 'Invalid signature' });
	}

	const { userId, amount, status, transactionId } = req.body;
	if (!transactionId) {
		return res.status(400).json({ message: 'Missing transactionId' });
	}

	if (status === 'success') {
		const db = await getDb();

		// Idempotency Check (Anti-Replay Attack)
		const existingTx = await db.get('SELECT id FROM transactions WHERE id = ?', [transactionId]);
		if (existingTx) {
			return res.status(200).json({ message: 'Transaction already processed' });
		}

		const thirtyDaysFromNow = new Date();
		thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
		const expiryDateIso = thirtyDaysFromNow.toISOString();

		await db.run('UPDATE accounts SET Status = ?, Expiry_Date = ? WHERE User_ID = ?', ['active', expiryDateIso, userId]);

		await db.run('INSERT INTO transactions (id, account_id, amount, status, method, plan) VALUES (?, ?, ?, ?, ?, ?)',
			[transactionId, userId, amount, 'success', 'Webhook', 'Membership']);

		return res.status(200).json({ message: 'Webhook processed' });
	}

	return res.status(200).json({ message: 'Received' });
});
// Admin Transactions Routes
router.get('/admin/transactions', requireAdmin, async (req, res) => {
	const db = await getDb();
	const transactions = await db.all(`
		SELECT t.id, COALESCE(a.Fullname, 'Chưa đặt tên') AS name, COALESCE(a.Email, '') AS email, t.plan, t.amount, t.method, t.status, t.created_at AS date, t.account_id
		FROM transactions t LEFT JOIN accounts a ON a.User_ID = t.account_id ORDER BY t.created_at DESC, t.id DESC
	`);
	const summary = await db.get(`
		SELECT COALESCE(SUM(CASE WHEN status = 'success' AND date(created_at) = date('now') THEN amount ELSE 0 END), 0) AS todayRevenue,
		COUNT(CASE WHEN status = 'success' THEN 1 END) AS successfulCount, COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pendingCount
		FROM transactions
	`);
	return res.status(200).json({ transactions, summary });
});

router.delete('/admin/transactions', requireAdmin, async (req, res) => {
	const db = await getDb();
	await db.run('DELETE FROM transactions');
	auditAdminAction(req.admin ? req.admin.User_ID : 'ADMIN', 'CLEAR_TRANSACTIONS', 'Đã xóa sạch toàn bộ lịch sử giao dịch');
	return res.status(200).json({ success: true, message: 'Đã xóa toàn bộ lịch sử giao dịch thành công.' });
});

router.delete('/admin/transactions/:id', requireAdmin, async (req, res) => {
	const { id } = req.params;
	const db = await getDb();
	const tx = await db.get('SELECT * FROM transactions WHERE id = ?', [id]);
	if (!tx) return res.status(404).json({ message: 'Không tìm thấy giao dịch.' });

	await db.run('DELETE FROM transactions WHERE id = ?', [id]);
	auditAdminAction(req.admin ? req.admin.User_ID : 'ADMIN', 'DELETE_TRANSACTION', `Đã xóa giao dịch ${id}`);
	return res.status(200).json({ success: true, message: `Đã xóa giao dịch ${id} thành công!` });
});

router.post('/admin/transactions/approve/:id', requireAdmin, async (req, res) => {
	const { id } = req.params;
	const db = await getDb();
	const tx = await db.get('SELECT * FROM transactions WHERE id = ?', [id]);
	if (!tx) return res.status(404).json({ message: 'Không tìm thấy giao dịch.' });

	await db.run('UPDATE transactions SET status = ? WHERE id = ?', ['success', id]);

	// Kích hoạt tài khoản học viên tương ứng
	if (tx.account_id) {
		let days = 30;
		if (String(tx.plan).includes('Năm VIP') || String(tx.plan).includes('1 Năm')) days = 365;
		else if (String(tx.plan).includes('Học Kỳ') || String(tx.plan).includes('Nửa Năm')) days = 180;
		else if (String(tx.plan).includes('Tháng')) days = 30;

		const expiry = new Date();
		expiry.setDate(expiry.getDate() + days);
		const expiryIso = expiry.toISOString();

		await db.run('UPDATE accounts SET Status = ?, Expiry_Date = ? WHERE User_ID = ?', ['active', expiryIso, tx.account_id]);

		const student = await db.get('SELECT * FROM accounts WHERE User_ID = ?', [tx.account_id]);
		if (student) {
			logForensicEvent(tx.account_id, student.Email, req.ip, 'Duyệt kích hoạt gói học tập', `Admin đã duyệt GD ${id} (${tx.plan} - ${tx.amount}đ). Tài khoản kích hoạt ${days} ngày.`);
		}
	}

	auditAdminAction(req.admin ? req.admin.User_ID : 'ADMIN', 'APPROVE_TRANSACTION', `Đã duyệt giao dịch ${id} cho tài khoản ${tx.account_id}`);
	return res.status(200).json({ success: true, message: `Đã duyệt thành công giao dịch ${id} và kích hoạt gói học tập!` });
});

router.post('/admin/transactions/simulate', requireAdmin, async (req, res) => {
	const { accountId, plan, amount, method, status } = req.body;
	const db = await getDb();
	const txId = `TXN_${Date.now().toString().slice(-6)}`;
	const numAmount = parseInt(amount) || 149000;
	const planName = plan || 'Gói Nửa Năm (Học Kỳ)';
	const payMethod = method || 'VietQR (TPBank)';
	const txStatus = status || 'pending';

	await db.run(
		'INSERT INTO transactions (id, account_id, amount, status, plan, method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
		[txId, accountId || 'SV001', numAmount, txStatus, planName, payMethod, new Date().toISOString()]
	);

	if (accountId && txStatus === 'success') {
		let days = 180;
		if (planName.includes('Năm VIP') || planName.includes('365')) days = 365;
		else if (planName.includes('Tháng')) days = 30;

		const expiry = new Date();
		expiry.setDate(expiry.getDate() + days);
		await db.run('UPDATE accounts SET Status = ?, Expiry_Date = ? WHERE User_ID = ?', ['active', expiry.toISOString(), accountId]);
	}

	auditAdminAction(req.admin ? req.admin.User_ID : 'ADMIN', 'SIMULATE_PAYMENT', `Tạo giao dịch mẫu ${txId} (${txStatus})`);
	return res.status(200).json({ success: true, message: `Đã tạo giao dịch mẫu ${txId} (${txStatus === 'pending' ? 'Chờ duyệt' : 'Thành công'})!`, txId });
});

router.delete('/admin/forensic-logs', requireAdmin, async (req, res) => {
	const db = await getDb();
	await db.run('DELETE FROM forensic_logs');
	return res.status(200).json({ message: 'Đã xóa toàn bộ event log.' });
});

router.delete('/admin/course-pdfs/:documentId', requireStaff, (req, res) => {
	const metadata = readPdfMetadata();
	const docIndex = metadata.findIndex(item => item.id === req.params.documentId);
	if (docIndex === -1) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' });
	const [document] = metadata.splice(docIndex, 1);
	if (document.filePath && fs.existsSync(document.filePath)) fs.unlinkSync(document.filePath);
	writePdfMetadata(metadata);

	// Staff can also be admin, fallback to unknown if not present in request (though requireStaff guarantees user)
	const staffId = req.admin ? req.admin.User_ID : (req.user ? req.user.User_ID : 'System');
	auditAdminAction(staffId, 'DELETE_PDF', `Deleted document: ${document.originalName} (${document.id})`);

	return res.status(200).json({ message: 'Đã xóa tài liệu PDF thành công.' });
});

// AI RAG Chat Route
router.post('/ai/rag-chat', requireActiveSession, async (req, res) => {
	try {
		const { message, context, subject, courseId } = req.body || {};
		if (!message) return res.status(400).json({ message: 'Thiếu tin nhắn.' });

		const db = await getDb();
		const apiKey = await resolveGeminiApiKey(db);

		let finalReply = '';
		let finalCitation = '';

		if (!apiKey) {
			finalReply = `Theo tài liệu mình tìm thấy trong hệ thống, nội dung liên quan đến môn <strong>${subject}</strong> đã được tổng hợp. <br><br><strong>Lưu ý:</strong> Đây là phản hồi giả lập (Mock AI) vì chưa có API Key. Cấu hình để nhận câu trả lời thật từ Gemini.`;
			finalCitation = `${context || 'Tài liệu chung'} (Chương Mock - Slide Mock)`;
		} else {

			let pdfInputs = [];
			let pdfNames = [];
			const metadata = readPdfMetadata();

			// Xác định trường của sinh viên
			const userDomain = String(req.user?.Email || '').toLowerCase().split('@')[1];
			const universityMap = {
				'st.ueh.edu.vn': 'UEH',
				'hcmut.edu.vn': 'BK',
				'ftu.edu.vn': 'FTU',
				'st.neu.edu.vn': 'NEU',
				'hcmus.edu.vn': 'HCMUS',
				'tdtu.edu.vn': 'TDTU',
			};
			const userUni = universityMap[userDomain] || 'BK';

			let matchingPdfs = [];
			if (courseId && courseId !== 'all' && !courseId.startsWith('all_')) {
				// Chọn môn học cụ thể
				matchingPdfs = metadata.filter(m => m.course === courseId);
			} else {
				// Mặc định: Tất cả môn học của trường sinh viên đó
				matchingPdfs = metadata.filter(m => m.university === userUni || (m.course && m.course.startsWith(userUni.toLowerCase())));
				if (matchingPdfs.length === 0) {
					matchingPdfs = metadata; // Fallback
				}
			}

			for (const pdf of matchingPdfs) {
				if (fs.existsSync(pdf.filePath)) {
					try {
						const fileBytes = fs.readFileSync(pdf.filePath);
						pdfInputs.push({
							type: "document",
							data: fileBytes.toString('base64'),
							mime_type: "application/pdf"
						});
						pdfNames.push(pdf.originalName);
					} catch (err) {
						console.error("Lỗi đọc PDF đính kèm:", err);
					}
				}
			}

			const pdfContextInfo = pdfNames.length > 0 ? `Danh sách các file tài liệu đính kèm: ${pdfNames.join(', ')}.` : '';
			const prompt = `Bạn là trợ lý học tập UniPass, hỗ trợ giải đáp môn học "${subject}". ${pdfContextInfo} 

YÊU CẦU BẮT BUỘC:
1. TRẢ LỜI NGHIÊM NGẶT THEO TÀI LIỆU: Chỉ sử dụng thông tin từ các tài liệu PDF được đính kèm để trả lời câu hỏi: "${message}". 
2. NẾU KHÔNG CÓ THÔNG TIN: Nếu trong tài liệu không có thông tin để trả lời, BẮT BUỘC phải trả lời: "Rất tiếc, tài liệu [Tên_Tài_Liệu] không chứa thông tin về câu hỏi này." và KHÔNG tự bịa ra hay dùng kiến thức bên ngoài.
3. ĐỊNH DẠNG TOÁN HỌC & ESCAPE JSON: 
   - BẮT BUỘC bao bọc MỌI công thức và phép tính bằng $...$ (inline) hoặc $$...$$ (block).
   - QUAN TRỌNG: Vì output ở định dạng JSON, mọi ký tự gạch chéo ngược trong công thức LaTeX BẮT BUỘC phải dùng 2 dấu gạch chéo \\\\ (ví dụ: \\\\times, \\\\forall, \\\\text, \\\\bar, \\\\sum, \\\\bigcup, \\\\in, \\\\mathbb{R}, \\\\left, \\\\right, \\\\begin, \\\\end, \\\\dots). Tuyệt đối không dùng 1 dấu gạch chéo để tránh lỗi escape chuỗi JSON (như \\t biến thành tab, \\b biến thành backspace).
4. Trả về JSON với 2 trường: 
- "reply" (Câu trả lời chi tiết, format bằng HTML và LaTeX)
- "citation" (Nếu có thông tin, ghi rõ tên file tài liệu trong danh sách đính kèm. VD: "Tài liệu X, trang Y". Nếu không có thông tin, ghi "Không có dữ liệu").`;

			const schema = {
				type: "object",
				properties: {
					reply: { type: "string" },
					citation: { type: "string" }
				},
				required: ["reply", "citation"]
			};

			const interaction = await runActiveGemini(apiKey, db, (ai, model) => ai.interactions.create({
				model,
				input: [
					...pdfInputs,
					{ type: "text", text: prompt }
				],
				response_format: {
					type: 'text',
					mime_type: 'application/json',
					schema: schema
				}
			}));

			const result = JSON.parse(interaction.output_text);
			finalReply = result.reply;
			finalCitation = result.citation;
		}

		// Save interaction to database for evaluation
		const dbResult = await db.run(
			'INSERT INTO rag_queries (account_id, question, answer, rating) VALUES (?, ?, ?, 0)',
			[req.user.User_ID, message, finalReply]
		);

		return res.status(200).json({
			reply: finalReply,
			citation: finalCitation,
			query_id: dbResult.lastID
		});
	} catch (error) {
		return sendGeminiFailure(res, error, 'RAG Chat Error:', 'Lỗi AI: ' + (error && error.message ? error.message : ''));
	}
});

// AI Rate RAG Chat Route
router.post('/ai/rate-rag', requireActiveSession, async (req, res) => {
	try {
		const { query_id, rating } = req.body;
		if (!query_id || rating === undefined) {
			return res.status(400).json({ message: 'Thiếu query_id hoặc rating.' });
		}
		const db = await getDb();
		const query = await db.get('SELECT * FROM rag_queries WHERE id = ? AND account_id = ?', [query_id, req.user.User_ID]);
		if (!query) {
			return res.status(404).json({ message: 'Không tìm thấy câu hỏi hoặc bạn không có quyền đánh giá.' });
		}

		await db.run('UPDATE rag_queries SET rating = ? WHERE id = ?', [rating, query_id]);
		return res.status(200).json({ message: 'Cảm ơn bạn đã đánh giá!' });
	} catch (error) {
		console.error('Rate RAG Error:', error);
		return res.status(500).json({ message: 'Lỗi hệ thống.' });
	}
});

// AI Generate Exam Route
router.post('/ai/generate-exam', requireActiveSession, async (req, res) => {
	try {
		const { examTitle, subject, university, courseId } = req.body || {};
		if (!examTitle || !subject) return res.status(400).json({ message: 'Thiếu thông tin đề thi.' });

		const db = await getDb();
		const apiKey = await resolveGeminiApiKey(db);

		// Helper trích xuất số thứ tự chương (Chương 1, Chương 2, ...)
		function extractChapterNumber(text) {
			if (!text) return null;
			const match = String(text).match(/(?:chương|chuong|chapter)\s*([0-9]+)/i);
			return match ? parseInt(match[1]) : null;
		}

		// 1. Kiểm tra tài liệu PDF có sẵn trong hệ thống cho môn học/chương này
		const metadata = readPdfMetadata();
		const userDomain = String(req.user?.Email || '').toLowerCase().split('@')[1];
		const universityMap = {
			'st.ueh.edu.vn': 'UEH',
			'hcmut.edu.vn': 'BK',
			'ftu.edu.vn': 'FTU',
			'st.neu.edu.vn': 'NEU',
			'hcmus.edu.vn': 'HCMUS',
			'tdtu.edu.vn': 'TDTU',
		};
		const userUni = university || universityMap[userDomain] || 'BK';

		let { chapterTitle, targetScope, chapterId, chapterNum } = req.body || {};
		// Lọc bỏ các chuỗi trạng thái tiến độ nếu vô tình truyền vào chapterTitle
		if (chapterTitle && (chapterTitle.includes('hoàn thành') || chapterTitle.includes('Học tiếp') || chapterTitle.includes('🎉'))) {
			chapterTitle = '';
			if (!chapterId) targetScope = 'full_course';
		}
		const reqChapNum = extractChapterNumber(chapterTitle || examTitle) || (chapterNum ? parseInt(chapterNum) : null);
		const isChapterSpecific = (targetScope === 'chapter' && (!!chapterTitle || !!chapterId)) || reqChapNum !== null || !!chapterId;

		let matchingPdfs = [];

		if (isChapterSpecific) {
			// CÔ LẬP THEO CHƯƠNG: Chỉ lấy PDF của đúng chương này thuộc môn học đó
			let dbDocIds = [];
			if (chapterId) {
				const chapterLessons = await db.all('SELECT document_id FROM course_lessons WHERE chapter_id = ? AND document_id IS NOT NULL AND document_id != ""', [chapterId]);
				dbDocIds = chapterLessons.map(l => String(l.document_id));
			}

			matchingPdfs = metadata.filter(m => {
				const courseMatch = (courseId && courseId !== 'all' && (m.course === courseId || String(m.course || '').replace(/-/g, '_') === String(courseId || '').replace(/-/g, '_'))) ||
					(m.university === userUni && (m.courseTitle?.toLowerCase().includes(subject.toLowerCase()) || subject.toLowerCase().includes(m.courseTitle?.toLowerCase() || '')));
				if (!courseMatch) return false;

				if (dbDocIds.length > 0 && dbDocIds.includes(String(m.id))) {
					return true;
				}

				const pdfChapNum = extractChapterNumber((m.lessonId || '') + ' ' + (m.lessonTitle || '') + ' ' + (m.originalName || ''));
				if (reqChapNum !== null && pdfChapNum !== null) {
					return pdfChapNum === reqChapNum;
				}
				if (chapterTitle && m.lessonTitle && m.lessonTitle.toLowerCase().includes(chapterTitle.toLowerCase())) {
					return true;
				}
				return false;
			});

			let validPdfs = matchingPdfs.filter(pdf => fs.existsSync(pdf.filePath));
			if (validPdfs.length === 0) {
				const label = chapterTitle || examTitle || `Chương ${reqChapNum}`;
				return res.status(400).json({
					message: `Chương "${label}" của môn "${subject}" hiện chưa có tài liệu PDF giáo trình riêng trong hệ thống. Vui lòng tải lên tài liệu PDF cho chương này trước khi tạo đề thi.`
				});
			}
			matchingPdfs = validPdfs;
		} else {
			// ĐỀ THI TOÀN BỘ MÔN HỌC (Giữa kỳ, Cuối kỳ): Lấy tất cả PDF của môn học đó
			if (courseId && courseId !== 'all') {
				matchingPdfs = metadata.filter(m => m.course === courseId);
			}
			if (matchingPdfs.length === 0) {
				matchingPdfs = metadata.filter(m =>
					(m.university === userUni || (m.course && m.course.startsWith(userUni.toLowerCase()))) &&
					(m.courseTitle?.toLowerCase().includes(subject.toLowerCase()) ||
						m.lessonTitle?.toLowerCase().includes(subject.toLowerCase()) ||
						subject.toLowerCase().includes(m.courseTitle?.toLowerCase() || ''))
				);
			}

			let validPdfs = matchingPdfs.filter(pdf => fs.existsSync(pdf.filePath));
			if (validPdfs.length === 0) {
				return res.status(400).json({
					message: `Môn học "${subject}" hiện chưa có tài liệu PDF giáo trình nào trong hệ thống. Vui lòng tải lên tài liệu PDF trước khi tạo đề thi.`
				});
			}
			matchingPdfs = validPdfs;
		}

		let validPdfs = matchingPdfs.filter(pdf => fs.existsSync(pdf.filePath));

		let pdfInputs = [];
		let pdfNames = [];
		for (const pdf of validPdfs) {
			try {
				const fileBytes = fs.readFileSync(pdf.filePath);
				pdfInputs.push({
					type: "document",
					data: fileBytes.toString('base64'),
					mime_type: "application/pdf"
				});
				pdfNames.push(pdf.originalName);
			} catch (err) {
				console.error("Lỗi đọc PDF đề thi:", err);
			}
		}

		if (pdfInputs.length === 0) {
			return res.status(400).json({
				message: `Không thể đọc file tài liệu PDF của môn "${subject}". Vui lòng kiểm tra lại file tải lên.`
			});
		}

		if (!apiKey) {
			return res.status(400).json({
				message: 'Hệ thống chưa được cấu hình GEMINI_API_KEY để xử lý tài liệu PDF giáo trình.'
			});
		}

		const pdfPluralDesc = pdfInputs.length >= 2
			? `Hệ thống đã đính kèm TỔNG CỘNG ${pdfInputs.length} FILE TÀI LIỆU GIÁO TRÌNH (${pdfNames.join(', ')}). BẮT BUỘC TỔNG HỢP VÀ KẾT HỢP KIẾN THỨC TỪ TẤT CẢ CÁC TÀI LIỆU NÀY để tạo đề thi.`
			: `Đã đính kèm tài liệu giáo trình (${pdfNames.join(', ')}). BẮT BUỘC trích xuất và sinh câu hỏi trực tiếp từ nội dung tài liệu này.`;

		const prompt = `Bạn là Trưởng bộ môn khảo thí tại ${userUni}.
Nhiệm vụ: Tạo một đề thi trắc nghiệm CHÍNH THỨC gồm đúng 50 CÂU HỎI TRẮC NGHIỆM NGẪU NHIÊN cho bài thi "${examTitle}" môn "${subject}".
${pdfPluralDesc}

YÊU CẦU QUAN TRỌNG:
1. ĐÚNG 50 CÂU HỎI NGẪU NHIÊN: Bao quát toàn diện các chương, định nghĩa, tính chất, công thức và bài tập tính toán từ TẤT CẢ các file PDF đính kèm.
2. ĐỊNH DẠNG TOÁN HỌC: Mọi công thức toán học, ma trận, ký hiệu bắt buộc bọc trong dấu $ (inline) hoặc $$ (block). Dùng 2 dấu gạch chéo \\\\ cho lệnh LaTeX trong JSON (ví dụ: \\\\times, \\\\forall, \\\\det, \\\\in, \\\\mathbb{R}, \\\\frac).
3. 4 LỰA CHỌN: Mỗi câu có đúng 4 phương án [A, B, C, D], chỉ có 1 đáp án đúng (correctAnswer từ 0 đến 3).
4. GIẢI THÍCH: Trường "explanation" giải thích rõ ràng tại sao đáp án đó đúng dựa theo nội dung trong các file giáo trình đính kèm.`;

		const schema = {
			type: "object",
			properties: {
				examTitle: { type: "string" },
				subject: { type: "string" },
				questions: {
					type: "array",
					items: {
						type: "object",
						properties: {
							question: { type: "string" },
							options: {
								type: "array",
								items: { type: "string" }
							},
							correctAnswer: { type: "integer", description: "Index của đáp án đúng (0-3)" },
							explanation: { type: "string" }
						},
						required: ["question", "options", "correctAnswer", "explanation"]
					}
				}
			},
			required: ["examTitle", "questions"]
		};

		const interaction = await runActiveGemini(apiKey, db, (ai, model) => ai.interactions.create({
			model,
			input: [
				...pdfInputs,
				{ type: "text", text: prompt }
			],
			response_format: {
				type: 'text',
				mime_type: 'application/json',
				schema: schema
			}
		}));

		const result = JSON.parse(interaction.output_text);

		// Đảm bảo có đủ 50 câu hỏi (nếu AI trả về ít hơn do token limit, tự động bù câu ngẫu nhiên)
		let finalQuestions = Array.isArray(result.questions) ? result.questions : [];
		if (finalQuestions.length < 50 && finalQuestions.length > 0) {
			const originalLen = finalQuestions.length;
			let idx = 0;
			while (finalQuestions.length < 50) {
				const cloneQ = JSON.parse(JSON.stringify(finalQuestions[idx % originalLen]));
				cloneQ.question = `${cloneQ.question} (Biến thể ${finalQuestions.length + 1})`;
				finalQuestions.push(cloneQ);
				idx++;
			}
		}

		const durationMinutes = parseInt(req.body.timeLimitMinutes) || (isChapterSpecific ? 45 : 60);
		return res.status(200).json({
			examTitle: result.examTitle || examTitle,
			subject: subject,
			chapterTitle: chapterTitle || '',
			durationMinutes: durationMinutes,
			totalQuestions: finalQuestions.length,
			questions: finalQuestions.slice(0, 50)
		});
	} catch (error) {
		return sendGeminiFailure(res, error, 'Generate Exam Error:', 'Lỗi AI: ' + (error && error.message ? error.message : ''));
	}
});

router.post('/admin/course-pdfs', requireStaff, (req, res) => {
	uploadPdf.single('pdf')(req, res, (err) => {
		if (err) {
			return res.status(400).json({ message: err.message || 'Lỗi xử lý file PDF.' });
		}
		if (!req.file) {
			return res.status(400).json({ message: 'Vui lòng chọn file định dạng PDF.' });
		}
		const course = String(req.body.course || '').trim();
		const lessonId = String(req.body.lessonId || req.body.chapter || 'chapter-1').trim();
		const lessonTitle = String(req.body.lessonTitle || req.body.chapterTitle || 'Chương 1').trim();
		const university = String(req.body.university || (course ? course.split('_')[0].split('-')[0].toUpperCase() : 'UEH')).trim();
		const courseTitle = String(req.body.courseTitle || course).trim();

		if (!course) {
			if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
			return res.status(400).json({ message: 'Vui lòng chọn môn học hợp lệ.' });
		}

		const metadata = readPdfMetadata();
		const document = {
			id: `pdf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
			course,
			courseTitle,
			university,
			lessonId,
			lessonTitle,
			originalName: req.file.originalname,
			filePath: req.file.path,
			size: req.file.size,
			createdAt: new Date().toISOString()
		};
		metadata.push(document);
		writePdfMetadata(metadata);
		return res.status(201).json({ document });
	});
});

router.put('/admin/course-pdfs/:documentId/assign', validators.assignPdf, handleValidationErrors, requireStaff, async (req, res) => {
	try {
		const { course, courseTitle, university, lessonId, lessonTitle } = req.body || {};
		const metadata = readPdfMetadata();
		const doc = metadata.find(item => item.id === req.params.documentId);
		if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu cần gán.' });

		const normalizedCourse = String(course || '').trim();
		doc.course = normalizedCourse;
		doc.courseTitle = resolveCourseTitle(normalizedCourse, courseTitle || normalizedCourse || 'Chưa gán môn học');
		doc.university = String(university || (normalizedCourse ? normalizedCourse.split('_')[0].toUpperCase() : '')).trim();
		doc.lessonId = String(lessonId || '').trim();
		doc.lessonTitle = String(lessonTitle || '').trim();
		doc.updatedAt = new Date().toISOString();

		writePdfMetadata(metadata);
		return res.status(200).json({ success: true, document: decoratePdfDocument(doc), message: 'Đã gán tài liệu vào môn học thành công!' });
	} catch (err) {
		console.error('Error assigning course to PDF:', err);
		return res.status(500).json({ message: 'Lỗi gán môn học: ' + err.message });
	}
});

router.post('/admin/course-pdfs/bulk-delete', requireStaff, async (req, res) => {
	try {
		const { documentIds } = req.body || {};
		if (!Array.isArray(documentIds) || documentIds.length === 0) {
			return res.status(400).json({ message: 'Danh sách tài liệu cần xóa không hợp lệ.' });
		}
		const metadata = readPdfMetadata();
		const idSet = new Set(documentIds);
		const remaining = [];
		let deletedCount = 0;

		for (const doc of metadata) {
			if (idSet.has(doc.id)) {
				if (doc.filePath && fs.existsSync(doc.filePath)) {
					try { fs.unlinkSync(doc.filePath); } catch (e) {}
				}
				deletedCount++;
			} else {
				remaining.push(doc);
			}
		}

		writePdfMetadata(remaining);
		return res.status(200).json({ success: true, deletedCount, message: `Đã xóa ${deletedCount} tài liệu thành công.` });
	} catch (err) {
		console.error('Error bulk deleting PDFs:', err);
		return res.status(500).json({ message: 'Lỗi xóa tài liệu: ' + err.message });
	}
});

const studyGroupClients = new Set();
router.get('/study-group/stream', async (req, res) => {
	const account = await getActiveUserFromRequest(req);
	if (!account) return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });
	res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive' });
	const db = await getDb();
	const history = await db.all('SELECT id, kind, text, user_id AS userId, user_name AS userName, created_at AS createdAt FROM study_group_messages ORDER BY created_at ASC LIMIT 100');
	res.write(`event: history\\ndata: ${JSON.stringify(history)}\\n\\n`);
	const client = { res };
	studyGroupClients.add(client);
	const keepAlive = setInterval(() => res.write(': keep-alive\\n\\n'), 20000);
	req.on('close', () => { clearInterval(keepAlive); studyGroupClients.delete(client); });
});

async function addStudyGroupMessage({ account, text, kind = 'student' }) {
	const message = { id: `chat-${Date.now()}-${crypto.randomUUID()}`, kind, text, userId: account.User_ID, userName: account.Fullname, createdAt: new Date().toISOString() };
	const db = await getDb();
	await db.run('INSERT INTO study_group_messages (id, kind, text, user_id, user_name, created_at) VALUES (?, ?, ?, ?, ?, ?)', [message.id, message.kind, message.text, message.userId, message.userName, message.createdAt]);

	// Tối ưu hóa: Chỉ thực hiện cleanup DB khoảng 10% số lần và không await để tránh block luồng
	if (Math.random() < 0.1) {
		db.run('DELETE FROM study_group_messages WHERE id NOT IN (SELECT id FROM study_group_messages ORDER BY created_at DESC LIMIT 100)').catch(err => console.error("Lỗi dọn dẹp tin nhắn:", err));
	}

	const payload = `data: ${JSON.stringify(message)}\n\n`;
	for (const client of studyGroupClients) client.res.write(payload);
	return message;
}

router.post('/study-group/messages', requireActiveSession, async (req, res) => {
	const text = String(req.body?.text || '').trim();
	if (!text || text.length > 2000) return res.status(400).json({ message: 'Tin nhắn phải có từ 1 đến 2000 ký tự.' });
	const db = await getDb();
	const account = await db.get('SELECT * FROM accounts WHERE User_ID = ?', [req.user.User_ID]);
	const message = await addStudyGroupMessage({ account, text });
	if (/@ai\b/i.test(text)) {
		setTimeout(() => addStudyGroupMessage({ account: { User_ID: 'AIBOT', Fullname: 'UniPass AI' }, kind: 'ai', text: 'Mình đã nhận câu hỏi của bạn. Trợ giảng AI sẽ phân tích nội dung phòng học và phản hồi ngay sau đây.' }), 1200);
	}
	return res.status(201).json({ message });
});

router.get('/admin/forensic-logs/stream', async (req, res) => {
	const admin = await getAdminFromToken(String(req.query.token || ''));
	if (!admin) return res.status(401).json({ message: 'Token quản trị không hợp lệ.' });
	res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive' });
	res.flushHeaders();
	const send = (event, data) => res.write(`event: ${event}\\ndata: ${JSON.stringify(data)}\\n\\n`);
	const db = await getDb();
	const initialLogs = await db.all(`SELECT id, email, action, ip, created_at AS time, status FROM forensic_logs WHERE email != 'admin' AND NOT EXISTS (SELECT 1 FROM accounts WHERE accounts.Email = forensic_logs.email AND accounts.Role = 'admin') ORDER BY id DESC`);
	send('snapshot', { logs: initialLogs });
	const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 15000);
	const subscriber = log => send('log', log);
	forensicSubscribers.add(subscriber);
	res.on('close', () => { clearInterval(keepAlive); forensicSubscribers.delete(subscriber); });
});

// Settings APIs
router.get('/admin/settings', requireAdmin, async (req, res) => {
	const db = await getDb();
	const rows = await db.all('SELECT key, value FROM settings');
	const settings = {};
	for (const row of rows) {
		settings[row.key] = row.value;
	}
	if (settings.llm_model) settings.llm_model = normalizeLlmModel(settings.llm_model);
	settings.ai_status_cache = JSON.stringify(aiStatusCache);
	return res.status(200).json(settings);
});

router.put('/admin/settings', requireAdmin, async (req, res) => {
	const updates = req.body || {};
	const db = await getDb();
	for (const [key, value] of Object.entries(updates)) {
		await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
	}

	// Trigger background check if keys changed
	if (updates.gemini_api_key !== undefined || updates.pinecone_api_key !== undefined) {
		runBackgroundAiCheck();
	}

	return res.status(200).json({ message: 'Đã cập nhật cài đặt thành công.' });
});

router.put('/admin/settings/password', requireAdmin, async (req, res) => {
	const { password } = req.body;
	if (!password) return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu mới.' });
	const db = await getDb();
	const bcrypt = require('bcrypt');
	const hashedPassword = await bcrypt.hash(password, 10);
	await db.run('UPDATE accounts SET password = ? WHERE User_ID = ?', [hashedPassword, req.admin.User_ID]);
	return res.status(200).json({ message: 'Đổi mật khẩu Admin thành công.' });
});

// --- Background AI Checker ---
let aiStatusCache = { gemini: null, pinecone: null };

async function testAiKeys(apiKey, pineconeKey) {
	let gemini = null;
	let pinecone = null;
	if (apiKey) {
		try {
			const ai = new GoogleGenAI({ apiKey });
			const dbForModel = await getDb();
			const activeModel = await getActiveLlmModel(dbForModel);
			const interaction = await runGeminiWithFallback(apiKey, activeModel, async (model) => {
				return await ai.interactions.create({ model, input: 'Ping' });
			});
			if (interaction.output_text) {
				gemini = { success: true, message: 'Kết nối Google Gemini thành công (200 OK).' };
			} else {
				gemini = { success: false, message: 'Không nhận được phản hồi hợp lệ.' };
			}
		} catch (error) {
			gemini = {
				success: false,
				message: isGeminiQuotaExceededError(error) ? GEMINI_QUOTA_MESSAGE : error.message
			};
		}
	}
	if (pineconeKey) {
		try {
			const response = await fetch('https://api.pinecone.io/indexes', { headers: { 'Api-Key': pineconeKey } });
			if (response.ok) {
				pinecone = { success: true, message: 'Kết nối Pinecone DB thành công (200 OK).' };
			} else {
				pinecone = { success: false, message: `Lỗi HTTP ${response.status}: Key không hợp lệ.` };
			}
		} catch (error) {
			pinecone = { success: false, message: error.message };
		}
	}
	return { gemini, pinecone };
}

async function runBackgroundAiCheck() {
	try {
		const db = await getDb();
		const geminiRow = await db.get("SELECT value FROM settings WHERE key = 'gemini_api_key'");
		const pineconeRow = await db.get("SELECT value FROM settings WHERE key = 'pinecone_api_key'");
		aiStatusCache = await testAiKeys(geminiRow?.value || '', pineconeRow?.value || '');
	} catch (err) {
		console.error("Lỗi khi kiểm tra AI ngầm:", err);
	}
}

router.post('/admin/test-ai', requireAdmin, async (req, res) => {
	const { apiKey, pineconeKey } = req.body || {};
	const result = await testAiKeys(apiKey, pineconeKey);

	// Update cache proactively
	if (apiKey) aiStatusCache.gemini = result.gemini;
	if (pineconeKey) aiStatusCache.pinecone = result.pinecone;

	return res.status(200).json(result);
});


router.post('/ai/exam-gap-analysis', requireActiveSession, async (req, res) => {
	try {
		const { examTitle, subject, chapterTitle, score, totalQuestions, accuracyPercent, wrongQuestions } = req.body || {};
		const db = await getDb();
		const apiKey = await resolveGeminiApiKey(db);

		if (!apiKey || !wrongQuestions || wrongQuestions.length === 0) {
			return res.status(200).json({
				weakTopics: accuracyPercent >= 80 ? ['Hoàn thiện điểm 10', 'Bài tập nâng cao'] : ['Kỹ năng tính toán', 'Lý thuyết định nghĩa'],
				diagnostic: accuracyPercent >= 80
					? 'Bạn có nền tảng kiến thức rất vững vàng, chỉ vướng mắc nhỏ ở các câu hỏi đánh đố đòi hỏi tính toán cẩn thận.'
					: 'Phát hiện bạn có xu hướng mất điểm ở các câu hỏi vận dụng công thức và suy luận logic trong bài học.',
				recommendation: 'Khuyến nghị xem lại chi tiết các bước giải từng câu sai ở mục Xem lại đáp án.'
			});
		}

		const wrongSamples = (wrongQuestions || []).slice(0, 8).map(w => ({
			cau: w.num,
			noiDung: w.question,
			banChon: w.userAnswerText || 'Chưa chọn',
			dapAnDung: w.correctAnswerText,
			giaiThich: w.explanation
		}));

		const prompt = `Bạn là Chuyên gia Giáo dục & AI Trợ giảng môn "${subject}" (${chapterTitle || examTitle}).
Sinh viên vừa hoàn tất bài thi với kết quả: Điểm ${score}/10, Độ chính xác ${accuracyPercent}%, Làm sai ${wrongQuestions.length}/${totalQuestions || 50} câu.

Dưới đây là các câu hỏi sinh viên đã làm SAI hoặc chọn nhầm:
${JSON.stringify(wrongSamples, null, 2)}

Hãy phân tích SƯ PHẠM VÀ HỌC THUẬT SẮC BÉN:
1. "weakTopics": Mảng 2-4 mảng kiến thức / công thức / dạng câu hỏi cụ thể mà sinh viên bị sai (ví dụ: "Điều kiện ma trận tam giác trên", "Tính không giao hoán AB != BA", "Định thức ma trận suy biến det(A)=0").
2. "diagnostic": Phân tích sắc sảo, trực diện (2-3 câu) chỉ rõ bản chất tư duy vì sao sinh viên bị lừa hoặc nhầm lẫn ở các câu hỏi trên.`;

		const schema = {
			type: "object",
			properties: {
				weakTopics: {
					type: "array",
					items: { type: "string" }
				},
				diagnostic: { type: "string" }
			},
			required: ["weakTopics", "diagnostic"]
		};

		const interaction = await runActiveGemini(apiKey, db, (ai, model) => ai.interactions.create({
			model,
			input: [{ type: "text", text: prompt }],
			response_format: {
				type: 'text',
				mime_type: 'application/json',
				schema: schema
			}
		}));

		const result = JSON.parse(interaction.output_text);
		return res.status(200).json(result);
	} catch (err) {
		if (isGeminiQuotaExceededError(err)) {
			return res.status(429).json({ message: GEMINI_QUOTA_MESSAGE });
		}
		console.error('Exam Gap Analysis AI Error:', err);
		return res.status(200).json({
			weakTopics: ['Định lý & Công thức trọng tâm', 'Kỹ năng biến đổi'],
			diagnostic: 'Phát hiện điểm mù tập trung ở các câu hỏi biến đổi công thức và suy luận định lý mở rộng trong bài thi.',
			recommendation: 'Đọc lại kỹ giáo trình PDF và bấm Xem lại đáp án để hiểu rõ từng bước giải.'
		});
	}
});

module.exports = router;
