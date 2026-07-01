// services/EmailScheduler.ts
// Lightweight in-process email scheduler for single + broadcast (BCC) sends.
// Designed to plug into AcademicEmailAgent's generated output.
//
// Swap-in points for production:
//  - Replace the in-memory `store` Map with a DB table (Mongo/Postgres).
//  - Replace `setTimeout`-based firing with a real job queue (BullMQ, Agenda,
//    node-cron, or a serverless cron) so schedules survive server restarts.
//  - Replace `sendEmailNow` / `sendBulkEmailNow` with your real mailer calls
//    (these are injected as dependencies so this file has no mail-lib coupling).

import { randomUUID } from "crypto";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ScheduleStatus = "scheduled" | "sent" | "failed" | "cancelled";
export type ScheduleDeliveryMode = "single" | "broadcast";

export interface ScheduledEmailBase {
  id: string;
  deliveryMode: ScheduleDeliveryMode;
  subject: string;
  body: string;
  senderName: string;
  scheduledFor: string;      // ISO timestamp
  createdAt: string;         // ISO timestamp
  status: ScheduleStatus;
  emailId?: string;          // link back to AcademicEmailAgent record, if any
  lastError?: string;
}

export interface ScheduledSingleEmail extends ScheduledEmailBase {
  deliveryMode: "single";
  recipientEmail: string;
}

export interface ScheduledBroadcastEmail extends ScheduledEmailBase {
  deliveryMode: "broadcast";
  bccList: string[];
}

export type ScheduledEmail = ScheduledSingleEmail | ScheduledBroadcastEmail;

export interface ScheduleSingleInput {
  recipientEmail: string;
  subject: string;
  body: string;
  senderName: string;
  scheduledFor: string;   // ISO timestamp, must be in the future
  emailId?: string;
}

export interface ScheduleBroadcastInput {
  bccList: string[];
  subject: string;
  body: string;
  senderName: string;
  scheduledFor: string;
  emailId?: string;
}

