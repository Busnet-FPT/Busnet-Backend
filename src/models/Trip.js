const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule", required: true },
    departureDate: { type: Date, required: true },
    actualDepartureTime: { type: String }, // "HH:MM" — overrides schedule.departureTime if set
    availableSeats: { type: Number, required: true, min: 0 },
    priceOverride: { type: Number, min: 0 }, // overrides schedule.basePrice if set
    status: {
      type: String,
      enum: ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"],
      default: "SCHEDULED",
    },
  },
  { timestamps: true, collection: "trips" }
);

tripSchema.index({ scheduleId: 1, departureDate: 1 });
tripSchema.index({ departureDate: 1, status: 1 });

module.exports = mongoose.model("Trip", tripSchema);
