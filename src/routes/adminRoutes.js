const express = require("express");
const router = express.Router();
const { adminLogin, verifyEmail, resendOTP, forgotPassword, resetPassword } = require("../controllers/adminController");

router.post("/login", adminLogin);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
