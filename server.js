require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const apiRoutes = require('./routes/index');
const { trackingMiddleware, auditApiRequest } = require('./middlewares/tracking');
const { getDb } = require('./config/database');

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.JWT_SECRET) {
	console.error('Set JWT_SECRET before starting in production.');
	process.exit(1);
}
app.set('trust proxy', 1);

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
	origin: isProduction ? true : ['http://localhost:3000', 'http://127.0.0.1:3000'],
	exposedHeaders: ['X-Viewer-IP'],
	credentials: true
};
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '50kb' }));

// Rate Limiting for Login
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 phút
	max: 10, // Giới hạn 10 lần đăng nhập sai
	skipSuccessfulRequests: true, // Chỉ đếm các request thất bại (HTTP >= 400)
	keyGenerator: (req) => {
		// Nhận diện theo thiết bị (deviceId gửi từ frontend) hoặc fallback về IP (chuẩn hoá IPv6)
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

// Rate Limiting for AI API (Denial of Wallet Protection)
const aiLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 30, // Limit each IP/user to 30 AI requests per hour
	message: { message: 'Bạn đã đạt giới hạn 30 câu hỏi AI mỗi giờ để đảm bảo hệ thống ổn định. Vui lòng thử lại sau.' },
	standardHeaders: true,
	legacyHeaders: false,
});
app.use('/api/ai/', aiLimiter);

// Custom Middlewares
app.use('/api', trackingMiddleware);
app.use('/api', auditApiRequest);

// API Routes
app.use('/api', apiRoutes);

// Static Files - Phục vụ thư mục public thay vì __dirname
app.use('/uploads', (req, res) => res.sendStatus(404));
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