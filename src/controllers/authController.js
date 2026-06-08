const crypto = require("crypto");
const Account = require("../models/Account");
const PartnerInformation = require("../models/PartnerInformation");
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

const sanitizeAccount = (account) => ({
  _id: account._id,
  fullName: account.fullName,
  email: account.email,
  phone: account.phone,
  role: account.role,
  status: account.status,
  isEmailVerified: account.isEmailVerified,
  profilePicture: account.profilePicture,
  createdAt: account.createdAt,
});

const verifyEmailTemplate = (fullName, otp) => `
  <div style="font-family:sans-serif;max-width:480px;margin:auto">
    <h2 style="color:#1a73e8">Xác minh tài khoản BusNest</h2>
    <p>Xin chào <strong>${fullName}</strong>,</p>
    <p>Mã OTP xác minh email của bạn là:</p>
    <div style="font-size:32px;font-weight:bold;letter-spacing:8px;
                text-align:center;padding:16px;background:#f1f3f4;
                border-radius:8px;margin:16px 0">${otp}</div>
    <p style="color:#666">Mã có hiệu lực trong <strong>10 phút</strong>. Không chia sẻ mã này với ai.</p>
  </div>
`;

const resetPasswordTemplate = (fullName, otp) => `
  <div style="font-family:sans-serif;max-width:480px;margin:auto">
    <h2 style="color:#e8321a">Đặt lại mật khẩu BusNest</h2>
    <p>Xin chào <strong>${fullName}</strong>,</p>
    <p>Mã OTP đặt lại mật khẩu của bạn là:</p>
    <div style="font-size:32px;font-weight:bold;letter-spacing:8px;
                text-align:center;padding:16px;background:#f1f3f4;
                border-radius:8px;margin:16px 0">${otp}</div>
    <p style="color:#666">Mã có hiệu lực trong <strong>10 phút</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
  </div>
`;

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, role, operatorName, operatorPhone, description } = req.body;
    if (await Account.findOne({ email })) {
      res.status(400);
      throw new Error("Email đã được sử dụng");
    }
    if (role === "ADMIN") {
      res.status(403);
      throw new Error("Không thể tự đăng ký tài khoản Admin");
    }

    const account = await Account.create({
      fullName, email, password, phone,
      role: role || "CUSTOMER",
      status: "UNVERIFIED",
    });

    // Create partner information record for partner registration
    if (account.role === "PARTNER") {
      await PartnerInformation.create({
        accountId: account._id,
        operatorName: operatorName || fullName,
        operatorPhone: operatorPhone || phone,
        description,
      });
    }

    // Create OTP in code_verifications collection
    const { otp, hashed, expires } = generateOTP();
    await CodeVerification.create({
      accountId: account._id,
      code: hashed,
      expiredAt: expires,
      type: "EMAIL_VERIFY",
    });

    await sendEmail({
      to: email,
      subject: "BusNest — Xác minh email của bạn",
      html: verifyEmailTemplate(fullName, otp),
    });

    res.status(201).json({ success: true, message: `Đăng ký thành công. Mã OTP đã gửi đến ${email}` });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const account = await Account.findOne({ email });
    if (!account) {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
    if (account.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email đã được xác minh" });
    }

    const codeDoc = await CodeVerification.findOne({
      accountId: account._id,
      type: "EMAIL_VERIFY",
      used: false,
    }).select("+code");

    if (!codeDoc) {
      res.status(400);
      throw new Error("Không có OTP nào đang chờ xác minh");
    }
    if (codeDoc.expiredAt < new Date()) {
      res.status(400);
      throw new Error("OTP đã hết hạn. Vui lòng yêu cầu gửi lại");
    }
    if (codeDoc.code !== hashOTP(otp)) {
      res.status(400);
      throw new Error("OTP không hợp lệ");
    }

    // Mark OTP as used
    codeDoc.used = true;
    await codeDoc.save();

    // Set account status based on role
    account.isEmailVerified = true;
    account.status = account.role === "PARTNER" ? "PENDING_APPROVAL" : "ACTIVE";
    await account.save();

    if (account.role === "PARTNER") {
      return res.status(200).json({
        success: true,
        message: "Xác minh email thành công. Tài khoản Partner đang chờ Admin duyệt",
      });
    }

    const token = generateToken(account._id, account.role);
    res.cookie("token", token, cookieOptions);
    res.status(200).json({ success: true, message: "Xác minh email thành công", token, user: sanitizeAccount(account) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/resend-otp
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const account = await Account.findOne({ email });
    if (!account) {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
    if (account.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email đã được xác minh" });
    }

    // Invalidate previous OTPs
    await CodeVerification.updateMany({ accountId: account._id, type: "EMAIL_VERIFY", used: false }, { used: true });

    const { otp, hashed, expires } = generateOTP();
    await CodeVerification.create({ accountId: account._id, code: hashed, expiredAt: expires, type: "EMAIL_VERIFY" });

    await sendEmail({ to: email, subject: "BusNest — Mã OTP mới", html: verifyEmailTemplate(account.fullName, otp) });

    res.status(200).json({ success: true, message: `Mã OTP mới đã gửi đến ${email}` });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const account = await Account.findOne({ email }).select("+password");
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
      throw new Error("Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ");
    }
    if (account.status === "DELETED") {
      res.status(403);
      throw new Error("Tài khoản không tồn tại");
    }

    const token = generateToken(account._id, account.role);
    res.cookie("token", token, cookieOptions);
    res.status(200).json({ success: true, token, user: sanitizeAccount(account) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const account = await Account.findOne({ email });

    // Always respond success to prevent email enumeration
    if (!account || !account.isEmailVerified) {
      return res.status(200).json({ success: true, message: `Nếu email tồn tại, mã OTP đã gửi đến ${email}` });
    }

    await CodeVerification.updateMany({ accountId: account._id, type: "PASSWORD_RESET", used: false }, { used: true });

    const { otp, hashed, expires } = generateOTP();
    await CodeVerification.create({ accountId: account._id, code: hashed, expiredAt: expires, type: "PASSWORD_RESET" });

    await sendEmail({ to: email, subject: "BusNest — Đặt lại mật khẩu", html: resetPasswordTemplate(account.fullName, otp) });

    res.status(200).json({ success: true, message: `Nếu email tồn tại, mã OTP đã gửi đến ${email}` });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const account = await Account.findOne({ email });
    if (!account) {
      res.status(400);
      throw new Error("Yêu cầu không hợp lệ");
    }

    const codeDoc = await CodeVerification.findOne({
      accountId: account._id,
      type: "PASSWORD_RESET",
      used: false,
    }).select("+code");

    if (!codeDoc || codeDoc.expiredAt < new Date()) {
      res.status(400);
      throw new Error("OTP không hợp lệ hoặc đã hết hạn");
    }
    if (codeDoc.code !== hashOTP(otp)) {
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

// POST /api/auth/logout
const logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Đăng xuất thành công" });
};

// POST /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const account = await Account.findById(req.user._id).select("+password");

    if (!(await account.comparePassword(currentPassword))) {
      res.status(401);
      throw new Error("Mật khẩu hiện tại không đúng");
    }
    account.password = newPassword;
    await account.save();

    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại" });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = (req, res) => {
  res.status(200).json({ success: true, user: sanitizeAccount(req.user) });
};

module.exports = { register, verifyEmail, resendOTP, login, forgotPassword, resetPassword, logout, changePassword, getMe };
