// services/ReminderAgent.ts
//
// Architecture:
//
//   Per-task pipeline (unchanged core, 2 LLM calls):
//     RAW TEXT ──▶ [Call 1] Understand & Analyze ──▶ [Call 2] Plan ──▶ Calendar
//     + [Call 3, conditional] Milestones (only when category === "project")
//
//   Deterministic deadline reminders (no LLM):
//     For assignment/exam/quiz/project categories, the 7d/3d/1d/due-date/
//     2h/30min interval reminders from the spec REPLACE the LLM-guessed
//     reminder list, since fixed intervals are more reliable than an LLM
//     inventing reminder timing. Other categories (email/meeting/study/
//     general) keep the LLM's context-aware reminder plan.
//
//   Cross-task functions (operate over the whole task list, not a single
//   task — these are plain exported functions, not part of the per-task
//   agent run):
//     - rankTaskPriorities()      smart priority tiers across all tasks
//     - generateDailySummary()    "Good morning" digest
//     - generateWeeklySummary()   Sunday planning digest (now with completed/overdue counts)
//     - checkOverdueTasks()       flags tasks past due, with a suggestion
//
//   Standalone subsystems (deterministic, small data models):
//     - Class schedule reminders   (getUpcomingClassReminders)
//     - Attendance reminders       (checkAttendance)
//     - Study break reminders      (checkBreakReminder)
//     - Email follow-up reminders  (checkEmailFollowUps)
//
//   Google Calendar sync (NEW):
//     - pushToGoogleCalendar()      create event, returns googleEventId
//     - updateGoogleCalendarTask()  patch an existing event
//     - removeGoogleCalendarTask()  delete an existing event
//     All three are fire-and-forget / try-caught — a Calendar hiccup never
//     blocks task creation, editing, or deletion.

import { ChatGroq } from "@langchain/groq";
import { tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "./Googlecalenderservice.js";

if (!process.env.GROQ_API_KEY) {
  throw new Error("[ReminderAgent] GROQ_API_KEY is not set.");
}

// ─────────────────────────────────────────────────────────────
// LLM
// ─────────────────────────────────────────────────────────────

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0,
});

// ─────────────────────────────────────────────────────────────
// Core Types
// ─────────────────────────────────────────────────────────────

export type TaskCategory =
  | "email"
  | "presentation"
  | "quiz"
  | "assignment"
  | "meeting"
  | "study"
  | "exam"
  | "project"
  | "general";

export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "pending" | "in_progress" | "done" | "overdue" | "deleted";

export interface ReminderAgentInput {
  rawText?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  userContext?: string;
}

export interface ParsedTask {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  subject?: string; // NEW — course/subject e.g. "AI", "Database Systems", "FYP"
  dueDate: string;
  daysUntilDue: number;
  estimatedMinutes: number;
  suggestedStartDate: string;
  subTasks: string[];
  tags: string[];
  dueDateAssumed: boolean;
  assumptionNote?: string;
}

export interface ScheduleSlot {
  date: string;
  startTime: string;
  endTime: string;
  label: string;
}

export interface NotificationReminder {
  triggerAt: string;
  message: string;
  channel: "in_app" | "email";
}

export interface NotificationPlan {
  reminders: NotificationReminder[];
  urgencyLevel: "low" | "medium" | "high";
  escalationNote?: string;
  isIntervalBased?: boolean; // true when reminders came from the fixed interval rule, not the LLM
}

export interface CalendarEvent {
  title: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  description: string;
}

export interface AgentRouting {
  shouldTriggerEmailAgent: boolean;
  shouldTriggerPresentationAgent: boolean;
  shouldTriggerQuizAgent: boolean;
  shouldTriggerPlanner: boolean;
  emailAgentHint?: string;
  presentationAgentHint?: string;
  quizAgentHint?: string;
  plannerHint?: string;
}

export interface MilestoneItem {
  name: string;
  dueDate: string;
  status: "pending" | "done";
}

export interface MilestonePlan {
  milestones: MilestoneItem[];
}

export interface ReminderAgentOutput {
  task: ParsedTask;
  schedule: ScheduleSlot[];
  notifications: NotificationPlan;
  calendarEvent: CalendarEvent;
  routing: AgentRouting;
  milestones?: MilestonePlan;
  agentSteps: string[];
  savedId?: string;
}

// Minimal shape the cross-task functions need — matches SavedTask on the frontend.
export interface StoredTaskLike {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string;
  suggestedStartDate?: string;
  estimatedMinutes: number;
  status: TaskStatus;
}

// ─────────────────────────────────────────────────────────────
// Class schedule, attendance, email follow-up data models
// ─────────────────────────────────────────────────────────────

export interface ClassScheduleEntry {
  id: string;
  courseName: string;
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  startTime: string; // "HH:MM", 24h
  endTime: string;
  location?: string;
}

