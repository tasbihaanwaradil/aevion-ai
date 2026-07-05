import mongoose, { Document } from "mongoose";

export interface IQuizQuestion {
  id: string;
  type: "MCQ" | "TrueFalse" | "ShortAnswer";
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
}

export interface IQuiz extends Document {
  userId: string;
  title: string;
  sourceType: "topic" | "pdf" | "pptx";
  sourceFileName?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questions: IQuizQuestion[];
  createdAt?: Date;
  updatedAt?: Date;
}

const QuizQuestionSchema = new mongoose.Schema<IQuizQuestion>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["MCQ", "TrueFalse", "ShortAnswer"], required: true },
    question: { type: String, required: true },
    options: { type: [String], default: null },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const QuizSchema = new mongoose.Schema<IQuiz>(
  {
    userId: { type: String, ref: "User", required: true },
    title: { type: String, required: true },
    sourceType: { type: String, enum: ["topic", "pdf", "pptx"], required: true },
    sourceFileName: { type: String },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    questions: { type: [QuizQuestionSchema], required: true },
  },
  { timestamps: true }
);

const Quiz = mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);

export default Quiz;