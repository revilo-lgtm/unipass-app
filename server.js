const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;
if (isProduction && !process.env.JWT_SECRET) {
	console.error('Set JWT_SECRET before starting in production.');
	process.exit(1);
}
if (isProduction && !process.env.ADMIN_PASSWORD) {
	console.error('Set ADMIN_PASSWORD before starting in production.');
	process.exit(1);
}
const jwtSecret = process.env.JWT_SECRET || 'unipass-development-secret';
const MAX_ACTIVE_SESSIONS = 2;
const activeSessions = new Map();
const supportedEmailPattern = /^[^\s@]+@(st\.ueh\.edu\.vn|hcmut\.edu\.vn|ftu\.edu\.vn|st\.neu\.edu\.vn|hcmus\.edu\.vn|tdtu\.edu\.vn)$/i;
const dataDirectory = process.env.DATA_DIR || __dirname;
const uploadDirectory = path.join(dataDirectory, 'uploads', 'course-pdfs');
const metadataPath = path.join(dataDirectory, 'course-pdfs.json');
const databasePath = path.join(dataDirectory, 'unipass.db');
const forensicSubscribers = new Set();
const studyGroupClients = new Set();
const publicAssetExtensions = new Set(['.html', '.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.map']);
const blockedPublicFiles = new Set(['server.js']);
fs.mkdirSync(uploadDirectory, { recursive: true });
app.set('trust proxy', 1);

const database = new DatabaseSync(databasePath);
database.exec(`
	CREATE TABLE IF NOT EXISTS accounts (
		User_ID TEXT PRIMARY KEY,
		Email TEXT NOT NULL UNIQUE COLLATE NOCASE,
		Fullname TEXT NOT NULL,
		password TEXT NOT NULL,
		Role TEXT NOT NULL,
		Status TEXT NOT NULL DEFAULT 'pending' CHECK (Status IN ('active', 'pending'))
	)
`);
try {
	database.exec("ALTER TABLE accounts ADD COLUMN Status TEXT NOT NULL DEFAULT 'pending' CHECK (Status IN ('active', 'pending'))");
} catch (error) {
	if (!String(error.message).includes('duplicate column name')) throw error;
}

database.exec(`
	CREATE TABLE IF NOT EXISTS forensic_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT NOT NULL DEFAULT 'Khách chưa xác thực',
		action TEXT NOT NULL,
		ip TEXT NOT NULL,
		status INTEGER NOT NULL,
		created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
	)
`);
database.exec(`
	CREATE TABLE IF NOT EXISTS transactions (
		id TEXT PRIMARY KEY,
		account_id TEXT,
		amount INTEGER NOT NULL DEFAULT 0,
		status TEXT NOT NULL,
		created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS rag_queries (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		account_id TEXT,
		created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS operating_costs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		amount INTEGER NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS study_group_messages (
		id TEXT PRIMARY KEY,
		kind TEXT NOT NULL DEFAULT 'student',
		text TEXT NOT NULL,
		user_id TEXT NOT NULL,
		user_name TEXT NOT NULL,
		created_at TEXT NOT NULL
	);
	CREATE TABLE IF NOT EXISTS course_progress (
		user_id TEXT NOT NULL,
		course_id TEXT NOT NULL,
		lesson_id TEXT NOT NULL,
		completed_at TEXT NOT NULL,
		PRIMARY KEY (user_id, course_id, lesson_id)
	);
`);
for (const statement of [
	"ALTER TABLE transactions ADD COLUMN plan TEXT NOT NULL DEFAULT 'Membership'",
	"ALTER TABLE transactions ADD COLUMN method TEXT NOT NULL DEFAULT 'Unknown'",
]) {
	try { database.exec(statement); } catch (error) {
		if (!String(error.message).includes('duplicate column name')) throw error;
	}
}

