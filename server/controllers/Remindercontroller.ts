import { Request, Response } from "express";
import Reminder, { IReminder } from "../models/Reminder.js";
import Teacher from "../models/Teacher.js";
import { sendEmail } from "../utils/EmailSender.js";
import { computePriority, isOverdue } from "../utils/Priority.js";
import { scheduleReminder, cancelReminderTimers } from "../utils/Reminderscheduler.js";

// Session-based auth: the Google OAuth callback and (assumed) local
// login both set req.session.teacherId directly — there is no req.user.
function getUserId(req: Request): string | undefined {
  return req.session?.teacherId?.toString();
}

function serialize(reminder: IReminder) {
  const obj = reminder.toObject();
  return { ...obj, overdue: isOverdue(obj) };
}

// Attendees are taken directly as given — they don't need to be
// registered platform users. resolveAttendees is only a convenience
// lookup against the Teacher collection when a bare name has no email.
async function resolveAttendees(
  rawAttendees: { name: string; email?: string }[]
) {
  const resolved: { name: string; email: string }[] = [];
  for (const a of rawAttendees) {
    if (a.email) {
      resolved.push({ name: a.name, email: a.email.toLowerCase().trim() });
      continue;
    }
    const user = await Teacher.findOne({ name: a.name });
    if (user?.email) {
      resolved.push({ name: a.name, email: user.email });
    }
  }
  return resolved;
}

// ── CREATE ──────────────────────────────────────────────────────────────
export async function createReminder(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }

    const { title, description, category, deadline, attendees } = req.body;

    if (!title || !deadline) {
      return res
        .status(400)
        .json({ success: false, message: "Title and deadline are required." });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid deadline." });
    }

    const duplicate = await Reminder.findOne({
      userId,
      title: title.trim(),
      deadline: deadlineDate,
      completed: false,
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "A reminder with the same title and deadline already exists.",
      });
    }

    const resolvedAttendees =
      category === "Meeting" && Array.isArray(attendees)
        ? await resolveAttendees(attendees)
        : [];

    if (category === "Meeting" && resolvedAttendees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Meeting reminders need at least one attendee with an email.",
      });
    }

    const reminder = await Reminder.create({
      userId,
      title: title.trim(),
      description: description?.trim() ?? "",
      category: category ?? "General",
      deadline: deadlineDate,
      priority: computePriority(deadlineDate, category ?? "General"),
      attendees: resolvedAttendees,
    });

    // Immediate notice: owner always gets a confirmation; meeting
    // attendees get an invite too. Individual send failures are logged,
    // not fatal — the reminder itself is already saved.
    const owner = await Teacher.findById(userId);
    if (owner?.email) {
      await sendEmail({
        to: owner.email,
        subject:
          category === "Meeting"
            ? `Meeting scheduled: ${reminder.title}`
            : `Reminder created: ${reminder.title}`,
        body: `"${reminder.title}" is due ${deadlineDate.toLocaleString()}.${
          description ? `\n\n${description}` : ""
        }`,
        fromName: "Aevion.AI Reminders",
      }).catch((err) => console.error("Owner notice email failed:", err));
    }

    if (category === "Meeting") {
      for (const attendee of resolvedAttendees) {
        await sendEmail({
          to: attendee.email,
          subject: `You've been invited: ${reminder.title}`,
          body: `You're invited to "${reminder.title}" on ${deadlineDate.toLocaleString()}.${
            description ? `\n\n${description}` : ""
          }`,
          fromName: "Aevion.AI Reminders",
        }).catch((err) => console.error("Attendee invite email failed:", err));
      }
    }

    scheduleReminder(reminder);

    return res.status(201).json({
      success: true,
      reminder: serialize(reminder),
      reminders: [serialize(reminder)],
    });
  } catch (err) {
    console.error("createReminder error:", err);
    return res.status(500).json({ success: false, message: "Failed to create reminder." });
  }
}

// ── READ ────────────────────────────────────────────────────────────────
export async function getReminders(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }
    const { completed } = req.query;

    const filter: Record<string, unknown> = { userId };
    if (completed !== undefined) {
      filter.completed = completed === "true";
    }

    const reminders = await Reminder.find(filter).sort({ deadline: 1 });
    return res.json({ success: true, reminders: reminders.map(serialize) });
  } catch (err) {
    console.error("getReminders error:", err);
    return res.status(500).json({ success: false, message: "Failed to load reminders." });
  }
}

export async function getToday(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const reminders = await Reminder.find({
      userId,
      completed: false,
      deadline: { $gte: start, $lte: end },
    }).sort({ deadline: 1 });

    return res.json({ success: true, reminders: reminders.map(serialize) });
  } catch (err) {
    console.error("getToday error:", err);
    return res.status(500).json({ success: false, message: "Failed to load today's reminders." });
  }
}

