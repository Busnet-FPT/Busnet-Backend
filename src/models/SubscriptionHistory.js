const mongoose = require("mongoose");

const subscriptionHistorySchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    subscriptionDate: { type: Date },
    expirationDate: { type: Date },
    subscriptionStatus: { type: String },
  },
  { collection: "subscription_histories" }
);

subscriptionHistorySchema.index({ partnerId: 1, subscriptionDate: -1 });

module.exports = mongoose.model("SubscriptionHistory", subscriptionHistorySchema);
