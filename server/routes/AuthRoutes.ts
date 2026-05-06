import express from 'express';
import { loginUser, logoutUser, registerUser, verifyUser } from '../controllers/AuthControllers.js';
import protect from '../middlewares/auth.js';
import  passport  from "../configs/passport.js";

const AuthRouter = express.Router();

AuthRouter.post('/register', registerUser);
AuthRouter.post('/login', loginUser);
AuthRouter.get('/verify', protect, verifyUser);
AuthRouter.post('/logout', protect, logoutUser);


// 🔹 Step 1: Redirect user to Google
AuthRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 🔹 Step 2: Google callback
AuthRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    // ✅ Set session manually (important for your system)
    req.session.isLoggedIn = true;
    req.session.userId = (req.user as any)._id;

    // redirect to frontend
    res.redirect("http://localhost:5173/dashboard");
  }
);

export default AuthRouter