export interface AttendanceRecord {
  courseName: string;
  attended: number;
  total: number;
  requiredPercent?: number; // default 75
}

export interface EmailFollowUpRecord {
  id: string;
  recipient: string;
  subject: string;
  sentAt: string; // ISO
  followUpAfterDays?: number; // default 5
  followedUp: boolean;
}

export interface RankedTask {
  id: string;
  title: string;
  score: number;
  tier: "high" | "medium" | "low";
  reason: string;
}

export interface DailySummary {
  greeting: string;
  todayItems: { title: string; time?: string; category: TaskCategory | "class" }[];
  upcoming: { day: string; label: string; items: string[] }[];
}

export interface WeeklySummary {
  weekOf: string;
  counts: Record<string, number>;
  completed: number; // NEW
  overdue: number; // NEW
  suggestedPlan: { day: string; focus: string }[];
}

export interface OverdueTask {
  id: string;
  title: string;
  daysOverdue: number;
  suggestion: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ─────────────────────────────────────────────────────────────
// JSON extractor
// ─────────────────────────────────────────────────────────────

const extractJSON = <T>(text: string, fallback: T, label = "?"): T => {
  const fixCtrl = (raw: string) => {
    let r = "", inStr = false, esc = false;
    for (const ch of raw) {
      if (esc) { r += ch; esc = false; continue; }
      if (ch === "\\") { esc = true; r += ch; continue; }
      if (ch === '"') { inStr = !inStr; r += ch; continue; }
      if (inStr) {
        if (ch === "\n") { r += "\\n"; continue; }
        if (ch === "\r") { r += "\\r"; continue; }
        if (ch === "\t") { r += "\\t"; continue; }
      }
      r += ch;
    }
    return r;
  };

  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(fixCtrl(cleaned)); } catch {}

  for (const m of [cleaned.match(/(\{[\s\S]*\})/), cleaned.match(/(\[[\s\S]*\])/)]) {
    if (!m?.[1]) continue;
    try { return JSON.parse(fixCtrl(m[1])); } catch {}
    try {
      return JSON.parse(fixCtrl(m[1]).replace(/,\s*([}\]])/g, "$1").replace(/'/g, '"'));
    } catch {}
  }

  console.warn(`[extractJSON:${label}] failed`, text.slice(0, 200));
  return fallback;
};

// ─────────────────────────────────────────────────────────────
// LLM helper
// ─────────────────────────────────────────────────────────────

const SYSTEM_JSON =
  "You are a precise assistant. Respond ONLY with valid JSON. No prose, no markdown fences.";

const callLLM = async (prompt: string, label: string): Promise<string> => {
  console.log(`[ReminderAgent] LLM → ${label}`);
  const res = await llm.invoke([
    new SystemMessage(SYSTEM_JSON),
    new HumanMessage(prompt),
  ]);
  const text = res.content?.toString() ?? "";
  console.log(`[ReminderAgent:${label}]\n`, text.slice(0, 300));
  return text;
};

const daysBetween = (a: Date, b: Date) =>
  Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

const defaultDueDate = () => new Date(Date.now() + 3 * 86400000).toISOString();

// Categories the spec treats as "core deadline" items that get the fixed
// interval reminder cadence instead of an LLM-generated one.
const INTERVAL_REMINDER_CATEGORIES: TaskCategory[] = ["assignment", "exam", "quiz", "project"];

// ─────────────────────────────────────────────────────────────
// TOOL 1 — Understand & Analyze
// ─────────────────────────────────────────────────────────────

const understandTool = tool(
  async ({ rawText, title, description, dueDate, userPriority, now, dayOfWeek }) => {
    const hasStructuredDate = Boolean(dueDate);

    const prompt = `
Today is ${now} (${dayOfWeek}).

You are extracting a complete, actionable academic task from minimal input.

${rawText ? `RAW REQUEST: "${rawText}"` : `TITLE: "${title}"\nDESCRIPTION: "${description || "none"}"`}
${hasStructuredDate ? `EXPLICIT DUE DATE (already known, do not change): ${dueDate}` : "No explicit due date was given — you must infer one."}
USER-SET PRIORITY: ${userPriority || "not specified"}

Determine:
1. A short, clear title (if not already given).
2. A one-sentence description (if not already given).
3. Category: email|presentation|quiz|assignment|meeting|study|exam|project|general
4. Priority: low|medium|high|critical — override the user's priority if the request clearly implies otherwise (e.g. urgent language, exam, short deadline).
5. dueDate as a full ISO 8601 datetime.
   ${hasStructuredDate
     ? "- Use the EXPLICIT DUE DATE given above exactly. Set dueDateAssumed to false."
     : "- Resolve any relative date mentioned (e.g. 'tomorrow', 'Friday', 'next week', 'in 2 days') against today's date.\n   - If NO date or timeframe is mentioned at all, infer a sensible one based on urgency and task type (small tasks: 1-2 days out, bigger tasks: 3-5 days out), set dueDateAssumed to true, and write a one-line assumptionNote explaining the assumption in plain language."}
6. estimatedMinutes to complete the task.
7. suggestedStartDate (ISO, at least 1 day before dueDate, never in the past).
8. 3-5 short actionable subtasks.
9. 2-4 relevant lowercase tags.
10. subject: the course/subject this relates to if inferable (e.g. "AI", "Database Systems", "FYP"), else null.

Respond ONLY with this JSON:
{
  "title": "...",
  "description": "...",
  "category": "...",
  "priority": "...",
  "dueDate": "...",
  "estimatedMinutes": 60,
  "suggestedStartDate": "...",
  "subTasks": ["...", "..."],
  "tags": ["...", "..."],
  "subject": null,
  "dueDateAssumed": false,
  "assumptionNote": null
}
`.trim();

    return callLLM(prompt, "understand");
  },
  {
    name: "understand_and_analyze",
    description:
      "Extracts a complete task (title, description, category, priority, subject, resolved due date, estimate, subtasks, tags) from either freeform text or partial structured input, in one pass.",
    schema: z.object({
      rawText: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      userPriority: z.string().optional(),
      now: z.string(),
      dayOfWeek: z.string(),
    }),
  }
);

