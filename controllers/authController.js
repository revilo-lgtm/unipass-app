const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { getDb } = require('../config/database');
const { jwtSecret, MAX_ACTIVE_SESSIONS } = require('../middlewares/auth');
const { logForensicEvent } = require('../middlewares/tracking');

const supportedEmailPattern = /^[^\s@]+@(st\.ueh\.edu\.vn|hcmut\.edu\.vn|ftu\.edu\.vn|st\.neu\.edu\.vn|hcmus\.edu\.vn|tdtu\.edu\.vn)$/i;

function publicAccount(account) {
	return { User_ID: account.User_ID, Email: account.Email, Role: account.Role };
}

function accountView(account) {
	return { ...publicAccount(account), Fullname: account.Fullname, Status: account.Status, Expiry_Date: account.Expiry_Date || null };
}

exports.login = async (req, res) => {
	const { email, password, deviceId } = req.body || {};
	const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

	if (!email || (password === undefined || password === null)) return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc.' });

	const db = await getDb();
	const user = normalizedEmail === 'admin'
		? await db.get("SELECT * FROM accounts WHERE Role = 'admin' ORDER BY CASE WHEN Email = 'admin' THEN 0 ELSE 1 END LIMIT 1")
		: await db.get('SELECT * FROM accounts WHERE Email = ?', [normalizedEmail]);

	if (!user) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });

	// Check Maintenance Mode
	if (user.Role !== 'admin') {
		const maintenance = await db.get('SELECT value FROM settings WHERE key = "maintenance_mode"');
		if (maintenance && maintenance.value === 'true') {
			return res.status(503).json({ message: 'Hệ thống đang bảo trì, Tạm thời đóng hệ thống để nâng cấp server.' });
		}
	}
	
	if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
		return res.status(423).json({ message: 'Tài khoản đã bị khoá do đăng nhập sai nhiều lần. Vui lòng thử lại sau 15 phút.' });
	}
	
	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		const attempts = (user.failed_login_attempts || 0) + 1;
		if (attempts >= 5) {
			const lockoutTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
			await db.run('UPDATE accounts SET failed_login_attempts = ?, lockout_until = ? WHERE User_ID = ?', [attempts, lockoutTime, user.User_ID]);
			return res.status(423).json({ message: 'Tài khoản đã bị khoá do đăng nhập sai quá 5 lần. Vui lòng thử lại sau 15 phút.' });
		} else {
			await db.run('UPDATE accounts SET failed_login_attempts = ? WHERE User_ID = ?', [attempts, user.User_ID]);
			return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
		}
	}

	if (user.failed_login_attempts > 0 || user.lockout_until) {
		await db.run('UPDATE accounts SET failed_login_attempts = 0, lockout_until = NULL WHERE User_ID = ?', [user.User_ID]);
	}

	// Check Expiry Date
	let currentStatus = user.Status;
	if (user.Role !== 'admin' && user.Role !== 'Giảng viên' && user.Expiry_Date) {
		const expiryDate = new Date(user.Expiry_Date);
		if (expiryDate < new Date()) {
			currentStatus = 'pending';
			await db.run('UPDATE accounts SET Status = ? WHERE User_ID = ?', ['pending', user.User_ID]);
			user.Status = 'pending'; // Update local object for token creation
		}
	}

	const sessions = await db.all('SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at ASC', [user.User_ID]);
	const sameDeviceSession = sessions.find(s => s.device_id === (deviceId || ''));
	const previousSessionWasAnotherDevice = sessions.length > 0 && !sameDeviceSession;
	
	if (previousSessionWasAnotherDevice && sessions.length >= MAX_ACTIVE_SESSIONS && user.Role !== 'admin') {
		const evictedSession = sessions[0];
		await logForensicEvent({ email: user.Email, action: 'Đăng xuất thiết bị cũ do vượt giới hạn session', ip: req.clientIp, status: 200 });
		await db.run('DELETE FROM sessions WHERE id = ?', [evictedSession.id]);
	} else if (sameDeviceSession) {
		await db.run('DELETE FROM sessions WHERE id = ?', [sameDeviceSession.id]);
	}

	const token = jwt.sign(
		{ ...publicAccount(user), Status: user.Status, deviceId: deviceId || '', jti: crypto.randomUUID() },
		jwtSecret, { expiresIn: '1h' }
	);
	
	await db.run('INSERT INTO sessions (id, user_id, token, device_id, created_at) VALUES (?, ?, ?, ?, ?)',
		[crypto.randomUUID(), user.User_ID, token, deviceId || '', Date.now().toString()]);

	const currentSessionCount = await db.get('SELECT COUNT(*) as count FROM sessions WHERE user_id = ?', [user.User_ID]);

	return res.status(200).json({
		token,
		session: { active: currentSessionCount.count, limit: MAX_ACTIVE_SESSIONS },
		user: accountView(user),
		requires_password_change: user.reset_requested === 1
	});
};

