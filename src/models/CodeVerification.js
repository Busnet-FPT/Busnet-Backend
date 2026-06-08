const mongoose = require("mongoose");

const codeVerificationSchema = new mongoose.Schema(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    // Stored as SHA-256 hash — never store plain OTP
    code: { type: String, required: true, select: false },
    expiredAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    type: { type: String, enum: ["EMAIL_VERIFY", "PASSWORD_RESET"], required: true },
  },
  { collection: "code_verifications" }
);

codeVerificationSchema.index({ accountId: 1, type: 1 });
// Auto-delete documents 1 hour after expiry
codeVerificationSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model("CodeVerification", codeVerificationSchema);
