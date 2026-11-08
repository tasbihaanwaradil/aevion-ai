import Reminder, { IReminder } from "../models/Reminder.js";
import Teacher from "../models/Teacher.js";
import { sendEmail } from "./EmailSender.js";

// Checkpoints expressed as ms-before-deadline, paired with a stable label
// used both for the timer key and for dedup via `notifiedCheckpoints`.
const CHECKPOINTS: { label: string; msBefore: number }[] = [
  { label: "7d", msBefore: 7 * 24 * 60 * 60 * 1000 },
  { label: "3d", msBefore: 3 * 24 * 60 * 60 * 1000 },
  { label: "1d", msBefore: 24 * 60 * 60 * 1000 },
  { label: "2h", msBefore: 2 * 60 * 60 * 1000 },
  { label: "30m", msBefore: 30 * 60 * 1000 },
];

// `${reminderId}:${label}` -> timeout handle, so cancelling/rescheduling
// one reminder never touches another reminder's pending timers.
const timers = new Map<string, NodeJS.Timeout>();

// How often to re-scan the database so checkpoints that were too far away
// for a single setTimeout (over ~24.8 days) get scheduled once they are close.
const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
let refreshStarted = false;

function timerKey(reminderId: string, label: string) {
  return `${reminderId}:${label}`;
}

function humanize(label: string): string {
  return label
    .replace("d", " day(s)")
    .replace("h", " hour(s)")
    .replace("m", " minute(s)");
}

async function fireCheckpoint(reminderId: string, label: string) {
  console.log(`[ReminderScheduler] Firing ${label} checkpoint for ${reminderId}`);

  // Re-fetch — the reminder may have been completed, deleted, or moved
  // since this timer was set.
  const fresh = await Reminder.findById(reminderId);
  if (!fresh || fresh.completed) return;
  if (fresh.notifiedCheckpoints.includes(label)) return;

  const owner = await Teacher.findById(fresh.userId);
  const body =
    `Reminder: "${fresh.title}" is due in ${humanize(label)} ` +
    `(${fresh.deadline.toLocaleString()}).` +
    (fresh.description ? `\n\n${fresh.description}` : "");

  if (owner?.email) {
    await sendEmail({
      to: owner.email,
      subject: `Upcoming deadline: ${fresh.title}`,
      body,
      fromName: "Aevion.AI Reminders",
    });
    console.log(`[ReminderScheduler] Email sent to ${owner.email} (${label})`);
  } else {
    console.warn(
      `[ReminderScheduler] No email found for user ${fresh.userId}; nothing sent for "${fresh.title}".`
    );
  }

  if (fresh.category === "Meeting") {
    for (const attendee of fresh.attendees) {
      await sendEmail({
        to: attendee.email,
        subject: `Upcoming meeting: ${fresh.title}`,
        body,
        fromName: "Aevion.AI Reminders",
      });
    }
  }

  fresh.notifiedCheckpoints.push(label);
  await fresh.save();
}

export function cancelReminderTimers(reminderId: string) {
  for (const cp of CHECKPOINTS) {
    const key = timerKey(reminderId, cp.label);
    const handle = timers.get(key);
    if (handle) {
      clearTimeout(handle);
      timers.delete(key);
    }
  }
}

export function scheduleReminder(reminder: IReminder) {
  const id = String(reminder._id);
  cancelReminderTimers(id);

  if (reminder.completed) return;

  const now = Date.now();
  const deadlineMs = new Date(reminder.deadline).getTime();
  const MAX_DELAY = 2 ** 31 - 1; // setTimeout's ~24.8-day ceiling
  const scheduled: string[] = [];

  for (const cp of CHECKPOINTS) {
    if (reminder.notifiedCheckpoints.includes(cp.label)) continue;

    const delay = deadlineMs - cp.msBefore - now;

    // Already past this checkpoint (e.g. created close to its deadline,
    // or right after a restart) — skip it.
    if (delay <= 0) continue;

    // Too far out for a single setTimeout — the hourly refresh below
    // schedules it once the checkpoint is within range.
    if (delay > MAX_DELAY) continue;

    const handle = setTimeout(() => {
      fireCheckpoint(id, cp.label).catch((err) =>
        console.error("Reminder checkpoint email failed:", err)
      );
    }, delay);

    timers.set(timerKey(id, cp.label), handle);
    scheduled.push(cp.label);
  }

  console.log(
    `[ReminderScheduler] "${reminder.title}" (${id}): ` +
      (scheduled.length
        ? `scheduled ${scheduled.join(", ")}`
        : "no checkpoints scheduled (all passed, already sent, or too far out)")
  );
}

/**
 * Rehydrates all pending timers from the database. Call once on server
 * boot (after the DB connection opens) — in-memory timers don't survive
 * a restart. It also starts an hourly refresh so far-future reminders
 * get their timers without needing a restart.
 */
export async function rehydrateReminderTimers() {
  const pending = await Reminder.find({
    completed: false,
    deadline: { $gt: new Date() },
  });

  for (const reminder of pending) {
    scheduleReminder(reminder);
  }

  console.log(
    `[ReminderScheduler] Rehydrated timers for ${pending.length} reminder(s).`
  );

  if (!refreshStarted) {
    refreshStarted = true;
    setInterval(() => {
      rehydrateReminderTimers().catch((err) =>
        console.error("Reminder refresh failed:", err)
      );
    }, REFRESH_INTERVAL_MS);
  }
}