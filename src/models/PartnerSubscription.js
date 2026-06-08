const mongoose = require("mongoose");

// One active subscription per partner at a time (partnerId is unique)
const partnerSubscriptionSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true, unique: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    subscriptionDate: { type: Date, required: true },
    expirationDate: { type: Date, required: true },
    subscriptionStatus: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED"],
      default: "ACTIVE",
    },
  },
  { collection: "partner_subscriptions" }
);

partnerSubscriptionSchema.index({ expirationDate: 1 });

module.exports = mongoose.model("PartnerSubscription", partnerSubscriptionSchema);