const seedAccount = database.prepare(`
	INSERT OR IGNORE INTO accounts (User_ID, Email, Fullname, password, Role, Status)
	VALUES (?, ?, ?, ?, ?, ?)
`);
if (!isProduction) {
	seedAccount.run('SV001', 'mssv@st.ueh.edu.vn', 'Sinh viên UEH', '123456', 'Học viên', 'active');
}
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
seedAccount.run('ADMIN001', 'admin', 'Quản trị viên', adminPassword, 'admin', 'active');
if (process.env.ADMIN_PASSWORD) {
	database.prepare("UPDATE accounts SET password = ? WHERE User_ID = 'ADMIN001'").run(process.env.ADMIN_PASSWORD);
}
database.prepare("UPDATE accounts SET Status = 'active' WHERE User_ID = 'ADMIN001'").run();

function findAccountByEmail(email) {
	return database.prepare('SELECT User_ID, Email, Fullname, password, Role, Status FROM accounts WHERE Email = ?').get(email);
}

function findAccountById(userId) {
	return database.prepare('SELECT User_ID, Email, Fullname, password, Role, Status FROM accounts WHERE User_ID = ?').get(userId);
}

function listAccounts() {
	return database.prepare('SELECT User_ID, Email, Fullname, password, Role, Status FROM accounts ORDER BY User_ID').all();
}

function readPdfMetadata() {
	try { return JSON.parse(fs.readFileSync(metadataPath, 'utf8')); } catch (error) { return []; }
}

