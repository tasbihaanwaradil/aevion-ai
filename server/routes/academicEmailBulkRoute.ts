// routes/academicEmail.ts  (Express router — add alongside existing generate/suggest/send routes)
// Handles: POST /api/academic-email/send-bulk
// Supports broadcast (single BCC email) and personalized (per-recipient) delivery.
// Designed for 60–500+ recipients with no manual-approval gate.

import { Router, Request, Response } from "express";
import nodemailer from "nodemailer";

const router = Router();

// ─────────────────────────────────────────────────────────────
// Shared SMTP transporter (reuse your existing config)
// ─────────────────────────────────────────────────────────────

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST ?? "smtp.gmail.com",
port: Number(process.env.EMAIL_PORT ?? 587),
secure: false,
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
},
    // Pool connections for bulk sends — critical for throughput
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,   // ms between bursts
    rateLimit: 10,     // max messages per rateDelta window
  });

// ─────────────────────────────────────────────────────────────
// Types mirroring the agent output
// ─────────────────────────────────────────────────────────────

interface PersonalizedEmail {
  email: string;
  subject: string;
  body: string;
}

interface BroadcastPayload {
  deliveryMode: "broadcast";
  subject: string;
  body: string;
  bccList: string[];
  senderName?: string;
  emailId?: string;
}

interface PersonalizedPayload {
  deliveryMode: "personalized";
  personalizedEmails: PersonalizedEmail[];
  senderName?: string;
  emailId?: string;
}

type BulkSendPayload = BroadcastPayload | PersonalizedPayload;

// ─────────────────────────────────────────────────────────────
// Helper — chunk an array into batches
// ─────────────────────────────────────────────────────────────

const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// ─────────────────────────────────────────────────────────────
// Helper — send one email via nodemailer with retry
// ─────────────────────────────────────────────────────────────

