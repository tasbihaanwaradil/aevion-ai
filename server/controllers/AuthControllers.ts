import { Request, Response } from 'express'
import User from '../models/User.js'
import bcrypt from 'bcrypt'

// ======================
// REGISTER USER
// ======================
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let newUser;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            newUser = new User({
                name,
                email,
                password: hashedPassword
            });
        } else {
            newUser = new User({
                name,
                email
            });
        }

        await newUser.save();

        // 🔥 IMPORTANT: regenerate session (prevents old session reuse)
        req.session.regenerate((err) => {
            if (err) throw err;

            req.session.isLoggedIn = true;
            req.session.userId = newUser._id;

            return res.json({
                message: 'Account created successfully',
                user: {
                    _id: newUser._id,
                    name: newUser.name,
                    email: newUser.email
                }
            });
        });

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};


// ======================
// LOGIN USER
// ======================
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        if (!user.password) {
            return res.status(400).json({
                message: 'Please login with Google'
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // 🔥 IMPORTANT: regenerate session on login
        req.session.regenerate((err) => {
            if (err) throw err;

            req.session.isLoggedIn = true;
            req.session.userId = user._id;

            return res.json({
                message: 'Login successful',
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                }
            });
        });

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};


// ======================
// LOGOUT USER (FIXED)
// ======================
export const logoutUser = async (req: Request, res: Response) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({ message: 'Logout failed' });
        }

        // 🔥 IMPORTANT: clear cookie
        res.clearCookie('connect.sid');

        return res.json({ message: 'Logout successful' });
    });
};


// ======================
// VERIFY USER
// ======================
export const verifyUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.session;

        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(400).json({ message: 'Invalid user' });
        }

        return res.json({ user });

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};