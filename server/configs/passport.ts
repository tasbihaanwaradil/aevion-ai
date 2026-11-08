import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import Teacher from "../models/Teacher.js";

// BACKEND_URL should be set in Render's environment tab to your deployed
// backend URL (e.g. https://aevion-ai.onrender.com). Falls back to
// localhost for local development.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// ======================
// TEACHER Google strategy
// ======================
// Signing in with Google either logs in an existing teacher or creates
// a brand-new account automatically (no need to visit "Create account").
passport.use(
  "google-teacher",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${BACKEND_URL}/api/teacher-auth/google/callback`,
    },
    async (
      _accessToken,
      _refreshToken,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase().trim();

        if (!email) {
          return done(null, false, { message: "no_email" });
        }

        // Only trust emails that Google itself has verified.
        const googleVerified = (profile as any)._json?.email_verified;
        if (googleVerified === false) {
          return done(null, false, { message: "google_email_unverified" });
        }

        // 1. Already linked — signed in with Google before.
        let teacher = await Teacher.findOne({ googleId: profile.id });
        if (teacher) {
          return done(null, teacher);
        }

        // 2. Account exists under this email (e.g. registered with
        //    email/password first) — link Google to it.
        teacher = await Teacher.findOne({ email });
        if (teacher) {
          teacher.googleId = profile.id;
          // Google has verified this email, so it's safe to mark verified.
          teacher.isEmailVerified = true;
          await teacher.save();
          return done(null, teacher);
        }

        // 3. Brand-new user — create the account straight away.
        teacher = await Teacher.create({
          name: (profile.displayName || email.split("@")[0]).trim(),
          email,
          googleId: profile.id,
          isEmailVerified: true,
          // no password: Google-only account
        });

        return done(null, teacher);
      } catch (error) {
        return done(error as Error, undefined);
      }
    },
  ),
);

// ======================
// Note on sessions: the teacher Google flow doesn't use Passport
// sessions — every passport.authenticate call for 'google-teacher' is
// called with { session: false }, and TeacherAuthController manages
// req.session.teacherId manually. So no serializeUser/deserializeUser
// is needed here at all.
// ======================

export default passport;