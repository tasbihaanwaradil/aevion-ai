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

  for (const cp of CHECKPOINTS) {
    if (reminder.notifiedCheckpoints.includes(cp.label)) continue;

    const delay = deadlineMs - cp.msBefore - now;

    // Already past this checkpoint (e.g. created close to its deadline,
    // or right after a restart) — skip it; the immediate creation email
    // already covers that case.
    if (delay <= 0) continue;

    // Too far out for a single setTimeout — rehydrateReminderTimers()
    // picks it up on the next server start as the deadline nears.
    if (delay > MAX_DELAY) continue;

    const handle = setTimeout(() => {
      fireCheckpoint(id, cp.label).catch((err) =>
        console.error("Reminder checkpoint email failed:", err)
      );
    }, delay);

    timers.set(timerKey(id, cp.label), handle);
  }
}

/**
 * Rehydrates all pending timers from the database. Call once on server
 * boot (after the DB connection opens) — in-memory timers don't survive
 * a restart, same as the Academic Email Agent's EmailScheduler.
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
}