// ─────────────────────────────────────────────────────────────
// TOOL 2 — Plan (schedule + notifications + routing) — its reminders
// may be overridden downstream for interval categories.
// ─────────────────────────────────────────────────────────────

const planTool = tool(
  async ({ title, description, dueDate, category, priority, estimatedMinutes, suggestedStartDate, daysUntilDue }) => {
    const prompt = `
Given this analyzed task, produce a work schedule, a notification plan, and an agent-routing decision — all at once.

TASK: "${title}"
DESCRIPTION: "${description || "none"}"
CATEGORY: ${category}
PRIORITY: ${priority}
DUE: ${dueDate}
DAYS UNTIL DUE: ${daysUntilDue}
ESTIMATED TIME: ${estimatedMinutes} minutes
SUGGESTED START: ${suggestedStartDate}

SCHEDULE rules:
- Split into 2-4 focused work sessions of 30-90 min each between suggestedStartDate and dueDate.
- Avoid weekends unless priority is critical.
- Sessions between 09:00 and 21:00. Last session must be before the due date.

NOTIFICATIONS rules:
- 2-4 reminders depending on priority and time left.
- channel is "in_app" or "email"; high/critical tasks get at least one email reminder.
- Last reminder should be 1-2 hours before due. All triggerAt values must be ISO timestamps before dueDate.

ROUTING rules:
- shouldTriggerEmailAgent: true if the task involves sending/drafting an email.
- shouldTriggerPresentationAgent: true if it involves creating slides/a presentation.
- shouldTriggerQuizAgent: true if it involves a quiz, test, or exam prep.
- shouldTriggerPlanner: true if the task is complex (project, multi-step assignment).
- Give a short hint for each triggered agent.

Respond ONLY with this JSON:
{
  "schedule": [
    {"date":"YYYY-MM-DD","startTime":"HH:MM","endTime":"HH:MM","label":"..."}
  ],
  "notifications": {
    "reminders": [{"triggerAt":"...","message":"...","channel":"in_app"}],
    "urgencyLevel": "low|medium|high",
    "escalationNote": null
  },
  "routing": {
    "shouldTriggerEmailAgent": false,
    "shouldTriggerPresentationAgent": false,
    "shouldTriggerQuizAgent": false,
    "shouldTriggerPlanner": false,
    "emailAgentHint": null,
    "presentationAgentHint": null,
    "quizAgentHint": null,
    "plannerHint": null
  }
}
`.trim();

    return callLLM(prompt, "plan");
  },
  {
    name: "plan",
    description: "Produces work schedule, notification plan, and agent routing in a single merged call.",
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      dueDate: z.string(),
      category: z.string(),
      priority: z.string(),
      estimatedMinutes: z.number(),
      suggestedStartDate: z.string(),
      daysUntilDue: z.number(),
    }),
  }
);

// ─────────────────────────────────────────────────────────────
// TOOL 3 — Milestones (conditional: only category === "project")
// ─────────────────────────────────────────────────────────────

const milestoneTool = tool(
  async ({ title, description, dueDate }) => {
    const prompt = `
This is a major/final-year project task: "${title}"
Description: ${description || "none"}
Final due date: ${dueDate}
Today: ${new Date().toISOString()}

Break it into the standard project milestones: Proposal, Literature Review, Development, Testing, Final Report, Presentation.
Distribute reasonable intermediate ISO due dates between today and the final due date, in order.
Skip a milestone only if it clearly doesn't apply.

Respond ONLY with this JSON:
{
  "milestones": [
    {"name": "Proposal", "dueDate": "...", "status": "pending"}
  ]
}
`.trim();
    return callLLM(prompt, "milestones");
  },
  {
    name: "plan_milestones",
    description: "Breaks a project task into milestone checkpoints with intermediate due dates.",
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      dueDate: z.string(),
    }),
  }
);

