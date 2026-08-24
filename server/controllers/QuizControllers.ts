import { Request, Response } from "express";
import Quiz from "../models/Quiz.js";
import { generateQuizAgent } from "../services/QuizAgent.js";

// STEP 1: generate a preview of questions — does NOT touch the database.
export const generateQuizPreview = async (req: Request, res: Response) => {
  const {
    topic,
    difficulty = "Medium",
    questionCount = 10,
    questionTypes,
    generateExplanations = true,
  } = req.body;

  if (!topic || topic.trim().length < 5) {
    return res.status(400).json({ message: "Please provide a topic (at least 5 characters)" });
  }

  const parsedTypes: string[] =
    Array.isArray(questionTypes) && questionTypes.length > 0
      ? questionTypes
      : ["MCQ", "TrueFalse", "ShortAnswer"];

  try {
    const result = await generateQuizAgent({
      topic,
      difficulty,
      questionCount: Number(questionCount),
      questionTypes: parsedTypes,
      generateExplanations: Boolean(generateExplanations),
    });

    res.json({ success: true, suggestedTitle: result.title, questions: result.questions });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate quiz questions" });
  }
};

// STEP 2: user has picked which generated questions to keep — persist the quiz.
export const createQuiz = async (req: Request, res: Response) => {
  const { teacherId } = req.session;
  const { title = "Untitled Quiz", difficulty = "Medium", questions = [] } = req.body;

  if (!teacherId) {
    return res.status(401).json({ message: "Please log in to save a quiz." });
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: "At least one question is required" });
  }

  try {
    const quizDoc = await Quiz.create({ teacherId, title, difficulty, questions });
    res.json({ success: true, quiz: quizDoc });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to save quiz" });
  }
};

// List all quizzes owned by the logged-in teacher (for Library.tsx)
export const getMyQuizzes = async (req: Request, res: Response) => {
  const { teacherId } = req.session;

  if (!teacherId) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    const quizzes = await Quiz.find({ teacherId })
      .select("title difficulty updatedAt")
      .sort({ updatedAt: -1 });

    res.json({ success: true, quizzes });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to load quizzes" });
  }
};

export const getQuizById = async (req: Request, res: Response) => {
  const { teacherId } = req.session;

  if (!teacherId) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });

  if (String(quiz.teacherId) !== String(teacherId)) {
    return res.status(403).json({ message: "Not authorized to view this quiz" });
  }

  res.json({ success: true, quiz });
};

// Editor screen: title edits, question edits/deletes/reorders/duplicates.
export const updateQuiz = async (req: Request, res: Response) => {
  const { teacherId } = req.session;
  const { title, questions } = req.body;

  if (!teacherId) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    const existing = await Quiz.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Quiz not found" });

    if (String(existing.teacherId) !== String(teacherId)) {
      return res.status(403).json({ message: "Not authorized to edit this quiz" });
    }

    if (title !== undefined) existing.title = title;
    if (questions !== undefined) existing.questions = questions;
    await existing.save();

    res.json({ success: true, quiz: existing });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to update quiz" });
  }
};

// Delete a quiz (wired to the trash icon in Library.tsx)
export const deleteQuiz = async (req: Request, res: Response) => {
  const { teacherId } = req.session;

  if (!teacherId) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (String(quiz.teacherId) !== String(teacherId)) {
      return res.status(403).json({ message: "Not authorized to delete this quiz" });
    }

    await quiz.deleteOne();
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete quiz" });
  }
};