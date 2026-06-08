const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

dotenv.config();

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// Thêm routes của từng module tại đây:
// app.use("/api/accounts",      require("./routes/accountRoutes"));
// app.use("/api/partner-info",  require("./routes/partnerInfoRoutes"));
// app.use("/api/addresses",     require("./routes/addressRoutes"));
// app.use("/api/plans",         require("./routes/subscriptionPlanRoutes"));
// app.use("/api/subscriptions", require("./routes/subscriptionRoutes"));
// app.use("/api/routes",        require("./routes/routeRoutes"));
// app.use("/api/buses",         require("./routes/busRoutes"));
// app.use("/api/trips",         require("./routes/tripRoutes"));
// app.use("/api/departures",    require("./routes/tripDepartureRoutes"));
// app.use("/api/bookings",      require("./routes/bookingRoutes"));
// app.use("/api/transactions",  require("./routes/transactionRoutes"));
// app.use("/api/tickets",       require("./routes/ticketRoutes"));
// app.use("/api/feedbacks",     require("./routes/feedbackRoutes"));
// app.use("/api/reports",       require("./routes/reportRoutes"));
// app.use("/api/favourites",    require("./routes/favouriteRoutes"));
// app.use("/api/notifications", require("./routes/notificationRoutes"));
// app.use("/api/stats",         require("./routes/statsRoutes"));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BusNest Backend API is running successfully",
    project: "BusNest",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    uptime: `${Math.floor(process.uptime())} seconds`,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
