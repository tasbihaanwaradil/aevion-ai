import { generateText } from "../utils/Llm.js";
import { quizPrompt } from "./prompts/quizPrompt.js";

export interface QuizQuestion {
  id: string;
  type: "MCQ" | "TrueFalse" | "ShortAnswer";
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
}

export interface QuizResult {
  title: string;
  difficulty: string;
  questions: QuizQuestion[];
}

const MAX_RETRIES = 2;

export const generateQuizAgent = async ({
  topic,
  difficulty,
  questionCount,
  questionTypes,
}: {
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questionCount: number;
  questionTypes: string[];
}): Promise<QuizResult> => {
  const prompt = quizPrompt({ topic, difficulty, questionCount, questionTypes });

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await generateText(prompt);
      const cleaned = stripJsonFences(raw);
      const parsed = JSON.parse(cleaned) as QuizResult;

      validateQuiz(parsed, questionCount);
      return parsed;
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw new Error(
    `Failed to generate valid quiz JSON after ${MAX_RETRIES + 1} attempts: ${lastError}`
  );
};

const stripJsonFences = (text: string): string => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

const validateQuiz = (quiz: QuizResult, expectedCount: number) => {
  if (!quiz.questions || !Array.isArray(quiz.questions)) {
    throw new Error("Missing questions array");
  }
  if (quiz.questions.length === 0) {
    throw new Error("Empty questions array");
  }
  for (const q of quiz.questions) {
    if (!q.question || !q.correctAnswer || !q.type) {
      throw new Error("Malformed question object");
    }
    if (q.type === "MCQ" && (!q.options || q.options.length !== 4)) {
      throw new Error("MCQ question missing 4 options");
    }
  }
  if (Math.abs(quiz.questions.length - expectedCount) > 2) {
    console.warn(
      `Quiz question count (${quiz.questions.length}) differs significantly from requested (${expectedCount})`
    );
  }
};