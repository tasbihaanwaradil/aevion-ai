/**
 * Reminder.scheduler.ts
 *
 * Deterministic, non-LLM scheduler for "deadline approaching" reminder
 * emails. Modeled on the existing EmailScheduler.ts pattern used by the
 * Academic Email Agent: setTimeout-based jobs keyed so duplicates can't
 * stack, plus a rehydrate() call for server restarts.
 *
 * Checkpoints (per the FYP spec): 7 days / 3 days / 1 day / 2 hours /
 * 30 minutes before the deadline. Only checkpoints still in the future at
 * schedule time are armed — anything already past is skipped (the reminder
 * shows up as HIGH priority / overdue instead, which already covers it).
 *
 * IMPORTANT: call `rehydrateReminderSchedules()` once when your server
 * boots (e.g. after the Mongo connection opens), the same way the
 * Academic Email Agent's scheduler is rehydrated. In-memory setTimeout
 * jobs don't survive a restart, but `sentDeadlineReminders` on each
 * Reminder document does, so nothing double-sends.
 */

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import { Reminder, type IReminder } from "../../models/Reminder.model.js";
import {
  sendDeadlineReminderEmail,
  type AttendeeInfo,
} from "./Reminder.notifier.js";

dayjs.extend(utc);
dayjs.extend(timezone);

interface Checkpoint {
  key: string; // persisted in reminder.sentDeadlineReminders
  label: string; // human-readable, used in the email subject/body
  msBefore: number;
}

const CHECKPOINTS: Checkpoint[] = [
  { key: "7d", label: "7 days", msBefore: 7 * 24 * 60 * 60 * 1000 },
  { key: "3d", label: "3 days", msBefore: 3 * 24 * 60 * 60 * 1000 },
  { key: "1d", label: "1 day", msBefore: 1 * 24 * 60 * 60 * 1000 },
  { key: "2h", label: "2 hours", msBefore: 2 * 60 * 60 * 1000 },
  { key: "30m", label: "30 minutes", msBefore: 30 * 60 * 1000 },
];

// setTimeout has a ~24.8 day max delay; nothing here ever needs more than
// 7 days, so we're safely inside that limit.
const jobs = new Map<string, NodeJS.Timeout>();

function jobKey(reminderId: string, checkpointKey: string) {
  return `${reminderId}:${checkpointKey}`;
}

function attendeesOf(reminder: IReminder): AttendeeInfo[] {
  return (reminder.attendees ?? []).map((a) => ({
    userId: a.userId ? a.userId.toString() : undefined,
    name: a.name,
    email: a.email,
  }));
}

async function fireCheckpoint(reminderId: string, checkpoint: Checkpoint) {
  jobs.delete(jobKey(reminderId, checkpoint.key));

  const reminder = await Reminder.findById(reminderId);

  if (!reminder) return;

  // Don't email about something that's done, cancelled, or already sent.
  if (reminder.status === "completed" || reminder.status === "cancelled") return;
  if ((reminder.sentDeadlineReminders ?? []).includes(checkpoint.key)) return;

  try {
    await sendDeadlineReminderEmail({
      reminder,
      attendees: attendeesOf(reminder),
      ownerUserId: reminder.userId.toString(),
      label: checkpoint.label,
    });

    reminder.sentDeadlineReminders = [
      ...(reminder.sentDeadlineReminders ?? []),
      checkpoint.key,
    ];

    await reminder.save();
  } catch (err) {
    console.error(
      `Reminder scheduler: failed to send "${checkpoint.key}" checkpoint for ${reminderId}:`,
      err
    );
  }
}

function armCheckpoint(
  reminderId: string,
  checkpoint: Checkpoint,
  deadline: dayjs.Dayjs,
  now: dayjs.Dayjs
) {
  const fireAt = deadline.valueOf() - checkpoint.msBefore;
  const delay = fireAt - now.valueOf();

  // Skip checkpoints already in the past; don't double-arm an existing timer.
  if (delay <= 0) return;

  const key = jobKey(reminderId, checkpoint.key);
  if (jobs.has(key)) return;

  const timer = setTimeout(() => {
    fireCheckpoint(reminderId, checkpoint);
  }, delay);

  // A scheduled email shouldn't by itself keep the Node process alive.
  timer.unref?.();

  jobs.set(key, timer);
}

/**
 * Call this right after a reminder is created, and again whenever its
 * date/time changes (updateReminder should reset `sentDeadlineReminders`
 * to `[]` first in that case, so the new deadline gets a fresh set of
 * checkpoints).
 */
export function scheduleDeadlineReminderEmails({
  reminder,
  timezone: tz,
}: {
  reminder: IReminder;
  timezone: string;
}): void {
  const reminderId = reminder._id.toString();

  // Clear any previously armed timers for this reminder first (e.g. after
  // a reschedule), so it's never double-armed.
  clearScheduledEmails(reminderId);

  const deadline = dayjs.tz(
    `${reminder.date} ${reminder.time}`,
    "YYYY-MM-DD HH:mm",
    tz
  );

  const now = dayjs().tz(tz);
  const alreadySent = new Set(reminder.sentDeadlineReminders ?? []);

  for (const checkpoint of CHECKPOINTS) {
    if (alreadySent.has(checkpoint.key)) continue;

    armCheckpoint(reminderId, checkpoint, deadline, now);
  }
}

/**
 * Cancels any pending deadline-email timers for a reminder. Call this from
 * deleteReminder/completeReminder so a cancelled or finished task doesn't
 * still trigger a "2 hours left" email.
 */
export function clearScheduledEmails(reminderId: string): void {
  for (const checkpoint of CHECKPOINTS) {
    const key = jobKey(reminderId, checkpoint.key);
    const timer = jobs.get(key);

    if (timer) {
      clearTimeout(timer);
      jobs.delete(key);
    }
  }
}

/**
 * Call once on server startup (after the DB connects) to re-arm timers for
 * every active reminder, since in-memory setTimeout jobs don't survive a
 * restart. Uses each reminder's own stored `timezone`.
 */
export async function rehydrateReminderSchedules(): Promise<void> {
  const active = await Reminder.find({
    status: { $in: ["pending", "overdue"] },
  });

  for (const reminder of active) {
    scheduleDeadlineReminderEmails({
      reminder,
      timezone: reminder.timezone || "Asia/Karachi",
    });
  }

  console.log(
    `Reminder scheduler: rehydrated ${active.length} active reminder(s).`
  );
}