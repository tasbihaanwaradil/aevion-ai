import { developerPrompt } from "./developerPrompt.js";
import { professionalPrompt } from "./professionalPrompt.js";
import { studentPrompt } from "./studentPrompt.js";
import { entrepreneurPrompt } from "./entrepreneurPrompt.js";

export const getPromptByAudience = ({
  topic,
  targetAudience,
  tone,
}: {
  topic: string;
  targetAudience: string;
  tone: string;
}): string => {
  switch (targetAudience) {
    case "Developers":
      return developerPrompt({ topic, tone });
    case "Professionals":
      return professionalPrompt({ topic, tone });
    case "Students":
      return studentPrompt({ topic, tone });
    case "Entrepreneurs":
      return entrepreneurPrompt({ topic, tone });
    default:
      return `Write a high-quality LinkedIn post about: ${topic}\nTone: ${tone}\n- Strong hook\n- 3–4 key insights\n- Clear CTA\n- 5 relevant hashtags`;
  }
};