const sendOne = async (
  transporter: nodemailer.Transporter,
  options: nodemailer.SendMailOptions,
  retries = 2
): Promise<void> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await transporter.sendMail(options);
      return;
    } catch (err: any) {
      if (attempt === retries) throw err;
      // Exponential back-off: 500ms, 1000ms
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/academic-email/send-bulk
// ─────────────────────────────────────────────────────────────

router.post("/send-bulk", async (req: Request, res: Response) => {
  const payload = req.body as BulkSendPayload;

  if (!payload.deliveryMode) {
    return res.status(400).json({ success: false, message: "deliveryMode is required." });
  }

  const fromAddress = process.env.EMAIL_USER ?? "";
  const senderDisplay = payload.senderName
    ? `"${payload.senderName}" <${fromAddress}>`
    : fromAddress;

  const transporter = createTransporter();
  const startTime = Date.now();

  try {
    // ── BROADCAST MODE ────────────────────────────────────────────────────────
    // One email, all recipients in BCC — no one sees others' addresses.
    if (payload.deliveryMode === "broadcast") {
      const { subject, body, bccList } = payload as BroadcastPayload;

      if (!subject || !body || !Array.isArray(bccList) || bccList.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Broadcast mode requires subject, body, and a non-empty bccList.",
        });
      }

      // For very large BCC lists, chunk into batches of 100
      // (many SMTP servers cap recipients per message)
      const BCC_BATCH_SIZE = 100;
      const batches = chunk(bccList, BCC_BATCH_SIZE);
      const batchResults: Array<{ batch: number; count: number; ok: boolean; error?: string }> = [];

      for (let i = 0; i < batches.length; i++) {
        const bcc = batches[i];
        try {
          await sendOne(transporter, {
            from: senderDisplay,
            // Use a no-reply or institutional address as visible "To"
            to: fromAddress,
            bcc: bcc.join(", "),
            subject,
            text: body,
            html: body.replace(/\n/g, "<br/>"),
          });
          batchResults.push({ batch: i + 1, count: bcc.length, ok: true });
        } catch (err: any) {
          batchResults.push({ batch: i + 1, count: bcc.length, ok: false, error: err.message });
        }
      }

      const failed = batchResults.filter((r) => !r.ok);
      const succeeded = batchResults.filter((r) => r.ok);
      const totalSent = succeeded.reduce((sum, r) => sum + r.count, 0);
      const totalFailed = failed.reduce((sum, r) => sum + r.count, 0);
      const elapsed = Date.now() - startTime;

      return res.json({
        success: failed.length === 0,
        message:
          failed.length === 0
            ? `Broadcast sent to ${totalSent} recipients in ${batches.length} batch(es).`
            : `Partial send: ${totalSent} succeeded, ${totalFailed} failed.`,
        deliveryMode: "broadcast",
        recipientCount: bccList.length,
        sentCount: totalSent,
        failedCount: totalFailed,
        batchResults,
        elapsedMs: elapsed,
      });
    }

    // ── PERSONALIZED MODE ─────────────────────────────────────────────────────
    // One email per recipient with resolved placeholders.
    // Auto-processes any count without manual approval.
    if (payload.deliveryMode === "personalized") {
      const { personalizedEmails } = payload as PersonalizedPayload;

      if (!Array.isArray(personalizedEmails) || personalizedEmails.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Personalized mode requires a non-empty personalizedEmails array.",
        });
      }

      // Process in parallel batches of 10 to avoid overwhelming SMTP
      const PARALLEL_BATCH = 10;
      const batches = chunk(personalizedEmails, PARALLEL_BATCH);
      const results: Array<{ email: string; ok: boolean; error?: string }> = [];

      for (const batch of batches) {
        const settled = await Promise.allSettled(
          batch.map(async ({ email, subject, body }) => {
            await sendOne(transporter, {
              from: senderDisplay,
              to: email,
              subject,
              text: body,
              html: body.replace(/\n/g, "<br/>"),
            });
            return email;
          })
        );

        settled.forEach((result, idx) => {
          const email = batch[idx].email;
          if (result.status === "fulfilled") {
            results.push({ email, ok: true });
          } else {
            results.push({ email, ok: false, error: (result.reason as Error).message });
          }
        });

        // Small delay between parallel batches to respect rate limits
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      const succeeded = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);
      const elapsed = Date.now() - startTime;

      return res.json({
        success: failed.length === 0,
        message:
          failed.length === 0
            ? `Personalized emails sent to ${succeeded.length} recipients.`
            : `Partial send: ${succeeded.length} succeeded, ${failed.length} failed.`,
        deliveryMode: "personalized",
        recipientCount: personalizedEmails.length,
        sentCount: succeeded.length,
        failedCount: failed.length,
        // Include failed list so caller can retry
        failedRecipients: failed.map((r) => ({ email: r.email, error: r.error })),
        elapsedMs: elapsed,
      });
    }

    return res.status(400).json({ success: false, message: `Unknown deliveryMode: ${(payload as any).deliveryMode}` });

  } catch (err: any) {
    console.error("[send-bulk] Unexpected error:", err);
    return res.status(500).json({
      success: false,
      message: `Bulk send failed: ${err.message ?? "Unknown error"}`,
    });
  } finally {
    transporter.close?.();
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/academic-email/generate  (enhanced — wire bulk meta through)
// Drop this into your existing generate handler:
//
//   const result = await runAcademicEmailAgent({
//     purpose, recipient, tone, senderName,
//     recipients: body.recipients,        // ← NEW
//     deliveryMode: body.deliveryMode,    // ← NEW
//   });
//
//   return res.json({
//     success: true,
//     email: { subject: result.subject, body: result.body },
//     emailId: savedId,
//     agentSteps: result.agentSteps,
//     bulk: result.bulk ?? null,          // ← NEW: forward bulk meta to frontend
//   });
// ─────────────────────────────────────────────────────────────

export default router;