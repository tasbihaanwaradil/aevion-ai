// services/AcademicEmailAgent.ts
// Architecture: Router → Context Analyzer (with Sender Role Detection) → Drafter → Critic → (Rewriter?) → Final
// Cost target: 3 LLM calls (vs 7 before). Autonomy: dynamic tool selection + clarification + memory.
// v3: Bulk email support — broadcast BCC mode only (60–500 recipients).

import { ChatGroq } from "@langchain/groq";
import { tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// LLM instances
// ─────────────────────────────────────────────────────────────

if (!process.env.GROQ_API_KEY) {
  throw new Error(
    "[AcademicEmailAgent] GROQ_API_KEY is not set. " +
    "Add it to your .env file and restart the server."
  );
}

const llmJSON = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  temperature: 0,
});

const llmCreative = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  temperature: 0.4,
});

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type SenderRole =
  | "student"
  | "professor"
  | "admin"
  | "staff"
  | "parent"
  | "unknown";

/** Delivery mode — single or broadcast only */
export type DeliveryMode = "single" | "broadcast";

/** A single recipient entry */
export interface Recipient {
  email: string;
}

export interface AgentInput {
  purpose: string;
  recipient: string;
  tone: string;
  senderName?: string;
  senderRole?: SenderRole;
  memory?: ConversationMemory;
  /** List of recipients for broadcast bulk send */
  recipients?: Recipient[] | string[];
  /** Delivery mode; defaults to "single" when recipients omitted */
  deliveryMode?: DeliveryMode;
}

export interface BulkDeliveryMeta {
  recipientCount: number;
  deliveryMode: DeliveryMode;
  status: "ready_to_send";
  /** Single resolved email for broadcast (all recipients BCC'd) */
  broadcastEmail?: { subject: string; body: string; bccList: string[] };
}

export interface AgentOutput {
  subject: string;
  body: string;
  audience: string;
  emailType: string;
  detectedSenderRole: SenderRole;
  senderRoleLabel: string;
  agentSteps: string[];
  memory: ConversationMemory;
  clarificationNeeded?: string;
  /** Populated when recipients list provided */
  bulk?: BulkDeliveryMeta;
}

export interface ConversationMemory {
  recipient?: string;
  tone?: string;
  senderName?: string;
  audience?: string;
  emailType?: string;
  lastPurpose?: string;
  senderRole?: SenderRole;
}

// ─────────────────────────────────────────────────────────────
// Role-aware writing style config
// ─────────────────────────────────────────────────────────────

interface RoleWritingProfile {
  label: string;
  voiceInstruction: string;
  structureHints: string;
  examplePhrases: string[];
  signOffStyle: string;
}