function writePdfMetadata(metadata) {
	fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

const pdfStorage = multer.diskStorage({
	destination: uploadDirectory,
	filename: (req, file, callback) => callback(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
});
const uploadPdf = multer({
	storage: pdfStorage,
	limits: { fileSize: 50 * 1024 * 1024 },
	fileFilter: (req, file, callback) => callback(null, file.mimetype === 'application/pdf'),
});

app.use(cors({ exposedHeaders: ['X-Viewer-IP'] }));
app.use(express.json());
app.use((req, res, next) => {
	if (req.method !== 'GET' && req.method !== 'HEAD') return next();
	let pathname;
	try {
		pathname = decodeURIComponent(req.path || '/');
	} catch (error) {
		return res.sendStatus(400);
	}
	const normalized = path.posix.normalize(pathname).replace(/\\/g, '/');
	if (normalized === '/' || normalized.startsWith('/api')) return next();
	if (
		normalized.includes('/node_modules') ||
		normalized === '/uploads' ||
		normalized.startsWith('/uploads/') ||
		blockedPublicFiles.has(path.posix.basename(normalized).toLowerCase())
	) {
		return res.sendStatus(404);
	}
	if (!publicAssetExtensions.has(path.posix.extname(normalized).toLowerCase())) {
		return res.sendStatus(404);
	}
	next();
});
app.use(express.static(__dirname, { index: 'index.html', dotfiles: 'deny' }));
app.use('/api', auditApiRequest);

function publicAccount(account) {
	return {
		User_ID: account.User_ID,
		Email: account.Email,
		Role: account.Role,
	};
}

function accountView(account) {
	return {
		...publicAccount(account),
		Fullname: account.Fullname,
		Status: account.Status,
	};
}

function getClientIp(req) {
	const forwardedIps = req.headers['x-forwarded-for'];
	return forwardedIps ? forwardedIps.split(',')[0].trim() : req.socket.remoteAddress;
}

function logForensicEvent({ email, action, ip, status }) {
	const result = database.prepare(`
		INSERT INTO forensic_logs (email, action, ip, status, created_at)
		VALUES (?, ?, ?, ?, ?)
	`).run(email || 'Khách chưa xác thực', action, ip || 'Unknown', status, new Date().toISOString());
	const log = database.prepare(`
		SELECT id, email, action, ip, created_at AS time, status
		FROM forensic_logs WHERE id = ?
	`).get(result.lastInsertRowid);
	for (const subscriber of forensicSubscribers) subscriber(log);
	return log;
}

function forensicAction(req, statusCode) {
	const requestKey = `${req.method} ${req.originalUrl.split('?')[0]}`;
	let action = null;
	if (requestKey === 'POST /api/login') action = 'Đăng nhập tài khoản';
	if (requestKey.startsWith('GET /api/documents/stream/')) {
		const documentId = requestKey.split('/').pop();
		action = `Xem tài liệu: ${documentId}`;
	}
	if (requestKey.startsWith('GET /api/course-pdfs/') && requestKey.endsWith('/download')) {
		const documentId = requestKey.split('/')[3];
		action = `Xem tài liệu PDF: ${documentId}`;
	}
	if (!action) return null;
	return `${action} (${statusCode >= 400 ? 'Thất bại' : 'Thành công'})`;
}

function auditApiRequest(req, res, next) {
	res.on('finish', () => {
		let email = '';
		const authorization = req.get('Authorization') || '';
		if (authorization.startsWith('Bearer ')) {
			try {
				const payload = jwt.verify(authorization.slice(7), jwtSecret);
				if (payload.Role === 'admin') return;
				email = payload.Email;
			} catch (error) { /* Request may be unauthenticated. */ }
		}
		if (req.originalUrl.split('?')[0] === '/api/login' && req.body && req.body.email) {
			email = String(req.body.email).trim().toLowerCase();
		}
		if (email === 'admin' || findAccountByEmail(email)?.Role === 'admin') return;
		const action = forensicAction(req, res.statusCode);
		if (action) logForensicEvent({ email, action, ip: getClientIp(req), status: res.statusCode });
	});
	next();
}

function trackingMiddleware(req, res, next) {
	const clientIp = getClientIp(req);
	const userAgent = req.headers['user-agent'] || 'Unknown Device';

	req.clientIp = clientIp;
	req.deviceInfo = userAgent;
	console.log(`\n[TRACKING] Bắt được luồng truy cập từ IP: ${clientIp}`);
	console.log(`[TRACKING] Thiết bị: ${userAgent}`);
	next();
}

function requireAdmin(req, res, next) {
	const authorization = req.get('Authorization') || '';
	const token = authorization.startsWith('Bearer ')
		? authorization.slice(7)
		: '';

	try {
		const payload = jwt.verify(token, jwtSecret);
		if (!hasActiveSession(payload.User_ID, token)) throw new Error('Inactive session');
		if (payload.Role !== 'admin') return res.status(403).json({ message: 'Bạn không có quyền quản trị.' });
		req.admin = payload;
		next();
	} catch (error) {
		return res.status(401).json({ message: 'Token quản trị không hợp lệ hoặc đã hết hạn.' });
	}
}

function getAdminFromToken(token) {
	try {
		const payload = jwt.verify(token || '', jwtSecret);
		if (!hasActiveSession(payload.User_ID, token) || payload.Role !== 'admin') return null;
		return payload;
	} catch (error) { return null; }
}

function requireActiveSession(req, res, next) {
	const authorization = req.get('Authorization') || '';
	const token = authorization.startsWith('Bearer ')
		? authorization.slice(7)
		: '';

	try {
		const payload = jwt.verify(token, jwtSecret);
		if (!hasActiveSession(payload.User_ID, token)) throw new Error('Inactive session');
		const account = findAccountById(payload.User_ID);
		if (!account) throw new Error('Account not found');
		if (account.Status !== 'active') {
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

function hasActiveSession(userId, token) {
	return (activeSessions.get(userId) || []).some(session => session.token === token);
}

function removeActiveSession(userId, token) {
	const sessions = (activeSessions.get(userId) || []).filter(session => session.token !== token);
	if (sessions.length) activeSessions.set(userId, sessions);
	else activeSessions.delete(userId);
	return sessions.length;
}

function getTokenFromRequest(req) {
	const authorization = req.get('Authorization') || '';
	return authorization.startsWith('Bearer ')
		? authorization.slice(7)
		: String(req.query.token || '');
}

function getActiveUserFromRequest(req) {
	const token = getTokenFromRequest(req);
	try {
		const payload = jwt.verify(token, jwtSecret);
		if (!hasActiveSession(payload.User_ID, token)) return null;
		const account = findAccountById(payload.User_ID);
		if (!account || account.Status !== 'active') return null;
		return account;
	} catch (error) {
		return null;
	}
}

function broadcastStudyGroupMessage(message) {
	const payload = `data: ${JSON.stringify(message)}\n\n`;
	for (const client of studyGroupClients) client.res.write(payload);
}

function listStudyGroupMessages() {
	return database.prepare(`
		SELECT id, kind, text, user_id AS userId, user_name AS userName, created_at AS createdAt
		FROM study_group_messages ORDER BY created_at ASC LIMIT 100
	`).all();
}

function addStudyGroupMessage({ account, text, kind = 'student' }) {
	const message = {
		id: `chat-${Date.now()}-${crypto.randomUUID()}`,
		kind,
		text,
		userId: account.User_ID,
		userName: account.Fullname,
		createdAt: new Date().toISOString(),
	};
	database.prepare(`
		INSERT INTO study_group_messages (id, kind, text, user_id, user_name, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`).run(message.id, message.kind, message.text, message.userId, message.userName, message.createdAt);
	database.prepare(`
		DELETE FROM study_group_messages WHERE id NOT IN (
			SELECT id FROM study_group_messages ORDER BY created_at DESC LIMIT 100
		)
	`).run();
	broadcastStudyGroupMessage(message);
	return message;
}

app.get('/api/course-progress/:courseId', requireActiveSession, (req, res) => {
	const courseId = String(req.params.courseId || '').trim();
	if (!/^[a-z0-9-]+$/i.test(courseId)) return res.status(400).json({ message: 'Mã khóa học không hợp lệ.' });
	const rows = database.prepare(`
		SELECT lesson_id AS lessonId, completed_at AS completedAt
		FROM course_progress WHERE user_id = ? AND course_id = ? ORDER BY lesson_id
	`).all(req.user.User_ID, courseId);
	return res.status(200).json({ courseId, completedLessonIds: rows.map(row => row.lessonId), progress: rows });
});

app.put('/api/course-progress/:courseId', requireActiveSession, (req, res) => {
	const courseId = String(req.params.courseId || '').trim();
	const lessonId = String(req.body?.lessonId || '').trim();
	const completed = Boolean(req.body?.completed);
	if (!/^[a-z0-9-]+$/i.test(courseId) || !/^lesson-\d+$/.test(lessonId)) {
		return res.status(400).json({ message: 'Thông tin bài học không hợp lệ.' });
	}

	if (completed) {
		database.prepare(`
			INSERT OR REPLACE INTO course_progress (user_id, course_id, lesson_id, completed_at)
			VALUES (?, ?, ?, ?)
		`).run(req.user.User_ID, courseId, lessonId, new Date().toISOString());
	} else {
		database.prepare('DELETE FROM course_progress WHERE user_id = ? AND course_id = ? AND lesson_id = ?')
			.run(req.user.User_ID, courseId, lessonId);
	}

	return res.status(200).json({ courseId, lessonId, completed });
});

app.get('/api/study-group/stream', (req, res) => {
	const account = getActiveUserFromRequest(req);
	if (!account) return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });

	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache, no-transform',
		'Connection': 'keep-alive',
		'X-Accel-Buffering': 'no',
	});
	res.write(`event: history\ndata: ${JSON.stringify(listStudyGroupMessages())}\n\n`);
	const client = { res };
	studyGroupClients.add(client);
	const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 20000);
	const cleanup = () => {
		clearInterval(keepAlive);
		studyGroupClients.delete(client);
	};
	req.on('close', cleanup);
	res.on('error', cleanup);
});

