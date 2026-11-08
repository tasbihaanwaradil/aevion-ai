export const documentQuizPrompt = ({
  documentText,
  focus,
  difficulty,
  questionCount,
  questionTypes,
  generateExplanations,
}: {
  documentText: string;
  focus?: string;
  difficulty: string;
  questionCount: number;
  questionTypes: string[];
  generateExplanations: boolean;
}): string => {
  return `You are a quiz-generation assistant. Return STRICT JSON only — no markdown fences, no preamble, no commentary.

Source material (extracted from a teacher's uploaded document):
"""
${documentText}
"""
${focus ? `\nThe teacher wants the quiz to focus specifically on: "${focus}"\n` : ""}
Difficulty: ${difficulty}
Number of questions: ${questionCount}
Allowed question types: ${questionTypes.join(", ")}

Rules:
- Base every question strictly on the source material above. Do not invent facts not present in the document.
- Distribute question types roughly evenly across the allowed types.
- "MCQ" questions must have exactly 4 options, with exactly one correct answer that matches one option exactly (string equality).
- "TrueFalse" questions must have options ["True", "False"] and correctAnswer must be "True" or "False".
- "ShortAnswer" questions must set options to null, and correctAnswer should be a concise model answer.
- ${
    generateExplanations
      ? "Include a 1-2 sentence explanation for every question, justifying the correct answer using the source material."
      : "Set explanation to an empty string for every question."
  }
- Output must be valid JSON matching exactly this shape:

{
  "title": "string - a short descriptive quiz title based on the document content",
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
