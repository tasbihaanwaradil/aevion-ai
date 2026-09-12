/**
 * priority.util.ts
 *
 * Deterministic priority + overdue calculation, per spec sections 9-10.
 * This is intentionally NOT left to the LLM — priority must be computed the
 * same way every time from the backend's own clock, not "decided" by the model.
 */

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export type ReminderPriority = "LOW" | "MEDIUM" | "HIGH";

export interface PriorityInput {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timezone: string; // e.g. "Asia/Karachi"
  now?: Date; // injectable for testing; defaults to current time
  userStatedUrgent?: boolean; // true if the user explicitly called it urgent/critical
}

export interface PriorityResult {
  priority: ReminderPriority;
  isOverdue: boolean;
  hoursUntilDeadline: number;
}

/**
 * Calculates priority + overdue status from a reminder's date/time and the
 * backend's current date/time, per spec section 9-10:
 *  - HIGH: overdue, due today, due within 24h, or user explicitly flags urgency
 *  - MEDIUM: > 24h and <= 7 days away
 *  - LOW: > 7 days away
 */
export function calculatePriority(input: PriorityInput): PriorityResult {
  const { date, time, timezone: tz, userStatedUrgent } = input;

  const deadline = dayjs.tz(`${date} ${time}`, "YYYY-MM-DD HH:mm", tz);
  const now = input.now ? dayjs(input.now).tz(tz) : dayjs().tz(tz);

  const hoursUntilDeadline = deadline.diff(now, "hour", true);
  const isOverdue = hoursUntilDeadline < 0;
  const isDueToday = deadline.format("YYYY-MM-DD") === now.format("YYYY-MM-DD");

  let priority: ReminderPriority;

  if (isOverdue || isDueToday || hoursUntilDeadline <= 24 || userStatedUrgent) {
    priority = "HIGH";
  } else if (hoursUntilDeadline <= 24 * 7) {
    priority = "MEDIUM";
  } else {
    priority = "LOW";
  }

  return { priority, isOverdue, hoursUntilDeadline };
}

/**
 * Validates a YYYY-MM-DD / HH:mm pair actually represents a real calendar
 * date/time (catches things like 2026-02-30).
 */
export function isValidDateTime(date: string, time: string, tz: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
    return false;
  }
  const parsed = dayjs.tz(`${date} ${time}`, "YYYY-MM-DD HH:mm", tz);
  return parsed.isValid() && parsed.format("YYYY-MM-DD") === date;
}