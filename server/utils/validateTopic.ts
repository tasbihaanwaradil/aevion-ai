const JUNK_PATTERNS = [
  /^[a-z]{1,3}$/i,
  /^(.)\1+$/i,
  /^[^a-zA-Z]+$/,
  /^(test|asdf|qwerty|lorem|dummy|foo|bar|baz|xyz|zzz|aaa|bbb)$/i,
  /^[\W\d]+$/,
];

const MIN_WORDS = 2;
const MIN_CHARS = 8;
const MAX_CHARS = 300;

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export const validateTopic = (topic: string): ValidationResult => {
  const trimmed = topic.trim();

  if (!trimmed || trimmed.length === 0)
    return { valid: false, reason: "Topic cannot be empty." };

  if (trimmed.length < MIN_CHARS)
    return { valid: false, reason: `Topic is too short. Please enter at least ${MIN_CHARS} characters.` };

  if (trimmed.length > MAX_CHARS)
    return { valid: false, reason: `Topic is too long. Please keep it under ${MAX_CHARS} characters.` };

  for (const pattern of JUNK_PATTERNS) {
    if (pattern.test(trimmed))
      return {
        valid: false,
        reason: "That doesn't look like a valid topic. Try something like 'AI agents in web development' or 'remote team management'.",
      };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < MIN_WORDS)
    return { valid: false, reason: `Please be more specific — enter at least ${MIN_WORDS} words.` };

  const alphaRatio = (trimmed.match(/[a-zA-Z]/g) || []).length / trimmed.length;
  if (alphaRatio < 0.5)
    return { valid: false, reason: "Topic must contain meaningful text." };

  return { valid: true };
};