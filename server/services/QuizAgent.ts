import crypto from "crypto";
import { generateText } from "../utils/Llm.js";
import { quizPrompt } from "./prompts/quizPrompt.js";
import { documentQuizPrompt } from "./prompts/documentQuizPrompt.js";

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
  questions: QuizQuestion[];
}

const MAX_RETRIES = 2;

export const generateQuizAgent = async ({
  topic,
  difficulty,
  questionCount,
  questionTypes,
  generateExplanations,
}: {
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questionCount: number;
  questionTypes: string[];
  generateExplanations: boolean;
}): Promise<QuizResult> => {
  const prompt = quizPrompt({
    topic,
    difficulty,
    questionCount,
    questionTypes,
    generateExplanations,
  });

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await generateText(prompt);
      const cleaned = stripJsonFences(raw);
      const parsed = JSON.parse(cleaned) as QuizResult;

      validateQuiz(parsed, questionCount);

      // Always assign our own ids — never trust the model for these.
      parsed.questions = parsed.questions.map((q) => ({
        ...q,
        id: crypto.randomUUID(),
        explanation: q.explanation ?? "",
      }));

      return parsed;
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw new Error(
    `Failed to generate valid quiz JSON after ${MAX_RETRIES + 1} attempts: ${lastError}`,
  );
};

const stripJsonFences = (text: string): string =>
  text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

const validateQuiz = (quiz: QuizResult, expectedCount: number) => {
  if (!quiz.questions || !Array.isArray(quiz.questions))
    throw new Error("Missing questions array");
  if (quiz.questions.length === 0) throw new Error("Empty questions array");

  for (const q of quiz.questions) {
    if (!q.question || !q.correctAnswer || !q.type)
      throw new Error("Malformed question object");
    if (q.type === "MCQ" && (!q.options || q.options.length !== 4)) {
      throw new Error("MCQ question missing 4 options");
    }
    if (q.type === "TrueFalse" && (!q.options || q.options.length !== 2)) {
      throw new Error("TrueFalse question missing 2 options");
    }
  }

  if (Math.abs(quiz.questions.length - expectedCount) > 2) {
    console.warn(
      `Quiz question count (${quiz.questions.length}) differs from requested (${expectedCount})`,
    );
  }
};

export const generateQuizFromDocumentAgent = async ({
  documentText,
  focus,
  difficulty,
  questionCount,
  questionTypes,
  generateExplanations,
}: {
  documentText: string;
  focus?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questionCount: number;
  questionTypes: string[];
  generateExplanations: boolean;
}): Promise<QuizResult> => {
  const prompt = documentQuizPrompt({
    documentText,
    focus,
    difficulty,
    questionCount,
    questionTypes,
    generateExplanations,
  });

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await generateText(prompt);
      const cleaned = stripJsonFences(raw);
      const parsed = JSON.parse(cleaned) as QuizResult;

      validateQuiz(parsed, questionCount);

      parsed.questions = parsed.questions.map((q) => ({
        ...q,
        id: crypto.randomUUID(),
        explanation: q.explanation ?? "",
      }));

      return parsed;
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw new Error(
    `Failed to generate valid quiz JSON from document after ${MAX_RETRIES + 1} attempts: ${lastError}`,
  );
};
