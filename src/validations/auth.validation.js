const { body, validationResult } = require('express-validator');

/**
 * Validation rules for customer registration
 */
const registerRules = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 7, max: 50 }).withMessage('Password must be over 6 characters')
        .matches(/^[A-Z]/).withMessage('First letter must be capitalized')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\';]/).withMessage('Password must contain at least one special character'),

    body('fullName')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),

    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^0\d{9}$/).withMessage('Phone must be exactly 10 digits and start with 0'),

    body('gender')
        .optional()
        .isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Gender must be one of: MALE, FEMALE, OTHER'),

    body('dob')
        .optional()
        .isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD)')
];

/**
 * Single middleware function that runs all register validations
 * and returns 400 if any fail. Compatible with Express 5.
 */
const validateRegister = async (req, res, next) => {
    // Run all validation rules
    for (const rule of registerRules) {
        await rule.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path,
            message: err.msg
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors
        });
    }

    next();
};

module.exports = {
    validateRegister
};
