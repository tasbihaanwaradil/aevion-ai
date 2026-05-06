import { ChatGroq } from "@langchain/groq";

export const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
});

// reusable helper
export const generateText = async (prompt: string) => {
  const res = await llm.invoke(prompt);
  return res.content?.toString() || "";
};