const ROLE_PROFILES: Record<SenderRole, RoleWritingProfile> = {
  student: {
    label: "Student → Instructor/Admin",
    voiceInstruction:
      "Write as a respectful student. Use a humble, polite, and deferential tone. " +
      "Show appreciation for the recipient's time. Acknowledge any inconvenience caused.",
    structureHints:
      "Open with a polite greeting and brief self-introduction if needed. " +
      "State the request clearly and humbly. Provide a brief reason. Close with gratitude.",
    examplePhrases: [
      "I hope this email finds you well.",
      "I am writing to respectfully request...",
      "I would be grateful if you could...",
      "Thank you for your time and consideration.",
    ],
    signOffStyle: "Respectfully yours / Sincerely",
  },
  professor: {
    label: "Professor → Students/Colleagues",
    voiceInstruction:
      "Write as an authoritative academic professional. Use a confident, clear, and instructive tone. " +
      "Be direct and informative. Avoid overly casual language.",
    structureHints:
      "State the purpose immediately. Provide clear instructions or information. " +
      "Use numbered lists for action items when relevant. Close professionally.",
    examplePhrases: [
      "Please be informed that...",
      "I would like to bring to your attention...",
      "Kindly ensure that...",
      "Please note the following important update.",
    ],
    signOffStyle: "Best regards / Regards",
  },
  admin: {
    label: "Administration → Community",
    voiceInstruction:
      "Write in an official, institutional voice. Be formal, neutral, and authoritative. " +
      "Represent the institution, not an individual. Use passive/collective voice where appropriate.",
    structureHints:
      "Use a formal opening referencing the department or office. " +
      "State the announcement or policy clearly. List key dates or requirements. " +
      "Provide contact information for queries. Close officially.",
    examplePhrases: [
      "The [Department/Office] wishes to inform all stakeholders...",
      "This is to formally notify...",
      "Please be advised that effective [date]...",
      "For further inquiries, please contact the office at...",
    ],
    signOffStyle: "Sincerely / On behalf of [Department]",
  },
  staff: {
    label: "Staff/TA/Coordinator → Students or Faculty",
    voiceInstruction:
      "Write as a supportive staff member. Be helpful, clear, and professional. " +
      "Maintain a cooperative tone — neither too authoritative nor too deferential.",
    structureHints:
      "Introduce the purpose briefly. Provide practical information or instructions. " +
      "Offer assistance if relevant. Close in a friendly yet professional manner.",
    examplePhrases: [
      "I wanted to follow up regarding...",
      "Please find the details below for your reference.",
      "Feel free to reach out if you have any questions.",
      "We appreciate your cooperation.",
    ],
    signOffStyle: "Best regards / Kind regards",
  },
  parent: {
    label: "Parent → School/Faculty",
    voiceInstruction:
      "Write as a concerned and respectful parent. Use a polite, earnest tone. " +
      "Express care for the student's wellbeing while maintaining respect for the institution.",
    structureHints:
      "Introduce yourself and your relationship to the student. " +
      "State your concern or query clearly. Request a specific action or response. " +
      "Thank the recipient for their attention.",
    examplePhrases: [
      "I am the parent/guardian of [student name]...",
      "I am writing to inquire about...",
      "I would appreciate your guidance on...",
      "Thank you for your attention to this matter.",
    ],
    signOffStyle: "Sincerely / Kind regards",
  },
  unknown: {
    label: "Academic Email",
    voiceInstruction:
      "Write in a professional, formal academic tone appropriate for an educational setting.",
    structureHints:
      "Include a clear greeting, concise body, and professional sign-off.",
    examplePhrases: [
      "I hope this email finds you well.",
      "I am writing regarding...",
      "Please do not hesitate to reach out if needed.",
    ],
    signOffStyle: "Sincerely / Best regards",
  },
};

// ─────────────────────────────────────────────────────────────
// Router decision shape
// ─────────────────────────────────────────────────────────────

interface RouterDecision {
  needsClarification: boolean;
  clarificationQuestion?: string;
  complexity: "low" | "medium" | "high";
  tasks: string[];
  skipContextAnalysis: boolean;
}

interface ContextAnalysis {
  audience: string;
  emailType: string;
  recipientType: string;
  formalityLevel: string;
  salutation: string;
  sections: string[];
  detectedSenderRole: SenderRole;
  senderRoleReason: string;
}

interface EmailDraft {
  subject: string;
  body: string;
  confidence: number;
}

interface CriticResult {
  passed: boolean;
  issues: string[];
  score: number;
}

interface RewriteResult {
  subject: string;
  body: string;
}

// ─────────────────────────────────────────────────────────────
// Robust JSON extractor
// ─────────────────────────────────────────────────────────────

const extractJSON = <T>(text: string, fallback: T, label = "unknown"): T => {
  let cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const fixControlChars = (raw: string): string => {
    let result = "";
    let inString = false;
    let escaped = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (escaped) { result += ch; escaped = false; continue; }
      if (ch === "\\") { escaped = true; result += ch; continue; }
      if (ch === '"') { inString = !inString; result += ch; continue; }
      if (inString) {
        if (ch === "\n") { result += "\\n"; continue; }
        if (ch === "\r") { result += "\\r"; continue; }
        if (ch === "\t") { result += "\\t"; continue; }
      }
      result += ch;
    }
    return result;
  };

  try { return JSON.parse(fixControlChars(cleaned)); } catch {}

  const objMatch = cleaned.match(/(\{[\s\S]*\})/);
  const arrMatch = cleaned.match(/(\[[\s\S]*\])/);

  for (const match of [objMatch?.[1], arrMatch?.[1]]) {
    if (!match) continue;
    try { return JSON.parse(fixControlChars(match)); } catch {}
    try {
      const repaired = fixControlChars(match)
        .replace(/,\s*([}\]])/g, "$1")
        .replace(/'/g, '"');
      return JSON.parse(repaired);
    } catch {}
  }

  console.warn(`[extractJSON:${label}] All parse attempts failed.\n`, text);
  return fallback;
};

