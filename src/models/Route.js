const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    routeName: { type: String, required: true, trim: true },
    origin_province: { type: String },
    origin_provinceName: { type: String },
    origin_district: { type: String },
    origin_districtName: { type: String },
    origin_address: { type: String },
    origin_lat: { type: Number },
    origin_lng: { type: Number },
    destination_province: { type: String },
    destination_provinceName: { type: String },
    destination_district: { type: String },
    destination_districtName: { type: String },
    destination_address: { type: String },
    destination_lat: { type: Number },
    destination_lng: { type: Number },
    distanceKm: { type: Number },
    estimatedDuration: { type: Number }, // minutes
    routePolyline: { type: String },
    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
  },
  { collection: "routes" }
);

routeSchema.index({ partnerId: 1 });
routeSchema.index({ origin_province: 1, destination_province: 1 });
routeSchema.index({ routeName: "text", origin_provinceName: "text", destination_provinceName: "text" });

module.exports = mongoose.model("Route", routeSchema);
