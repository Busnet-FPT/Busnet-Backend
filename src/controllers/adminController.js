const crypto = require("crypto");
const Account = require("../models/Account");
const CodeVerification = require("../models/CodeVerification");
const generateToken = require("../utils/generateToken");
const generateOTP = require("../utils/generateOTP");
const sendEmail = require("../utils/sendEmail");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const hashOTP = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

const sanitizeAdmin = (account) => ({
  _id: account._id,
  fullName: account.fullName,
  email: account.email,
  phone: account.phone,
  role: account.role,
  status: account.status,
  gender: account.gender,
  dob: account.dob,
  profilePicture: account.profilePicture,
  isEmailVerified: account.isEmailVerified,
  createdAt: account.createdAt,
});

const verifyEmailTemplate = (fullName, otp) => `
  <div style="font-family:sans-serif;max-width:480px;margin:auto">
    <h2 style="color:#1a73e8">Xác minh email quản trị viên BusNest</h2>
    <p>Xin chào <strong>${fullName}</strong>,</p>
    <p>Mã OTP xác minh email tài khoản Admin của bạn là:</p>
    <div style="font-size:32px;font-weight:bold;letter-spacing:8px;
                text-align:center;padding:16px;background:#f1f3f4;
                border-radius:8px;margin:16px 0">${otp}</div>
    <p style="color:#666">Mã có hiệu lực trong <strong>10 phút</strong>. Không chia sẻ mã này với ai.</p>
  </div>
`;

const resetPasswordTemplate = (fullName, otp) => `
  <div style="font-family:sans-serif;max-width:480px;margin:auto">
    <h2 style="color:#e8321a">Đặt lại mật khẩu quản trị viên BusNest</h2>
    <p>Xin chào <strong>${fullName}</strong>,</p>
    <p>Mã OTP đặt lại mật khẩu tài khoản Admin của bạn là:</p>
    <div style="font-size:32px;font-weight:bold;letter-spacing:8px;
                text-align:center;padding:16px;background:#f1f3f4;
                border-radius:8px;margin:16px 0">${otp}</div>
    <p style="color:#666">Mã có hiệu lực trong <strong>10 phút</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
  </div>
`;

// POST /api/admin/login
// Dedicated entry point for ADMIN accounts — kept separate from the
// CUSTOMER/PARTNER login because admin accounts can't self-register
// (see authController.register) and so never go through partner approval;
// they still verify their email via OTP (see verifyEmail/resendOTP below)
// since accounts created directly in DB/seed start out UNVERIFIED.
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("Vui lòng nhập email và mật khẩu");
    }

    const account = await Account.findOne({ email, role: "ADMIN" }).select("+password");
    if (!account || !account.password || !(await account.comparePassword(password))) {
      res.status(401);
      throw new Error("Email hoặc mật khẩu không đúng");
    }
    if (account.status === "UNVERIFIED") {
      res.status(403);
      throw new Error("Email chưa được xác minh. Vui lòng kiểm tra hộp thư");
    }
    if (account.status === "BAN") {
      res.status(403);
      throw new Error("Tài khoản đã bị khóa");
    }
    if (account.status === "DELETED") {
      res.status(403);
      throw new Error("Tài khoản không tồn tại");
    }

    const token = generateToken(account._id, account.role);
    res.cookie("token", token, cookieOptions);
    res.status(200).json({ success: true, token, user: sanitizeAdmin(account) });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/verify-email
