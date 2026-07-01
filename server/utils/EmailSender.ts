// utils/EmailSender.ts

import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;           // recipient email address
  subject: string;
  body: string;
  fromName?: string;    // display name for the sender
}

// ─── Transporter ─────────────────────────────────────────────────────────────
// Uses environment variables — set these in your .env file:
//   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
// For Gmail: use an App Password (not your real password)

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST ?? "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
  });

// ─── Send ─────────────────────────────────────────────────────────────────────

export const sendEmail = async ({ to, subject, body, fromName }: SendEmailOptions) => {
  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from: `"${fromName ?? "Academic Email Tool"}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: body,
  });

  return { messageId: info.messageId, accepted: info.accepted };
};