import { ChatGroq } from "@langchain/groq";
import { StringOutputParser } from "@langchain/core/output_parsers";

export const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  temperature: 0.7,
});

export const outputParser = new StringOutputParser();

export const generateText = async (
  prompt: string
): Promise<string> => {
  const res = await llm.invoke(prompt);
  return res.content?.toString() || "";
};