// ─────────────────────────────────────────────────────────────
// LLM invoke helpers
// ─────────────────────────────────────────────────────────────

const SYSTEM_JSON =
  "You are a precise assistant. You ALWAYS respond with valid JSON only. " +
  "No prose, no markdown, no explanation before or after the JSON.";

const invokeLLM = async (
  prompt: string,
  label: string,
  mode: "json" | "creative" = "json"
): Promise<string> => {
  console.log(`[LLM] Invoking: ${label}`);
  const client = mode === "creative" ? llmCreative : llmJSON;
  try {
    const response = await client.invoke([
      new SystemMessage(SYSTEM_JSON),
      new HumanMessage(prompt),
    ]);
    const text = response.content?.toString() ?? "";
    console.log(`[LLM:${label}] Raw response:\n`, text);
    return text;
  } catch (err: any) {
    console.error(`[LLM:${label}] Groq API call failed:`, err?.message ?? err);
    throw new Error(`Groq API call failed at step "${label}": ${err?.message ?? err}`);
  }
};

// ─────────────────────────────────────────────────────────────
// TOOL 1 — Task Router
// ─────────────────────────────────────────────────────────────

const taskRouterTool = tool(
  async ({ purpose, recipient, tone, memoryJSON }) => {
    const memory: ConversationMemory = extractJSON(memoryJSON, {}, "router:memory");
    const memoryContext = Object.keys(memory).length
      ? `KNOWN FROM MEMORY: ${JSON.stringify(memory)}`
      : "No prior memory.";

    const prompt = `
You are an email agent task router. Decide what work is needed.

PURPOSE: "${purpose}"
RECIPIENT: "${recipient}"
TONE: "${tone}"
${memoryContext}

RULES:
- If the purpose is vague (< 5 meaningful words, or generic like "meeting", "email professor"),
  set needsClarification=true and write a short clarificationQuestion.
- If recipient and audience are obvious from purpose, set skipContextAnalysis=true.
- complexity: "low" for simple requests, "medium" for moderate, "high" for complex multi-part.
- tasks: always include "draft_email". Include "analyze_context" only if not skipping it.
  Include "critic" always. Include "rewrite" only if complexity is "high".

Respond with ONLY this JSON:
{
  "needsClarification": false,
  "clarificationQuestion": null,
  "complexity": "low|medium|high",
  "tasks": ["analyze_context","draft_email","critic"],
  "skipContextAnalysis": false
}
`.trim();

    const text = await invokeLLM(prompt, "task_router");
    const parsed = extractJSON<RouterDecision>(
      text,
      {
        needsClarification: false,
        complexity: "medium",
        tasks: ["analyze_context", "draft_email", "critic"],
        skipContextAnalysis: false,
      },
      "task_router"
    );
    return JSON.stringify(parsed);
  },
  {
    name: "task_router",
    description: "Decides which tasks to run and whether clarification is needed.",
    schema: z.object({
      purpose: z.string(),
      recipient: z.string(),
      tone: z.string(),
      memoryJSON: z.string(),
    }),
  }
);

// ─────────────────────────────────────────────────────────────
// TOOL 2 — Unified Context Analyzer + Sender Role Detector
// ─────────────────────────────────────────────────────────────

