const jwt = require("jsonwebtoken");
const Account = require("../models/Account");

const verifyToken = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const account = await Account.findById(decoded.id).select("-__v");

    if (!account) {
      return res.status(401).json({ success: false, message: "Tài khoản không tồn tại" });
    }
    if (account.status === "BAN") {
      return res.status(403).json({ success: false, message: "Tài khoản đã bị khóa" });
    }
    if (account.status === "DELETED") {
      return res.status(403).json({ success: false, message: "Tài khoản không tồn tại" });
    }

    req.user = account;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token đã hết hạn" });
    }
    return res.status(401).json({ success: false, message: "Token không hợp lệ" });
  }
};

// Usage: authorize('ADMIN') | authorize('PARTNER', 'ADMIN')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' không có quyền truy cập`,
      });
    }
    next();
  };
};

// Partner must be ACTIVE (approved by admin)
const requireApprovedPartner = (req, res, next) => {
  if (req.user.status === "PENDING_APPROVAL") {
    return res.status(403).json({ success: false, message: "Tài khoản Partner đang chờ Admin duyệt" });
  }
  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({ success: false, message: "Tài khoản Partner chưa được kích hoạt" });
  }
  next();
};

module.exports = { verifyToken, authorize, requireApprovedPartner };