exports.logout = async (req, res) => {
	const db = await getDb();
	await db.run('DELETE FROM sessions WHERE token = ?', [req.userToken]);
	const currentSessionCount = await db.get('SELECT COUNT(*) as count FROM sessions WHERE user_id = ?', [req.user.User_ID]);
	return res.status(200).json({ loggedOut: true, session: { active: currentSessionCount.count, limit: MAX_ACTIVE_SESSIONS } });
};

exports.verifyToken = async (req, res) => {
	const authorization = req.get('Authorization') || '';
	const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

	try {
		const payload = jwt.verify(token, jwtSecret);
		const db = await getDb();
		await cleanExpiredSessions(payload.User_ID, db);
		const session = await db.get('SELECT * FROM sessions WHERE user_id = ? AND token = ?', [payload.User_ID, token]);
		if (!session) return res.status(401).json({ code: 'SESSION_REPLACED', message: 'Tài khoản đang được đăng nhập trên thiết bị khác.' });
		
		if (payload.Role !== 'admin') {
			const maintenance = await db.get('SELECT value FROM settings WHERE key = "maintenance_mode"');
			if (maintenance && maintenance.value === 'true') {
				return res.status(503).json({ code: 'MAINTENANCE', message: 'Hệ thống đang bảo trì, Tạm thời đóng hệ thống để nâng cấp server.' });
			}
		}

		const currentSessionCount = await db.get('SELECT COUNT(*) as count FROM sessions WHERE user_id = ?', [payload.User_ID]);
		const account = await db.get('SELECT Status, Expiry_Date FROM accounts WHERE User_ID = ?', [payload.User_ID]);
		
		return res.status(200).json({ 
			valid: true, 
			session: { active: currentSessionCount.count, limit: MAX_ACTIVE_SESSIONS },
			Status: account ? account.Status : 'pending',
			Expiry_Date: account ? account.Expiry_Date : null
		});
	} catch (error) {
		return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn hoặc được đăng nhập ở thiết bị khác' });
	}
};

exports.register = async (req, res) => {
	const { fullname, email, password, university, isPaid, isTrial, planId, txId: customTxId } = req.body || {};
	
	if (!email || !password) {
		return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc.' });
	}

	const passwordStr = String(password || '');
	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
	if (!passwordRegex.test(passwordStr)) {
		return res.status(400).json({ 
			message: 'Mật khẩu phải dài ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (VD: Pass@123).' 
		});
	}

	const normalizedEmail = String(email).trim().toLowerCase();
	const normalizedFullname = String(fullname || '').trim();
	
	const db = await getDb();
	
	const maintenance = await db.get('SELECT value FROM settings WHERE key = "maintenance_mode"');
	if (maintenance && maintenance.value === 'true') {
		return res.status(503).json({ message: 'Hệ thống đang bảo trì, Tạm thời đóng hệ thống để nâng cấp server.' });
	}

	const existing = await db.get('SELECT * FROM accounts WHERE Email = ?', [normalizedEmail]);
	if (existing) {
		if (existing.Status === 'active') {
			return res.status(409).json({ message: 'Email đã được sử dụng. Vui lòng đăng nhập.' });
		}
		// Nếu tài khoản đang pending, cho phép cập nhật lại mật khẩu/thông tin để tiếp tục
		const hashedPassword = await bcrypt.hash(String(password), 10);
		let status = isTrial ? 'active' : 'pending';
		let expiry = null;
		if (isTrial) {
			const exp = new Date();
			exp.setDate(exp.getDate() + 1);
			expiry = exp.toISOString();
		}
		await db.run('UPDATE accounts SET password = ?, Fullname = ?, Status = ?, Expiry_Date = ? WHERE User_ID = ?', 
			[hashedPassword, normalizedFullname || existing.Fullname, status, expiry, existing.User_ID]);
		
		const txId = customTxId || `TXN_${Date.now().toString().slice(-6)}`;
		let finalPlanName = req.body.planName || (planId === 'yearly' ? 'Gói 1 Năm VIP' : planId === 'monthly' ? 'Gói 1 Tháng' : 'Gói Nửa Năm (Học Kỳ)');
		let finalAmount = parseInt(req.body.amount) || (planId === 'yearly' ? 249000 : planId === 'monthly' ? 79000 : 149000);
		let finalMethod = req.body.method || 'VietQR 24/7';

		if (isTrial) {
			await db.run(
				'INSERT INTO transactions (id, account_id, amount, status, plan, method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
				[txId, existing.User_ID, 0, 'success', 'Dùng thử 1 ngày', 'Khuyến mãi / Trial', new Date().toISOString()]
			);
		} else {
			const exTx = await db.get('SELECT id FROM transactions WHERE id = ?', [txId]);
			if (exTx) {
				await db.run('UPDATE transactions SET amount = ?, plan = ?, method = ?, status = "pending", created_at = ? WHERE id = ?',
					[finalAmount, finalPlanName, finalMethod, new Date().toISOString(), txId]);
			} else {
				await db.run(
					'INSERT INTO transactions (id, account_id, amount, status, plan, method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
					[txId, existing.User_ID, finalAmount, 'pending', finalPlanName, finalMethod, new Date().toISOString()]
				);
			}
		}

		return res.status(200).json({
			account: accountView({ User_ID: existing.User_ID, Email: normalizedEmail, Role: 'Học viên', Status: status, Expiry_Date: expiry, Fullname: normalizedFullname || existing.Fullname }),
			university: university || '',
			txId
		});
	}

	const row = await db.get(`SELECT COALESCE(MAX(CAST(SUBSTR(User_ID, 3) AS INTEGER)), 0) + 1 AS nextNumber FROM accounts WHERE User_ID LIKE 'SV%'`);
	const userId = `SV${String(row.nextNumber).padStart(3, '0')}`;
	
	let initialStatus = 'pending';
	let expiryDateIso = null;

	if (isTrial) {
		initialStatus = 'active';
		const expiry = new Date();
		expiry.setDate(expiry.getDate() + 1); // Dùng thử 1 ngày
		expiryDateIso = expiry.toISOString();
	}

	const hashedPassword = await bcrypt.hash(String(password), 10);
	await db.run('INSERT INTO accounts (User_ID, Email, Fullname, password, Role, Status, Expiry_Date) VALUES (?, ?, ?, ?, ?, ?, ?)',
		[userId, normalizedEmail, normalizedFullname, hashedPassword, 'Học viên', initialStatus, expiryDateIso]);

	// Ghi nhận bản ghi giao dịch vào hệ thống đối soát Admin
	const txId = customTxId || `TXN_${Date.now().toString().slice(-6)}`;
	let finalPlanName = req.body.planName || (planId === 'yearly' ? 'Gói 1 Năm VIP' : planId === 'monthly' ? 'Gói 1 Tháng' : 'Gói Nửa Năm (Học Kỳ)');
	let finalAmount = parseInt(req.body.amount) || (planId === 'yearly' ? 249000 : planId === 'monthly' ? 79000 : 149000);
	let finalMethod = req.body.method || 'VietQR 24/7';

	if (isTrial) {
		await db.run(
			'INSERT INTO transactions (id, account_id, amount, status, plan, method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
			[txId, userId, 0, 'success', 'Dùng thử 1 ngày', 'Khuyến mãi / Trial', new Date().toISOString()]
		);
	} else {
		await db.run(
			'INSERT INTO transactions (id, account_id, amount, status, plan, method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
			[txId, userId, finalAmount, 'pending', finalPlanName, finalMethod, new Date().toISOString()]
		);
	}

	return res.status(201).json({
		account: accountView({ User_ID: userId, Email: normalizedEmail, Role: 'Học viên', Status: initialStatus, Expiry_Date: expiryDateIso, Fullname: normalizedFullname }),
		university: university || '',
		txId
	});
};


