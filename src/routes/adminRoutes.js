const express = require("express");
const router = express.Router();
const { adminLogin, verifyEmail, resendOTP } = require("../controllers/adminController");

router.post("/login", adminLogin);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);

module.exports = router;
