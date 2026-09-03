require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const cookieParser = require('cookie-parser');
const { doubleCsrf } = require('csrf-csrf');
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const apiRoutes = require('./routes/index');
const { trackingMiddleware, auditApiRequest } = require('./middlewares/tracking');
const { securityLoggingMiddleware } = require('./middlewares/securityLogger');
const { getDb } = require('./config/database');

const app = express();
const port = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
			styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
			fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
			imgSrc: ["'self'", "data:", "https://img.vietqr.io", "https://api.qrserver.com"],
			connectSrc: ["'self'", "https://cdnjs.cloudflare.com"],
			objectSrc: ["'none'"],
			upgradeInsecureRequests: [],
		},
	}
}));

const corsOptions = {
	origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Thay đổi tên miền thực tế khi deploy
	exposedHeaders: ['X-Viewer-IP', 'X-CSRF-Token'],
	credentials: true
};
app.use(cors(corsOptions));
app.use(compression());
app.use(cookieParser());
// Must stay above the rate limiters: loginLimiter's keyGenerator reads req.body.deviceId.
app.use(express.json({ limit: '50kb' }));

if (process.env.NODE_ENV === 'production' && !process.env.CSRF_SECRET) {
	throw new Error('FATAL SECURITY ERROR: CSRF_SECRET is required in production.');
}

// Bearer-authenticated API calls do not need CSRF protection because browsers
// do not attach Authorization headers automatically.
const csrfUtilities = doubleCsrf({
	getSecret: () => process.env.CSRF_SECRET || 'unipass-development-csrf-secret',
	getSessionIdentifier: req => `${req.ip}|${req.get('user-agent') || 'unknown'}`,
	cookieName: '_csrf',
	cookieOptions: {
		httpOnly: false,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production'
	}
});
const csrfProtection = csrfUtilities.doubleCsrfProtection;

// Rate Limiting for Login
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 phút
	max: 10, // Giới hạn 10 lần đăng nhập sai
	skipSuccessfulRequests: true, // Chỉ đếm các request thất bại (HTTP >= 400)
	keyGenerator: (req) => {
		const clientIp = req['ip'] || '';
		return req.body.deviceId || clientIp.replace(/^::ffff:/, '');
	},
	message: { message: 'Thiết bị của bạn đã bị khoá do đăng nhập sai quá 10 lần. Vui lòng thử lại sau 15 phút.' },
	standardHeaders: true,
	legacyHeaders: false,
});
app.use('/api/login', loginLimiter);

// Rate Limiting for Register
const registerLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 phút
	max: 50, // Limit each IP to 50 register requests per window
	message: { message: 'Bạn đã đăng ký quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
	standardHeaders: true,
	legacyHeaders: false,
});
app.use('/api/register', registerLimiter);

// Rate Limiting for Forgot Password
const forgotPasswordLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 phút
	max: 3, // Giới hạn 3 lần yêu cầu cấp lại pass
	message: { message: 'Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
	standardHeaders: true,
	legacyHeaders: false,
});
app.use('/api/forgot-password', forgotPasswordLimiter);

// HTML Sanitization Helper (Global)
global.sanitizeHtml = (html, options = {}) => {
	const defaultConfig = {
		allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
		allowedAttributes: {
			'a': ['href', 'title'],
		},
		disallowedTagsMode: 'discard',
	};
	return sanitizeHtml(html, { ...defaultConfig, ...options });
};

// Input Sanitization Middleware (trim, sanitize)
app.use((req, res, next) => {
	// Sanitize string fields in request body
	const sanitizeObj = (obj) => {
		if (!obj) return obj;
		if (typeof obj === 'string') {
			return obj.trim();
		}
		if (typeof obj === 'object' && obj !== null) {
			const sanitized = {};
			for (const [key, value] of Object.entries(obj)) {
				if (typeof value === 'string') {
					sanitized[key] = value.trim();
				} else if (typeof value === 'object') {
					sanitized[key] = sanitizeObj(value);
				} else {
					sanitized[key] = value;
				}
			}
			return sanitized;
		}
		return obj;
	};
	
	if (req.body) {
		req.body = sanitizeObj(req.body);
	}
	next();
});

// CSRF Protection for Mutating Operations
app.use((req, res, next) => {
	if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
		const authorization = req.get('Authorization') || '';
		const bearerRequest = authorization.startsWith('Bearer ');
		// These endpoints authenticate with their own credentials/signature, not browser cookies.
		if (bearerRequest || ['/api/login', '/api/register', '/api/forgot-password', '/api/verify-token', '/api/payment/check-transfer', '/api/webhook/payment'].includes(req.path)) {
			return next();
		}
		return csrfProtection(req, res, next);
	}
	next();
});