async function cleanExpiredSessions(userId, db) {
	try {
		if (!db) db = await (require('../config/database')).getDb();
		const query = userId ? 'SELECT * FROM sessions WHERE user_id = ?' : 'SELECT * FROM sessions';
		const params = userId ? [userId] : [];
		const sessions = await db.all(query, params);
		
		const now = Math.floor(Date.now() / 1000);
		const toDelete = [];
		
		for (const sess of sessions) {
			try {
				const decoded = jwt.decode(sess.token);
				if (!decoded || (decoded.exp && decoded.exp < now)) {
					toDelete.push(sess.id);
				}
			} catch (e) {
				toDelete.push(sess.id);
			}
		}
		
		if (toDelete.length > 0) {
			const placeholders = toDelete.map(() => '?').join(',');
			await db.run(`DELETE FROM sessions WHERE id IN (${placeholders})`, toDelete);
		}
	} catch (e) {
		console.error('Error cleaning expired sessions:', e);
	}
}

exports.cleanExpiredSessions = cleanExpiredSessions;

exports.getUserSessions = async (req, res) => {
	try {
		const db = await getDb();
		await cleanExpiredSessions(req.user.User_ID, db);
		const sessions = await db.all('SELECT id, token, device_id, created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC', [req.user.User_ID]);
		
		const list = sessions.map(s => {
			const isCurrent = s.token === req.userToken;
			return {
				id: s.id,
				deviceId: s.device_id || 'Phiên web',
				createdAt: s.created_at,
				isCurrent
			};
		});
		
		return res.status(200).json({
			sessions: list,
			activeCount: list.length,
			limit: MAX_ACTIVE_SESSIONS
		});
	} catch (err) {
		return res.status(500).json({ message: 'Lỗi tải danh sách phiên đăng nhập.' });
	}
};

exports.logoutOtherDevices = async (req, res) => {
	try {
		const db = await getDb();
		await db.run('DELETE FROM sessions WHERE user_id = ? AND token != ?', [req.user.User_ID, req.userToken]);
		
		return res.status(200).json({
			message: 'Đã đăng xuất khỏi tất cả các thiết bị khác thành công!',
			session: { active: 1, limit: MAX_ACTIVE_SESSIONS }
		});
	} catch (err) {
		return res.status(500).json({ message: 'Lỗi khi đăng xuất thiết bị khác.' });
	}
};
