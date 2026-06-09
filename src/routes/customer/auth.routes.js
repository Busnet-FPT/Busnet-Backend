const express = require('express');
const customerAuthController = require('../../controllers/customer/customerAuth.controller');
const { validateRegister } = require('../../validations/auth.validation');

const router = express.Router();

// POST /api/customer/auth/register
router.post('/register', validateRegister, customerAuthController.register);

// POST /api/customer/auth/login
router.post('/login', customerAuthController.login);

// POST /api/customer/auth/google
router.post('/google', customerAuthController.loginWithGoogle);

module.exports = router;