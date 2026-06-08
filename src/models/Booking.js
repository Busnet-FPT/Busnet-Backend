const mongoose = require("mongoose");

const bookingSeatSchema = new mongoose.Schema(
  {
    seatCode: { type: String, required: true },
    seatType: { type: String, enum: ["NORMAL", "VIP"] },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    passengerName: { type: String },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      unique: true,
      default: () => "BK" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase(),
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
    // Snapshot of selected pickup/dropoff at booking time
    pickupPoint_name: { type: String },
    pickupPoint_address: { type: String },
    pickupPoint_time: { type: String },
    dropoffPoint_name: { type: String },
    dropoffPoint_address: { type: String },
    dropoffPoint_time: { type: String },
    seats: {
      type: [bookingSeatSchema],
      validate: [(v) => v.length > 0, "At least one seat required"],
    },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "CONFIRMED", "CANCEL_REQUESTED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_OPERATOR", "COMPLETED", "NO_SHOW", "REFUNDED"],
      default: "PENDING_PAYMENT",
    },
    // Contact info (person who made the booking)
    passengerName: { type: String },
    passengerPhone: { type: String },
    passengerEmail: { type: String },
    customerNote: { type: String },
    cancelReason: { type: String },
    cancelResponse: { type: String },
    // Payment snapshot
    payment_transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    payment_amount: { type: Number },
    payment_status: { type: String, enum: ["PENDING", "PAID", "REFUNDED", "FAILED"] },
    payment_paymentType: { type: String }, // SEPAY, BANK_TRANSFER, CASH
    isReminder: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "bookings" }
);


bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ partnerId: 1, createdAt: -1 });
bookingSchema.index({ tripId: 1 });
// bookingCode unique index already created via field definition

module.exports = mongoose.model("Booking", bookingSchema);