app.post('/api/study-group/messages', requireActiveSession, (req, res) => {
	const text = String(req.body?.text || '').trim();
	if (!text || text.length > 2000) return res.status(400).json({ message: 'Tin nhắn phải có từ 1 đến 2000 ký tự.' });

	const message = addStudyGroupMessage({ account: findAccountById(req.user.User_ID), text });
	if (/@ai\b/i.test(text)) {
		setTimeout(() => addStudyGroupMessage({
			account: { User_ID: 'AIBOT', Fullname: 'UniPass AI' },
			kind: 'ai',
			text: 'Mình đã nhận câu hỏi của bạn. Trợ giảng AI sẽ phân tích nội dung phòng học và phản hồi ngay sau đây.',
		}), 1200);
	}
	return res.status(201).json({ message });
});

app.post('/api/logout', requireActiveSession, (req, res) => {
	const active = removeActiveSession(req.user.User_ID, req.userToken);
	return res.status(200).json({ loggedOut: true, session: { active, limit: MAX_ACTIVE_SESSIONS } });
});

app.post('/api/login', trackingMiddleware, (req, res) => {
	const { email, password, deviceId } = req.body || {};
	const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

	if (!email || !password) {
		console.log('[LOGIN] Thất bại - Thiếu thông tin.');
		return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc.' });
	}

	const user = findAccountByEmail(normalizedEmail);

	if (!user || password !== user.password) {
		console.log(`[LOGIN] Thất bại - Sai thông tin xác thực cho: ${normalizedEmail}`);
		return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
	}

	const sessions = activeSessions.get(user.User_ID) || [];
	const sameDeviceSession = sessions.find(session => session.deviceId === (deviceId || ''));
	const previousSessionWasAnotherDevice = sessions.length > 0 && !sameDeviceSession;
	const evictedSession = previousSessionWasAnotherDevice && sessions.length >= MAX_ACTIVE_SESSIONS
		? sessions[0]
		: null;
	if (evictedSession && user.Role !== 'admin') {
		logForensicEvent({
			email: user.Email,
			action: 'Đăng xuất thiết bị cũ do vượt giới hạn session',
			ip: req.clientIp,
			status: 200,
		});
	}

	console.log(`[LOGIN] Xác thực thành công cho: ${normalizedEmail}`);

	const token = jwt.sign(
		{
			...publicAccount(user),
			Status: user.Status,
			deviceId: deviceId || '',
			jti: crypto.randomUUID(),
		},
		jwtSecret,
		{ noTimestamp: true },
	);
	const remainingSessions = sessions.filter(session => session !== sameDeviceSession && session !== evictedSession);
	remainingSessions.push({ token, deviceId: deviceId || '', createdAt: Date.now() });
	activeSessions.set(user.User_ID, remainingSessions.slice(-MAX_ACTIVE_SESSIONS));

	return res.status(200).json({
		token,
		session: { active: activeSessions.get(user.User_ID).length, limit: MAX_ACTIVE_SESSIONS },
		user: {
			...publicAccount(user),
			Fullname: user.Fullname,
			Status: user.Status,
		},
	});
});