// ─────────────────────────────────────────────────────────────
// Calendar event builder (deterministic)
// ─────────────────────────────────────────────────────────────

const buildCalendarEvent = (
  title: string,
  description: string,
  dueDate: string,
  category: TaskCategory,
  priority: TaskPriority,
  estimatedMinutes: number = 30
): CalendarEvent => {
  const colorMap: Record<string, string> = {
    email: "#3B82F6",
    presentation: "#8B5CF6",
    quiz: "#F59E0B",
    exam: "#EF4444",
    assignment: "#10B981",
    meeting: "#6366F1",
    study: "#06B6D4",
    project: "#F97316",
    general: "#6B7280",
  };

  // IMPORTANT: this is a TIMED event, not an all-day event. dueDate carries
  // an exact time (e.g. "5:00 PM"), and Google Calendar can only count
  // reminders backward from a specific time — all-day events don't have one,
  // so hour/minute-level reminders (2h, 30min before) would silently never
  // fire on an all-day event. End time is padded by estimatedMinutes (min 15)
  // just so start < end; the reminder timing is what actually matters here.
  const start = new Date(dueDate);
  const durationMs = Math.max(estimatedMinutes, 15) * 60000;
  const end = new Date(start.getTime() + durationMs);

  return {
    title: `📌 ${title}`,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    allDay: false,
    color: colorMap[category] ?? "#6B7280",
    description: description || `${category} task — priority: ${priority}`,
  };
};

// ─────────────────────────────────────────────────────────────
// Convert our NotificationPlan into Google Calendar's reminder format.
//
// Google Calendar allows a MAX of 5 override reminders per event. Our
// interval plan can have up to 6 (7d/3d/1d/due-date/2h/30min), so if we're
// over the limit we drop the earliest (least urgent) one first — the
// reminders closest to the deadline matter most operationally.
// ─────────────────────────────────────────────────────────────

const GOOGLE_MAX_REMINDERS = 5;

const toGoogleReminderOverrides = (
  notifications: NotificationPlan,
  dueDate: string
): { minutesBefore: number; method: "email" | "popup" }[] => {
  const due = new Date(dueDate).getTime();

  const overrides = notifications.reminders
    .map(r => ({
      minutesBefore: Math.round((due - new Date(r.triggerAt).getTime()) / 60000),
      method: (r.channel === "email" ? "email" : "popup") as "email" | "popup",
    }))
    // Google requires 0 <= minutes <= 40320 (28 days); drop anything outside that.
    .filter(r => r.minutesBefore >= 0 && r.minutesBefore <= 40320)
    // Closest-to-due first, so if we have to truncate to 5 we keep the most urgent ones.
    .sort((a, b) => a.minutesBefore - b.minutesBefore);

  return overrides.slice(0, GOOGLE_MAX_REMINDERS);
};

// ─────────────────────────────────────────────────────────────
// Google Calendar sync wrappers
//
// These never THROW out of the request — a Calendar hiccup should never
// 500 the whole task-creation flow. But unlike before, they no longer
// swallow the error silently either: they return the real error message
// alongside a null eventId, so the route (and ultimately the UI) can tell
// the user *why* sync failed — "no refresh token", "invalid_grant", missing
// scope, etc. — instead of the task just quietly not appearing on Calendar
// with no explanation.
// ─────────────────────────────────────────────────────────────

export interface GoogleCalendarSyncResult {
  eventId?: string;
  error?: string;
}

export const pushToGoogleCalendar = async (
  userId: string,
  event: CalendarEvent,
  notifications?: NotificationPlan
): Promise<GoogleCalendarSyncResult> => {
  try {
    const eventId = await createCalendarEvent(userId, {
      summary: event.title,
      description: event.description,
      start: event.startDate,
      end: event.endDate,
      allDay: event.allDay,
      reminders: notifications ? toGoogleReminderOverrides(notifications, event.startDate) : [],
    });
    return { eventId };
  } catch (err: any) {
    const message = err?.message ?? String(err);
    console.error("[ReminderAgent] Google Calendar create failed — continuing without sync:", err);
    return { error: message };
  }
};

export const updateGoogleCalendarTask = async (
  userId: string,
  eventId: string,
  event: CalendarEvent,
  notifications?: NotificationPlan
): Promise<GoogleCalendarSyncResult> => {
  try {
    await updateCalendarEvent(userId, eventId, {
      summary: event.title,
      description: event.description,
      start: event.startDate,
      end: event.endDate,
      allDay: event.allDay,
      reminders: notifications ? toGoogleReminderOverrides(notifications, event.startDate) : [],
    });
    return { eventId };
  } catch (err: any) {
    const message = err?.message ?? String(err);
    console.error("[ReminderAgent] Google Calendar update failed:", err);
    return { error: message };
  }
};

