const express = require("express");
const router = express.Router();
const { adminLogin, verifyEmail, resendOTP, forgotPassword, resetPassword, getProfile, updateProfile, changePassword, getPartnerList, getPartnerDetail } = require("../controllers/adminController");
const { verifyToken, authorize } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

router.post("/login", adminLogin);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", verifyToken, authorize("ADMIN"), getProfile);
router.put("/me", verifyToken, authorize("ADMIN"), upload.single("profilePicture"), updateProfile);
router.post("/change-password", verifyToken, authorize("ADMIN"), changePassword);
router.get("/partners", verifyToken, authorize("ADMIN"), getPartnerList);
router.get("/partners/:id", verifyToken, authorize("ADMIN"), getPartnerDetail);

module.exports = router;