const analyzeContextTool = tool(
  async ({ purpose, recipient, tone, hintedSenderRole }) => {
    const hint = hintedSenderRole && hintedSenderRole !== "unknown"
      ? `SENDER ROLE HINT (trust this if provided): "${hintedSenderRole}"`
      : "No sender role hint provided — infer from context.";

    const prompt = `
Analyze this academic email request in one pass, including detecting who is SENDING the email.

PURPOSE: "${purpose}"
RECIPIENT: "${recipient}"
TONE: "${tone}"
${hint}

--- SENDER ROLE DETECTION GUIDE ---
"student"   → Writing to professor, advisor, or admin.
"professor" → Writing to students or colleagues.
"admin"     → Writing on behalf of a department/institution.
"staff"     → TA, coordinator, lab assistant.
"parent"    → Writing about their child.

If none match clearly, use "unknown".

--- OUTPUT FORMAT ---
Respond with ONLY this JSON:
{
  "audience": "students|professor|faculty|parents|administration|external|unknown",
  "emailType": "announcement|request|meeting|reminder|feedback|event|other",
  "recipientType": "professor|advisor|colleague|student|admin|unknown",
  "formalityLevel": "very_formal|formal|semi_formal",
  "salutation": "Dear ...",
  "sections": ["opening","details","action_items","closing"],
  "detectedSenderRole": "student|professor|admin|staff|parent|unknown",
  "senderRoleReason": "One sentence explaining the detection evidence."
}
`.trim();

    const text = await invokeLLM(prompt, "analyze_context");
    const parsed = extractJSON<ContextAnalysis>(
      text,
      {
        audience: "unknown",
        emailType: "other",
        recipientType: "unknown",
        formalityLevel: "formal",
        salutation: `Dear ${recipient},`,
        sections: ["opening", "details", "closing"],
        detectedSenderRole: "unknown",
        senderRoleReason: "Could not determine sender role.",
      },
      "analyze_context"
    );
    return JSON.stringify(parsed);
  },
  {
    name: "analyze_context",
    description:
      "Single-pass analysis: audience, email type, recipient type, salutation, sections, AND sender role detection.",
    schema: z.object({
      purpose: z.string(),
      recipient: z.string(),
      tone: z.string(),
      hintedSenderRole: z.string().optional(),
    }),
  }
);

// ─────────────────────────────────────────────────────────────
// TOOL 3 — Role-Aware Draft Generator
// ─────────────────────────────────────────────────────────────

const draftEmailTool = tool(
  async ({ purpose, tone, senderName, contextJSON, senderRole, isBulk }) => {
    const context = extractJSON<ContextAnalysis>(
      contextJSON,
      {
        audience: "academic",
        emailType: "general",
        recipientType: "unknown",
        formalityLevel: "formal",
        salutation: "Dear Recipient,",
        sections: ["opening", "details", "closing"],
        detectedSenderRole: "unknown",
        senderRoleReason: "",
      },
      "draft:context"
    );

    const resolvedSenderName = senderName?.trim() || "The Sender";
    const resolvedRole: SenderRole = (senderRole as SenderRole) || context.detectedSenderRole || "unknown";
    const profile = ROLE_PROFILES[resolvedRole] ?? ROLE_PROFILES.unknown;

    const bulkInstructions = isBulk
      ? `
BROADCAST MODE: This email goes to all students via BCC. Use a general greeting like 
"Dear Students," or "Dear All,". Do NOT use individual names or placeholders.
`
      : "";

    const greeting = isBulk ? "Dear Students," : context.salutation;

    const prompt = `
Write a complete professional academic email.

PURPOSE: ${purpose}
GREETING: ${greeting}
EMAIL TYPE: ${context.emailType}
SECTIONS (in order): ${context.sections.join(" → ")}
TONE: ${tone}
SENDER NAME: ${resolvedSenderName}

━━━ SENDER ROLE: ${profile.label} ━━━
VOICE INSTRUCTION:
${profile.voiceInstruction}

STRUCTURE HINTS:
${profile.structureHints}

EXAMPLE PHRASES TO DRAW FROM (use sparingly, do not copy verbatim):
${profile.examplePhrases.map((p) => `• ${p}`).join("\n")}

PREFERRED SIGN-OFF STYLE: ${profile.signOffStyle}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${bulkInstructions}

STRICT RULES:
- Address "${purpose}" directly. Never write about email composition.
- Open the email with EXACTLY this greeting on its own line: ${greeting}
- Do not leave any unresolved placeholders like [Your Name] or [details]. Use real content.
- Sign off with the sender's name: ${resolvedSenderName}
- Body under 200 words. Subject under 10 words.
- After writing, self-assess confidence (0–100).

Respond with ONLY this JSON:
{"subject":"...","body":"...","confidence":95}
`.trim();

    const text = await invokeLLM(prompt, "draft_email", "creative");
    const parsed = extractJSON<EmailDraft>(
      text,
      {
        subject: "Academic Email",
        body: `${context.salutation}\n\nUnable to generate email content.\n\nSincerely,\n${resolvedSenderName}`,
        confidence: 0,
      },
      "draft_email"
    );

    // Strip legacy square-bracket placeholders
    parsed.body = parsed.body
      .replace(/\[Your Name\]/g, resolvedSenderName)
      .replace(/\[Sender[^\]]*\]/g, resolvedSenderName)
      .replace(/\[details?\]/gi, "");

    return JSON.stringify(parsed);
  },
  {
    name: "draft_email",
    description: "Generates role-aware email draft. Supports broadcast bulk mode.",
    schema: z.object({
      purpose: z.string(),
      tone: z.string(),
      senderName: z.string().optional(),
      contextJSON: z.string(),
      senderRole: z.string().optional(),
      isBulk: z.boolean().optional(),
    }),
  }
);

