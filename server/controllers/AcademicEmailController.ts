// controllers/AcademicEmailController.ts

import { Request, Response } from "express";
import { runAcademicEmailAgent, generateEmailSuggestions } from "../services/AcademicEmailAgent.js";
import { sendEmail } from "../utils/EmailSender.js";
import AcademicEmail from "../models/AcademicEmail.js";

// ─── POST /api/academic-email/generate ───────────────────────────────────────

export const generateEmail = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.session as any;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to generate an email.",
      });
    }

    const { purpose, recipient, recipientEmail, tone, senderName } = req.body;

    if (!purpose || !purpose.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please describe the purpose of the email before generating.",
      });
    }

    if (!recipient || !recipient.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a recipient name before generating.",
      });
    }

    if (!tone || !tone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please select a tone before generating.",
      });
    }

    // 🤖 Run the real agent (plan → tools → reflect → output)
    const result = await runAcademicEmailAgent({ purpose, recipient, tone, senderName });

    // Save to DB
    const saved = await AcademicEmail.create({
      teacherId,
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
    res.status(500).json({
      success: false,
      message: "Something went wrong while generating the email. Please try again.",
    });
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
    // Suggestions are a non-critical enhancement — fail quietly with an empty list
    // rather than surfacing a scary error for something the user didn't explicitly request.
    res.json({ success: true, suggestions: [] });
  }
};

// ─── POST /api/academic-email/send ───────────────────────────────────────────

export const sendGeneratedEmail = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.session as any;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to send an email.",
      });
    }

    const { recipientEmail, subject, body, senderName, emailId } = req.body;

    if (!recipientEmail || !recipientEmail.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a recipient email address before sending.",
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: "This email needs a subject line before it can be sent.",
      });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({
        success: false,
        message: "This email needs a body before it can be sent.",
      });
    }

    const result = await sendEmail({ to: recipientEmail, subject, body, fromName: senderName });

    if (emailId) {
      // Scope by teacherId so one teacher can't mark another's email as sent.
      await AcademicEmail.findOneAndUpdate({ _id: emailId, teacherId }, { sent: true });
    }

    res.json({ success: true, messageId: result.messageId, accepted: result.accepted });

  } catch (error: any) {
    console.error("[sendGeneratedEmail]", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while sending the email. Please check your connection and try again.",
    });
  }
};

// ─── GET /api/academic-email/history ─────────────────────────────────────────

export const getEmailHistory = async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.session as any;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view your email history.",
      });
    }

    const emails = await AcademicEmail.find({ teacherId }).sort({ createdAt: -1 });
    res.json({ success: true, emails });

  } catch (error: any) {
    console.error("[getEmailHistory]", error);
    res.status(500).json({
      success: false,
      message: "Couldn't load your email history. Please try again.",
    });
  }
};