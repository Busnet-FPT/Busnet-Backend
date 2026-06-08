const crypto = require("crypto");

// Returns plain OTP (send to user), hashed OTP (store in DB), and expiry date
const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashed = crypto.createHash("sha256").update(otp).digest("hex");
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return { otp, hashed, expires };
};

module.exports = generateOTP;