export const removeGoogleCalendarTask = async (userId: string, eventId: string): Promise<GoogleCalendarSyncResult> => {
  try {
    await deleteCalendarEvent(userId, eventId);
    return {};
  } catch (err: any) {
    const message = err?.message ?? String(err);
    console.error("[ReminderAgent] Google Calendar delete failed:", err);
    return { error: message };
  }
};

// ─────────────────────────────────────────────────────────────
// Deterministic interval reminder builder
// (7d / 3d / 1d / due-date / 2h / 30min — no LLM, so it's reliable.)
// ─────────────────────────────────────────────────────────────

export const buildIntervalReminders = (
  dueDate: string,
  title: string,
  priority: TaskPriority,
  now: Date = new Date()
): NotificationPlan => {
  const due = new Date(dueDate);

  const dayIntervals = [
    { ms: 7 * 86400000, label: "in 7 days" },
    { ms: 3 * 86400000, label: "in 3 days" },
    { ms: 1 * 86400000, label: "tomorrow" },
    { ms: 0, label: "today" },
  ];
  const hourIntervals = [
    { ms: 2 * 3600000, label: "in 2 hours" },
    { ms: 30 * 60000, label: "in 30 minutes" },
  ];

  const reminders: NotificationReminder[] = [];

  for (const iv of dayIntervals) {
    const triggerAt = new Date(due.getTime() - iv.ms);
    if (triggerAt.getTime() > now.getTime()) {
      reminders.push({
        triggerAt: triggerAt.toISOString(),
        message: `📚 "${title}" is due ${iv.label}.`,
        channel: iv.ms <= 86400000 || priority === "critical" || priority === "high" ? "email" : "in_app",
      });
    }
  }

  for (const iv of hourIntervals) {
    const triggerAt = new Date(due.getTime() - iv.ms);
    if (triggerAt.getTime() > now.getTime()) {
      reminders.push({
        triggerAt: triggerAt.toISOString(),
        message: `⏳ "${title}" is due ${iv.label}!`,
        channel: "in_app", // last-minute pings stay in-app; email already sent earlier
      });
    }
  }

  reminders.sort((a, b) => new Date(a.triggerAt).getTime() - new Date(b.triggerAt).getTime());

  const urgencyLevel: NotificationPlan["urgencyLevel"] =
    priority === "critical" || priority === "high" ? "high" : priority === "medium" ? "medium" : "low";

  return {
    reminders,
    urgencyLevel,
    escalationNote:
      reminders.length === 0 ? "Due date is very close or in the past — no lead-time reminders left to schedule." : undefined,
    isIntervalBased: true,
  };
};

// ─────────────────────────────────────────────────────────────
// Class schedule reminders (deterministic)
// ─────────────────────────────────────────────────────────────

export const getUpcomingClassReminders = (
  classes: ClassScheduleEntry[],
  now: Date = new Date(),
  windowDays = 7
): { classId: string; courseName: string; triggerAt: string; message: string }[] => {
  const reminders: { classId: string; courseName: string; triggerAt: string; message: string }[] = [];

  for (const c of classes) {
    for (let d = 0; d < windowDays; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      if (date.getDay() !== c.dayOfWeek) continue;

      const [h, m] = c.startTime.split(":").map(Number);
      const classStart = new Date(date);
      classStart.setHours(h, m, 0, 0);
      const reminderTime = new Date(classStart.getTime() - 15 * 60000);

      if (reminderTime.getTime() > now.getTime()) {
        reminders.push({
          classId: c.id,
          courseName: c.courseName,
          triggerAt: reminderTime.toISOString(),
          message: `🔔 ${c.courseName} class begins in 15 minutes${c.location ? ` at ${c.location}` : ""}.`,
        });
      }
      break; // only the next occurrence of each class within the window
    }
  }

  return reminders.sort((a, b) => new Date(a.triggerAt).getTime() - new Date(b.triggerAt).getTime());
};

// ─────────────────────────────────────────────────────────────
// Attendance reminders (deterministic)
// ─────────────────────────────────────────────────────────────

export const checkAttendance = (
  records: AttendanceRecord[]
): { courseName: string; currentPercent: number; message: string; severity: "medium" | "high" }[] => {
  const results: { courseName: string; currentPercent: number; message: string; severity: "medium" | "high" }[] = [];

  for (const r of records) {
    const required = r.requiredPercent ?? 75;
    const pct = r.total > 0 ? (r.attended / r.total) * 100 : 100;
    if (pct < required) {
      results.push({
        courseName: r.courseName,
        currentPercent: Math.round(pct * 10) / 10,
        message: `⚠️ Your attendance in ${r.courseName} is ${Math.round(pct)}%. Attend the next lecture to stay above ${required}%.`,
        severity: pct < required - 10 ? "high" : "medium",
      });
    }
  }
  return results;
};

