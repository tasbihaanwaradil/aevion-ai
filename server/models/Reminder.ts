import mongoose, { Schema, Document, Types } from "mongoose";

export type ReminderCategory =
  | "General"
  | "Assignment"
  | "Exam"
  | "Meeting"
  | "Other";
export type ReminderPriority = "Low" | "Medium" | "High";

export interface IAttendee {
  name: string;
  email: string;
}

export interface IReminder extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  category: ReminderCategory;
  deadline: Date;
  priority: ReminderPriority;
  completed: boolean;
  completedAt?: Date;
  attendees: IAttendee[];
  // Which checkpoint emails (7d/3d/1d/2h/30m) have already fired for this
  // reminder — prevents duplicate sends across server restarts.
  notifiedCheckpoints: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AttendeeSchema = new Schema<IAttendee>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false }
);

const ReminderSchema = new Schema<IReminder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    category: {
      type: String,
      enum: ["General", "Assignment", "Exam", "Meeting", "Other"],
      default: "General",
    },
    deadline: { type: Date, required: true, index: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    attendees: { type: [AttendeeSchema], default: [] },
    notifiedCheckpoints: { type: [String], default: [] },
  },
  { timestamps: true }
);

ReminderSchema.index({ userId: 1, deadline: 1 });

export default mongoose.model<IReminder>("Reminder", ReminderSchema);