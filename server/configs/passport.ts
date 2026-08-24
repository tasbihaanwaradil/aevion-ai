import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import User from "../models/User.js";
import Teacher from "../models/Teacher.js";

// ======================
// USER Google strategy (unchanged)
// ======================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:3000/api/auth/google/callback"
    },
    async (_accessToken, _refreshToken, profile: Profile, done: VerifyCallback) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) return done(new Error("No email found"), undefined);

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email,
            password: "",
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

// ======================
// TEACHER Google strategy (new — explicitly named so it doesn't
// collide with the default 'google' strategy above)
// ======================
passport.use(
  "google-teacher",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:3000/api/teacher-auth/google/callback"
    },
    async (_accessToken, _refreshToken, profile: Profile, done: VerifyCallback) => {
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
    }
  )
);

// ======================
// Sessions — used by the USER Google flow (req.login / passport session).
// The TEACHER flow does NOT use these; it manages req.session.teacherId
// manually, matching your existing TeacherAuthController pattern
// (loginTeacher / verifyTeacherEmail), so it's unaffected by this.
// ======================
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error as Error, null);
  }
});

export default passport;