// controllers/AcademicEmailController.ts

import { Request, Response } from "express";
import { runAcademicEmailAgent, generateEmailSuggestions } from "../services/AcademicEmailAgent.js";
import { sendEmail } from "../utils/EmailSender.js";
import AcademicEmail from "../models/AcademicEmail.js";

// ─── POST /api/academic-email/generate ───────────────────────────────────────

export const generateEmail = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const { purpose, recipient, recipientEmail, tone, senderName } = req.body;

    if (!purpose || !recipient || !tone) {
      return res.status(400).json({ message: "purpose, recipient, and tone are required." });
    }

    // 🤖 Run the real agent (plan → tools → reflect → output)
    const result = await runAcademicEmailAgent({ purpose, recipient, tone, senderName });

    // Save to DB
    const saved = await AcademicEmail.create({
      userId: userId ?? "guest",
      senderName: senderName ?? "",
      recipient,
      recipientEmail: recipientEmail ?? "",
      purpose,
      tone,
      subject: result.subject,
      body: result.body,
      sent: false,
    });

    res.json({
  success: true,
  email: {
    subject: result.subject,
    body: result.body,
  },

  audience: result.audience,
  emailType: result.emailType,

  agentSteps: result.agentSteps,

  emailId: saved._id,
});

  } catch (error: any) {
    console.error("[generateEmail Agent]", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/academic-email/suggest ────────────────────────────────────────

export const suggestContent = async (req: Request, res: Response) => {
  try {
    const { purpose, recipient, tone } = req.body;
    const suggestions = await generateEmailSuggestions({ purpose, recipient, tone });
    res.json({ success: true, suggestions });
  } catch (error: any) {
    console.error("[suggestContent]", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/academic-email/send ───────────────────────────────────────────

export const sendGeneratedEmail = async (req: Request, res: Response) => {
  try {
    const { recipientEmail, subject, body, senderName, emailId } = req.body;

    if (!recipientEmail || !subject || !body) {
      return res.status(400).json({ message: "recipientEmail, subject, and body are required." });
    }

    const result = await sendEmail({ to: recipientEmail, subject, body, fromName: senderName });

    if (emailId) {
      await AcademicEmail.findByIdAndUpdate(emailId, { sent: true });
    }

    res.json({ success: true, messageId: result.messageId, accepted: result.accepted });

  } catch (error: any) {
    console.error("[sendGeneratedEmail]", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/academic-email/history ─────────────────────────────────────────

export const getEmailHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;

    if (!userId) {
      return res.status(401).json({ message: "Not logged in." });
    }

    const emails = await AcademicEmail.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, emails });

  } catch (error: any) {
    console.error("[getEmailHistory]", error);
    res.status(500).json({ message: error.message });
  }
};