app.get('/api/verify-token', (req, res) => {
	const authorization = req.get('Authorization') || '';
	const token = authorization.startsWith('Bearer ')
		? authorization.slice(7)
		: '';

	try {
		const payload = jwt.verify(token, jwtSecret);
		if (!hasActiveSession(payload.User_ID, token)) {
			return res.status(401).json({ code: 'SESSION_REPLACED', message: 'Tài khoản đang được đăng nhập trên thiết bị khác.' });
		}
		return res.status(200).json({
			valid: true,
			session: { active: (activeSessions.get(payload.User_ID) || []).length, limit: MAX_ACTIVE_SESSIONS },
		});
	} catch (error) {
		return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn hoặc được đăng nhập ở thiết bị khác' });
	}
});

app.post('/api/register', (req, res) => {
	const { email, password, fullname, university } = req.body || {};
	const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
	const normalizedFullname = String(fullname || '').trim();

	if (!normalizedEmail || !password || !normalizedFullname) {
		return res.status(400).json({ message: 'Họ tên, email và mật khẩu là bắt buộc.' });
	}
	if (!supportedEmailPattern.test(normalizedEmail)) {
		return res.status(400).json({ message: 'Email chưa thuộc trường được hỗ trợ.' });
	}
	if (findAccountByEmail(normalizedEmail)) {
		return res.status(409).json({ message: 'Email đã được sử dụng.' });
	}

	const nextUserNumber = database.prepare(`
		SELECT COALESCE(MAX(CAST(SUBSTR(User_ID, 3) AS INTEGER)), 0) + 1 AS nextNumber
		FROM accounts
		WHERE User_ID LIKE 'SV%'
	`).get().nextNumber;
	const userId = `SV${String(nextUserNumber).padStart(3, '0')}`;
	database.prepare(`
		INSERT INTO accounts (User_ID, Email, Fullname, password, Role, Status)
		VALUES (?, ?, ?, ?, ?, ?)
	`).run(userId, normalizedEmail, normalizedFullname, String(password), 'Học viên', 'pending');

	return res.status(201).json({
		account: accountView({ User_ID: userId, Email: normalizedEmail, Role: 'Học viên', Status: 'pending' }),
		university: university || '',
	});
});

