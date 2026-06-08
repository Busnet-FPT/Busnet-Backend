const mongoose = require("mongoose");

const partnerInformationSchema = new mongoose.Schema(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true, unique: true },
    operatorName: { type: String, trim: true },
    operatorPhone: { type: String, trim: true },
    description: { type: String },
    amenities: [{ type: String }],
    policies: [{ type: String }],
    profilePicture: { type: String },
    coverImage: { type: String },
    bankName: { type: String },
    bankNumber: { type: String },
    bankBranch: { type: String },
    // SePay payment gateway credentials
    sepayVa: { type: String, select: false },
    sepayKey: { type: String, select: false },
    isVerify: { type: Boolean, default: false },
    // Denormalized for performance (updated when feedback is created)
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "partner_information" }
);

module.exports = mongoose.model("PartnerInformation", partnerInformationSchema);
