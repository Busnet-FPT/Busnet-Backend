const mongoose = require("mongoose");

const banHistorySchema = new mongoose.Schema(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    banCounts: { type: Number },
    type: { type: String }, // e.g. "TEMPORARY", "PERMANENT"
    banDescription: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "ban_histories" }
);

banHistorySchema.index({ accountId: 1 });

module.exports = mongoose.model("BanHistory", banHistorySchema);
