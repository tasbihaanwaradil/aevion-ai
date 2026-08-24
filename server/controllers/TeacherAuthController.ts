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

const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PASSWORD_RESET_URL = `${FRONTEND_URL}/ResetPassword`;

const generateVerificationCode = () =>
    Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

// Thin wrapper around the existing sendEmail utility so the two call
// sites below don't need to repeat the subject/body text.
const sendVerificationEmail = async (to: string, name: string, code: string) => {
    await sendEmail({
        to,
        subject: 'Verify your email',
        body: `Hi ${name},

Here's your one time verification code:

${code}

Verification codes expire after 15 minutes.
If you didn't request this verification code, you can ignore this message.

What's Aevion.AI?
Aevion.AI helps teachers plan, communicate, and grade faster with a set of AI-powered classroom tools, all in one place.`,
        fromName: 'Aevion.AI'
    });
};

// ======================
// REGISTER TEACHER
// ======================
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

        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);

        let newTeacher;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            newTeacher = new Teacher({
                name,
                email,
                password: hashedPassword,
                isEmailVerified: false,
                verificationCode,
                verificationCodeExpires
            });
        } else {
            newTeacher = new Teacher({
                name,
                email,
                isEmailVerified: false,
                verificationCode,
                verificationCodeExpires
            });
        }

        await newTeacher.save();

        try {
            await sendVerificationEmail(email, name, verificationCode);
        } catch (mailError) {
            console.error('Failed to send verification email:', mailError);
            // The account still gets created — the user can hit
            // /resend-code to try again rather than losing their signup.
        }

        // Deliberately NOT starting a session here — the account isn't
        // usable until the email is verified. The frontend should route
        // to /VerifyEmail with this email, not /Dashboard.
        return res.json({
            message: 'Account created. Verification code sent.',
            email: newTeacher.email
        });

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};


// ======================
// VERIFY TEACHER EMAIL
// ======================
export const verifyTeacherEmail = async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: 'Email and code are required.' });
        }

        const teacher = await Teacher.findOne({ email }).select('+verificationCode +verificationCodeExpires');

        if (!teacher) {
            return res.status(400).json({ message: 'No account found for that email.' });
        }

        if (teacher.isEmailVerified) {
            return res.status(400).json({ message: 'This email is already verified.' });
        }

        if (
            !teacher.verificationCode ||
            !teacher.verificationCodeExpires ||
            teacher.verificationCodeExpires.getTime() < Date.now()
        ) {
            return res.status(400).json({ message: 'That code has expired. Request a new one.' });
        }

        if (teacher.verificationCode !== code) {
            return res.status(400).json({ message: 'Incorrect verification code.' });
        }

        teacher.isEmailVerified = true;
        teacher.verificationCode = undefined;
        teacher.verificationCodeExpires = undefined;
        await teacher.save();

        // Now that the email is confirmed, actually start the session.
        req.session.regenerate((err) => {
            if (err) throw err;

            req.session.isLoggedIn = true;
            req.session.teacherId = teacher._id;

            return res.json({
                message: 'Email verified successfully',
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
// RESEND VERIFICATION CODE
// ======================
export const resendVerificationCode = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        const teacher = await Teacher.findOne({ email });

        if (!teacher) {
            return res.status(400).json({ message: 'No account found for that email.' });
        }

        if (teacher.isEmailVerified) {
            return res.status(400).json({ message: 'This email is already verified.' });
        }

        const verificationCode = generateVerificationCode();
        teacher.verificationCode = verificationCode;
        teacher.verificationCodeExpires = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
        await teacher.save();

        await sendVerificationEmail(email, teacher.name, verificationCode);

        return res.json({ message: 'Verification code resent.' });

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

        if (!teacher.isEmailVerified) {
            return res.status(403).json({
                message: 'Please verify your email before logging in.',
                email: teacher.email
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