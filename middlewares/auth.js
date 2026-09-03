const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getDb } = require('../config/database');

if (!process.env.JWT_SECRET) {
	if (process.env.NODE_ENV === 'production') {
		throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is not defined in production!');
	} else {
		console.warn('[SECURITY WARNING] JWT_SECRET is not defined. Using default fallback key for development only.');
	}
}

let jwtSecret = process.env.JWT_SECRET || 'unipass-development-secret-safe-fixed-key';

const MAX_ACTIVE_SESSIONS = 2;

async function getClientIp(req) {
	const forwardedIps = req.headers['x-forwarded-for'];
	return forwardedIps ? forwardedIps.split(',')[0].trim() : req.socket.remoteAddress;
}

async function checkActiveSession(userId, token) {
	const db = await getDb();
	const session = await db.get('SELECT * FROM sessions WHERE user_id = ? AND token = ?', [userId, token]);
	return !!session;
}

async function requireActiveSession(req, res, next) {
	const authorization = req.get('Authorization') || '';
	let token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
	if (!token && req.query && req.query.token) {
		token = String(req.query.token).trim();
	}

	try {
		const payload = jwt.verify(token, jwtSecret);
		const isActive = await checkActiveSession(payload.User_ID, token);
		if (!isActive) throw new Error('Inactive session');
		
		const db = await getDb();
		const account = await db.get('SELECT * FROM accounts WHERE User_ID = ?', [payload.User_ID]);
		if (!account) throw new Error('Account not found');
		if (account.Expiry_Date && account.Role !== 'admin' && account.Role !== 'Giảng viên' && new Date(account.Expiry_Date) <= new Date()) {
			return res.status(403).json({ code: 'PAYMENT_REQUIRED', message: 'Gói học của bạn đã hết hạn.' });
		}

		if (payload.Role !== 'admin') {
			const maintenance = await db.get('SELECT value FROM settings WHERE key = "maintenance_mode"');
			if (maintenance && maintenance.value === 'true') {
				return res.status(503).json({ message: 'Hệ thống đang bảo trì, Tạm thời đóng hệ thống để nâng cấp server.' });
			}
		}
		
		if (account.reset_requested === 1 && req.path !== '/user/change-password' && req.path !== '/logout') {
			return res.status(403).json({ message: 'Bạn phải đổi mật khẩu mới trước khi tiếp tục.', requires_password_change: true });
		}
		
		if (account.Status !== 'active') {
			res.set({ 'Cache-Control': 'no-store, max-age=0' });
			return res.status(403).json({
				code: 'PAYMENT_REQUIRED',
				message: 'Vui lòng thanh toán phí duy trì để truy cập tài liệu khóa học.',
			});
		}
		req.user = payload;
		req.userToken = token;
		next();
	} catch (error) {
		return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
	}
}

async function requireAdmin(req, res, next) {
	const authorization = req.get('Authorization') || '';
	let token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
	if (!token && req.query && req.query.token) {
		token = String(req.query.token).trim();
	}

	try {
		const payload = jwt.verify(token, jwtSecret);
		const isActive = await checkActiveSession(payload.User_ID, token);
		if (!isActive) throw new Error('Inactive session');
		if (payload.Role !== 'admin') return res.status(403).json({ message: 'Bạn không có quyền quản trị.' });
		req.admin = payload;
		req.user = payload;
		next();
	} catch (error) {
		return res.status(401).json({ message: 'Token quản trị không hợp lệ hoặc đã hết hạn.' });
	}
}

async function getAdminFromToken(token) {
	try {
		const payload = jwt.verify(token || '', jwtSecret);
		const isActive = await checkActiveSession(payload.User_ID, token);
		if (!isActive || payload.Role !== 'admin') return null;
		return payload;
	} catch (error) { return null; }
}

async function getActiveUserFromRequest(req) {
	const authorization = req.get('Authorization') || '';
	const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : String(req.query.token || '');
	try {
		const payload = jwt.verify(token, jwtSecret);
		const isActive = await checkActiveSession(payload.User_ID, token);
		if (!isActive) return null;
		const db = await getDb();
		const account = await db.get('SELECT * FROM accounts WHERE User_ID = ?', [payload.User_ID]);
		if (!account || account.Status !== 'active') return null;
		return account;
	} catch (error) {
		return null;
	}
}

async function requireStaff(req, res, next) {
	const authorization = req.get('Authorization') || '';
	let token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
	if (!token && req.query && req.query.token) {
		token = String(req.query.token).trim();
	}

	try {
		const payload = jwt.verify(token, jwtSecret);
		const isActive = await checkActiveSession(payload.User_ID, token);
		if (!isActive) throw new Error('Inactive session');
		if (payload.Role !== 'admin' && payload.Role !== 'Giảng viên') return res.status(403).json({ message: 'Bạn không có quyền thao tác.' });
		req.admin = payload;
		req.user = payload;
		next();
	} catch (error) {
		return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
	}
}

module.exports = {
	requireActiveSession,
	requireAdmin,
	requireStaff,
	getAdminFromToken,
	getActiveUserFromRequest,
	getClientIp,
	MAX_ACTIVE_SESSIONS,
	jwtSecret
};
