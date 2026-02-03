/**
 * Academic Services Marketplace - Server Bootstrap
 */

const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
dotenv.config({ path: path.join(__dirname, "config.env") });

const connectDB = require("./config/db");
const app = require("./app");

const mongoUri = process.env.MONGODB_URI;
if (
  !mongoUri ||
  (typeof mongoUri === "string" &&
    !mongoUri.startsWith("mongodb://") &&
    !mongoUri.startsWith("mongodb+srv://"))
) {
  console.error(
    "❌ MONGODB_URI is missing or invalid. Set it in .env or config.env.",
  );
  process.exit(1);
}

// Connect DB
connectDB();

/* -------------------- SERVER -------------------- */

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`
🏛️ Academic Services Marketplace API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Port: ${PORT}
🌍 Env: ${process.env.NODE_ENV || "development"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
});

/* -------------------- PROCESS SAFETY -------------------- */

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down...");
  server.close(() => process.exit(0));
});

module.exports = app;
