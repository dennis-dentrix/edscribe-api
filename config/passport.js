/**
 * Passport Google OAuth Configuration
 * Handles Google authentication strategy
 */

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

/**
 * Configure and export Google OAuth strategy
 * @param {Object} passport - Passport instance
 */
const configurePassport = (passport) => {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Configure Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // User exists, return them
            return done(null, user);
          }

          // Check if user exists by email
          const email = profile.emails[0].value;
          user = await User.findOne({ email });

          if (user) {
            // User exists with same email, link Google account
            user.googleId = profile.id;
            user.avatar = profile.photos[0].value;
            await user.save();
            return done(null, user);
          }

          // Create new user
          const newUser = new User({
            googleId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: email,
            avatar: profile.photos[0].value,
            authProvider: "google",
            isVerified: true, // Google verifies email
          });

          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          console.error("Error in Google Strategy:", error);
          return done(error, null);
        }
      },
    ),
  );
};

module.exports = configurePassport;
