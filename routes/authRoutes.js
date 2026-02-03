/**
 * Authentication Routes
 * Defines API endpoints for user authentication
 */

const express = require("express");
const passport = require("passport");
const router = express.Router();

const {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
} = require("../controllers/authController");

const { protect, generateToken } = require("../middleware/auth");
const {
  validateUserRegistration,
  validateUserLogin,
} = require("../middleware/validation");

// Google OAuth routes
// Initiate Google login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=oauth_failed",
    session: false,
  }),
  (req, res) => {
    // Generate token
    const token = generateToken(req.user);

    // Redirect to frontend with token
    const frontendUrl = process.env.CLIENT_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  },
);

// Public routes
router.post("/register", validateUserRegistration, register);
router.post("/login", validateUserLogin, login);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

// Protected routes
router.use(protect);
router.get("/me", getMe);
router.post("/logout", logout);
router.put("/profile", updateProfile);
router.put("/password", changePassword);

module.exports = router;
