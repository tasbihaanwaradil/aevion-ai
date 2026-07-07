import { Request, Response } from "express";
import Quiz from "../models/Quiz.js";
import { generateQuizAgent } from "../services/QuizAgent.js";

export const generateQuiz = async (req: Request, res: Response) => {
  const { userId } = req.session;
  const { topic, difficulty = "Medium", questionCount = 5, questionTypes } = req.body;

  if (!topic || topic.trim().length < 5) {
    return res.status(400).json({ message: "Please provide a topic (at least 5 characters)" });
  }

  const parsedTypes: string[] = Array.isArray(questionTypes)
    ? questionTypes
    : questionTypes
    ? JSON.parse(questionTypes)
    : ["MCQ", "TrueFalse", "ShortAnswer"];

  try {
    const quizResult = await generateQuizAgent({
      topic,
      difficulty,
      questionCount: Number(questionCount),
      questionTypes: parsedTypes,
    });

    const quizDoc = await Quiz.create({
      userId,
      title: quizResult.title,
      difficulty,
      questions: quizResult.questions,
    });

    res.json({ success: true, quiz: quizDoc });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate quiz" });
  }
};

export const getQuizById = async (req: Request, res: Response) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  res.json({ success: true, quiz });
};