// ─────────────────────────────────────────────────────────────
// TOOL 4 — Critic
// ─────────────────────────────────────────────────────────────

const criticTool = tool(
  async ({ subject, body, tone, audience, senderName, senderRole }) => {
    const resolvedSenderName = senderName?.trim() || "The Sender";
    const profile = ROLE_PROFILES[(senderRole as SenderRole) ?? "unknown"] ?? ROLE_PROFILES.unknown;

    const prompt = `
You are a strict academic email critic. Identify real problems only.

SUBJECT: ${subject}
BODY:
${body}

EXPECTED TONE: ${tone}
AUDIENCE: ${audience}
SENDER ROLE: ${profile.label}
SENDER NAME IN SIGN-OFF: ${resolvedSenderName}

EVALUATE: grammar, professionalism, structure, tone, audience suitability, 
placeholder text, and whether the voice matches the sender role (${profile.label}).
DO NOT suggest making content more generic.

Respond with ONLY this JSON:
{
  "passed": true,
  "issues": [],
  "score": 95
}
`.trim();

    const text = await invokeLLM(prompt, "critic");
    const parsed = extractJSON<CriticResult>(
      text,
      { passed: true, issues: [], score: 90 },
      "critic"
    );
    return JSON.stringify(parsed);
  },
  {
    name: "critic",
    description: "Evaluates email quality including role-voice alignment.",
    schema: z.object({
      subject: z.string(),
      body: z.string(),
      tone: z.string(),
      audience: z.string(),
      senderName: z.string().optional(),
      senderRole: z.string().optional(),
    }),
  }
);

// ─────────────────────────────────────────────────────────────
// TOOL 5 — Rewriter
// ─────────────────────────────────────────────────────────────

const rewriterTool = tool(
  async ({ subject, body, issues, tone, senderName, senderRole }) => {
    const resolvedSenderName = senderName?.trim() || "The Sender";
    const profile = ROLE_PROFILES[(senderRole as SenderRole) ?? "unknown"] ?? ROLE_PROFILES.unknown;

    const prompt = `
You are a precise academic email rewriter. Fix ONLY the listed issues — do not change anything else.
Maintain the voice appropriate for: ${profile.label}

CURRENT SUBJECT: ${subject}
CURRENT BODY:
${body}

ISSUES TO FIX:
${issues.map((i, n) => `${n + 1}. ${i}`).join("\n")}

TONE: ${tone}
SENDER NAME: ${resolvedSenderName}

Respond with ONLY this JSON:
{"subject":"...","body":"..."}
`.trim();

    const text = await invokeLLM(prompt, "rewriter", "creative");
    const parsed = extractJSON<RewriteResult>(
      text,
      { subject, body },
      "rewriter"
    );
    return JSON.stringify(parsed);
  },
  {
    name: "rewriter",
    description: "Fixes only the issues identified by the critic, preserving sender role voice.",
    schema: z.object({
      subject: z.string(),
      body: z.string(),
      issues: z.array(z.string()),
      tone: z.string(),
      senderName: z.string().optional(),
      senderRole: z.string().optional(),
    }),
  }
);

// ─────────────────────────────────────────────────────────────
// TOOL 6 — Suggestions
// ─────────────────────────────────────────────────────────────