/** Dependency-injected senders — wire these to your actual mailer in app startup. */
export interface MailerDeps {
  sendSingle: (args: { recipientEmail: string; subject: string; body: string; senderName: string }) => Promise<void>;
  sendBroadcast: (args: { bccList: string[]; subject: string; body: string; senderName: string }) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// In-memory store (swap for DB in production)
// ─────────────────────────────────────────────────────────────

const store = new Map<string, ScheduledEmail>();
const timers = new Map<string, NodeJS.Timeout>();

const MIN_LEAD_TIME_MS = 60 * 1000; // must be scheduled at least 1 minute out
const MAX_LEAD_TIME_MS = 1000 * 60 * 60 * 24 * 90; // cap at 90 days out

// ─────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────

const validateScheduleTime = (scheduledFor: string): { ok: true; date: Date } | { ok: false; error: string } => {
  const date = new Date(scheduledFor);
  if (isNaN(date.getTime())) {
    return { ok: false, error: "Invalid scheduledFor timestamp." };
  }
  const delta = date.getTime() - Date.now();
  if (delta < MIN_LEAD_TIME_MS) {
    return { ok: false, error: "Scheduled time must be at least 1 minute in the future." };
  }
  if (delta > MAX_LEAD_TIME_MS) {
    return { ok: false, error: "Scheduled time cannot be more than 90 days in the future." };
  }
  return { ok: true, date };
};

// ─────────────────────────────────────────────────────────────
// Core scheduler factory
// Call createEmailScheduler(mailerDeps) once at app startup and reuse the
// returned instance across routes.
// ─────────────────────────────────────────────────────────────

export const createEmailScheduler = (deps: MailerDeps) => {
  const fire = async (id: string) => {
    const entry = store.get(id);
    if (!entry || entry.status !== "scheduled") return;

    try {
      if (entry.deliveryMode === "single") {
        await deps.sendSingle({
          recipientEmail: entry.recipientEmail,
          subject: entry.subject,
          body: entry.body,
          senderName: entry.senderName,
        });
      } else {
        await deps.sendBroadcast({
          bccList: entry.bccList,
          subject: entry.subject,
          body: entry.body,
          senderName: entry.senderName,
        });
      }
      entry.status = "sent";
      console.log(`[EmailScheduler] Sent scheduled email ${id} (${entry.deliveryMode})`);
    } catch (err: any) {
      entry.status = "failed";
      entry.lastError = err?.message ?? String(err);
      console.error(`[EmailScheduler] Failed to send scheduled email ${id}:`, entry.lastError);
    } finally {
      store.set(id, entry);
      timers.delete(id);
    }
  };

  const arm = (entry: ScheduledEmail) => {
    const delay = new Date(entry.scheduledFor).getTime() - Date.now();
    const timer = setTimeout(() => fire(entry.id), Math.max(delay, 0));
    timers.set(entry.id, timer);
  };

  /** Re-arm any pending schedules — call once on server boot if loading from DB. */
  const rehydrate = (entries: ScheduledEmail[]) => {
    for (const entry of entries) {
      store.set(entry.id, entry);
      if (entry.status === "scheduled") {
        const delta = new Date(entry.scheduledFor).getTime() - Date.now();
        if (delta <= 0) {
          // Missed window while server was down — fire immediately.
          fire(entry.id);
        } else {
          arm(entry);
        }
      }
    }
  };

  const scheduleSingle = (input: ScheduleSingleInput): ScheduledSingleEmail => {
    const check = validateScheduleTime(input.scheduledFor);
    if (!check.ok) throw new Error(check.error);
    if (!input.recipientEmail?.trim()) throw new Error("recipientEmail is required.");
    if (!input.subject?.trim() || !input.body?.trim()) throw new Error("subject and body are required.");

    const entry: ScheduledSingleEmail = {
      id: randomUUID(),
      deliveryMode: "single",
      recipientEmail: input.recipientEmail.trim(),
      subject: input.subject,
      body: input.body,
      senderName: input.senderName?.trim() || "The Sender",
      scheduledFor: check.date.toISOString(),
      createdAt: new Date().toISOString(),
      status: "scheduled",
      emailId: input.emailId,
    };

    store.set(entry.id, entry);
    arm(entry);
    return entry;
  };

  const scheduleBroadcast = (input: ScheduleBroadcastInput): ScheduledBroadcastEmail => {
    const check = validateScheduleTime(input.scheduledFor);
    if (!check.ok) throw new Error(check.error);
    if (!input.bccList || input.bccList.length === 0) throw new Error("bccList must contain at least one recipient.");
    if (!input.subject?.trim() || !input.body?.trim()) throw new Error("subject and body are required.");

    const entry: ScheduledBroadcastEmail = {
      id: randomUUID(),
      deliveryMode: "broadcast",
      bccList: input.bccList.map((e) => e.trim()).filter(Boolean),
      subject: input.subject,
      body: input.body,
      senderName: input.senderName?.trim() || "The Sender",
      scheduledFor: check.date.toISOString(),
      createdAt: new Date().toISOString(),
      status: "scheduled",
      emailId: input.emailId,
    };

    store.set(entry.id, entry);
    arm(entry);
    return entry;
  };

  const cancel = (id: string): boolean => {
    const entry = store.get(id);
    if (!entry || entry.status !== "scheduled") return false;

    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
    entry.status = "cancelled";
    store.set(id, entry);
    return true;
  };

  const reschedule = (id: string, newScheduledFor: string): ScheduledEmail => {
    const entry = store.get(id);
    if (!entry) throw new Error("Scheduled email not found.");
    if (entry.status !== "scheduled") throw new Error(`Cannot reschedule an email with status "${entry.status}".`);

    const check = validateScheduleTime(newScheduledFor);
    if (!check.ok) throw new Error(check.error);

    const timer = timers.get(id);
    if (timer) clearTimeout(timer);

    entry.scheduledFor = check.date.toISOString();
    store.set(id, entry);
    arm(entry);
    return entry;
  };

  const get = (id: string): ScheduledEmail | undefined => store.get(id);

  const list = (filter?: { status?: ScheduleStatus }): ScheduledEmail[] => {
    const all = Array.from(store.values()).sort(
      (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
    if (!filter?.status) return all;
    return all.filter((e) => e.status === filter.status);
  };

  return {
    scheduleSingle,
    scheduleBroadcast,
    cancel,
    reschedule,
    get,
    list,
    rehydrate,
  };
};

export type EmailScheduler = ReturnType<typeof createEmailScheduler>;