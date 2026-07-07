// routes/reminder.routes.ts
// Mount at: /api/reminder

import { Router } from "express";
import {
  runReminderAgent,
  quickAnalyzeTask,
  buildIntervalReminders,
  getUpcomingClassReminders,
  checkAttendance,
  checkBreakReminder,
  checkEmailFollowUps,
  checkOverdueTasks,
  rankTaskPriorities,
  generateDailySummary,
  generateWeeklySummary,
  pushToGoogleCalendar,
  updateGoogleCalendarTask,
  removeGoogleCalendarTask,
  type ClassScheduleEntry,
  type AttendanceRecord,
  type EmailFollowUpRecord,
  type StoredTaskLike,
} from "../services/ReminderAgent.js";

// ─────────────────────────────────────────────────────────────
// In-memory stores (swap for your real DB later).
//
// FIX: every record now carries a `userId` field, and every route filters
// by the logged-in user's id before reading or writing. Previously these
// were flat, unscoped stores — ANY logged-in user's /list, /classes,
// /attendance, etc. calls returned EVERY user's data, because nothing
// filtered by who was asking. Signing in with a different Google account
// showed the previous account's tasks because the data was never
// partitioned per user in the first place.
// ─────────────────────────────────────────────────────────────

interface StoredRecord {
  userId: string;
  [key: string]: any;
}

const taskStore: Map<string, StoredRecord> = new Map();
const classStore: Map<string, StoredRecord & ClassScheduleEntry> = new Map();
// attendance is keyed by `${userId}:${courseName}` so two users can each
// track a course with the same name without colliding.
const attendanceStore: Map<string, StoredRecord & AttendanceRecord> = new Map();
const emailFollowUpStore: Map<string, StoredRecord & EmailFollowUpRecord> = new Map();
// study session start time, per user
const studySessionStore: Map<string, string> = new Map();

let idCounter = 1;
let classIdCounter = 1;
let followUpIdCounter = 1;

const router = Router();

// Swap for your real session/auth lookup (reuse whatever identifies the
// user for Gmail/OAuth2 elsewhere in the app). Throws instead of silently
// falling back to a placeholder — a placeholder ID isn't a valid Mongo
// ObjectId, so Calendar sync would fail deep inside googleCalendarService
// with a confusing CastError instead of a clear "not logged in" message.
const getUserId = (req: any): string => {
  const userId = req.session?.userId ?? req.user?._id ?? req.user?.id;
  if (!userId) {
    throw new Error("Not logged in — no session.userId found. Log in (ideally via Google) before this request.");
  }
  return String(userId);
};

// ═════════════════════════════════════════════════════════════
// TASKS
// ═════════════════════════════════════════════════════════════

router.post("/add", async (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  try {
    const { input, title, description, dueDate, priority, userContext } = req.body;

    if (!input?.trim() && !title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Provide either 'input' (a one-line description) or a 'title'.",
      });
    }
    if (title && !dueDate) {
      return res.status(400).json({
        success: false,
        message: "When using structured fields, 'dueDate' is required. Use 'input' instead if you don't have one yet.",
      });
    }

    const result = await runReminderAgent({
      rawText: input,
      title,
      description,
      dueDate,
      priority,
      userContext,
    });

    // ── Sync to Google Calendar (best-effort — never blocks task creation) ──
    let googleEventId: string | undefined;
    let calendarWarning: string | undefined;
    try {
      const calendarSync = await pushToGoogleCalendar(userId, result.calendarEvent, result.notifications);
      googleEventId = calendarSync.eventId;
      calendarWarning = calendarSync.error;
    } catch (syncErr: any) {
      calendarWarning = syncErr?.message ?? "Could not sync to Google Calendar.";
    }
    if (calendarWarning) {
      console.error(`[reminder/add] Calendar sync failed:`, calendarWarning);
    }

    const id = String(idCounter++);
    const record: StoredRecord = {
      id,
      userId,
      ...result.task,
      schedule: result.schedule,
      notifications: result.notifications,
      calendarEvent: result.calendarEvent,
      routing: result.routing,
      milestones: result.milestones,
      status: "pending",
      googleEventId,
      createdAt: new Date().toISOString(),
    };

    // await db.tasks.insertOne(record); // ← plug in your DB here
    taskStore.set(id, record);

    return res.json({
      success: true,
      id,
      result: { ...result, googleEventId, googleCalendarWarning: calendarWarning },
    });
  } catch (err: any) {
    console.error("[reminder/add]", err);
    return res.status(500).json({ success: false, message: err?.message ?? "Agent failed." });
  }
});

router.get("/list", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const tasks = Array.from(taskStore.values())
    .filter(t => t.userId === userId && t.status !== "deleted")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  res.json({ success: true, tasks });
});