// ─────────────────────────────────────────────────────────────
// Study break reminders (deterministic, session-based)
// ─────────────────────────────────────────────────────────────

export const checkBreakReminder = (
  studySessionStartedAt: string,
  now: Date = new Date()
): { message: string; minutesElapsed: number } | null => {
  const start = new Date(studySessionStartedAt);
  const minutesElapsed = Math.round((now.getTime() - start.getTime()) / 60000);
  if (minutesElapsed >= 120) {
    return {
      message: `You've been studying for ${Math.floor(minutesElapsed / 60)} hour(s). Take a 10-minute break.`,
      minutesElapsed,
    };
  }
  return null;
};

// ─────────────────────────────────────────────────────────────
// Email follow-up reminders (deterministic)
// ─────────────────────────────────────────────────────────────

export const checkEmailFollowUps = (
  records: EmailFollowUpRecord[],
  now: Date = new Date()
): { id: string; message: string; daysSince: number }[] => {
  const results: { id: string; message: string; daysSince: number }[] = [];

  for (const r of records) {
    if (r.followedUp) continue;
    const sentAt = new Date(r.sentAt);
    const daysSince = Math.floor((now.getTime() - sentAt.getTime()) / 86400000);
    if (daysSince >= (r.followUpAfterDays ?? 5)) {
      results.push({
        id: r.id,
        daysSince,
        message: `✉️ You emailed ${r.recipient} ${daysSince} days ago ("${r.subject}"). Would you like to send a follow-up?`,
      });
    }
  }
  return results;
};

// ─────────────────────────────────────────────────────────────
// Overdue task detection (deterministic) — NEW
// ─────────────────────────────────────────────────────────────

