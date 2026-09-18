// models/AcademicEmail.ts

import mongoose, { Document } from "mongoose";

export interface IAcademicEmail extends Document {
  teacherId: string;
  senderName: string;
  recipient: string;
  recipientEmail: string;
  purpose: string;
  tone: "Formal" | "Respectful" | "Semi-Formal";
  subject: string;
  body: string;
  sent: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const AcademicEmailSchema = new mongoose.Schema<IAcademicEmail>(
  {
    teacherId:      { type: String, ref: "Teacher", required: true },
    senderName:     { type: String, default: "" },
    recipient:      { type: String, required: true, trim: true },
    recipientEmail: { type: String, default: "" },
    purpose:        { type: String, required: true, trim: true },
    tone:           { type: String, enum: ["Formal", "Respectful", "Semi-Formal"], required: true },
    subject:        { type: String, required: true },
    body:           { type: String, required: true },
    sent:           { type: Boolean, default: false }, // true after Send Email is clicked
  },
  { timestamps: true }
);

const AcademicEmail =
  mongoose.models.AcademicEmail ||
  mongoose.model<IAcademicEmail>("AcademicEmail", AcademicEmailSchema);

export default AcademicEmail;