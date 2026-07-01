import { Router } from "express";
import { createEmailScheduler } from "../utils/EmailScheduler.js";
import { sendEmail } from "../utils/EmailSender.js";

const router = Router();

const scheduler = createEmailScheduler({
  sendSingle: async ({
    recipientEmail,
    subject,
    body,
    senderName,
  }) => {
    await sendEmail({
      to: recipientEmail,
      subject,
      body,
      fromName: senderName,
    });
  },

  sendBroadcast: async ({
    bccList,
    subject,
    body,
    senderName,
  }) => {
    // Send the same email to each recipient
    for (const email of bccList) {
      await sendEmail({
        to: email,
        subject,
        body,
        fromName: senderName,
      });
    }
  },
});

// POST /api/academic-email/schedule
router.post("/schedule", async (req, res) => {
  try {
    const {
      deliveryMode,
      subject,
      body,
      senderName,
      scheduledFor,
      recipientEmail,
      bccList,
      emailId,
    } = req.body;

    if (deliveryMode === "broadcast") {
      const entry = scheduler.scheduleBroadcast({
        bccList,
        subject,
        body,
        senderName,
        scheduledFor,
        emailId,
      });

      return res.json({
        success: true,
        scheduled: entry,
      });
    }

    const entry = scheduler.scheduleSingle({
      recipientEmail,
      subject,
      body,
      senderName,
      scheduledFor,
      emailId,
    });

    return res.json({
      success: true,
      scheduled: entry,
    });
  } catch (err: any) {
    console.error(err);

    return res.status(400).json({
      success: false,
      message: err.message ?? "Failed to schedule email.",
    });
  }
});

// GET scheduled emails
router.get("/schedule", (req, res) => {
  const status = req.query.status as any;

  const list = scheduler.list(
    status ? { status } : undefined
  );

  res.json({
    success: true,
    scheduled: list,
  });
});

// DELETE schedule
router.delete("/schedule/:id", (req, res) => {
  const ok = scheduler.cancel(req.params.id);

  if (!ok) {
    return res.status(404).json({
      success: false,
      message: "Schedule not found.",
    });
  }

  res.json({
    success: true,
  });
});

// PATCH schedule
router.patch("/schedule/:id", (req, res) => {
  try {
    const updated = scheduler.reschedule(
      req.params.id,
      req.body.scheduledFor
    );

    res.json({
      success: true,
      scheduled: updated,
    });
  } catch (err: any) {
    console.error(err);

    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;