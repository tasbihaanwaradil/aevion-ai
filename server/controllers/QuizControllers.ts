import crypto from "crypto";
import { Request, Response } from "express";
import Quiz, { IQuizQuestion } from "../models/Quiz.js";
import { generateQuizAgent } from "../services/QuizAgent.js";
import { generateQuizPdf } from "../services/QuizPdfExporter.js";
import { extractTextFromDocument } from "../services/DocumentTextExtractor.js";
import { generateQuizFromDocumentAgent } from "../services/QuizAgent.js";

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
    return res
      .status(400)
      .json({ message: "Please provide a topic (at least 5 characters)" });
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

    res.json({
      success: true,
      suggestedTitle: result.title,
      questions: result.questions,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate quiz questions" });
  }
};

// STEP 2: user has picked which generated questions to keep — persist the quiz.
export const createQuiz = async (req: Request, res: Response) => {
  const { teacherId } = req.session;
  const {
    title = "Untitled Quiz",
    difficulty = "Medium",
    questions = [],
  } = req.body;

  if (!teacherId) {
    return res.status(401).json({ message: "Please log in to save a quiz." });
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return res
      .status(400)
      .json({ message: "At least one question is required" });
  }

  try {
    const quizDoc = await Quiz.create({
      teacherId,
      title,
      difficulty,
      questions,
    });
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
      .select("title difficulty updatedAt isShared shareCode")
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
    return res
      .status(403)
      .json({ message: "Not authorized to view this quiz" });
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
      return res
        .status(403)
        .json({ message: "Not authorized to edit this quiz" });
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
      return res
        .status(403)
        .json({ message: "Not authorized to delete this quiz" });
    }

    await quiz.deleteOne();
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete quiz" });
  }
};

// Toggle sharing on/off. Generates a share code the first time it's enabled.
export const toggleQuizSharing = async (req: Request, res: Response) => {
  const { teacherId } = req.session;
  const { enabled } = req.body;

  if (!teacherId) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (String(quiz.teacherId) !== String(teacherId)) {
      return res
        .status(403)
        .json({ message: "Not authorized to share this quiz" });
    }

    quiz.isShared = Boolean(enabled);
    if (quiz.isShared && !quiz.shareCode) {
      quiz.shareCode = `QZ-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    }
    await quiz.save();

    res.json({ success: true, quiz });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to update sharing settings" });
  }
};

// Duplicate a quiz — new document, new question ids, "(Copy)" suffix.
export const duplicateQuiz = async (req: Request, res: Response) => {
  const { teacherId } = req.session;

  if (!teacherId) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    const original = await Quiz.findById(req.params.id);
    if (!original) return res.status(404).json({ message: "Quiz not found" });

    if (String(original.teacherId) !== String(teacherId)) {
      return res
        .status(403)
        .json({ message: "Not authorized to duplicate this quiz" });
    }

    const duplicated = await Quiz.create({
      teacherId,
      title: `${original.title} (Copy)`,
      difficulty: original.difficulty,
      questions: original.questions.map((q: IQuizQuestion) => ({
        id: crypto.randomUUID(),
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    });

    res.json({ success: true, quiz: duplicated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to duplicate quiz" });
  }
};

// Export a quiz as a branded, printable PDF (wired to the Download button)
export const exportQuizPdf = async (req: Request, res: Response) => {
  const { teacherId } = req.session;

  if (!teacherId) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (String(quiz.teacherId) !== String(teacherId)) {
      return res
        .status(403)
        .json({ message: "Not authorized to export this quiz" });
    }

    const safeFilename = quiz.title.replace(/[^a-z0-9]/gi, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}.pdf"`,
    );

    const doc = generateQuizPdf(quiz);
    doc.pipe(res);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to export quiz PDF" });
  }
};

// STEP 1 (document variant): extract text from an uploaded doc/pdf/ppt,
// generate a preview of questions — does NOT touch the database.
export const generateQuizPreviewFromDocument = async (
  req: Request,
  res: Response,
) => {
  const file = req.file;
  const {
    difficulty = "Medium",
    questionCount = 10,
    questionTypes,
    generateExplanations = "true",
    focus,
  } = req.body;

  if (!file) {
    return res.status(400).json({ message: "Please upload a document." });
  }

  let parsedTypes: string[];
  try {
    parsedTypes = questionTypes
      ? JSON.parse(questionTypes)
      : ["MCQ", "TrueFalse", "ShortAnswer"];
  } catch {
    parsedTypes = ["MCQ", "TrueFalse", "ShortAnswer"];
  }

  try {
    const documentText = await extractTextFromDocument(
      file.buffer,
      file.originalname,
    );

    const result = await generateQuizFromDocumentAgent({
      documentText,
      focus: focus?.trim() || undefined,
      difficulty,
      questionCount: Number(questionCount),
      questionTypes: parsedTypes,
      generateExplanations:
        generateExplanations === "true" || generateExplanations === true,
    });

    res.json({
      success: true,
      suggestedTitle: result.title,
      questions: result.questions,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Failed to generate quiz from document",
    });
  }
};
