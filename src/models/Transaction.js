const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    senderAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "PartnerSubscription" },
    transactionType: { type: String, enum: ["BOOKING_PAYMENT", "SUBSCRIPTION_PAYMENT", "REFUND"] },
    amount: { type: Number, required: true },
    currency: { type: String, default: "VND" },
    status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED", "EXPIRED"], default: "PENDING" },
    expiresAt: { type: Date },
    // SePay webhook fields
    sepayTransactionId: { type: String },
    gateway: { type: String }, // SEPAY, CASH, BANK_TRANSFER
    transactionDate: { type: Date },
    accountNumber: { type: String },
    code: { type: String },
    content: { type: String },
    transferAmount: { type: Number },
    transferType: { type: String },
    accumulated: { type: Number },
    subAccount: { type: String },
    referenceCode: { type: String },
    description: { type: String },
  },
  { timestamps: true, collection: "transactions" }
);

transactionSchema.index({ bookingId: 1 });
transactionSchema.index({ partnerId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