router.patch("/:id/status", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const task = taskStore.get(req.params.id);
  if (!task || task.userId !== userId) {
    return res.status(404).json({ success: false, message: "Task not found." });
  }
  task.status = req.body.status ?? task.status;
  taskStore.set(req.params.id, task);
  res.json({ success: true, task });
});

router.patch("/:id", async (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const task = taskStore.get(req.params.id);
  if (!task || task.userId !== userId) {
    return res.status(404).json({ success: false, message: "Task not found." });
  }
  const { dueDate, title, description, priority } = req.body;

  if (dueDate) {
    task.dueDate = dueDate;
    task.dueDateAssumed = false;
    task.assumptionNote = undefined;
    if (task.notifications?.isIntervalBased) {
      task.notifications = buildIntervalReminders(dueDate, task.title, task.priority);
    }
    task.calendarEvent = { ...task.calendarEvent, startDate: dueDate, endDate: dueDate };
  }
  if (title) {
    task.title = title;
    task.calendarEvent = { ...task.calendarEvent, title: `📌 ${title}` };
  }
  if (description !== undefined) task.description = description;
  if (priority) task.priority = priority;

  let calendarWarning: string | undefined;
  if (task.googleEventId) {
    try {
      const sync = await updateGoogleCalendarTask(userId, task.googleEventId, task.calendarEvent, task.notifications);
      calendarWarning = sync.error;
    } catch (syncErr: any) {
      calendarWarning = syncErr?.message ?? "Could not sync to Google Calendar.";
    }
    if (calendarWarning) console.error("[reminder/:id PATCH] Calendar sync failed:", calendarWarning);
  }

  taskStore.set(req.params.id, task);
  res.json({ success: true, task, googleCalendarWarning: calendarWarning });
});

// Soft-delete by default (keeps history + a Deleted status).
// Pass ?permanent=true to hard-delete instead.
router.delete("/:id", async (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const task = taskStore.get(req.params.id);
  if (!task || task.userId !== userId) {
    return res.status(404).json({ success: false, message: "Task not found." });
  }

  if (task.googleEventId) {
    try {
      await removeGoogleCalendarTask(userId, task.googleEventId);
    } catch (err: any) {
      console.error("[reminder/:id DELETE] Calendar sync failed:", err?.message ?? err);
    }
  }

  if (req.query.permanent === "true") {
    taskStore.delete(req.params.id);
  } else {
    task.status = "deleted";
    task.deletedAt = new Date().toISOString();
    taskStore.set(req.params.id, task);
  }

  res.json({ success: true });
});

router.post("/quick-analyze", async (req, res) => {
  const { input } = req.body;
  try {
    const result = await quickAnalyzeTask(input);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message });
  }
});

// ═════════════════════════════════════════════════════════════
// HISTORY — completed / deleted / upcoming views
// ═════════════════════════════════════════════════════════════

router.get("/history", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const mine = Array.from(taskStore.values()).filter(t => t.userId === userId);
  res.json({
    success: true,
    completed: mine.filter(t => t.status === "done"),
    deleted: mine.filter(t => t.status === "deleted"),
    upcoming: mine
      .filter(t => t.status === "pending" || t.status === "in_progress")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
  });
});

// ═════════════════════════════════════════════════════════════
// OVERDUE DETECTION
// ═════════════════════════════════════════════════════════════

router.get("/overdue", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const tasks: StoredTaskLike[] = Array.from(taskStore.values())
    .filter(t => t.userId === userId && t.status !== "deleted")
    .map(t => ({
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      dueDate: t.dueDate,
      estimatedMinutes: t.estimatedMinutes,
      status: t.status,
    }));
  res.json({ success: true, overdue: checkOverdueTasks(tasks) });
});

// ═════════════════════════════════════════════════════════════
// SMART PRIORITY RANKING + DAILY / WEEKLY SUMMARIES
// ═════════════════════════════════════════════════════════════

router.get("/priorities", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const tasks: StoredTaskLike[] = Array.from(taskStore.values())
    .filter(t => t.userId === userId && t.status !== "deleted")
    .map(t => ({
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      dueDate: t.dueDate,
      suggestedStartDate: t.suggestedStartDate,
      estimatedMinutes: t.estimatedMinutes,
      status: t.status,
    }));
  res.json({ success: true, ranked: rankTaskPriorities(tasks) });
});

router.get("/summary/daily", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const userName = (req.query.name as string) || "there";
  const tasks: StoredTaskLike[] = Array.from(taskStore.values())
    .filter(t => t.userId === userId && t.status !== "deleted")
    .map(t => ({
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      dueDate: t.dueDate,
      estimatedMinutes: t.estimatedMinutes,
      status: t.status,
    }));
  const classes = Array.from(classStore.values()).filter(c => c.userId === userId);
  res.json({ success: true, summary: generateDailySummary(tasks, classes, userName) });
});