const generateSuggestionsTool = tool(
  async ({ purpose, recipient, tone }) => {
    const prompt = `
You are an academic email purpose autocomplete engine.
Give exactly 3 ALTERNATIVE PHRASINGS of the same purpose — more specific or with different emphasis.

USER'S PURPOSE: "${purpose}"
RECIPIENT: "${recipient}"
TONE: "${tone}"

STRICT OUTPUT RULES:
1. Output ONLY a valid JSON array. Nothing else. No prose, no numbering, no markdown.
2. The array must contain EXACTLY 3 separate string elements.
3. Each string is one complete rephrased sentence, max 20 words.
4. Every suggestion must reference the same specific event/topic as the user's purpose.
5. Do NOT merge all 3 into one string. Each must be its own array element.

CORRECT format:
["First suggestion here", "Second suggestion here", "Third suggestion here"]

WRONG formats (never do these):
"First suggestion. Second suggestion. Third suggestion."
["First. Second. Third."]
1. First 2. Second 3. Third
`.trim();

    const text = await invokeLLM(prompt, "suggestions");

    let parsed = extractJSON<string[]>(text, [], "suggestions");

    if (!Array.isArray(parsed) || parsed.length === 0) {
      const raw = text.replace(/\`\`\`json|\`\`\`/gi, "").trim();
      const numberedSplit = raw.split(/\n?\d+[.)]\s+/).filter((s) => s.trim().length > 5);
      if (numberedSplit.length >= 3) {
        parsed = numberedSplit.slice(0, 3).map((s) => s.trim().replace(/^["']|["']$/g, ""));
      }
    } else if (parsed.length === 1 && parsed[0].length > 80) {
      const single = parsed[0];
      const sentenceSplit = single
        .split(/(?<=\.{1,3})\s+(?=[A-Z])|\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);
      if (sentenceSplit.length >= 3) {
        parsed = sentenceSplit.slice(0, 3);
      } else {
        const embeddedNum = single.split(/[,;]\s*(?=\d+[.)\s])/).filter((s) => s.trim().length > 5);
        if (embeddedNum.length >= 3) parsed = embeddedNum.slice(0, 3).map((s) => s.replace(/^\d+[.)\s]+/, "").trim());
      }
    }

    const clean = parsed
      .map((s) => (typeof s === "string" ? s.trim().replace(/^["'\d.)\s]+/, "").replace(/["']$/, "") : ""))
      .filter((s) => s.length > 5)
      .slice(0, 3);

    return JSON.stringify(clean);
  },
  {
    name: "generate_suggestions",
    description: "Suggests more specific/complete versions of the email purpose.",
    schema: z.object({ purpose: z.string(), recipient: z.string(), tone: z.string() }),
  }
);

// ─────────────────────────────────────────────────────────────
// Bulk email helpers
// ─────────────────────────────────────────────────────────────

/**
 * Normalizes the recipients input array into Recipient objects.
 * Accepts both string[] and Recipient[].
 */
const normalizeRecipients = (raw: Recipient[] | string[]): Recipient[] => {
  return (raw as any[]).map((r) => {
    if (typeof r === "string") return { email: r.trim() };
    return { email: (r.email ?? "").trim() };
  }).filter((r) => r.email.length > 0);
};

/**
 * Builds BulkDeliveryMeta for broadcast mode (all recipients BCC'd).
 */
const buildBulkMeta = (
  subject: string,
  body: string,
  recipients: Recipient[],
): BulkDeliveryMeta => ({
  recipientCount: recipients.length,
  deliveryMode: "broadcast",
  status: "ready_to_send",
  broadcastEmail: {
    subject,
    body,
    bccList: recipients.map((r) => r.email),
  },
});

// ─────────────────────────────────────────────────────────────
// Memory helpers
// ─────────────────────────────────────────────────────────────

const updateMemory = (
  existing: ConversationMemory,
  updates: Partial<ConversationMemory>
): ConversationMemory => ({ ...existing, ...updates });

const applyMemory = (input: AgentInput): AgentInput => {
  const mem = input.memory ?? {};
  return {
    ...input,
    recipient:  input.recipient  || mem.recipient  || "",
    tone:       input.tone       || mem.tone        || "formal",
    senderName: input.senderName || mem.senderName  || "",
    senderRole: input.senderRole || mem.senderRole  || undefined,
  };
};

// ─────────────────────────────────────────────────────────────
// MAIN AGENT
// Graph: Router → ContextAnalyzer → Drafter (role+broadcast-aware) → Critic → Rewriter? → BulkMeta → Final
// Supports: single | broadcast (BCC, 60–500+)
// ─────────────────────────────────────────────────────────────

export const runAcademicEmailAgent = async (
  rawInput: AgentInput
): Promise<AgentOutput> => {
  const agentSteps: string[] = [];
  const input = applyMemory(rawInput);
  let memory: ConversationMemory = rawInput.memory ?? {};

  if (!input.purpose?.trim())   throw new Error("Email purpose is required.");
  if (!input.recipient?.trim()) throw new Error("Recipient name is required.");
  if (!input.tone?.trim())      throw new Error("Tone is required.");

  const senderName = input.senderName?.trim() || "The Sender";

  // ── Resolve delivery mode + recipients ───────────────────────────────────────
  const rawRecipients = input.recipients;
  const hasMultipleRecipients = rawRecipients && rawRecipients.length > 0;
  const resolvedRecipients: Recipient[] = hasMultipleRecipients
    ? normalizeRecipients(rawRecipients!)
    : [];
  const deliveryMode: DeliveryMode = hasMultipleRecipients ? "broadcast" : "single";

  agentSteps.push(
    hasMultipleRecipients
      ? `Broadcast mode | ${resolvedRecipients.length} recipients`
      : "Single email mode"
  );

  agentSteps.push("Routing task...");

  // ── STEP 1: Router ───────────────────────────────────────────────────────────
  const routerRaw = await taskRouterTool.invoke({
    purpose:    input.purpose,
    recipient:  input.recipient,
    tone:       input.tone,
    memoryJSON: JSON.stringify(memory),
  });
  const router = extractJSON<RouterDecision>(
    routerRaw,
    {
      needsClarification: false,
      complexity: "medium",
      tasks: ["analyze_context", "draft_email", "critic"],
      skipContextAnalysis: false,
    },
    "main:router"
  );

  agentSteps.push(`📋 Plan: [${router.tasks.join(" → ")}] | Complexity: ${router.complexity}`);

  if (router.needsClarification && router.clarificationQuestion) {
    agentSteps.push(` Clarification needed`);
    return {
      subject: "",
      body: "",
      audience: "",
      emailType: "",
      detectedSenderRole: "unknown",
      senderRoleLabel: ROLE_PROFILES.unknown.label,
      agentSteps,
      memory,
      clarificationNeeded: router.clarificationQuestion,
    };
  }

  // ── STEP 2: Context Analysis + Sender Role Detection ─────────────────────────
  let detectedSenderRole: SenderRole = input.senderRole ?? memory.senderRole ?? "unknown";

  let contextJSON = JSON.stringify({
    audience: memory.audience || "academic",
    emailType: memory.emailType || "other",
    recipientType: "unknown",
    formalityLevel: "formal",
    salutation: `Dear ${input.recipient},`,
    sections: ["opening", "details", "closing"],
    detectedSenderRole,
    senderRoleReason: "Using memory/inference.",
  });

  if (!router.skipContextAnalysis && router.tasks.includes("analyze_context")) {
    agentSteps.push("🔍 Analyzing context & detecting sender role...");
    contextJSON = await analyzeContextTool.invoke({
      purpose:          input.purpose,
      recipient:        input.recipient,
      tone:             input.tone,
      hintedSenderRole: input.senderRole ?? "",
    });
    const ctx = extractJSON<ContextAnalysis>(contextJSON, {} as ContextAnalysis, "main:context");
    detectedSenderRole = input.senderRole ?? ctx.detectedSenderRole ?? "unknown";

    agentSteps.push(
      `Audience: ${ctx.audience} | Type: ${ctx.emailType} | Sender role: ${detectedSenderRole}`
    );

    memory = updateMemory(memory, {
      audience:   ctx.audience,
      emailType:  ctx.emailType,
      senderRole: detectedSenderRole,
    });
  } else {
    agentSteps.push(` Context analysis skipped — sender role: ${detectedSenderRole}`);
  }

  // ── Patch salutation for broadcast mode ──────────────────────────────────────
  const context = extractJSON<ContextAnalysis>(contextJSON, {} as ContextAnalysis, "main:context_parse");

  const patchedSalutation = deliveryMode === "broadcast"
    ? "Dear Students,"
    : context.salutation || `Dear ${input.recipient},`;

  const patchedContext: ContextAnalysis = { ...context, salutation: patchedSalutation };
  const patchedContextJSON = JSON.stringify(patchedContext);

  const roleProfile = ROLE_PROFILES[detectedSenderRole] ?? ROLE_PROFILES.unknown;

  // ── STEP 3: Role-Aware + Broadcast-Aware Draft ───────────────────────────────
  const draftLabel = hasMultipleRecipients
    ? ` Drafting broadcast email as ${roleProfile.label} for ${resolvedRecipients.length} recipients...`
    : ` Drafting email as ${roleProfile.label}...`;
  agentSteps.push(draftLabel);

  const draftRaw = await draftEmailTool.invoke({
    purpose:     input.purpose,
    tone:        input.tone,
    senderName,
    contextJSON: patchedContextJSON,
    senderRole:  detectedSenderRole,
    isBulk:      hasMultipleRecipients ?? false,
  });
  const draft = extractJSON<EmailDraft>(
    draftRaw,
    {
      subject: "Academic Email",
      body: `Dear ${input.recipient},\n\nUnable to generate.\n\nSincerely,\n${senderName}`,
      confidence: 0,
    },
    "main:draft"
  );
  // agentSteps.push(`✅ Draft done (self-confidence: ${draft.confidence}/100)`);

  // ── STEP 4: Critic ────────────────────────────────────────────────────────────
  let finalSubject = draft.subject;
  let finalBody    = draft.body;

  const shouldCritic = router.tasks.includes("critic") && draft.confidence < 90;

  if (shouldCritic) {
    agentSteps.push("🔎 Running critic...");
    const criticRaw = await criticTool.invoke({
      subject:    draft.subject,
      body:       draft.body,
      tone:       input.tone,
      audience:   patchedContext.audience || memory.audience || "academic",
      senderName,
      senderRole: detectedSenderRole,
    });
    const critic = extractJSON<CriticResult>(criticRaw, { passed: true, issues: [], score: 90 }, "main:critic");
    agentSteps.push(` Critic score: ${critic.score}/100`);

    if (!critic.passed && critic.issues.length > 0) {
      agentSteps.push(`🔧 Rewriting (${critic.issues.length} issue(s))...`);
      const rewriteRaw = await rewriterTool.invoke({
        subject:    draft.subject,
        body:       draft.body,
        issues:     critic.issues,
        tone:       input.tone,
        senderName,
        senderRole: detectedSenderRole,
      });
      const rewrite = extractJSON<RewriteResult>(rewriteRaw, { subject: draft.subject, body: draft.body }, "main:rewrite");
      finalSubject = rewrite.subject;
      finalBody    = rewrite.body;
      agentSteps.push(" Rewrite complete");
    } else {
      agentSteps.push(" No rewrites needed");
    }
  } else if (draft.confidence >= 90) {
    agentSteps.push(` Critic skipped (confidence ${draft.confidence}/100 ≥ 90)`);
  }

  // ── STEP 5: Build Bulk Meta ───────────────────────────────────────────────────
  let bulkMeta: BulkDeliveryMeta | undefined;

  if (hasMultipleRecipients && resolvedRecipients.length > 0) {
    agentSteps.push(
      ` Building broadcast package (${resolvedRecipients.length} recipients)...`
    );
    bulkMeta = buildBulkMeta(finalSubject, finalBody, resolvedRecipients);
    agentSteps.push(
      ` Broadcast package ready — ${bulkMeta.recipientCount} recipients | status: ${bulkMeta.status}`
    );
  }

  agentSteps.push(" Email ready");

  memory = updateMemory(memory, {
    recipient:   input.recipient,
    tone:        input.tone,
    senderName,
    lastPurpose: input.purpose,
    senderRole:  detectedSenderRole,
  });

  return {
    subject:           finalSubject,
    body:              finalBody,
    audience:          context.audience || memory.audience || "unknown",
    emailType:         context.emailType || memory.emailType || "other",
    detectedSenderRole,
    senderRoleLabel:   roleProfile.label,
    agentSteps,
    memory,
    ...(bulkMeta ? { bulk: bulkMeta } : {}),
  };
};

// ─────────────────────────────────────────────────────────────
// Suggestions API
// ─────────────────────────────────────────────────────────────

export const generateEmailSuggestions = async ({
  purpose,
  recipient,
  tone,
}: {
  purpose: string;
  recipient: string;
  tone: string;
}): Promise<string[]> => {
  const words = purpose.trim().split(/\s+/).filter(Boolean);
  if (words.length < 3) return [];

  console.log("[generateEmailSuggestions] Generating for purpose:", purpose);
  try {
    const raw = await generateSuggestionsTool.invoke({
      purpose: purpose.trim(),
      recipient: recipient?.trim() || "recipient",
      tone: tone?.trim() || "formal",
    });
    const results = extractJSON<string[]>(raw, [], "suggestions");
    console.log("[generateEmailSuggestions] Results:", results);
    return results;
  } catch (err) {
    console.error("[generateEmailSuggestions]", err);
    return [];
  }
};