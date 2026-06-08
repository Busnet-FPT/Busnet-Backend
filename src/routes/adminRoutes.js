const express = require("express");
const router = express.Router();
const { adminLogin, verifyEmail, resendOTP, forgotPassword, resetPassword, getProfile } = require("../controllers/adminController");
const { verifyToken, authorize } = require("../middlewares/authMiddleware");

router.post("/login", adminLogin);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", verifyToken, authorize("ADMIN"), getProfile);

module.exports = router;
