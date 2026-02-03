/**
 * Academic Services Marketplace - Main Server File
 * Entry point for the Express backend application
 */

// Load environment variables first
require("dotenv").config();

// Import required modules
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
// const passport = require("passport");
const mongoSanitize = require("express-mongo-sanitize");
const path = require("path");

// Import configuration
const connectDB = require("./config/db");
// const configurePassport = require("./config/passport");

// Import routes
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const pricingRoutes = require("./routes/pricingRoutes");

// Import error handler
const errorHandler = require("./utils/errorHandler");

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Configure Passport
// configurePassport(passport);

// Initialize Passport in app
// app.use(passport.initialize());

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "unsafe-inline"],
      },
    },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitize data to prevent NoSQL injection
app.use(mongoSanitize());

// Logging middleware (development)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/pricing", pricingRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Academic Marketplace API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "Academic Services Marketplace API",
    version: "1.0.0",
    description: "API for academic writing services platform",
    endpoints: {
      auth: {
        "POST /api/auth/register": "Register new user",
        "POST /api/auth/login": "Login user",
        "GET /api/auth/google": "Initiate Google OAuth",
        "GET /api/auth/me": "Get current user (requires auth)",
        "POST /api/auth/logout": "Logout user",
        "POST /api/auth/forgot-password": "Request password reset",
        "PUT /api/auth/reset-password/:token": "Reset password",
        "PUT /api/auth/profile": "Update profile",
        "PUT /api/auth/password": "Change password",
      },
      orders: {
        "POST /api/orders": "Create new order",
        "GET /api/orders": "Get user orders (with pagination)",
        "GET /api/orders/:id": "Get single order",
        "PUT /api/orders/:id": "Update order",
        "PUT /api/orders/:id/cancel": "Cancel order",
        "POST /api/orders/:id/review": "Add review to order",
        "POST /api/orders/calculate-price": "Calculate price preview",
      },
      pricing: {
        "POST /api/pricing/calculate": "Calculate price (public)",
        "GET /api/pricing": "Get all pricing rules (admin)",
        "POST /api/pricing": "Create pricing rule (admin)",
        "POST /api/pricing/seed": "Seed default pricing rules (admin)",
        "PUT /api/pricing/:id": "Update pricing rule (admin)",
        "DELETE /api/pricing/:id": "Delete pricing rule (admin)",
      },
    },
  });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client", "build", "index.html"));
  });
}

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
🏛️  Academic Services Marketplace API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV || "development"}
📡 API Base: http://localhost:${PORT}/api
🔐 Health Check: http://localhost:${PORT}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err.message);

  // Close server gracefully
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Process terminated");
    process.exit(0);
  });
});

module.exports = app;
