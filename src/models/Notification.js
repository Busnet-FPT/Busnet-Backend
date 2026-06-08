const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String }, // BOOKING, SUBSCRIPTION, SYSTEM, PROMOTION, etc.
    referenceId: { type: mongoose.Schema.Types.ObjectId }, // bookingId / tripId / etc.
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "notifications" }
);

notificationSchema.index({ accountId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
