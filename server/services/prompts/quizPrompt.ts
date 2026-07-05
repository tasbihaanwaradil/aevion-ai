export const quizPrompt = ({
  sourceText,
  topic,
  difficulty,
  questionCount,
  questionTypes,
}: {
  sourceText?: string;
  topic?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questionCount: number;
  questionTypes: string[]; // e.g. ["MCQ", "TrueFalse", "ShortAnswer"]
}) => {
  const contentSource = sourceText
    ? `Base the quiz strictly on the following source material. Do not invent facts not present in it:\n\n"""${sourceText}"""`
    : `Base the quiz on general, accurate knowledge of this topic: "${topic}"`;

  return `
You are an expert quiz designer creating an assessment.

${contentSource}

Requirements:
- Difficulty: ${difficulty}
- Number of questions: ${questionCount}
- Allowed question types: ${questionTypes.join(", ")}
- Distribute question types roughly evenly across the allowed types
- Questions must test understanding, not just recall of exact wording
- For MCQ: exactly 4 options, only one correct
- For TrueFalse: statement must be unambiguous
- For ShortAnswer: answer should be a short phrase (1-5 words), not an essay
- Every question must include a brief explanation of the correct answer
- Do NOT repeat the same fact across multiple questions
- Do NOT reference "the document" or "the slides" in question text — write questions as standalone

Return ONLY valid JSON. No markdown, no backticks, no preamble, no trailing commentary.

JSON schema:
{
  "title": string,
  "difficulty": string,
  "questions": [
    {
      "id": string,
      "type": "MCQ" | "TrueFalse" | "ShortAnswer",
      "question": string,
      "options": string[] | null,
      "correctAnswer": string,
      "explanation": string
    }
  ]
}
`;
};