import { IReminder } from "../models/Reminder.js";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Deterministic (non-LLM) priority calculation — same philosophy as the
 * rest of the Reminder Agent's overdue/priority logic.
 *
 * - Overdue or under 24h out: High, regardless of category.
 * - Exams escalate earlier than other categories (High inside 3 days,
 *   Medium inside a week).
 * - Everything else: Medium inside 3 days, Low beyond that.
 */
export function computePriority(
  deadline: Date,
  category: string
): "Low" | "Medium" | "High" {
  const msUntil = deadline.getTime() - Date.now();

  if (msUntil <= 0) return "High";
  if (msUntil <= DAY) return "High";

  if (category === "Exam") {
    if (msUntil <= 3 * DAY) return "High";
    if (msUntil <= 7 * DAY) return "Medium";
    return "Low";
  }

  if (msUntil <= 3 * DAY) return "Medium";
  return "Low";
}

export function isOverdue(
  reminder: Pick<IReminder, "deadline" | "completed">
): boolean {
  return !reminder.completed && new Date(reminder.deadline).getTime() < Date.now();
}