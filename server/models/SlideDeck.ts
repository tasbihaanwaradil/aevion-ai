import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISlideBullet {
  point: string;
  description: string;
}

export interface ISlide {
  title: string;
  bullets: ISlideBullet[];
}

export type SlideDeckStatus = "draft" | "downloaded";
export type SlideTone = "Conversational" | "Formal" | "Academic" | "Simple";

export interface ISlideDeck extends Document {
  teacher: Types.ObjectId;
  topic: string;
  outline?: string;
  tone: SlideTone;
  deckTitle: string;
  slides: ISlide[];
  status: SlideDeckStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BulletSchema = new Schema<ISlideBullet>(
  {
    point: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const SlideSchema = new Schema<ISlide>(
  {
    title: { type: String, required: true },
    bullets: { type: [BulletSchema], default: [] },
  },
  { _id: false }
);

const SlideDeckSchema = new Schema<ISlideDeck>(
  {
    // If protectTeacher attaches something other than `req.teacher._id`
    // (e.g. a different model name), update the `ref` below to match.
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    topic: { type: String, required: true },
    outline: { type: String, default: "" },
    tone: {
      type: String,
      enum: ["Conversational", "Formal", "Academic", "Simple"],
      default: "Conversational",
    },
    deckTitle: { type: String, required: true },
    slides: { type: [SlideSchema], default: [] },
    status: { type: String, enum: ["draft", "downloaded"], default: "draft" },
  },
  { timestamps: true }
);

export default mongoose.model<ISlideDeck>("SlideDeck", SlideDeckSchema);