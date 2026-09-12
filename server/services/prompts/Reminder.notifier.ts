/**
 * Reminder.notifier.ts
 *
 * Composes and sends reminder-related emails. This module never decides
 * WHETHER to email someone — that's deterministic, based on `category` and
 * `attendees`, same philosophy as Priority.util.ts calculating priority
 * instead of leaving it to the LLM. The agent's job is only to collect the
 * task/date/time/attendees; this file always sends the same email for the
 * same inputs.
 *
 * Two kinds of email:
 *  1. sendReminderConfirmationEmail — fired once, right when the reminder
 *     is created.
 *       - category === "Meeting" with attendees -> meeting notice to the
 *         owner + every attendee.
 *       - everything else -> "reminder created" confirmation to the owner
 *         only.
 *  2. sendDeadlineReminderEmail — fired later by Reminder.scheduler.ts as a
 *     deadline checkpoint (7d/3d/1d/2h/30m) is reached.
 *
 * Uses the project's existing utils/EmailSender.ts (`sendEmail`), which
 * takes a single `to` string, a `subject`, and a plain-text `body` — no
 * HTML and no array of recipients. Multiple recipients are passed as one
 * comma-separated string, which Nodemailer accepts natively even though
 * the helper's TypeScript signature only types `to` as `string`.
 */

import { sendEmail } from "../../utils/EmailSender.js";
import User from "../../models/User.js";
import type { IReminder } from "../../models/Reminder.model.js";

export interface AttendeeInfo {
  userId?: string;
  name: string;
  email: string;
}

interface NotifyArgs {
  reminder: IReminder;
  attendees: AttendeeInfo[];
  ownerUserId: string;
}

async function getOwner(ownerUserId: string) {
  const owner = await User.findById(ownerUserId).select("_id name email");

  if (!owner) return null;

  return {
    userId: owner._id.toString(),
    name: owner.name as string,
    email: owner.email as string,
  };
}

function formatWhen(reminder: IReminder) {
  return `${reminder.date} at ${reminder.time}`;
}

function isMeeting(reminder: IReminder) {
  return (reminder.category ?? "").toLowerCase() === "meeting";
}

/**
 * Sent once, immediately after a reminder is successfully created.
 */
export async function sendReminderConfirmationEmail({
  reminder,
  attendees,
  ownerUserId,
}: NotifyArgs): Promise<void> {
  const owner = await getOwner(ownerUserId);

  if (!owner) return;

  if (isMeeting(reminder) && attendees.length > 0) {
    const recipients = [owner.email, ...attendees.map((a) => a.email)].join(
      ", "
    );
    const attendeeNames = [owner.name, ...attendees.map((a) => a.name)].join(
      ", "
    );

    await sendEmail({
      to: recipients,
      subject: `Meeting scheduled: ${reminder.task}`,
      body:
        `${owner.name} has scheduled a meeting: "${reminder.task}"\n` +
        `When: ${formatWhen(reminder)}\n` +
        `Attendees: ${attendeeNames}` +
        (reminder.notes ? `\nNotes: ${reminder.notes}` : "") +
        `\n\n— Aevion.AI`,
      fromName: "Aevion.AI Reminders",
    });

    return;
  }

  // Non-meeting categories (Quiz, Assignment, Exam, etc.) -> owner only.
  await sendEmail({
    to: owner.email,
    subject: `Reminder set: ${reminder.task}`,
    body:
      `Hi ${owner.name},\n\n` +
      `Your reminder has been created:\n` +
      `Task: ${reminder.task}\n` +
      `Category: ${reminder.category}\n` +
      `Due: ${formatWhen(reminder)}` +
      (reminder.notes ? `\nNotes: ${reminder.notes}` : "") +
      `\n\nWe'll email you again as the deadline gets closer.` +
      `\n\n— Aevion.AI`,
    fromName: "Aevion.AI Reminders",
  });
}

/**
 * Sent by Reminder.scheduler.ts as a deadline checkpoint (e.g. "2 hours") is
 * reached. Meeting reminders notify the owner + attendees; everything else
 * notifies the owner only.
 */
export async function sendDeadlineReminderEmail({
  reminder,
  attendees,
  ownerUserId,
  label,
}: NotifyArgs & { label: string }): Promise<void> {
  const owner = await getOwner(ownerUserId);

  if (!owner) return;

  const meeting = isMeeting(reminder);

  const recipients = (
    meeting && attendees.length > 0
      ? [owner.email, ...attendees.map((a) => a.email)]
      : [owner.email]
  ).join(", ");

  await sendEmail({
    to: recipients,
    subject: `${meeting ? "Meeting" : "Reminder"} in ${label}: ${reminder.task}`,
    body:
      `This is a reminder that "${reminder.task}" is due in ${label} ` +
      `(${formatWhen(reminder)}).` +
      (reminder.notes ? `\nNotes: ${reminder.notes}` : "") +
      `\n\n— Aevion.AI`,
    fromName: "Aevion.AI Reminders",
  });
}