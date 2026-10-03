import crypto from "crypto";
import { Request, Response } from "express";
import Session, { ISessionParticipant } from "../models/Session.js";
import Quiz, { IQuizQuestion } from "../models/Quiz.js";

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
  const { quizId, mode, settings } = req.body;

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
      mode: mode === "space-race" ? "space-race" : "quiz",
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

// List finished sessions (for the Reports page)
export const getFinishedSessions = async (req: Request, res: Response) => {
  const { teacherId } = req.session;

  if (!teacherId) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    const sessions = await Session.find({ teacherId, status: "finished" })
      .select(
        "title roomCode mode updatedAt participants questions isShared shareCode",
      )
      .sort({ updatedAt: -1 });

    const reports = sessions.map((s) => {
      const totalQuestions = s.questions.length;
      const attempted = s.participants.length;
      const avgScore =
        attempted > 0
          ? Math.round(
              s.participants.reduce(
                (sum: number, p: ISessionParticipant) =>
                  sum +
                  (totalQuestions > 0 ? (p.score / totalQuestions) * 100 : 0),
                0,
              ) / attempted,
            )
          : 0;

      return {
        id: s._id,
        title: s.title,
        roomCode: s.roomCode,
        mode: s.mode,
        updatedAt: s.updatedAt,
        attempted,
        avgScore,
        isShared: s.isShared,
        shareCode: s.shareCode,
      };
    });

    res.json({ success: true, reports });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to load reports" });
  }
};

// Toggle public sharing for a finished session's results
export const toggleSessionSharing = async (req: Request, res: Response) => {
  const { teacherId } = req.session;
  const { enabled } = req.body;

  if (!teacherId) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Report not found" });

    if (String(session.teacherId) !== String(teacherId)) {
      return res
        .status(403)
        .json({ message: "Not authorized to share this report" });
    }

    session.isShared = Boolean(enabled);
    if (session.isShared && !session.shareCode) {
      session.shareCode = `RPT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    }
    await session.save();

    res.json({ success: true, session });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to update sharing settings" });
  }
};

// Public, unauthenticated: view a shared report by its share code
export const getPublicReport = async (req: Request, res: Response) => {
  try {
    const session = await Session.findOne({
      shareCode: req.params.shareCode,
      isShared: true,
    });

    if (!session) {
      return res
        .status(404)
        .json({ message: "This report was not found or is no longer shared." });
    }

    res.json({
      success: true,
      report: {
        title: session.title,
        updatedAt: session.updatedAt,
        questions: session.questions.map((q: IQuizQuestion) => ({
          id: q.id,
          question: q.question,
          type: q.type,
        })),
        participants: session.participants.map((p: ISessionParticipant) => ({
          name: p.name,
          score: p.score,
          answers: p.answers,
        })),
      },
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to load report" });
  }
};
