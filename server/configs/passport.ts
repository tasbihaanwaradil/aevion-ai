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
passport.use(
  "google-teacher",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${BACKEND_URL}/api/teacher-auth/google/callback`
    },
    async (
      _accessToken,
      _refreshToken,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, { message: "no_email" });
        }

        // Already linked — signed in with Google before.
        let teacher = await Teacher.findOne({ googleId: profile.id });
        if (teacher) {
          return done(null, teacher);
        }

        // Not linked yet — check if an account exists under this email
        // (e.g. they registered with name/email/password first).
        teacher = await Teacher.findOne({ email });

        if (!teacher) {
          return done(null, false, { message: "notfound" });
        }

        if (!teacher.isEmailVerified) {
          return done(null, false, { message: "unverified", email });
        }

        // Verified account, first Google sign-in — link it.
        teacher.googleId = profile.id;
        await teacher.save();

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
