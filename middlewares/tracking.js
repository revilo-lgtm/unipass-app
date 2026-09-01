const fs = require('fs');
const path = require('path');

function getReadableDocName(docId) {
	try {
		const metaPath = path.join(__dirname, '..', 'course-pdfs.json');
		if (fs.existsSync(metaPath)) {
			const list = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
			const found = list.find(d => d.id === docId);
			if (found) {
				const cTitle = found.courseTitle || found.course || 'Môn học';
				let lTitle = found.lessonTitle || found.originalName || docId;
				lTitle = lTitle.replace(/^Mục \d+:\s*Tài liệu Giáo trình Học tập\s*-\s*Bài \d+:\s*/i, '');
				return `${cTitle} - ${lTitle}`;
			}
		}
	} catch (e) {}
	return docId;
}

const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');
const { getClientIp, jwtSecret } = require('./auth');

const forensicSubscribers = new Set();

async function logForensicEvent({ email, action, ip, status }) {
	const db = await getDb();
	const result = await db.run(`
		INSERT INTO forensic_logs (email, action, ip, status, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, [email || 'Khách chưa xác thực', action, ip || 'Unknown', status, new Date().toISOString()]);
	
	const log = await db.get(`
		SELECT id, email, action, ip, created_at AS time, status
		FROM forensic_logs WHERE id = ?
	`, [result.lastID]);
	
	for (const subscriber of forensicSubscribers) subscriber(log);
	return log;
}

function forensicAction(req, statusCode) {
	let action = null;
	const requestKey = `${req.method} ${req.originalUrl.split('?')[0]}`;
	if (requestKey === 'POST /api/login') action = 'Đăng nhập tài khoản';
	if (requestKey.startsWith('GET /api/documents/stream/')) {
		const documentId = requestKey.split('/').pop();
		const docName = getReadableDocName(documentId);
		action = `Xem bài học: ${docName}`;
	}
	if (requestKey.startsWith('GET /api/course-pdfs/') && requestKey.endsWith('/download')) {
		const documentId = requestKey.split('/')[3];
		const docName = getReadableDocName(documentId);
		action = `Xem bài học: ${docName}`;
	}
	if (!action) return null;
	return action;
}

async function trackingMiddleware(req, res, next) {
	const clientIp = await getClientIp(req);
	const userAgent = req.headers['user-agent'] || 'Unknown Device';

	req.clientIp = clientIp;
	req.deviceInfo = userAgent;
	console.log(`\n[TRACKING] Bắt được luồng truy cập từ IP: ${clientIp}`);
	console.log(`[TRACKING] Thiết bị: ${userAgent}`);
	next();
}

function auditApiRequest(req, res, next) {
	res.on('finish', async () => {
		try {
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
			
			const db = await getDb();
			let isAdmin = false;
			if (email === 'admin') isAdmin = true;
			else {
				const acc = await db.get('SELECT Role FROM accounts WHERE Email = ?', [email]);
				if (acc && acc.Role === 'admin') isAdmin = true;
			}
			
			if (isAdmin) return;
			const action = forensicAction(req, res.statusCode);
			if (action) {
				const ip = await getClientIp(req);
				await logForensicEvent({ email, action, ip, status: res.statusCode });
			}
		} catch (e) {
			console.error("Audit error", e);
		}
	});
	next();
}

module.exports = { trackingMiddleware, auditApiRequest, logForensicEvent, forensicSubscribers };
