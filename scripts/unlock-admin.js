'use strict';

/**
 * Clear admin lockout after too many failed login attempts.
 *
 * Usage:
 *   node scripts/unlock-admin.js
 *
 * On Railway: open service Shell, then:
 *   node scripts/unlock-admin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcrypt');
const { getDb } = require('../config/database');

async function main() {
	const db = await getDb();
	const admin = await db.get("SELECT User_ID, Email, failed_login_attempts, lockout_until FROM accounts WHERE Role = 'admin' ORDER BY CASE WHEN Email = 'admin' THEN 0 ELSE 1 END LIMIT 1");

	if (!admin) {
		console.error('No admin account found.');
		process.exit(1);
	}

	console.log('Before:', admin);

	await db.run(
		'UPDATE accounts SET failed_login_attempts = 0, lockout_until = NULL WHERE User_ID = ?',
		[admin.User_ID]
	);

	if (process.env.ADMIN_PASSWORD) {
		const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
		await db.run('UPDATE accounts SET password = ?, Email = ?, Status = ? WHERE User_ID = ?', [
			hash,
			process.env.ADMIN_EMAIL || 'admin',
			'active',
			admin.User_ID
		]);
		console.log('Password synced from ADMIN_PASSWORD env.');
	}

	const after = await db.get('SELECT User_ID, Email, failed_login_attempts, lockout_until, Status FROM accounts WHERE User_ID = ?', [admin.User_ID]);
	console.log('After:', after);
	console.log('Admin unlocked. Login with username admin and ADMIN_PASSWORD from Railway Variables.');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
