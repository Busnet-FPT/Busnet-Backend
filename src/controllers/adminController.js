const Account = require("../models/Account");
const generateToken = require("../utils/generateToken");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sanitizeAdmin = (account) => ({
  _id: account._id,
  fullName: account.fullName,
  email: account.email,
  role: account.role,
  status: account.status,
});

// POST /api/admin/login
// Dedicated entry point for ADMIN accounts — kept separate from the
// CUSTOMER/PARTNER login because admin accounts can't self-register
// (see authController.register) and so never go through email verification
// or partner approval; only BAN/DELETED need to be checked here.
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

module.exports = { adminLogin };
