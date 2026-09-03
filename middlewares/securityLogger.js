const { getDb } = require('../config/database');

// Security Event Types
const SecurityEventTypes = {
	LOGIN_SUCCESS: 'LOGIN_SUCCESS',
	LOGIN_FAILED: 'LOGIN_FAILED',
	ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
	PASSWORD_CHANGED: 'PASSWORD_CHANGED',
	AUTH_FAILED: 'AUTH_FAILED',
	UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
	ADMIN_ACTION: 'ADMIN_ACTION',
	COURSE_CREATED: 'COURSE_CREATED',
	DOCUMENT_ASSIGNED: 'DOCUMENT_ASSIGNED',
	DATA_EXPORTED: 'DATA_EXPORTED',
	INVALID_TOKEN: 'INVALID_TOKEN',
	CSRF_VIOLATION: 'CSRF_VIOLATION',
	RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
};

// Log Security Event to Database
async function logSecurityEvent(eventType, details = {}) {
	try {
		const db = await getDb();
		const timestamp = new Date().toISOString();
		const userId = details.userId || null;
		const email = details.email || null;
		const ipAddress = details.ipAddress || null;
		const userAgent = details.userAgent || null;
		const endpoint = details.endpoint || null;
		const eventDetails = JSON.stringify(details);

		await db.run(
			`INSERT INTO security_logs (
				event_type, user_id, email, ip_address, user_agent, endpoint, details, timestamp
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[eventType, userId, email, ipAddress, userAgent, endpoint, eventDetails, timestamp]
		);
	} catch (error) {
		console.error('[SECURITY LOG ERROR]', error.message);
	}
}

// Middleware to capture request details and attach to req
function securityLoggingMiddleware(req, res, next) {
	req.securityContext = {
		ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
		userAgent: req.get('user-agent') || 'unknown',
		endpoint: req.method + ' ' + req.path,
		timestamp: new Date().toISOString(),
	};
	next();
}

// Log failed authentication attempts
async function logFailedAuth(req, details = {}) {
	const context = req.securityContext || {};
	await logSecurityEvent(SecurityEventTypes.AUTH_FAILED, {
		email: details.email || 'unknown',
		reason: details.reason || 'unknown',
		ipAddress: context.ipAddress,
		userAgent: context.userAgent,
		endpoint: context.endpoint,
		...details,
	});
}

// Log successful login
async function logSuccessfulLogin(req, userId, email) {
	const context = req.securityContext || {};
	await logSecurityEvent(SecurityEventTypes.LOGIN_SUCCESS, {
		userId,
		email,
		ipAddress: context.ipAddress,
		userAgent: context.userAgent,
		endpoint: context.endpoint,
	});
}

// Log account lockout
async function logAccountLocked(email, reason = 'too many failed attempts') {
	await logSecurityEvent(SecurityEventTypes.ACCOUNT_LOCKED, {
		email,
		reason,
	});
}

// Log unauthorized access attempt
async function logUnauthorizedAccess(req, resource, reason = 'insufficient permissions') {
	const context = req.securityContext || {};
	const userId = req.user?.User_ID || null;
	await logSecurityEvent(SecurityEventTypes.UNAUTHORIZED_ACCESS, {
		userId,
		email: req.user?.Email || 'unknown',
		resource,
		reason,
		ipAddress: context.ipAddress,
		userAgent: context.userAgent,
		endpoint: context.endpoint,
	});
}

// Log admin action
async function logAdminAction(req, action, details = {}) {
	const context = req.securityContext || {};
	const userId = req.admin?.User_ID || req.user?.User_ID || null;
	await logSecurityEvent(SecurityEventTypes.ADMIN_ACTION, {
		userId,
		email: req.admin?.Email || req.user?.Email || 'unknown',
		action,
		ipAddress: context.ipAddress,
		userAgent: context.userAgent,
		endpoint: context.endpoint,
		...details,
	});
}

// Log CSRF violation
async function logCsrfViolation(req) {
	const context = req.securityContext || {};
	const userId = req.user?.User_ID || null;
	await logSecurityEvent(SecurityEventTypes.CSRF_VIOLATION, {
		userId,
		email: req.user?.Email || 'unknown',
		ipAddress: context.ipAddress,
		userAgent: context.userAgent,
		endpoint: context.endpoint,
	});
}

// Log rate limit exceeded
async function logRateLimitExceeded(req, endpoint) {
	const context = req.securityContext || {};
	await logSecurityEvent(SecurityEventTypes.RATE_LIMIT_EXCEEDED, {
		endpoint,
		ipAddress: context.ipAddress,
		userAgent: context.userAgent,
	});
}

module.exports = {
	SecurityEventTypes,
	logSecurityEvent,
	securityLoggingMiddleware,
	logFailedAuth,
	logSuccessfulLogin,
	logAccountLocked,
	logUnauthorizedAccess,
	logAdminAction,
	logCsrfViolation,
	logRateLimitExceeded,
};
