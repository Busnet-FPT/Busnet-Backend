const mongoose = require("mongoose");

// Queued next-plan renewal — processed when current subscription expires
const subscriptionRenewalQueueSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true, unique: true },
    nextPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    targetStartDate: { type: Date },
    targetEndDate: { type: Date },
  },
  { collection: "subscription_renewal_queue" }
);

module.exports = mongoose.model("SubscriptionRenewalQueue", subscriptionRenewalQueueSchema);
