import crypto from "crypto";
import { Request, Response } from "express";
import Session from "../models/Session.js";
import Quiz from "../models/Quiz.js";

const generateRoomCode = async (): Promise<string> => {
  let code = "";
  let exists = true;
  while (exists) {
    code = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 hex chars
    exists = !!(await Session.exists({
      roomCode: code,
      status: { $ne: "finished" },
    }));
  }
  return code;
};

// Teacher picks a quiz + delivery settings and creates a launchable session.
export const createSession = async (req: Request, res: Response) => {
  const { teacherId } = req.session;
  const { quizId, settings } = req.body;

  if (!teacherId) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  if (!quizId) {
    return res.status(400).json({ message: "quizId is required" });
  }

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (String(quiz.teacherId) !== String(teacherId)) {
      return res
        .status(403)
        .json({ message: "Not authorized to launch this quiz" });
    }

    const roomCode = await generateRoomCode();

    const session = await Session.create({
      teacherId,
      quizId: quiz._id,
      title: quiz.title,
      roomCode,
      status: "waiting",
      settings: {
        requireNames: settings?.requireNames ?? true,
        shuffleQuestions: settings?.shuffleQuestions ?? false,
        shuffleAnswers: settings?.shuffleAnswers ?? false,
        showQuestionFeedback: settings?.showQuestionFeedback ?? true,
        showFinalScore: settings?.showFinalScore ?? false,
      },
      questions: quiz.questions,
      participants: [],
    });

    res.json({ success: true, session });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to launch quiz" });
  }
};

// Teacher's live results page — reload-safe fetch of full session state.
export const getSessionById = async (req: Request, res: Response) => {
  const { teacherId } = req.session;

  if (!teacherId) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (String(session.teacherId) !== String(teacherId)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this session" });
    }

    res.json({ success: true, session });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to load session" });
  }
};
