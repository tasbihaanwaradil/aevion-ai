import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";

import User from "../models/User.js";
import GoogleToken from "../models/GoogleToken.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:3000/api/auth/google/callback",
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        console.log("\n========== GOOGLE LOGIN ==========");
        console.log("User:", profile.displayName);
        console.log("Email:", profile.emails?.[0]?.value);
        console.log("Access Token:", !!accessToken);
        console.log("Refresh Token:", !!refreshToken);

        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("Google account has no email."), undefined);
        }

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email,
            password: "",
            googleId: profile.id,
          });

          console.log("Created new user.");
        } else {
          user.name = profile.displayName;
          user.googleId = profile.id;
          await user.save();

          console.log("Updated existing user.");
        }

        const expiry = new Date(Date.now() + 55 * 60 * 1000);

        const existingToken = await GoogleToken.findOne({ userId: user._id });

        // Resolve which refresh token to persist:
        // - Google only sends a fresh one on first-ever consent (or when
        //   prompt=consent forces re-consent).
        // - Otherwise fall back to whatever is already stored.
        const resolvedRefreshToken =
          refreshToken && refreshToken.trim() !== ""
            ? refreshToken
            : existingToken?.refreshToken;

        // CRITICAL: if we still don't have a refresh token at this point
        // (no existing one AND Google didn't send one), do NOT silently
        // save a broken token doc. findOneAndUpdate skips schema
        // validators by default (required: true is NOT enforced unless
        // runValidators is passed), so without this guard a doc with
        // refreshToken: undefined can get saved with no error at all —
        // which is exactly how "No Google refresh token found" happens
        // downstream in googleCalendarService.ts.
        if (!resolvedRefreshToken) {
          console.error(
            "No refresh token available (none returned by Google, none stored previously). " +
            "User must fully reconnect via /auth/google with prompt=consent."
          );
          return done(
            new Error(
              "Google did not return a refresh token and none is on file. " +
              "Please reconnect your Google account."
            ),
            undefined
          );
        }

        await GoogleToken.findOneAndUpdate(
          { userId: user._id },
          {
            accessToken,
            refreshToken: resolvedRefreshToken,
            expiry,
          },
          {
            upsert: true,
            new: true,
            runValidators: true, // enforce schema validation on this write
          }
        );

        console.log("Google tokens saved successfully.");
        console.log("===============================\n");

        return done(null, user);
      } catch (err) {
        console.error("Google OAuth Error:", err);
        return done(err as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err as Error, null);
  }
});

export default passport;