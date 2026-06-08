const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, trim: true },
    reviewImages: [{ type: String }],
    type: { type: String }, // TRIP, OPERATOR, etc.
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "feedbacks" }
);

feedbackSchema.index({ partnerId: 1, createdAt: -1 });
// bookingId unique index already created via field definition

module.exports = mongoose.model("Feedback", feedbackSchema);
