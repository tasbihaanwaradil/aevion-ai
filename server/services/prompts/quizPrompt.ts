export const quizPrompt = ({
  topic,
  difficulty,
  questionCount,
  questionTypes,
}: {
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questionCount: number;
  questionTypes: string[]; // e.g. ["MCQ", "TrueFalse", "ShortAnswer"]
}) => {
  return `
You are an expert quiz designer creating an assessment.

Base the quiz on accurate knowledge of this topic: "${topic}"

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