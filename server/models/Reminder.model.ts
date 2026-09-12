/**
 * reminder.model.ts
 *
 * Mongoose schema for reminders, matching the field list in the Reminder Agent spec:
 * task, date, time, priority, status, category, notes, userId, createdAt, updatedAt,
 * notificationSent.
 *
 * `googleEventId` is included as optional to slot into the existing Google Calendar
 * sync described elsewhere in the project, but is never required by the agent itself.
 *
 * NEW (email feature):
 * - `attendees` — resolved {userId, name, email} entries for Meeting-category
 *   reminders, so meeting notice emails don't need to re-resolve names every time.
 * - `timezone` — the timezone the reminder was created in, so the deadline-email
 *   scheduler computes offsets correctly even if the server's default changes.
 * - `sentDeadlineReminders` — which "time left" checkpoint emails (7d/3d/1d/2h/30m)
 *   have already fired, so restarts/reschedules never send a duplicate.
 */

import { Schema, model, Document, Types } from "mongoose";

export type ReminderPriority = "LOW" | "MEDIUM" | "HIGH";
export type ReminderStatus = "pending" | "overdue" | "completed" | "cancelled";
export type ReminderCategory =
  | "Assignment"
  | "Quiz"
  | "Exam"
  | "Research Paper"
  | "FYP Task"
  | "Presentation"
  | "Class"
  | "Thesis"
  | "Project Submission"
  | "Meeting"
  | "Interview"
  | "Work Task"
  | "Report"
  | "Client Deadline"
  | "Job Application"
  | "Professional Presentation"
  | "Academic"
  | "Professional"
  | "Other";

export interface IReminderAttendee {
  userId?: Types.ObjectId;
  name: string;
  email: string;
}

export interface IReminder extends Document {
  userId: Types.ObjectId;
  task: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h)
  priority: ReminderPriority;
  status: ReminderStatus;
  category: ReminderCategory;
  notes?: string;
  notificationSent: boolean;
  googleEventId?: string;
  attendees: IReminderAttendee[];
  timezone: string;
  sentDeadlineReminders: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AttendeeSchema = new Schema<IReminderAttendee>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  { _id: false }
);

const ReminderSchema = new Schema<IReminder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    task: { type: String, required: true, trim: true, maxlength: 300 },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    time: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      required: true,
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["pending", "overdue", "completed", "cancelled"],
      required: true,
      default: "pending",
      index: true,
    },
    category: {
      type: String,
      default: "Other",
    },
    notes: { type: String, maxlength: 1000 },
    notificationSent: { type: Boolean, required: true, default: false },
    googleEventId: { type: String },
    attendees: { type: [AttendeeSchema], default: [] },
    timezone: { type: String, default: "Asia/Karachi" },
    sentDeadlineReminders: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Common compound index for "active reminders for this user, ordered by deadline"
ReminderSchema.index({ userId: 1, status: 1, date: 1, time: 1 });

export const Reminder = model<IReminder>("Reminder", ReminderSchema);