const mongoose = require("mongoose");

const favouriteOperatorSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "favourite_operators" }
);

// Prevent duplicate favourites
favouriteOperatorSchema.index({ customerId: 1, partnerId: 1 }, { unique: true });

module.exports = mongoose.model("FavouriteOperator", favouriteOperatorSchema);
