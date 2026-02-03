/**
 * Academic Services Marketplace - App Setup
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const pricingRoutes = require("./routes/pricingRoutes");

const errorHandler = require("./utils/errorHandler");

const app = express();

/* -------------------- CORE CONFIG -------------------- */

// Trust proxy (important for cookies, OAuth, Stripe later)
app.set("trust proxy", 1);

/* -------------------- SECURITY -------------------- */

// Helmet – relaxed CSP for React compatibility
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
  }),
);

/* -------------------- CORS -------------------- */

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow Postman / server-to-server
      const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:5173"];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  }),
);

/* -------------------- BODY PARSERS -------------------- */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* -------------------- SANITIZATION -------------------- */

// Prevent NoSQL injection (allow dots for nested pricing rules)
app.use(
  mongoSanitize({
    allowDots: true,
  }),
);

/* -------------------- LOGGING -------------------- */

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/* -------------------- ROUTES -------------------- */

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/pricing", pricingRoutes);

/* -------------------- HEALTH -------------------- */

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Academic Services Marketplace API",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

/* -------------------- API INFO -------------------- */

app.get("/api", (req, res) => {
  res.json({
    name: "Academic Services Marketplace API",
    version: "1.0.0",
    status: "running",
  });
});

/* -------------------- STATIC CLIENT -------------------- */

if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../client/build");

  if (require("fs").existsSync(clientPath)) {
    app.use(express.static(clientPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(clientPath, "index.html"));
    });
  }
}

/* -------------------- 404 -------------------- */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

/* -------------------- ERROR HANDLER -------------------- */

app.use(errorHandler);

module.exports = app;