// CSRF Error Handler
app.use((err, req, res, next) => {
	if (err.code === 'EBADCSRFTOKEN') {
		res.status(403).json({ code: 'INVALID_CSRF', message: 'CSRF token không hợp lệ. Vui lòng load lại trang.' });
	} else {
		next(err);
	}
});

app.get('/api/csrf-token', csrfProtection, (req, res) => {
	res.json({ csrfToken: csrfUtilities.generateCsrfToken(req, res) });
});
const aiLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 30, // Limit each IP/user to 30 AI requests per hour
	message: { message: 'Bạn đã đạt giới hạn 30 câu hỏi AI mỗi giờ để đảm bảo hệ thống ổn định. Vui lòng thử lại sau.' },
	standardHeaders: true,
	legacyHeaders: false,
});
app.use('/api/ai/', aiLimiter);

// Custom Middlewares
app.use('/api', (req, res, next) => {
	res.set({
		'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
		'Pragma': 'no-cache',
		'Expires': '0'
	});
	next();
});
app.use('/api', securityLoggingMiddleware);
app.use('/api', trackingMiddleware);
app.use('/api', auditApiRequest);

// API Routes
app.use('/api', apiRoutes);

// Static Files - Phục vụ thư mục public thay vì __dirname
app.use('/uploads', (req, res) => res.sendStatus(404));

// Legacy Course URL redirection to dynamic portal
const legacyCourseMap = {
	'course-ueh.html': 'ueh_hvntd',
	'course-ueh-marketing.html': 'ueh_marketing',
	'course-ueh-macro.html': 'ueh_macro',
	'course-ueh-accounting.html': 'ueh_accounting',
	'course-ueh-math.html': 'ueh_math',
	'course-ueh-hr.html': 'ueh_hr',
	'course-bk.html': 'bk_giai_tich',
	'course-bk-physics.html': 'bk_physics',
	'course-bk-calculus.html': 'bk_calculus_1',
	'course-bk-chemistry.html': 'bk_chemistry',
	'course-bk-programming.html': 'bk_programming',
	'course-ftu.html': 'ftu_vamo',
	'course-ftu-payment.html': 'ftu_international-payment',
	'course-ftu-logistics.html': 'ftu_logistics',
	'course-ftu-trade.html': 'ftu_trade',
	'course-ftu-english.html': 'ftu_english',
	'course-neu-economics.html': 'neu_basic-economics',
	'course-neu-math.html': 'neu_econometrics',
	'course-neu-stats.html': 'neu_statistics',
	'course-neu-finance.html': 'neu_corporate_finance',
	'course-neu-accounting.html': 'neu_managerial_accounting',
	'course-hcmus-programming.html': 'hcmus_programming',
	'course-hcmus-discrete.html': 'hcmus_discrete-math',
	'course-hcmus-dsa.html': 'hcmus_dsa',
	'course-hcmus-db.html': 'hcmus_database',
	'course-hcmus-networks.html': 'hcmus_networks',
	'course-tdtu-skills.html': 'tdtu_study-skills',
	'course-tdtu-it.html': 'tdtu_applied-it',
	'course-tdtu-english.html': 'tdtu_english_comm',
	'course-tdtu-startup.html': 'tdtu_startup',
	'course-tdtu-pe.html': 'tdtu_pe'
};

app.get(/^\/(course-[a-z0-9_-]+)\.html$/i, (req, res, next) => {
	const filename = `${req.params[0]}.html`;
	if (filename === 'course-portal.html') return next();
	const courseId = legacyCourseMap[filename] || req.params[0].replace(/^course-/, '').replace(/-/g, '_');
	return res.redirect(302, `/course-portal.html?course=${encodeURIComponent(courseId)}`);
});

app.use(express.static(path.join(__dirname, 'public')));

// Catch-all removed

if (require.main === module) {
	// Khởi tạo DB trước khi listen
	getDb().then(() => {
		app.listen(port, '0.0.0.0', () => {
			console.log(`✅ UniPass API đang chạy tại http://127.0.0.1:${port}`);
			console.log('⏳ Đang lắng nghe các luồng truy cập... (Nhấn Ctrl + C để thoát)');
		});
	}).catch(err => {
		console.error("Lỗi khởi tạo Database:", err);
		process.exit(1);
	});
}

module.exports = app;