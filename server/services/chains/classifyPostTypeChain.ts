import { PromptTemplate } from "@langchain/core/prompts";
import { llm, outputParser } from "../../utils/Llm.js";

const classifyPrompt = PromptTemplate.fromTemplate(`
You are classifying a LinkedIn post topic for a university professor into ONE category.

Topic: "{topic}"

CATEGORIES:
- event_announcement: events, seminars, competitions, "join us", registration
- achievement: students won/secured/achieved something, awards, competition results
- session_recap: conducted/attended a session, workshop, training, facilitated
- inspirational: occasions like Mother's Day, Women's Day, celebrations
- institutional_visit: delegation visits, meetings with officials, NCEAC, Governor

Respond with ONLY the category name, nothing else. Example output: achievement
`);

const classifyChain = classifyPrompt.pipe(llm).pipe(outputParser);

export type PostType =
  | "event_announcement"
  | "achievement"
  | "session_recap"
  | "inspirational"
  | "institutional_visit";

const VALID_TYPES: PostType[] = [
  "event_announcement",
  "achievement",
  "session_recap",
  "inspirational",
  "institutional_visit",
];

export const classifyPostType = async (topic: string): Promise<PostType> => {
  const raw = await classifyChain.invoke({ topic });
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z_]/g, "");

  return VALID_TYPES.includes(cleaned as PostType)
    ? (cleaned as PostType)
    : "session_recap";
};