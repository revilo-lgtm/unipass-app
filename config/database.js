const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

const dataDirectory = process.env.DATA_DIR || path.join(__dirname, '..');
fs.mkdirSync(dataDirectory, { recursive: true });
const databasePath = path.join(dataDirectory, 'unipass.db');

let dbPromise = null;

async function getDb() {
	if (!dbPromise) {
		dbPromise = open({
			filename: databasePath,
			driver: sqlite3.Database
		}).then(async (db) => {
			await initSchema(db);
			return db;
		});
	}
	return dbPromise;
}

async function initSchema(db) {
	await db.exec('PRAGMA foreign_keys = ON;');
	await db.exec(`
		CREATE TABLE IF NOT EXISTS accounts (
			User_ID TEXT PRIMARY KEY,
			Email TEXT NOT NULL UNIQUE COLLATE NOCASE,
			Fullname TEXT NOT NULL,
			password TEXT NOT NULL,
			Role TEXT NOT NULL,
			Status TEXT NOT NULL DEFAULT 'pending' CHECK (Status IN ('active', 'pending')),
			Expiry_Date TEXT,
			failed_login_attempts INTEGER DEFAULT 0,
			lockout_until TEXT
		);
		CREATE TABLE IF NOT EXISTS forensic_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT NOT NULL DEFAULT 'Khách chưa xác thực',
			action TEXT NOT NULL,
			ip TEXT NOT NULL,
			status INTEGER NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS transactions (
			id TEXT PRIMARY KEY,
			account_id TEXT,
			amount INTEGER NOT NULL DEFAULT 0,
			status TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			plan TEXT NOT NULL DEFAULT 'Membership',
			method TEXT NOT NULL DEFAULT 'Unknown'
		);
		CREATE TABLE IF NOT EXISTS rag_queries (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			account_id TEXT,
			question TEXT,
			answer TEXT,
			rating INTEGER DEFAULT 0,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS admin_audit_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			admin_id TEXT NOT NULL,
			action TEXT NOT NULL,
			details TEXT,
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
		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			token TEXT NOT NULL,
			device_id TEXT,
			created_at TEXT NOT NULL,
			FOREIGN KEY(user_id) REFERENCES accounts(User_ID) ON DELETE CASCADE
		);
		CREATE TABLE IF NOT EXISTS reading_history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id TEXT NOT NULL,
			document_id TEXT NOT NULL,
			document_title TEXT,
			course_id TEXT,
			course_title TEXT,
			lesson_title TEXT,
			last_read_at TEXT NOT NULL,
			UNIQUE(user_id, document_id)
		);
		CREATE TABLE IF NOT EXISTS course_details (
			course_id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			university TEXT NOT NULL,
			description TEXT,
			updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS course_chapters (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			course_id TEXT NOT NULL,
			chapter_order INTEGER NOT NULL DEFAULT 1,
			title TEXT NOT NULL,
			meta TEXT,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS course_lessons (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			course_id TEXT NOT NULL,
			chapter_id INTEGER NOT NULL,
			lesson_order INTEGER NOT NULL DEFAULT 1,
			lesson_id TEXT NOT NULL,
			title TEXT NOT NULL,
			type TEXT NOT NULL DEFAULT 'doc',
			document_id TEXT,
			meta_text TEXT,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(chapter_id) REFERENCES course_chapters(id) ON DELETE CASCADE
		);
		CREATE INDEX IF NOT EXISTS idx_course_chapters_course ON course_chapters(course_id, chapter_order);
		CREATE INDEX IF NOT EXISTS idx_course_lessons_chapter ON course_lessons(chapter_id, lesson_order);
		CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history(user_id, last_read_at DESC);
		CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
		CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
	`);

	// Add missing columns if they don't exist (migrations)
	try { await db.exec("ALTER TABLE accounts ADD COLUMN Status TEXT NOT NULL DEFAULT 'pending' CHECK (Status IN ('active', 'pending'))"); } catch(e){}
	try { await db.exec("ALTER TABLE accounts ADD COLUMN Expiry_Date TEXT"); } catch(e){}
	try { await db.exec("ALTER TABLE accounts ADD COLUMN failed_login_attempts INTEGER DEFAULT 0"); } catch(e){}
	try { await db.exec("ALTER TABLE accounts ADD COLUMN lockout_until TEXT"); } catch(e){}
	try { await db.exec("ALTER TABLE accounts ADD COLUMN reset_requested INTEGER DEFAULT 0"); } catch(e){}
	try { await db.exec("ALTER TABLE transactions ADD COLUMN plan TEXT NOT NULL DEFAULT 'Membership'"); } catch(e){}
	try { await db.exec("ALTER TABLE transactions ADD COLUMN method TEXT NOT NULL DEFAULT 'Unknown'"); } catch(e){}

	// Create settings table
	await db.exec(`
		CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
	`);

	// Seed data for accounts
	const seed = await db.get("SELECT User_ID FROM accounts WHERE User_ID = 'SV001'");
	if (!seed) {
		const bcrypt = require('bcrypt');
		const defaultPassword = await bcrypt.hash('123456', 10);
		// SV001 is active and expires in 30 days
		const thirtyDaysFromNow = new Date();
		thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
		
		await db.run(`INSERT OR IGNORE INTO accounts (User_ID, Email, Fullname, password, Role, Status, Expiry_Date) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
			['SV001', 'mssv@st.ueh.edu.vn', 'Sinh viên UEH', defaultPassword, 'Học viên', 'active', thirtyDaysFromNow.toISOString()]);
		
		const adminPassword = await bcrypt.hash('admin', 10);
		await db.run(`INSERT OR IGNORE INTO accounts (User_ID, Email, Fullname, password, Role, Status, Expiry_Date) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
			['ADMIN001', 'admin', 'Quản trị viên', adminPassword, 'admin', 'active', null]);
	}

	// Seed default settings
	const defaultSettings = {
		llm_model: 'gemini-3.6-flash',
		gemini_api_key: '',
		pinecone_api_key: '',
		momo_active: 'true',
		momo_phone: '0903768871',
		vnpay_active: 'true',
		system_name: 'UniPass - Học trúng đích, Thi qua môn',
		support_email: 'support@unipass.edu.vn',
		maintenance_mode: 'false',
		two_factor_auth: 'true'
	};
	
	for (const [key, value] of Object.entries(defaultSettings)) {
		await db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
	}
}

module.exports = { getDb, dataDirectory };