app.get('/api/admin/accounts', requireAdmin, (req, res) => {
	const accounts = listAccounts();
	return res.status(200).json({
		count: accounts.length,
		accounts: accounts.map(accountView),
	});
});

app.get('/api/admin/dashboard-stats', requireAdmin, (req, res) => {
	const stats = database.prepare(`
		SELECT
			(SELECT COUNT(*) FROM accounts) AS accountCount,
			(SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'success') AS revenue,
			(SELECT COUNT(*) FROM rag_queries WHERE created_at >= datetime('now', '-1 day')) AS ragQueries,
			(SELECT COALESCE(SUM(amount), 0) FROM operating_costs WHERE created_at >= date('now', 'start of month')) AS operatingCost
	`).get();
	return res.status(200).json({ stats });
});

app.get('/api/admin/forensic-logs', requireAdmin, (req, res) => {
	const logs = database.prepare(`
		SELECT id, email, action, ip, created_at AS time, status
		FROM forensic_logs
		WHERE email != 'admin'
		  AND NOT EXISTS (
			  SELECT 1 FROM accounts WHERE accounts.Email = forensic_logs.email AND accounts.Role = 'admin'
		  )
		  AND (
			  action LIKE 'Đăng nhập tài khoản%'
			  OR action LIKE 'Xem tài liệu%'
			  OR action LIKE 'Xem tài liệu PDF%'
			  OR action LIKE 'Mở Secure Stream%'
			  OR action LIKE 'Cố gắng %'
			  OR action = 'Đăng xuất do đăng nhập trên thiết bị khác'
		  )
		ORDER BY id DESC
	`).all();
	return res.status(200).json({ logs });
});

app.get('/api/admin/transactions', requireAdmin, (req, res) => {
	const transactions = database.prepare(`
		SELECT
			t.id,
			COALESCE(a.Fullname, a.Email, 'Không xác định') AS name,
			t.plan,
			t.amount,
			t.method,
			t.status,
			t.created_at AS date
		FROM transactions t
		LEFT JOIN accounts a ON a.User_ID = t.account_id
		ORDER BY t.created_at DESC, t.id DESC
	`).all();
	const summary = database.prepare(`
		SELECT
			COALESCE(SUM(CASE WHEN status = 'success' AND date(created_at) = date('now') THEN amount ELSE 0 END), 0) AS todayRevenue,
			COUNT(CASE WHEN status = 'success' THEN 1 END) AS successfulCount,
			COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pendingCount
		FROM transactions
	`).get();
	return res.status(200).json({ transactions, summary });
});

app.get('/api/admin/forensic-logs/stream', (req, res) => {
	const admin = getAdminFromToken(String(req.query.token || ''));
	if (!admin) return res.status(401).json({ message: 'Token quản trị không hợp lệ hoặc đã hết hạn.' });

	res.set({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache, no-transform',
		'Connection': 'keep-alive',
		'X-Accel-Buffering': 'no',
	});

	res.flushHeaders();
	const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
	const initialLogs = database.prepare(`
		SELECT id, email, action, ip, created_at AS time, status
		FROM forensic_logs
		WHERE email != 'admin'
		  AND NOT EXISTS (
			  SELECT 1 FROM accounts WHERE accounts.Email = forensic_logs.email AND accounts.Role = 'admin'
		  )
		  AND (
			  action LIKE 'Đăng nhập tài khoản%'
			  OR action LIKE 'Xem tài liệu%'
			  OR action LIKE 'Xem tài liệu PDF%'
			  OR action LIKE 'Mở Secure Stream%'
			  OR action LIKE 'Cố gắng %'
			  OR action = 'Đăng xuất do đăng nhập trên thiết bị khác'
		  )
		ORDER BY id DESC
	`).all();
	send('snapshot', { logs: initialLogs });
	const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 15000);
	const subscriber = log => send('log', log);
	forensicSubscribers.add(subscriber);
	res.on('close', () => {
		clearInterval(keepAlive);
		forensicSubscribers.delete(subscriber);
	});
});

