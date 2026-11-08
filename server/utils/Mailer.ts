import nodemailer from "nodemailer";

// Uses a Gmail account to send mail via SMTP. Requires:
//   GMAIL_USER            — the sending Gmail address
//   GMAIL_APP_PASSWORD    — a Google "App Password" for that account
//                            (Google Account > Security > App Passwords,
//                            which requires 2FA to be on).
// Created on first use (not at import time) so the .env values are already
// loaded by the time the credentials are read.
let transporter: nodemailer.Transporter | null = null;

// Also accepts EMAIL_USER / EMAIL_PASS, the names used by the academic email tool.
const getGmailUser = () => process.env.GMAIL_USER ?? process.env.EMAIL_USER;
const getGmailPass = () => process.env.GMAIL_APP_PASSWORD ?? process.env.EMAIL_PASS;

const getTransporter = () => {
    const user = getGmailUser();
    const pass = getGmailPass();
    if (!user || !pass) {
        throw new Error(
            "Gmail credentials are missing. Set GMAIL_USER and GMAIL_APP_PASSWORD (or EMAIL_USER and EMAIL_PASS) in server/.env and restart the server."
        );
    }
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass },
        });
    }
    return transporter;
};

export const sendVerificationEmail = async (to: string, code: string) => {
    await getTransporter().sendMail({
        from: `"Aevion.AI" <${getGmailUser()}>`,
        to,
        subject: "Verify your email",
        text: `Your verification code is ${code}. It expires in 15 minutes.`,
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #2d5f6e;">Verify your email</h2>
                <p>Use this code to verify your account. It expires in 15 minutes.</p>
                <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2d5f6e;">
                    ${code}
                </p>
                <p style="color: #888; font-size: 13px;">
                    If you didn't request this, you can safely ignore this email.
                </p>
            </div>
        `,
    });
};