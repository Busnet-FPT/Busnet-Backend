const express = require("express");
const router = express.Router();
const { register, verifyEmail, resendOTP, login, forgotPassword, resetPassword, logout, changePassword, getMe } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", verifyToken, logout);
router.post("/change-password", verifyToken, changePassword);
router.get("/me", verifyToken, getMe);

module.exports = router;