app.post('/api/forensic-events', requireActiveSession, (req, res) => {
	const allowedActions = new Set([
		'Cố gắng lưu tài liệu bằng phím tắt (Ctrl/Cmd+S)',
		'Cố gắng in tài liệu bằng phím tắt (Ctrl/Cmd+P)',
		'Cố gắng sao chép nội dung tài liệu (Ctrl/Cmd+C)',
		'Cố gắng mở Developer Tools (F12/Inspect Element)',
		'Cố gắng mở menu chuột phải trên tài liệu',
	]);
	const action = String(req.body && req.body.action || '');
	if (!allowedActions.has(action)) return res.status(400).json({ message: 'Hành vi forensic không hợp lệ.' });
	logForensicEvent({ email: req.user.Email, action: `${action} (Bị chặn)`, ip: getClientIp(req), status: 200 });
	return res.status(201).json({ message: 'Đã ghi nhận hành vi bảo mật.' });
});

app.delete('/api/admin/forensic-logs', requireAdmin, (req, res) => {
	database.prepare('DELETE FROM forensic_logs').run();
	return res.status(200).json({ message: 'Đã xóa toàn bộ event log.' });
});

app.delete('/api/admin/forensic-logs/:id', requireAdmin, (req, res) => {
	const result = database.prepare('DELETE FROM forensic_logs WHERE id = ?').run(Number(req.params.id));
	if (!result.changes) return res.status(404).json({ message: 'Không tìm thấy event log.' });
	return res.status(200).json({ message: 'Đã xóa event log.' });
});

app.post('/api/admin/accounts', requireAdmin, (req, res) => {
	const { email, password, fullname, role = 'Học viên' } = req.body || {};
	const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

	if (!normalizedEmail || !password) {
		return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc.' });
	}
	if (!String(fullname || '').trim()) {
		return res.status(400).json({ message: 'Họ và tên là bắt buộc.' });
	}
	if (!supportedEmailPattern.test(normalizedEmail)) {
		return res.status(400).json({ message: 'Email chưa thuộc trường được hỗ trợ.' });
	}
	if (findAccountByEmail(normalizedEmail)) {
		return res.status(409).json({ message: 'Email đã tồn tại.' });
	}

	const nextUserNumber = database.prepare(`
		SELECT COALESCE(MAX(CAST(SUBSTR(User_ID, 3) AS INTEGER)), 0) + 1 AS nextNumber
		FROM accounts
		WHERE User_ID LIKE 'SV%'
	`).get().nextNumber;
	const account = {
		User_ID: `SV${String(nextUserNumber).padStart(3, '0')}`,
		Email: normalizedEmail,
		Fullname: String(fullname).trim(),
		password: String(password),
		Role: role === 'admin' ? 'admin' : 'Học viên',
	};
	database.prepare(`
		INSERT INTO accounts (User_ID, Email, Fullname, password, Role, Status)
		VALUES (?, ?, ?, ?, ?, ?)
	`).run(account.User_ID, account.Email, account.Fullname, account.password, account.Role, 'pending');
	return res.status(201).json({ account: publicAccount(account) });
});

app.patch('/api/admin/accounts/:userId/status', requireAdmin, (req, res) => {
	const status = req.body && req.body.status;
	if (!['active', 'pending'].includes(status)) {
		return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
	}
	if (!findAccountById(req.params.userId)) return res.status(404).json({ message: 'Không tìm thấy account.' });

	database.prepare('UPDATE accounts SET Status = ? WHERE User_ID = ?').run(status, req.params.userId);
	return res.status(200).json({ message: 'Đã cập nhật trạng thái tài khoản.', status });
});

app.post('/api/admin/accounts/:userId/reset-password', requireAdmin, (req, res) => {
	const { password } = req.body || {};
	if (!password) return res.status(400).json({ message: 'Mật khẩu mới là bắt buộc.' });

	const account = findAccountById(req.params.userId);
	if (!account) return res.status(404).json({ message: 'Không tìm thấy account.' });

	database.prepare('UPDATE accounts SET password = ? WHERE User_ID = ?').run(String(password), req.params.userId);
	return res.status(200).json({ message: 'Đã reset mật khẩu thành công.' });
});

