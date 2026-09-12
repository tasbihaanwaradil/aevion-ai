import { Router, Request, Response } from "express";
import { ReminderAgent } from "../services/prompts/Reminderagent.js";
import { Reminder, type ReminderPriority } from "../models/Reminder.model.js";
import { calculatePriority } from "../utils/Priority.util.js";

const router = Router();

const reminderAgent = new ReminderAgent();

interface AuthedRequest extends Request {
  user?: {
    id: string;
    timezone?: string;
  };
}

function serialize(r: any) {
  return {
    id: r._id.toString(),
    task: r.task,
    date: r.date,
    time: r.time,
    priority: r.priority,
    status: r.status,
    category: r.category,
    notes: r.notes ?? null,
    attendees: (r.attendees ?? []).map((a: any) => ({
      name: a.name,
      email: a.email,
    })),
    notificationSent: r.notificationSent,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/**
 * Keep pending/overdue statuses accurate before reading, same logic used
 * by the agent tools (Reminder.tools.ts) before every read.
 */
async function refreshOverdueStatuses(userId: string, tz: string) {
  const active = await Reminder.find({
    userId,
    status: { $in: ["pending", "overdue"] },
  });

  for (const r of active) {
    const { priority, isOverdue } = calculatePriority({
      date: r.date,
      time: r.time,
      timezone: tz,
    });

    const nextStatus = isOverdue ? "overdue" : "pending";

    if (r.status !== nextStatus || r.priority !== priority) {
      r.status = nextStatus;
      r.priority = priority;
      await r.save();
    }
  }
}

/* ============================================================
   POST /api/agents/reminder — existing chat agent route
   ============================================================ */

router.post(
  "/api/agents/reminder",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthedRequest;

      if (!authReq.user?.id) {
        res.status(401).json({
          success: false,
          error: "unauthorized",
        });
        return;
      }

      const { message, chatHistory } = req.body as {
        message?: string;
        chatHistory?: Array<{
          role: "user" | "assistant";
          content: string;
        }>;
      };

      if (!message || typeof message !== "string" || !message.trim()) {
        res.status(400).json({
          success: false,
          error: "message is required",
        });
        return;
      }

      const result = await reminderAgent.handleMessage({
        userId: authReq.user.id,
        message: message.trim(),
        timezone: authReq.user.timezone ?? "Asia/Karachi",
        chatHistory,
      });

      res.status(200).json({
        success: true,
        reply: result.reply,
        toolCalls: result.toolCalls,
      });
    } catch (err) {
      console.error("Reminder Agent error:", err);

      res.status(500).json({
        success: false,
        error:
          "I couldn't process that reminder request right now. Please try again.",
      });
    }
  }
);

/* ============================================================
   GET /api/reminders — structured list for the sidebar/UI
   ============================================================

   Reads the database directly instead of going through the LLM agent,
   since the agent only returns free-text `reply`, not structured JSON.
   Mirrors the `getUpcomingReminders` tool: excludes completed/cancelled,
   sorted by priority then earliest deadline.
   ============================================================ */

router.get(
  "/api/reminders",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthedRequest;

      if (!authReq.user?.id) {
        res.status(401).json({
          success: false,
          error: "unauthorized",
        });
        return;
      }

      const userId = authReq.user.id;
      const tz = authReq.user.timezone ?? "Asia/Karachi";

      await refreshOverdueStatuses(userId, tz);

      // Optional ?status= filter (pending | overdue | completed | cancelled | all)
      const statusParam =
        typeof req.query.status === "string"
          ? req.query.status
          : "active";

      const filter: Record<string, unknown> = { userId };

      if (statusParam === "active") {
        filter.status = { $in: ["pending", "overdue"] };
      } else if (statusParam !== "all") {
        filter.status = statusParam;
      }

      const reminders = await Reminder.find(filter);

      const order: Record<ReminderPriority, number> = {
        HIGH: 0,
        MEDIUM: 1,
        LOW: 2,
      };

      reminders.sort((a: any, b: any) => {
        if (order[a.priority as ReminderPriority] !== order[b.priority as ReminderPriority]) {
          return (
            order[a.priority as ReminderPriority] -
            order[b.priority as ReminderPriority]
          );
        }
        return `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
      });

      res.status(200).json({
        success: true,
        reminders: reminders.map(serialize),
      });
    } catch (err) {
      console.error("Get reminders error:", err);

      res.status(500).json({
        success: false,
        error: "Couldn't load reminders right now. Please try again.",
      });
    }
  }
);

router.get("/api/agents/reminder-test", (req, res) => {
  console.log("🔥 REMINDER TEST ROUTE HIT");

  res.json({
    success: true,
    message: "ReminderRoutes is registered correctly",
  });
});

console.log(
  "Reminder routes:",
  router.stack.map((layer: any) => ({
    path: layer.route?.path,
    methods: layer.route?.methods,
  }))
);

export default router;