export const checkOverdueTasks = (
  tasks: StoredTaskLike[],
  now: Date = new Date()
): OverdueTask[] =>
  tasks
    .filter(t => t.status !== "done" && t.status !== "deleted" && new Date(t.dueDate).getTime() < now.getTime())
    .map(t => {
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - new Date(t.dueDate).getTime()) / 86400000));
      return {
        id: t.id,
        title: t.title,
        daysOverdue,
        suggestion:
          daysOverdue === 0
            ? "Due earlier today — submit as soon as possible."
            : `Overdue by ${daysOverdue} day(s). Submit immediately or reschedule.`,
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

// ─────────────────────────────────────────────────────────────
// Cross-task smart priority ranking (deterministic scoring)
// ─────────────────────────────────────────────────────────────

export const rankTaskPriorities = (tasks: StoredTaskLike[], now: Date = new Date()): RankedTask[] => {
  const priorityWeight: Record<TaskPriority, number> = { critical: 40, high: 30, medium: 20, low: 10 };

  const scored = tasks
    .filter(t => t.status !== "done" && t.status !== "deleted")
    .map(t => {
      const daysLeft = (new Date(t.dueDate).getTime() - now.getTime()) / 86400000;
      const urgencyScore = daysLeft <= 0 ? 50 : Math.max(0, 30 - daysLeft * 2);
      const effortScore = Math.min(20, (t.estimatedMinutes ?? 60) / 15);
      const score = Math.round(priorityWeight[t.priority] + urgencyScore + effortScore);
      const reason = `${t.priority} priority, ${daysLeft <= 0 ? "overdue" : `${Math.ceil(daysLeft)}d left`}, ~${t.estimatedMinutes}min`;
      return { id: t.id, title: t.title, score, reason };
    })
    .sort((a, b) => b.score - a.score);

  const highCut = Math.max(1, Math.ceil(scored.length * 0.3));
  const lowCut = Math.max(1, Math.ceil(scored.length * 0.2));

  return scored.map((s, i) => ({
    ...s,
    tier: i < highCut ? "high" : i >= scored.length - lowCut ? "low" : "medium",
  }));
};

// ─────────────────────────────────────────────────────────────
// Daily academic summary (deterministic)
// ─────────────────────────────────────────────────────────────

export const generateDailySummary = (
  tasks: StoredTaskLike[],
  classes: ClassScheduleEntry[] = [],
  userName = "there",
  now: Date = new Date()
): DailySummary => {
  const todayStr = now.toDateString();

  const todayClasses = classes
    .filter(c => c.dayOfWeek === now.getDay())
    .map(c => ({ title: c.courseName, time: c.startTime, category: "class" as const }));

  const todayTasks = tasks
    .filter(t => t.status !== "done" && t.status !== "deleted" && new Date(t.dueDate).toDateString() === todayStr)
    .map(t => ({ title: t.title, category: t.category }));

  const upcoming: DailySummary["upcoming"] = [];
  for (let d = 1; d <= 3; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    const dateStr = date.toDateString();
    const items = tasks
      .filter(t => t.status !== "done" && t.status !== "deleted" && new Date(t.dueDate).toDateString() === dateStr)
      .map(t => t.title);
    if (items.length) {
      upcoming.push({
        day: DAY_NAMES[date.getDay()],
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        items,
      });
    }
  }

  return {
    greeting: `Good morning, ${userName}!`,
    todayItems: [
      ...todayClasses.map(c => ({ title: c.title, time: c.time, category: "class" as const })),
      ...todayTasks.map(t => ({ title: t.title, category: t.category })),
    ],
    upcoming,
  };
};

// ─────────────────────────────────────────────────────────────
// Weekly planning summary (deterministic) — now with completed/overdue counts
// ─────────────────────────────────────────────────────────────

export const generateWeeklySummary = (tasks: StoredTaskLike[], now: Date = new Date()): WeeklySummary => {
  const weekEnd = new Date(now.getTime() + 7 * 86400000);
  const weekTasks = tasks.filter(
    t => t.status !== "done" && t.status !== "deleted" && new Date(t.dueDate) >= now && new Date(t.dueDate) <= weekEnd
  );

  const counts: Record<string, number> = {};
  for (const t of weekTasks) counts[t.category] = (counts[t.category] ?? 0) + 1;

  const completed = tasks.filter(
    t => t.status === "done" && new Date(t.dueDate) >= now && new Date(t.dueDate) <= weekEnd
  ).length;

  const overdue = tasks.filter(
    t => t.status !== "done" && t.status !== "deleted" && new Date(t.dueDate).getTime() < now.getTime()
  ).length;

  const suggestedPlan = weekTasks
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .map(t => {
      const startRef = new Date(t.suggestedStartDate ?? t.dueDate);
      return { day: DAY_NAMES[isNaN(startRef.getTime()) ? now.getDay() : startRef.getDay()], focus: t.title };
    });

  return { weekOf: now.toISOString(), counts, completed, overdue, suggestedPlan };
};

// ─────────────────────────────────────────────────────────────
// MAIN AGENT (per-task pipeline)
// ─────────────────────────────────────────────────────────────

export const runReminderAgent = async (
  input: ReminderAgentInput
): Promise<ReminderAgentOutput> => {
  const agentSteps: string[] = [];

  const hasRawText = Boolean(input.rawText?.trim());
  const hasStructured = Boolean(input.title?.trim());

  if (!hasRawText && !hasStructured) {
    throw new Error("Provide either a freeform description or a title.");
  }

  const now = new Date();
  const nowISO = now.toISOString();
  const dayOfWeek = now.toLocaleDateString(undefined, { weekday: "long" });

  agentSteps.push(hasRawText ? "🧠 Reading your request..." : "🧠 Analyzing task...");

  // ── Call 1: Understand & Analyze ──
  const understandRaw = await understandTool.invoke({
    rawText: input.rawText,
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    userPriority: input.priority,
    now: nowISO,
    dayOfWeek,
  });

  const fallbackDue = input.dueDate || defaultDueDate();
  const analysis = extractJSON(
    understandRaw,
    {
      title: input.title ?? input.rawText ?? "Untitled task",
      description: input.description ?? "",
      category: "general" as TaskCategory,
      priority: (input.priority ?? "medium") as TaskPriority,
      subject: undefined as string | undefined,
      dueDate: fallbackDue,
      estimatedMinutes: 60,
      suggestedStartDate: fallbackDue,
      subTasks: [] as string[],
      tags: [] as string[],
      dueDateAssumed: !input.dueDate,
      assumptionNote: input.dueDate ? undefined : "Couldn't parse a deadline — defaulted to 3 days out.",
    },
    "understand"
  );

  let resolvedDueDate = analysis.dueDate;
  const parsedDue = new Date(resolvedDueDate);
  if (isNaN(parsedDue.getTime()) || parsedDue.getTime() < now.getTime()) {
    resolvedDueDate = input.dueDate || defaultDueDate();
    analysis.dueDateAssumed = true;
    analysis.assumptionNote = analysis.assumptionNote || "Deadline was unclear — defaulted to a few days out.";
  }

  const daysUntilDue = daysBetween(now, new Date(resolvedDueDate));
  const resolvedPriority = analysis.priority as TaskPriority;
  const resolvedCategory = analysis.category as TaskCategory;
  const resolvedTitle = analysis.title || input.title || input.rawText || "Untitled task";
  const resolvedDescription = analysis.description ?? input.description ?? "";
  const resolvedSubject = analysis.subject || undefined;

  agentSteps.push(
    `✅ "${resolvedTitle}" — ${resolvedCategory} · ${resolvedPriority}${resolvedSubject ? ` · ${resolvedSubject}` : ""} · ~${analysis.estimatedMinutes}min`
  );
  if (analysis.dueDateAssumed) {
    agentSteps.push(`📌 Assumed due date: ${analysis.assumptionNote || "no deadline given, picked a reasonable one"}`);
  }

  // ── Call 2: Plan (schedule + notifications + routing) ──
  agentSteps.push("📅 Planning schedule, reminders, and routing...");
  const planRaw = await planTool.invoke({
    title: resolvedTitle,
    description: resolvedDescription,
    dueDate: resolvedDueDate,
    category: resolvedCategory,
    priority: resolvedPriority,
    estimatedMinutes: analysis.estimatedMinutes,
    suggestedStartDate: analysis.suggestedStartDate,
    daysUntilDue,
  });

  const plan = extractJSON(
    planRaw,
    {
      schedule: [] as ScheduleSlot[],
      notifications: { reminders: [], urgencyLevel: "medium" } as NotificationPlan,
      routing: {
        shouldTriggerEmailAgent: false,
        shouldTriggerPresentationAgent: false,
        shouldTriggerQuizAgent: false,
        shouldTriggerPlanner: false,
      } as AgentRouting,
    },
    "plan"
  );

  // ── Deadline-interval override ──
  // For assignment/exam/quiz/project, swap the LLM's guessed reminders
  // for the deterministic 7d/3d/1d/due-date/2h/30min cadence from the spec.
  let notifications: NotificationPlan = plan.notifications;
  if (INTERVAL_REMINDER_CATEGORIES.includes(resolvedCategory)) {
    notifications = buildIntervalReminders(resolvedDueDate, resolvedTitle, resolvedPriority, now);
    agentSteps.push(`⏰ Using fixed interval reminders (${notifications.reminders.length} scheduled)`);
  } else {
    agentSteps.push(
      `✅ ${plan.schedule.length} work session(s), ${plan.notifications.reminders.length} reminder(s)`
    );
  }

  const triggered = [
    plan.routing.shouldTriggerEmailAgent && "Email Agent",
    plan.routing.shouldTriggerPresentationAgent && "Presentation Agent",
    plan.routing.shouldTriggerQuizAgent && "Quiz Agent",
    plan.routing.shouldTriggerPlanner && "Planner",
  ].filter(Boolean);
  agentSteps.push(
    triggered.length > 0 ? `🤖 Triggered: ${triggered.join(", ")}` : "✅ No downstream agents needed"
  );

  // ── Call 3 (conditional): Milestones for project tasks ──
  let milestones: MilestonePlan | undefined;
  if (resolvedCategory === "project") {
    agentSteps.push("🚀 Breaking project into milestones...");
    const milestoneRaw = await milestoneTool.invoke({
      title: resolvedTitle,
      description: resolvedDescription,
      dueDate: resolvedDueDate,
    });
    milestones = extractJSON(milestoneRaw, { milestones: [] as MilestoneItem[] }, "milestones");
    agentSteps.push(`✅ ${milestones.milestones.length} milestone(s) planned`);
  }

  // ── Calendar event object (deterministic; actual Google sync happens in the route) ──
  const calendarEvent = buildCalendarEvent(
    resolvedTitle,
    resolvedDescription,
    resolvedDueDate,
    resolvedCategory,
    resolvedPriority,
    analysis.estimatedMinutes
  );
  agentSteps.push("🗓️ Calendar event created");
  agentSteps.push("🎉 Task saved");

  const parsedTask: ParsedTask = {
    title: resolvedTitle,
    description: resolvedDescription,
    category: resolvedCategory,
    priority: resolvedPriority,
    subject: resolvedSubject,
    dueDate: resolvedDueDate,
    daysUntilDue,
    estimatedMinutes: analysis.estimatedMinutes,
    suggestedStartDate: analysis.suggestedStartDate,
    subTasks: analysis.subTasks ?? [],
    tags: analysis.tags ?? [],
    dueDateAssumed: Boolean(analysis.dueDateAssumed),
    assumptionNote: analysis.assumptionNote ?? undefined,
  };

  return {
    task: parsedTask,
    schedule: plan.schedule,
    notifications,
    calendarEvent,
    routing: plan.routing,
    milestones,
    agentSteps,
  };
};

// ─────────────────────────────────────────────────────────────
// Quick-analyze (lightweight preview, still 1 LLM call only)
// ─────────────────────────────────────────────────────────────

export const quickAnalyzeTask = async (
  text: string
): Promise<{ category: TaskCategory; priority: TaskPriority; tags: string[]; dueDateGuess?: string }> => {
  if (!text || text.trim().length < 3) {
    return { category: "general", priority: "medium", tags: [] };
  }
  try {
    const now = new Date();
    const raw = await understandTool.invoke({
      rawText: text,
      now: now.toISOString(),
      dayOfWeek: now.toLocaleDateString(undefined, { weekday: "long" }),
    });
    const r = extractJSON(
      raw,
      { category: "general", priority: "medium", tags: [], dueDate: undefined },
      "quick"
    );
    return {
      category: r.category as TaskCategory,
      priority: r.priority as TaskPriority,
      tags: r.tags ?? [],
      dueDateGuess: r.dueDate,
    };
  } catch {
    return { category: "general", priority: "medium", tags: [] };
  }
};