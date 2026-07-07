import express from 'express';
import { loginUser, logoutUser, registerUser, verifyUser } from '../controllers/AuthControllers.js';
import protect from '../middlewares/auth.js';
import passport from "../configs/passport.js";
import GoogleToken from "../models/GoogleToken.js";

const AuthRouter = express.Router();

AuthRouter.post('/register', registerUser);
AuthRouter.post('/login', loginUser);
AuthRouter.get('/verify', protect, verifyUser);
AuthRouter.post('/logout', protect, logoutUser);

// Step 1: Redirect user to Google
// - "calendar.events" scope is required for Calendar sync.
// - accessType: "offline" + prompt: "consent" force Google to reissue a
//   refresh_token on every single authorization, not just the first ever.
AuthRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    accessType: "offline",
    prompt: "consent",
  })
);

// Step 2: Google callback
AuthRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login",
  }),
  (req, res) => {
    req.session.isLoggedIn = true;
    req.session.userId = (req.user as any)._id;
    res.redirect("http://localhost:5173/dashboard");
  }
);

// Self-healing reconnect route.
//
// If a GoogleToken doc got saved earlier without a refreshToken (from the
// old findOneAndUpdate-without-runValidators bug), Google won't always
// send a fresh one to overwrite it. Instead of opening Mongo shell/Compass
// to fix it by hand, this route deletes the broken doc through the app's
// own Mongoose model, then redirects straight into the normal Google OAuth
// flow. This is the app fixing its own data, not manual DB editing.
//
// Hit this once from the browser (while logged in) whenever you see
// "No Google refresh token found" -> GET /api/auth/google/reconnect
AuthRouter.get("/google/reconnect", protect, async (req, res) => {
  try {
    const userId = (req.user as any)?._id ?? req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not logged in — log in first, then retry reconnect.",
      });
    }

    const deleted = await GoogleToken.findOneAndDelete({ userId });
    console.log(
      deleted
        ? `[auth/google/reconnect] Cleared existing Google token for user ${userId}.`
        : `[auth/google/reconnect] No existing token found for user ${userId} — proceeding to fresh auth anyway.`
    );

    // Now send them into the real OAuth flow, which will force consent
    // and (this time, with nothing stale to fall back on) require Google
    // to hand back a real refresh_token.
    res.redirect("/api/auth/google");
  } catch (err: any) {
    console.error("[auth/google/reconnect] Failed to clear token:", err);
    res.status(500).json({
      success: false,
      message: err?.message ?? "Failed to reset Google connection.",
    });
  }
});

export default AuthRouter;