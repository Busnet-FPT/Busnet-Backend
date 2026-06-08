const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    planName: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
    discount: { type: Number, default: 0, min: 0, max: 100 }, // percentage off original price
    planFeatures: [{ type: String }],
    maxBuses: { type: Number, required: true, min: 1 },
    maxRoutes: { type: Number, required: true, min: 1 },
    isPopular: { type: Boolean, default: false },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    chartColor: { type: String }, // hex color for UI display
  },
  { timestamps: true, collection: "subscription_plans" }
);

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