export async function getUpcoming(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }
    const reminders = await Reminder.find({
      userId,
      completed: false,
      deadline: { $gt: new Date() },
    }).sort({ deadline: 1 });

    return res.json({ success: true, reminders: reminders.map(serialize) });
  } catch (err) {
    console.error("getUpcoming error:", err);
    return res.status(500).json({ success: false, message: "Failed to load upcoming reminders." });
  }
}

export async function getOverdue(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }
    const reminders = await Reminder.find({
      userId,
      completed: false,
      deadline: { $lt: new Date() },
    }).sort({ deadline: 1 });

    return res.json({ success: true, reminders: reminders.map(serialize) });
  } catch (err) {
    console.error("getOverdue error:", err);
    return res.status(500).json({ success: false, message: "Failed to load overdue reminders." });
  }
}

// Priority is a string enum, so we rank it in JS rather than relying on
// Mongo's lexical string sort (which would put "High" before "Low" only
// by accident of alphabetical order).
const PRIORITY_RANK: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

export async function getMostUrgent(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }
    const candidates = await Reminder.find({ userId, completed: false }).sort({
      deadline: 1,
    });

    const top = candidates.sort((a, b) => {
      const rankDiff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (rankDiff !== 0) return rankDiff;
      return a.deadline.getTime() - b.deadline.getTime();
    })[0];

    return res.json({ success: true, reminder: top ? serialize(top) : null });
  } catch (err) {
    console.error("getMostUrgent error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load the most urgent reminder." });
  }
}

// ── UPDATE ──────────────────────────────────────────────────────────────
export async function updateReminder(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }
    const { id } = req.params;
    const { title, description, category, deadline, attendees } = req.body;

    const reminder = await Reminder.findOne({ _id: id, userId });
    if (!reminder) {
      return res.status(404).json({ success: false, message: "Reminder not found." });
    }

    if (title !== undefined) reminder.title = title.trim();
    if (description !== undefined) reminder.description = description.trim();
    if (category !== undefined) reminder.category = category;

    if (deadline !== undefined) {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid deadline." });
      }
      reminder.deadline = deadlineDate;
      // Deadline moved — checkpoints already fired no longer apply at
      // the new distance, so let them re-fire against the new deadline.
      reminder.notifiedCheckpoints = [];
    }

    if (reminder.category === "Meeting" && Array.isArray(attendees)) {
      reminder.attendees = await resolveAttendees(attendees);
    } else if (reminder.category !== "Meeting") {
      reminder.attendees = [];
    }

    reminder.priority = computePriority(reminder.deadline, reminder.category);

    await reminder.save();
    scheduleReminder(reminder);

    return res.json({
      success: true,
      reminder: serialize(reminder),
      reminders: [serialize(reminder)],
    });
  } catch (err) {
    console.error("updateReminder error:", err);
    return res.status(500).json({ success: false, message: "Failed to update reminder." });
  }
}

// ── COMPLETE ────────────────────────────────────────────────────────────
export async function completeReminder(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }
    const { id } = req.params;

    const reminder = await Reminder.findOne({ _id: id, userId });
    if (!reminder) {
      return res.status(404).json({ success: false, message: "Reminder not found." });
    }

    reminder.completed = true;
    reminder.completedAt = new Date();
    await reminder.save();

    cancelReminderTimers(String(reminder._id));

    return res.json({ success: true, reminder: serialize(reminder) });
  } catch (err) {
    console.error("completeReminder error:", err);
    return res.status(500).json({ success: false, message: "Failed to complete reminder." });
  }
}

// ── DELETE ──────────────────────────────────────────────────────────────
export async function deleteReminder(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }
    const { id } = req.params;

    const reminder = await Reminder.findOneAndDelete({ _id: id, userId });
    if (!reminder) {
      return res.status(404).json({ success: false, message: "Reminder not found." });
    }

    cancelReminderTimers(String(reminder._id));

    return res.json({ success: true });
  } catch (err) {
    console.error("deleteReminder error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete reminder." });
  }
}

// ── DUPLICATE CHECK ─────────────────────────────────────────────────────
export async function checkDuplicate(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }
    const { title, deadline } = req.query;

    if (!title || !deadline) {
      return res
        .status(400)
        .json({ success: false, message: "title and deadline are required." });
    }

    const existing = await Reminder.findOne({
      userId,
      title: String(title).trim(),
      deadline: new Date(String(deadline)),
      completed: false,
    });

    return res.json({ success: true, duplicate: Boolean(existing) });
  } catch (err) {
    console.error("checkDuplicate error:", err);
    return res.status(500).json({ success: false, message: "Failed to check for duplicates." });
  }
}