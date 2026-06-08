const mongoose = require("mongoose");

const busSeatSchema = new mongoose.Schema(
  {
    seatCode: { type: String, required: true },
    seatType: { type: String, enum: ["NORMAL", "VIP"], default: "NORMAL" },
    floor: { type: Number, default: 1 },
    row: { type: Number, required: true },
    column: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
    priceModifier: { type: Number, default: 0 }, // % adjustment from base price
  },
  { _id: false }
);

const busSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    busName: { type: String, trim: true },
    licensePlate: { type: String, required: true, unique: true, uppercase: true, trim: true },
    busType: { type: String, enum: ["SEATED", "SLEEPER", "LIMOUSINE", "DOUBLE_DECKER"], required: true },
    totalSeats: { type: Number, required: true, min: 1 },
    description: { type: String },
    images: [{ type: String }],
    amenities: [{ type: String }],
    isActive: { type: Boolean, default: true },
    seatLayout_totalRows: { type: Number },
    seatLayout_totalColumns: { type: Number },
    seatLayout_totalFloors: { type: Number, default: 1 },
    seats: [busSeatSchema],
  },
  { timestamps: true, collection: "buses" }
);

busSchema.index({ partnerId: 1 });

module.exports = mongoose.model("Bus", busSchema);
