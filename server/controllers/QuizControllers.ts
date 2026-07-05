import { Request, Response } from "express";
import fs from "fs";
import Quiz from "../models/Quiz.js";
import { generateQuizAgent } from "../services/QuizAgent.js";
import { extractTextFromFile } from "../utils/fileExtractor.js";

export const generateQuiz = async (req: Request, res: Response) => {
  const { userId } = req.session;
  const { topic, difficulty = "Medium", questionCount = 5, questionTypes } = req.body;

  const parsedTypes: string[] = questionTypes
    ? JSON.parse(questionTypes)
    : ["MCQ", "TrueFalse", "ShortAnswer"];

  const file = req.file; // populated by multer if a file was uploaded

  if (!topic && !file) {
    return res.status(400).json({ message: "Provide a topic or upload a file" });
  }

  try {
    let sourceText: string | undefined;
    let sourceType: "topic" | "pdf" | "pptx" = "topic";

    if (file) {
      sourceText = await extractTextFromFile(file.path, file.mimetype);
      sourceType = file.mimetype === "application/pdf" ? "pdf" : "pptx";

      if (!sourceText || sourceText.trim().length < 50) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ message: "Could not extract enough text from file" });
      }
    }

    const quizResult = await generateQuizAgent({
      sourceText,
      topic,
      difficulty,
      questionCount: Number(questionCount),
      questionTypes: parsedTypes,
    });

    const quizDoc = await Quiz.create({
      userId,
      title: quizResult.title,
      sourceType,
      sourceFileName: file?.originalname,
      difficulty,
      questions: quizResult.questions,
    });

    if (file) fs.unlinkSync(file.path); // cleanup temp upload

    res.json({ success: true, quiz: quizDoc });
  } catch (error: any) {
    if (file) fs.unlinkSync(file.path);
    console.error(error);
    res.status(500).json({ message: "Failed to generate quiz" });
  }
};

export const getQuizById = async (req: Request, res: Response) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  res.json({ success: true, quiz });
};