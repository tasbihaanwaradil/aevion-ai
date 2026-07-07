import nodemailer from "nodemailer";

interface SendEmailOptions {
  to?: string;
  bcc?: string[];
  subject: string;
  body: string;
  fromName?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({
  to,
  bcc,
  subject,
  body,
  fromName,
}: SendEmailOptions) => {
  if (!to && (!bcc || bcc.length === 0)) {
    throw new Error("No recipients provided.");
  }

  const info = await transporter.sendMail({
    from: `"${fromName || "Academic Email Tool"}" <${process.env.EMAIL_USER}>`,

    // Gmail requires a TO field
    to: to || process.env.EMAIL_USER,

    // Broadcast recipients
    bcc: bcc && bcc.length ? bcc : undefined,

    subject,
    text: body,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
  };
};