// Verifies the OTP sent to a freshly-created ADMIN account (created directly
// by another Admin / via seed — see authController.register, which blocks
// self-registration for the ADMIN role) and activates it.
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400);
      throw new Error("Vui lòng nhập email và mã OTP");
    }

    const account = await Account.findOne({ email, role: "ADMIN" });
    if (!account) {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
    if (account.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email đã được xác minh" });
    }

    const codeDoc = await CodeVerification.findOne({
      accountId: account._id,
      type: "VERIFY_EMAIL",
      used: false,
    }).select("+codeHash");

    if (!codeDoc) {
      res.status(400);
      throw new Error("Không có OTP nào đang chờ xác minh");
    }
    if (codeDoc.expiredAt < new Date()) {
      res.status(400);
      throw new Error("OTP đã hết hạn. Vui lòng yêu cầu gửi lại");
    }
    if (codeDoc.codeHash !== hashOTP(otp)) {
      res.status(400);
      throw new Error("OTP không hợp lệ");
    }

    codeDoc.used = true;
    await codeDoc.save();

    account.isEmailVerified = true;
    account.status = "ACTIVE";
    await account.save();

    const token = generateToken(account._id, account.role);
    res.cookie("token", token, cookieOptions);
    res.status(200).json({ success: true, message: "Xác minh email thành công", token, user: sanitizeAdmin(account) });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/resend-otp
// Re-sends the email verification OTP for an ADMIN account that hasn't
// verified its email yet, invalidating any previously issued OTPs.
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error("Vui lòng nhập email");
    }

    const account = await Account.findOne({ email, role: "ADMIN" });
    if (!account) {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
    if (account.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email đã được xác minh" });
    }

    await CodeVerification.updateMany({ accountId: account._id, type: "VERIFY_EMAIL", used: false }, { used: true });

    const { otp, hashed, expires } = generateOTP();
    await CodeVerification.create({
      accountId: account._id,
      target: email,
      targetType: "EMAIL",
      codeHash: hashed,
      expiredAt: expires,
      type: "VERIFY_EMAIL",
    });

    await sendEmail({ to: email, subject: "BusNest — Mã OTP xác minh email", html: verifyEmailTemplate(account.fullName, otp) });

    res.status(200).json({ success: true, message: `Mã OTP mới đã gửi đến ${email}` });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/forgot-password
// Sends a password-reset OTP to an ADMIN account's email. Always responds
// with a generic success message (even if the account doesn't exist or its
// email isn't verified) to prevent email enumeration.
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const account = await Account.findOne({ email, role: "ADMIN" });

    if (!account || !account.isEmailVerified) {
      return res.status(200).json({ success: true, message: `Nếu email tồn tại, mã OTP đã gửi đến ${email}` });
    }

    await CodeVerification.updateMany({ accountId: account._id, type: "RESET_PASSWORD", used: false }, { used: true });

    const { otp, hashed, expires } = generateOTP();
    await CodeVerification.create({
      accountId: account._id,
      target: email,
      targetType: "EMAIL",
      codeHash: hashed,
      expiredAt: expires,
      type: "RESET_PASSWORD",
    });

    await sendEmail({ to: email, subject: "BusNest — Đặt lại mật khẩu Admin", html: resetPasswordTemplate(account.fullName, otp) });

    res.status(200).json({ success: true, message: `Nếu email tồn tại, mã OTP đã gửi đến ${email}` });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/reset-password
// Verifies the OTP and sets a new password for an ADMIN account.
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const account = await Account.findOne({ email, role: "ADMIN" });
    if (!account) {
      res.status(400);
      throw new Error("Yêu cầu không hợp lệ");
    }

    const codeDoc = await CodeVerification.findOne({
      accountId: account._id,
      type: "RESET_PASSWORD",
      used: false,
    }).select("+codeHash");

    if (!codeDoc || codeDoc.expiredAt < new Date()) {
      res.status(400);
      throw new Error("OTP không hợp lệ hoặc đã hết hạn");
    }
    if (codeDoc.codeHash !== hashOTP(otp)) {
      res.status(400);
      throw new Error("OTP không hợp lệ");
    }

    codeDoc.used = true;
    await codeDoc.save();

    account.password = newPassword;
    await account.save();

    res.status(200).json({ success: true, message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại" });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/me
const getProfile = (req, res) => {
  res.status(200).json({ success: true, user: sanitizeAdmin(req.user) });
};

module.exports = { adminLogin, verifyEmail, resendOTP, forgotPassword, resetPassword, getProfile };
