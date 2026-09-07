import mongoose, { Document, Schema } from "mongoose";
import { IQuizQuestion } from "./Quiz.js";

export interface ISessionAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

export interface ISessionParticipant {
  participantId: string;
  name: string;
  answers: ISessionAnswer[];
  score: number;
  currentIndex: number;
  completed: boolean;
  completedAt?: Date;
}

export interface ISessionSettings {
  requireNames: boolean;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showQuestionFeedback: boolean;
  showFinalScore: boolean;
}

export interface ISession extends Document {
  teacherId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  title: string;
  roomCode: string;
  status: "waiting" | "active" | "paused" | "finished";
  settings: ISessionSettings;
  questions: IQuizQuestion[];
  participants: ISessionParticipant[];
  createdAt?: Date;
  updatedAt?: Date;
}

const SessionAnswerSchema = new Schema<ISessionAnswer>(
  {
    questionId: { type: String, required: true },
    answer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false },
);

const SessionParticipantSchema = new Schema<ISessionParticipant>(
  {
    participantId: { type: String, required: true },
    name: { type: String, required: true },
    answers: { type: [SessionAnswerSchema], default: [] },
    score: { type: Number, default: 0 },
    currentIndex: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: false },
);

const QuestionSnapshotSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["MCQ", "TrueFalse", "ShortAnswer"],
      required: true,
    },
    question: { type: String, required: true },
    options: { type: [String], default: null },
    correctAnswer: { type: String, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false },
);

const SessionSchema = new Schema<ISession>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    title: { type: String, required: true },
    roomCode: { type: String, required: true, unique: true, uppercase: true },
    status: {
      type: String,
      enum: ["waiting", "active", "paused", "finished"],
      default: "waiting",
    },
    settings: {
      requireNames: { type: Boolean, default: true },
      shuffleQuestions: { type: Boolean, default: false },
      shuffleAnswers: { type: Boolean, default: false },
      showQuestionFeedback: { type: Boolean, default: true },
      showFinalScore: { type: Boolean, default: false },
    },
    questions: { type: [QuestionSnapshotSchema], required: true },
    participants: { type: [SessionParticipantSchema], default: [] },
  },
  { timestamps: true },
);

const Session =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

export default Session;
