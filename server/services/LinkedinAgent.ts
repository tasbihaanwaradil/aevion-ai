import { generateText } from "../utils/Llm.js";
import { getPromptByAudience } from "./prompts/index.js";
import { validateTopic } from "../utils/validateTopic.js";

export class AgentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentValidationError";
  }
}

export const generateLinkedInPostAgent = async ({
  topic,
  targetAudience,
  tone,
}: {
  topic: string;
  targetAudience: string;
  tone: string;
}): Promise<string> => {
  const validation = validateTopic(topic);
  if (!validation.valid) {
    throw new AgentValidationError(validation.reason || "Invalid topic.");
  }

  const prompt = getPromptByAudience({ topic, targetAudience, tone });
  const result = await generateText(prompt);

  return cleanPost(result);
};

const cleanPost = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#{1,6}\s/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s*[-*]\s/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};