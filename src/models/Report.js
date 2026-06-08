const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    reportType: { type: String }, // TRIP, OPERATOR, APP_BUG, etc.
    description: { type: String, required: true },
    reportImages: [{ type: String }],
    isResponse: { type: Boolean, default: false },
    responseDescription: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "reports" }
);

reportSchema.index({ accountId: 1 });
reportSchema.index({ isResponse: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
