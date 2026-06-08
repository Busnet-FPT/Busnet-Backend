const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true }, // direct link to the trip run, for fast check-in
    seatCode: { type: String, required: true },
    ticketCode: { type: String, unique: true },
    qrCode: { type: String },   // URL to QR code image
    pdfUrl: { type: String },   // URL to downloadable PDF
    checkInStatus: { type: Boolean, default: false },
    checkedInAt: { type: Date },
    ticketExpiredAt: { type: Date },
    issuedAt: { type: Date },
    status: { type: String, enum: ["ACTIVE", "EXPIRED", "CANCELLED"], default: "ACTIVE" },
  },
  { collection: "tickets" }
);

ticketSchema.index({ bookingId: 1 });
ticketSchema.index({ tripId: 1 });
// ticketCode unique index already created via field definition

module.exports = mongoose.model("Ticket", ticketSchema);
