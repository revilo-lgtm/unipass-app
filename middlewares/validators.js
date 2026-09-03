const { body, param, query, validationResult } = require('express-validator');

// Validation Middleware Factories
const validators = {
	// Login Validation
	login: [
		body('email')
			.trim()
			.custom(value => value === 'admin' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
			.withMessage('Email không hợp lệ.')
			.customSanitizer(value => value === 'admin' ? value : value.toLowerCase()),
		body('password')
			.trim()
			.custom((value, { req }) => req.body.email === 'admin' || value.length >= 6)
			.withMessage('Mật khẩu phải có ít nhất 6 ký tự.')
			.notEmpty()
			.withMessage('Mật khẩu là bắt buộc.'),
		body('deviceId')
			.optional()
			.trim()
			.isLength({ max: 100 })
			.withMessage('Device ID quá dài.'),
	],

	// Register Validation
	register: [
		body('email')
			.trim()
			.isEmail()
			.withMessage('Email không hợp lệ.')
			.normalizeEmail(),
		body('password')
			.trim()
			.isLength({ min: 8 })
			.withMessage('Mật khẩu phải dài ít nhất 8 ký tự.')
			.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/)
			.withMessage('Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'),
		body('fullname')
			.optional()
			.trim()
			.isLength({ min: 3, max: 200 })
			.withMessage('Họ tên phải từ 3-200 ký tự.'),
		body('university')
			.optional()
			.trim()
			.isLength({ max: 100 })
			.withMessage('Tên trường quá dài.'),
	],

	// Change Password Validation
	changePassword: [
		body('oldPassword')
			.trim()
			.notEmpty()
			.withMessage('Mật khẩu cũ là bắt buộc.'),
		body('newPassword')
			.trim()
			.isLength({ min: 8 })
			.withMessage('Mật khẩu mới phải dài ít nhất 8 ký tự.')
			.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/)
			.withMessage('Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'),
		body('confirmPassword')
			.trim()
			.custom((value, { req }) => value === req.body.newPassword)
			.withMessage('Xác nhận mật khẩu không khớp.'),
	],

	// Forgot Password Validation
	forgotPassword: [
		body('email')
			.trim()
			.isEmail()
			.withMessage('Email không hợp lệ.')
			.normalizeEmail(),
	],

	// Create Course Validation
	createCourse: [
		body('title')
			.trim()
			.isLength({ min: 3, max: 300 })
			.withMessage('Tên môn học phải từ 3-300 ký tự.'),
		body('course_id')
			.trim()
			.matches(/^[a-z0-9_]+$/)
			.withMessage('Course ID chỉ được chứa chữ thường, số và dấu gạch dưới.')
			.isLength({ min: 3, max: 100 })
			.withMessage('Course ID phải từ 3-100 ký tự.'),
		body('university')
			.trim()
			.isLength({ min: 2, max: 100 })
			.withMessage('Tên trường phải từ 2-100 ký tự.'),
		body('description')
			.optional()
			.trim()
			.isLength({ max: 2000 })
			.withMessage('Mô tả quá dài (tối đa 2000 ký tự).'),
	],

	// Assign PDF Validation
	assignPdf: [
		param('documentId')
			.trim()
			.notEmpty()
			.withMessage('Document ID không hợp lệ.'),
		body('course')
			.optional()
			.trim()
			.isLength({ min: 1, max: 100 })
			.withMessage('Course ID không hợp lệ.'),
	],

	// Course ID Validation (for routes)
	courseId: [
		param('courseId')
			.trim()
			.matches(/^[a-z0-9_]+$/)
			.withMessage('Course ID không hợp lệ.'),
	],

	// Document ID Validation
	documentId: [
		param('documentId')
			.trim()
			.notEmpty()
			.withMessage('Document ID không hợp lệ.'),
	],
};

// Validation Error Handler Middleware
const handleValidationErrors = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const formattedErrors = errors.array().map(err => ({
			field: err.path || err.param,
			message: err.msg,
		}));
		return res.status(400).json({
			code: 'VALIDATION_ERROR',
			message: 'Dữ liệu nhập không hợp lệ.',
			errors: formattedErrors,
		});
	}
	next();
};

module.exports = {
	validators,
	handleValidationErrors,
	body,
	param,
	query,
	validationResult,
};
