const mongoose = require("mongoose");

const ticketPriceSchema = new mongoose.Schema(
  {
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule", required: true },
    seatType: { type: String, enum: ["NORMAL", "VIP"], required: true },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 }, // percentage
    effectiveFrom: { type: Date },
    effectiveTo: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { collection: "ticket_prices" }
);

ticketPriceSchema.index({ scheduleId: 1, seatType: 1 });

module.exports = mongoose.model("TicketPrice", ticketPriceSchema);
