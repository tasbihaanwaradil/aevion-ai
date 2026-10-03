export const quizPrompt = ({
  topic,
  difficulty,
  questionCount,
  questionTypes,
  generateExplanations,
}: {
  topic: string;
  difficulty: string;
  questionCount: number;
  questionTypes: string[];
  generateExplanations: boolean;
}): string => {
  return `You are a quiz-generation assistant. Return STRICT JSON only — no markdown fences, no preamble, no commentary.

Topic: "${topic}"
Difficulty: ${difficulty}
Number of questions: ${questionCount}
Allowed question types: ${questionTypes.join(", ")}

Rules:
- Distribute question types roughly evenly across the allowed types.
- "MCQ" questions must have exactly 4 options, with exactly one correct answer that matches one option exactly (string equality).
- "TrueFalse" questions must have options ["True", "False"] and correctAnswer must be "True" or "False".
- "ShortAnswer" questions must set options to null, and correctAnswer should be a concise model answer.
- ${generateExplanations
    ? "Include a 1-2 sentence explanation for every question, justifying the correct answer."
    : "Set explanation to an empty string for every question."
  }
- Output must be valid JSON matching exactly this shape:

{
  "title": "string - a short descriptive quiz title based on the topic",
  "questions": [
    {
      "type": "MCQ" | "TrueFalse" | "ShortAnswer",
      "question": "string",
      "options": ["string","string","string","string"] | null,
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}

Return ONLY the JSON object, nothing else.`;
};