router.get("/summary/weekly", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const tasks: StoredTaskLike[] = Array.from(taskStore.values())
    .filter(t => t.userId === userId && t.status !== "deleted")
    .map(t => ({
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      dueDate: t.dueDate,
      suggestedStartDate: t.suggestedStartDate,
      estimatedMinutes: t.estimatedMinutes,
      status: t.status,
    }));
  res.json({ success: true, summary: generateWeeklySummary(tasks) });
});

// ═════════════════════════════════════════════════════════════
// CLASS SCHEDULE + ATTENDANCE
// ═════════════════════════════════════════════════════════════

router.post("/classes", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const { courseName, dayOfWeek, startTime, endTime, location } = req.body;
  if (!courseName || dayOfWeek === undefined || !startTime || !endTime) {
    return res.status(400).json({ success: false, message: "courseName, dayOfWeek, startTime, endTime are required." });
  }
  const id = String(classIdCounter++);
  const entry = { id, userId, courseName, dayOfWeek, startTime, endTime, location } as StoredRecord & ClassScheduleEntry;
  classStore.set(id, entry);
  res.json({ success: true, class: entry });
});

router.get("/classes", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  res.json({ success: true, classes: Array.from(classStore.values()).filter(c => c.userId === userId) });
});

router.delete("/classes/:id", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const entry = classStore.get(req.params.id);
  if (!entry || entry.userId !== userId) {
    return res.status(404).json({ success: false, message: "Class not found." });
  }
  classStore.delete(req.params.id);
  res.json({ success: true });
});

router.get("/classes/reminders", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const mine = Array.from(classStore.values()).filter(c => c.userId === userId);
  res.json({ success: true, reminders: getUpcomingClassReminders(mine) });
});

router.post("/attendance", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const { courseName, attended, total, requiredPercent } = req.body;
  if (!courseName || attended === undefined || total === undefined) {
    return res.status(400).json({ success: false, message: "courseName, attended, total are required." });
  }
  const key = `${userId}:${courseName}`;
  const record = { userId, courseName, attended, total, requiredPercent } as StoredRecord & AttendanceRecord;
  attendanceStore.set(key, record);
  res.json({ success: true, record });
});

router.get("/attendance", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  res.json({ success: true, records: Array.from(attendanceStore.values()).filter(r => r.userId === userId) });
});

router.get("/attendance/warnings", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const mine = Array.from(attendanceStore.values()).filter(r => r.userId === userId);
  res.json({ success: true, warnings: checkAttendance(mine) });
});

// ═════════════════════════════════════════════════════════════
// STUDY BREAK REMINDERS
// ═════════════════════════════════════════════════════════════

router.post("/study-session/start", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const startedAt = new Date().toISOString();
  studySessionStore.set(userId, startedAt);
  res.json({ success: true, startedAt });
});

router.post("/study-session/stop", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  studySessionStore.delete(userId);
  res.json({ success: true });
});

router.get("/study-session/break-check", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const startedAt = studySessionStore.get(userId);
  if (!startedAt) {
    return res.json({ success: true, active: false, breakReminder: null });
  }
  res.json({ success: true, active: true, breakReminder: checkBreakReminder(startedAt) });
});

// ═════════════════════════════════════════════════════════════
// EMAIL FOLLOW-UP REMINDERS
// (Call POST /email-followups after your Email Agent sends a message.)
// ═════════════════════════════════════════════════════════════

router.post("/email-followups", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const { recipient, subject, sentAt, followUpAfterDays } = req.body;
  if (!recipient || !subject) {
    return res.status(400).json({ success: false, message: "recipient and subject are required." });
  }
  const id = String(followUpIdCounter++);
  const record = {
    id,
    userId,
    recipient,
    subject,
    sentAt: sentAt || new Date().toISOString(),
    followUpAfterDays,
    followedUp: false,
  } as StoredRecord & EmailFollowUpRecord;
  emailFollowUpStore.set(id, record);
  res.json({ success: true, record });
});

router.patch("/email-followups/:id/resolve", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const record = emailFollowUpStore.get(req.params.id);
  if (!record || record.userId !== userId) {
    return res.status(404).json({ success: false, message: "Follow-up not found." });
  }
  record.followedUp = true;
  emailFollowUpStore.set(req.params.id, record);
  res.json({ success: true, record });
});

router.get("/email-followups/due", (req, res) => {
  let userId: string;
  try {
    userId = getUserId(req);
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }

  const mine = Array.from(emailFollowUpStore.values()).filter(r => r.userId === userId);
  res.json({ success: true, due: checkEmailFollowUps(mine) });
});

export default router;