const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String },
    time: { type: String }, // "HH:MM" — offset from departure
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const scheduleSchema = new mongoose.Schema(
  {
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    tripCode: {
      type: String,
      unique: true,
      default: () => "TRIP" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase(),
    },
    basePrice: { type: Number, required: true, min: 0 },
    departureTime: { type: String, required: true }, // "HH:MM" template time
    arrivalTime: { type: String, required: true },   // "HH:MM" template time
    isActive: { type: Boolean, default: true },
    pickupPoints: [pointSchema],
    dropoffPoints: [pointSchema],
  },
  { timestamps: true, collection: "schedules" }
);


scheduleSchema.index({ partnerId: 1 });
scheduleSchema.index({ routeId: 1 });

module.exports = mongoose.model("Schedule", scheduleSchema);
