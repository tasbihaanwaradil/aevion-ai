import nodemailer from "nodemailer";

// Uses a Gmail account to send mail via SMTP. Requires:
//   GMAIL_USER            — the sending Gmail address
//   GMAIL_APP_PASSWORD    — a Google "App Password" for that account
//                            (not the regular account password — Gmail
//                            blocks plain SMTP login for most accounts
//                            now, so this has to be an app password
//                            generated from Google Account > Security >
//                            App Passwords, which requires 2FA to be on).
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export const sendVerificationEmail = async (to: string, code: string) => {
    await transporter.sendMail({
        from: `"Aevion.AI" <${process.env.GMAIL_USER}>`,
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