app.delete('/api/admin/accounts/:userId', requireAdmin, (req, res) => {
	if (req.params.userId === req.admin.User_ID) {
		return res.status(400).json({ message: 'Không thể xóa tài khoản admin đang đăng nhập.' });
	}

	if (!findAccountById(req.params.userId)) return res.status(404).json({ message: 'Không tìm thấy account.' });

	database.prepare('DELETE FROM accounts WHERE User_ID = ?').run(req.params.userId);
	activeSessions.delete(req.params.userId);
	return res.status(200).json({ message: 'Đã xóa account thành công.' });
});

app.get('/api/course-pdfs', (req, res) => {
	const course = String(req.query.course || '');
	const documents = readPdfMetadata().filter(document => document.course === course);
	return res.status(200).json({ documents });
});

app.get('/api/course-pdfs/:documentId/download', requireActiveSession, (req, res) => {
	const document = readPdfMetadata().find(item => item.id === req.params.documentId);
	if (!document || !fs.existsSync(document.filePath)) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' });
	res.type('application/pdf');
	res.set('Content-Disposition', `inline; filename="${document.originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}"`);
	return res.sendFile(document.filePath);
});

app.get('/api/documents/stream/:id', requireActiveSession, (req, res) => {
	const document = readPdfMetadata().find(item => item.id === req.params.id);
	if (!document) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' });

	fs.readFile(document.filePath, (error, fileBuffer) => {
		if (error) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' });
		res.set({
			'Content-Type': 'application/pdf',
			'Cache-Control': 'no-store, max-age=0',
			'X-Viewer-IP': getClientIp(req),
		});
		return res.send(fileBuffer);
	});
});

app.post('/api/admin/course-pdfs', requireAdmin, uploadPdf.single('pdf'), (req, res) => {
	const allowedCourses = ['ueh_hvntd', 'bk_giai_tich', 'ftu_vamo'];
	if (!req.file) return res.status(400).json({ message: 'Chỉ chấp nhận file PDF.' });
	if (!allowedCourses.includes(req.body.course)) {
		fs.unlinkSync(req.file.path);
		return res.status(400).json({ message: 'Khóa học không hợp lệ.' });
	}
	if (!req.body.lessonId || !String(req.body.lessonTitle || '').trim()) {
		fs.unlinkSync(req.file.path);
		return res.status(400).json({ message: 'Bài học là bắt buộc.' });
	}

	const metadata = readPdfMetadata();
	const document = {
		id: `pdf-${Date.now()}`,
		course: req.body.course,
		lessonId: String(req.body.lessonId),
		lessonTitle: String(req.body.lessonTitle).trim(),
		originalName: req.file.originalname,
		filePath: req.file.path,
		size: req.file.size,
		createdAt: new Date().toISOString(),
	};
	metadata.push(document);
	writePdfMetadata(metadata);
	return res.status(201).json({ document: { id: document.id, course: document.course, lessonId: document.lessonId, lessonTitle: document.lessonTitle, originalName: document.originalName, size: document.size, createdAt: document.createdAt } });
});

app.delete('/api/admin/course-pdfs/:documentId', requireAdmin, (req, res) => {
	const metadata = readPdfMetadata();
	const documentIndex = metadata.findIndex(item => item.id === req.params.documentId);
	if (documentIndex === -1) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' });

	const [document] = metadata.splice(documentIndex, 1);
	if (document.filePath && fs.existsSync(document.filePath)) fs.unlinkSync(document.filePath);
	writePdfMetadata(metadata);
	return res.status(200).json({ message: 'Đã xóa tài liệu PDF thành công.' });
});

if (require.main === module) {
	app.listen(port, '0.0.0.0', () => {
		console.log(`✅ UniPass API đang chạy tại http://127.0.0.1:${port}`);
		console.log('⏳ Đang lắng nghe các luồng truy cập... (Nhấn Ctrl + C để thoát)');
	});
}

module.exports = app;