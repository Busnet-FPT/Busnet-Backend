const express = require('express');
const customerAuthController = require('../../controllers/customer/customerAuth.controller');

const router = express.Router();

router.post('/login', customerAuthController.login);

module.exports = router;