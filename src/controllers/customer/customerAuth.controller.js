const authService = require('../../services/auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/response');

/**
 * POST /api/customer/auth/register
 * Register a new customer account
 */
const register = asyncHandler(async (req, res) => {
    const result = await authService.registerCustomer(req.body);

    return successResponse(res, 201,
        'Account created successfully. Please verify your email to activate your account.',
        result
    );
});

/**
 * POST /api/customer/auth/login
 * Login customer with email/phone + password
 */
const login = asyncHandler(async (req, res) => {
    const result = await authService.loginCustomer(req.body);

    return successResponse(res, 200, 'Logged in successfully', result);
});

/**
 * POST /api/customer/auth/google
 * Login or register customer via Google OAuth ID Token
 */
const loginWithGoogle = asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    const result = await authService.loginGoogleCustomer(idToken);

    return successResponse(res, 200, 'Authenticated with Google successfully', result);
});

module.exports = {
    register,
    login,
    loginWithGoogle
};