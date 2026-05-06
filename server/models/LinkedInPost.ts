import mongoose, { Document } from "mongoose";

export interface ILinkedInPost extends Document {
    userId: string;
    topic: string;
    content: string;
    targetAudience: "Professionals" | "Entrepreneurs" | "Students" | "Developers";
    tone: "Professional" | "Casual" | "Inspirational" | "Informative";
    isGenerating?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const LinkedInPostSchema = new mongoose.Schema<ILinkedInPost>(
    {
        userId: { type: String, ref: 'User', required: true },
        topic: { type: String, required: true, trim: true },
        content: { type: String, default: "" },
        targetAudience: {
            type: String,
            enum: ["Professionals", "Entrepreneurs", "Students", "Developers"],
            required: true
        },
        tone: {
            type: String,
            enum: ["Professional", "Casual", "Inspirational", "Informative"],
            required: true
        },
        isGenerating: { type: Boolean, default: false },
    },
    { timestamps: true } // ✅ important
);

const LinkedInPost =
    mongoose.models.LinkedInPost ||
    mongoose.model<ILinkedInPost>('LinkedInPost', LinkedInPostSchema);

export default LinkedInPost;