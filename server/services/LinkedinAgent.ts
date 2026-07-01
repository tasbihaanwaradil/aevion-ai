// services/LinkedinAgent.ts

import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { professorPrompt, ProfessorPostType } from "./prompts/professorPrompt.js";

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
});

const llmStrict = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.1, // low temp for validation/QA
});

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface GeneratePostInput {
  topic: string;
  tone: string;
  postType?: ProfessorPostType;
}

export interface GeneratePostResult {
  success: boolean;
  post?: string;
  error?: string;
}

// ─── Agent 1: Input Validator ──────────────────────────────────────────────────
async function validateInput(topic: string): Promise<{ valid: boolean; reason?: string }> {
  const response = await llmStrict.invoke([
    new SystemMessage(`
You are an input validation agent for a University Professor LinkedIn post generator.

Decide if the topic is VALID for generating a professional academic LinkedIn post.

VALID examples:
- "AI Ethics workshop for faculty members"
- "Students won first place at the JIDEA innovation challenge"
- "Session on generative AI in life sciences during AI Week"
- "Faculty development workshop on active learning strategies"

INVALID examples:
- "hhh", "asdf", "test", "abc123" — gibberish or random characters
- Single words with no academic context: "good", "nice", "hello"
- Fewer than 4 real words
- Completely unrelated to education, academia, students, or faculty

Respond ONLY with raw JSON. No markdown fences. No explanation.
Format: {"valid": true} or {"valid": false, "reason": "one sentence explaining why"}
    `),
    new HumanMessage(`Topic to validate: "${topic}"`),
  ]);

  try {
    const text = response.content.toString().trim().replace(/```json|```/g, "");
    return JSON.parse(text);
  } catch {
    return { valid: true }; // fail open on parse error
  }
}

// ─── Agent 2: Post Generator ───────────────────────────────────────────────────
async function generatePost(input: GeneratePostInput): Promise<string> {
  const prompt = professorPrompt(input);

  const response = await llm.invoke([
    new SystemMessage(
      "You are a professional LinkedIn ghostwriter specializing in university professor posts. Follow the prompt instructions exactly. Output only the post content."
    ),
    new HumanMessage(prompt),
  ]);

  return response.content.toString();
}

// ─── Agent 3: Quality Checker ──────────────────────────────────────────────────
async function checkQuality(post: string, topic: string): Promise<{ pass: boolean; feedback?: string }> {
  const response = await llmStrict.invoke([
    new SystemMessage(`
You are a quality assurance agent reviewing a LinkedIn post written for a university professor.

Check for these FAILURE conditions:
1. Generic opener like "Excited to share" or "Game changer" or "Amazing journey"
2. No specific themes, topics, or outcomes mentioned
3. No 🔹 bullet points with specific content
4. Sounds like a content creator, not an academic
5. Over 400 words or under 100 words

If ANY failure condition is present, respond: {"pass": false, "feedback": "brief reason"}
If the post meets professional academic standards, respond: {"pass": true}

Respond ONLY with raw JSON. No explanation outside the JSON.
    `),
    new HumanMessage(`Topic: "${topic}"\n\nPost:\n${post}`),
  ]);

  try {
    const text = response.content.toString().trim().replace(/```json|```/g, "");
    return JSON.parse(text);
  } catch {
    return { pass: true };
  }
}

// ─── Post Cleanup ─────────────────────────────────────────────────────────────
function cleanPost(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/^\s*[-–]\s/gm, "")    // remove leading dashes used as bullets
    .replace(/\n{3,}/g, "\n\n")      // max 2 consecutive newlines
    .trim();
}

// ─── Main Export: 3-Agent Pipeline ────────────────────────────────────────────
export async function generateLinkedInPostAgent(
  input: GeneratePostInput
): Promise<GeneratePostResult> {

  // AGENT 1: Validate
  const validation = await validateInput(input.topic);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.reason || "Please enter a meaningful academic topic to generate a post.",
    };
  }

  // AGENT 2: Generate
  let rawPost = await generatePost(input);
  let post = cleanPost(rawPost);

  // AGENT 3: Quality check — retry once if fails
  const quality = await checkQuality(post, input.topic);
  if (!quality.pass) {
    // Retry with a more constrained temperature
    const llmRetry = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
    });
    const retryPrompt = professorPrompt(input);
    const retryResponse = await llmRetry.invoke([
      new SystemMessage(
        `You are a LinkedIn ghostwriter for university professors. The previous attempt was rejected for: ${quality.feedback}. Write a better version following the structure exactly.`
      ),
      new HumanMessage(retryPrompt),
    ]);
    post = cleanPost(retryResponse.content.toString());
  }

  return { success: true, post };
}