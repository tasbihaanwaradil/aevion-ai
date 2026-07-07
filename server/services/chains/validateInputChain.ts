import { PromptTemplate } from "@langchain/core/prompts";
import { llm, outputParser } from "../../utils/Llm.js";

const validationPrompt = PromptTemplate.fromTemplate(`
You are an input validator for a university professor's LinkedIn post generator.

Check if this input is a valid, meaningful topic for a LinkedIn post:
"{topic}"

INVALID if:
- Random characters (hhh, asdfgh, xxx, jsjsjs)
- Gibberish or keyboard mashing
- Single characters or numbers only
- Fewer than 2 meaningful words (unless a proper noun like "JIDEA 2026")

VALID if:
- Any real academic event, achievement, workshop, session, or occasion
- Short but meaningful (e.g. "Mother's Day", "NCEAC visit", "AI Ethics session")

Respond ONLY with JSON, no markdown:
{{"valid": true}} OR {{"valid": false, "reason": "one sentence explanation"}}
`);

const validationChain = validationPrompt.pipe(llm).pipe(outputParser);

export const validateInput = async (
  topic: string
): Promise<{ valid: boolean; reason?: string }> => {
  try {
    const raw = await validationChain.invoke({ topic });
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { valid: true };
  }
};