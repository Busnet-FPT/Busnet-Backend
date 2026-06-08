const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    address: { type: String, trim: true },
    ward: { type: String },
    wardName: { type: String },
    district: { type: String },
    districtName: { type: String },
    province: { type: String },
    provinceName: { type: String },
  },
  { collection: "addresses" }
);

addressSchema.index({ accountId: 1 });

module.exports = mongoose.model("Address", addressSchema);
