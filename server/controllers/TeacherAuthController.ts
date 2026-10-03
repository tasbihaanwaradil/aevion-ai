import { Request, Response } from 'express'
import Teacher from '../models/Teacher.js'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { sendEmail } from '../utils/EmailSender.js'

// Basic server-side guards to back up the frontend's regex checks —
// never trust client-side validation alone.
const NAME_REGEX = /^[A-Za-z\s]{2,50}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// At least 8 chars, at least one letter and one number.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PASSWORD_RESET_URL = `${FRONTEND_URL}/ResetPassword`;

// ======================
// REGISTER TEACHER
// ======================
// No email verification: the account is usable immediately. The
// frontend logs the teacher in right after this call succeeds.
export const registerTeacher = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !NAME_REGEX.test(name)) {
            return res.status(400).json({ message: 'Please enter a valid name (letters and spaces only).' });
        }

        if (!email || !EMAIL_REGEX.test(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        if (password && !PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters and include a letter and a number.'
            });
        }

        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ message: 'Teacher already exists' });
        }

        let newTeacher;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            newTeacher = new Teacher({
                name,
                email,
                password: hashedPassword,
                isEmailVerified: true
            });
        } else {
            newTeacher = new Teacher({
                name,
                email,
                isEmailVerified: true
            });
        }

        await newTeacher.save();

        return res.json({
            message: 'Account created successfully.',
            email: newTeacher.email
        });

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};


// ======================
// REQUEST PASSWORD RESET
// ======================
// Always returns the same generic success message whether or not the
// email is registered — this stops someone from using the forgot-
// password form to check which emails have accounts (email enumeration).
export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        const genericMessage =
            "If an account exists for that email, we've sent a password reset link.";

        const teacher = await Teacher.findOne({ email });

        // Deliberately don't reveal whether the account exists — return
        // the same success response either way and just skip the email
        // if there's no match.
        if (!teacher) {
            return res.json({ message: genericMessage });
        }

        // Google-only accounts have no password to reset.
        if (!teacher.password) {
            return res.json({ message: genericMessage });
        }

        // Generate a random token, but only ever store its hash — same
        // principle as never storing a plaintext password. Even if the
        // database leaks, the raw token (the only thing that works in
        // the reset link) was never persisted anywhere.
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        teacher.resetPasswordToken = hashedToken;
        teacher.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
        await teacher.save();

        const resetLink = `${PASSWORD_RESET_URL}?token=${rawToken}&email=${encodeURIComponent(email)}`;

        try {
            await sendEmail({
                to: email,
                subject: 'Reset your password',
                body: `Hi ${teacher.name},

We got a request to reset your password. Click the link below to choose a new one — it expires in 30 minutes:

${resetLink}

If you didn't request this, you can safely ignore this email. Your password won't be changed.`,
                fromName: 'Aevion.AI'
            });
        } catch (mailError) {
            console.error('Failed to send password reset email:', mailError);
            // Still return the generic success message — don't leak
            // whether the send actually worked, and don't block the
            // response on an email provider hiccup.
        }

        return res.json({ message: genericMessage });

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};


// ======================
// RESET PASSWORD
// ======================
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, token, password } = req.body;

        if (!email || !token || !password) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters and include a letter and a number.'
            });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const teacher = await Teacher.findOne({ email }).select(
            '+resetPasswordToken +resetPasswordExpires'
        );

        if (
            !teacher ||
            !teacher.resetPasswordToken ||
            !teacher.resetPasswordExpires ||
            teacher.resetPasswordToken !== hashedToken ||
            teacher.resetPasswordExpires.getTime() < Date.now()
        ) {
            return res.status(400).json({
                message: 'That reset link is invalid or has expired. Request a new one.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        teacher.password = await bcrypt.hash(password, salt);
        teacher.resetPasswordToken = undefined;
        teacher.resetPasswordExpires = undefined;
        await teacher.save();

        return res.json({ message: 'Your password has been reset. You can now log in.' });

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};


// ======================
// LOGIN TEACHER
// ======================
export const loginTeacher = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const teacher = await Teacher.findOne({ email });

        if (!teacher) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        if (!teacher.password) {
            return res.status(400).json({
                message: 'Please login with Google'
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, teacher.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // 🔥 IMPORTANT: regenerate session on login
        req.session.regenerate((err) => {
            if (err) throw err;

            req.session.isLoggedIn = true;
            req.session.teacherId = teacher._id;

            return res.json({
                message: 'Login successful',
                teacher: {
                    _id: teacher._id,
                    name: teacher.name,
                    email: teacher.email
                }
            });
        });

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};


// ======================
// LOGOUT TEACHER (FIXED)
// ======================
export const logoutTeacher = async (req: Request, res: Response) => {
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
// VERIFY TEACHER (session check)
// ======================
export const verifyTeacher = async (req: Request, res: Response) => {
    try {
        const { teacherId } = req.session;

        if (!teacherId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const teacher = await Teacher.findById(teacherId).select('-password');

        if (!teacher) {
            return res.status(400).json({ message: 'Invalid teacher' });
        }

        return res.json({ teacher });

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};