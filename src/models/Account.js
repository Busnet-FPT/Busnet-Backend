const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const accountSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["CUSTOMER", "PARTNER", "ADMIN"], default: "CUSTOMER" },
    status: {
      type: String,
      enum: ["UNVERIFIED", "ACTIVE", "DELETED", "BAN", "PENDING_APPROVAL"],
      default: "UNVERIFIED",
    },
    fullName: { type: String, trim: true },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
    dob: { type: Date },
    profilePicture: { type: String },
    isOAuthUser: { type: Boolean, default: false },
    googleId: { type: String, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
    banCounts: { type: Number, default: 0 },
    banDescription: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true, collection: "accounts" }
);

// Mongoose 6+ async middleware: do NOT call next(), just return
accountSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

accountSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("Account", accountSchema);
