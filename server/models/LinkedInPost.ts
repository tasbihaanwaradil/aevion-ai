// models/LinkedInPost.ts

import mongoose, { Document } from "mongoose";

export type PostType =
  | "session_conducted"
  | "student_achievement"
  | "workshop_event"
  | "research_insight"
  | "faculty_development";

export type PostTone = "Reflective" | "Informative" | "Celebratory" | "Inspirational";
export type PostStatus = "draft" | "approved" | "posted";

export interface ILinkedInPost extends Document {
  userId: string;
  topic: string;
  postType: PostType;
  tone: PostTone;
  content: string;
  status: PostStatus;
  isGenerating: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const LinkedInPostSchema = new mongoose.Schema<ILinkedInPost>(
  {
    userId: { type: String, ref: "User", required: true },
    topic: { type: String, required: true, trim: true },
    postType: {
      type: String,
      enum: ["session_conducted", "student_achievement", "workshop_event", "research_insight", "faculty_development"],
      required: true,
    },
    tone: {
      type: String,
      enum: ["Reflective", "Informative", "Celebratory", "Inspirational"],
      required: true,
    },
    content: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "approved", "posted"],
      default: "draft",
    },
    isGenerating: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const LinkedInPost =
  mongoose.models.LinkedInPost ||
  mongoose.model<ILinkedInPost>("LinkedInPost", LinkedInPostSchema);

export default LinkedInPost;