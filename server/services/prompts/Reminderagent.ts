/**
 * ReminderAgent.ts
 *
 * Main Reminder Agent service.
 *
 * Uses:
 * - Groq via ChatGroq
 * - LangChain v1 createAgent
 * - Per-request reminder tools scoped to the authenticated user
 * - Day.js timezone support
 * - Chat history
 *
 * The userId is NEVER supplied by the LLM.
 * It is bound to the tools when buildReminderTools() is called.
 *
 * RATE LIMIT HANDLING:
 * Groq's per-minute input-token limit can be hit under normal use (the
 * system prompt + tool schemas + chat history all count). Rather than
 * bubbling a raw "rate_limit_exceeded" error up to the route (which the
 * frontend shows as a scary red error banner), invokeAgentWithRetry waits
 * out the limit's own suggested delay (or a short default) and retries
 * once. If it still fails, handleMessage returns a normal, friendly
 * assistant reply instead of throwing.
 */

import { ChatGroq } from "@langchain/groq";
import { createAgent } from "langchain";
import {
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import { REMINDER_AGENT_SYSTEM_PROMPT } from "./Reminderagent.prompt.js";
import { buildReminderTools } from "./Reminder.tools.js";

dayjs.extend(utc);
dayjs.extend(timezone);

/* ============================================================
   TYPES
   ============================================================ */

export interface ReminderAgentInput {
  /**
   * Authenticated user's ID.
   *
   * This comes from the authenticated session/request.
   * The LLM cannot provide or override this value.
   */
  userId: string;

  /**
   * User's natural-language reminder request.
   */
  message: string;

  /**
   * User's IANA timezone.
   *
   * Example:
   * Asia/Karachi
   *
   * Defaults to Asia/Karachi.
   */
  timezone?: string;

  /**
   * Previous conversation messages.
   */
  chatHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;

  /**
   * Optional current date/time.
   *
   * Useful for testing.
   * If omitted, the actual current date/time is used.
   */
  now?: Date;
}

export interface ReminderToolCall {
  tool: string;
  input: unknown;
  output: string;
}

export interface ReminderAgentResult {
  reply: string;
  toolCalls: ReminderToolCall[];
  rateLimited?: boolean;
}

/* ============================================================
   RATE LIMIT HELPERS
   ============================================================ */

const RATE_LIMIT_MAX_RETRIES = 1;
const RATE_LIMIT_DEFAULT_WAIT_MS = 5000;
const RATE_LIMIT_MAX_WAIT_MS = 15000;

function isRateLimitError(err: unknown): boolean {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : JSON.stringify(err ?? "");

  return (
    message.includes("rate_limit_exceeded") ||
    message.toLowerCase().includes("rate limit reached")
  );
}

/**
 * Groq's error message includes "Please try again in 22.86s" — parse that
 * out so we wait roughly the right amount instead of guessing.
 */
function extractRetryDelayMs(err: unknown): number {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : JSON.stringify(err ?? "");

  const match = message.match(/try again in ([\d.]+)s/i);

  if (match) {
    const seconds = parseFloat(match[1]);

    if (!Number.isNaN(seconds)) {
      // Add a small buffer so we don't retry a hair too early.
      return Math.min(
        Math.ceil(seconds * 1000) + 500,
        RATE_LIMIT_MAX_WAIT_MS
      );
    }
  }

  return RATE_LIMIT_DEFAULT_WAIT_MS;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================================================
   AGENT
   ============================================================ */

export class ReminderAgent {
  private readonly llm: ChatGroq;

  constructor(
    apiKey: string = process.env.GROQ_API_KEY ?? ""
  ) {
    if (!apiKey) {
      throw new Error(
        "ReminderAgent: GROQ_API_KEY is required."
      );
    }

    this.llm = new ChatGroq({
      apiKey,
      model: "qwen/qwen3.6-27b",
      temperature: 0.7,
      maxTokens: 500,
      reasoningEffort: "none",
    });
  }

  /* ==========================================================
     CURRENT DATE / TIME
     ========================================================== */

  private buildContextBlock(
    tz: string,
    now?: Date
  ) {
    const current = now
      ? dayjs(now).tz(tz)
      : dayjs().tz(tz);

    return {
      currentDate: current.format("YYYY-MM-DD"),
      currentTime: current.format("HH:mm"),
      timezone: tz,
    };
  }

  /* ==========================================================
     SYSTEM PROMPT
     ========================================================== */

  private buildSystemPrompt(
    currentDate: string,
    currentTime: string,
    timezone: string
  ): string {
    return REMINDER_AGENT_SYSTEM_PROMPT
      .replace("{currentDate}", currentDate)
      .replace("{currentTime}", currentTime)
      .replace("{timezone}", timezone);
  }

  /* ==========================================================
     INVOKE WITH RATE-LIMIT RETRY
     ========================================================== */

  private async invokeAgentWithRetry(
    agent: ReturnType<typeof createAgent>,
    messages: (HumanMessage | AIMessage)[]
  ): Promise<{ result: any; rateLimited: boolean }> {
    let attempt = 0;

    while (true) {
      try {
        const result = await agent.invoke({ messages });
        return { result, rateLimited: false };
      } catch (err) {
        if (!isRateLimitError(err) || attempt >= RATE_LIMIT_MAX_RETRIES) {
          if (isRateLimitError(err)) {
            console.error(
              "ReminderAgent: rate limit persisted after retry, giving up.",
              err
            );
            return { result: null, rateLimited: true };
          }

          throw err;
        }

        const waitMs = extractRetryDelayMs(err);

        console.warn(
          `ReminderAgent: rate limited, retrying in ${waitMs}ms (attempt ${
            attempt + 1
          }/${RATE_LIMIT_MAX_RETRIES})...`
        );

        await sleep(waitMs);
        attempt += 1;
      }
    }
  }

  /* ==========================================================
     HANDLE MESSAGE
     ========================================================== */

  async handleMessage(
    input: ReminderAgentInput
  ): Promise<ReminderAgentResult> {

    /* --------------------------------------------------------
       Validate user ID
       -------------------------------------------------------- */

    if (!input.userId?.trim()) {
      throw new Error(
        "ReminderAgent: userId is required."
      );
    }

    /* --------------------------------------------------------
       Validate message
       -------------------------------------------------------- */

    if (!input.message?.trim()) {
      throw new Error(
        "ReminderAgent: message is required."
      );
    }

    /* --------------------------------------------------------
       Resolve timezone
       -------------------------------------------------------- */

    const resolvedTimezone =
      input.timezone?.trim() || "Asia/Karachi";

    /* --------------------------------------------------------
       Validate timezone
       -------------------------------------------------------- */

    try {
      dayjs().tz(resolvedTimezone);
    } catch {
      throw new Error(
        `ReminderAgent: Invalid timezone "${resolvedTimezone}".`
      );
    }

    /* --------------------------------------------------------
       Build current date/time context
       -------------------------------------------------------- */

    const {
      currentDate,
      currentTime,
      timezone: timezoneName,
    } = this.buildContextBlock(
      resolvedTimezone,
      input.now
    );

    /* --------------------------------------------------------
       Build system prompt
       -------------------------------------------------------- */

    const systemPrompt =
      this.buildSystemPrompt(
        currentDate,
        currentTime,
        timezoneName
      );

    /* --------------------------------------------------------
       Build user-scoped tools
       --------------------------------------------------------

       IMPORTANT:

       userId comes from the authenticated backend request.

       The LLM cannot supply userId because none of the
       tool schemas expose userId.
    -------------------------------------------------------- */

    const tools = buildReminderTools({
      userId: input.userId,
      timezone: timezoneName,
      now: input.now,
    });

    /* --------------------------------------------------------
       Create LangChain v1 agent
       -------------------------------------------------------- */

    const agent = createAgent({
      model: this.llm,
      tools,
      systemPrompt,
    });

    /* --------------------------------------------------------
       Convert chat history to LangChain messages
       -------------------------------------------------------- */

    const recentChatHistory = (
      input.chatHistory ?? []
    ).slice(-4);

    const chatHistory = recentChatHistory.map((message) => {
      if (message.role === "user") {
        return new HumanMessage(message.content);
      }

      return new AIMessage(message.content);
    });

    /* --------------------------------------------------------
       Add current user message
       -------------------------------------------------------- */

    const messages = [
      ...chatHistory,
      new HumanMessage(input.message),
    ];

    /* --------------------------------------------------------
       Run agent (with rate-limit retry)
       -------------------------------------------------------- */

    const { result, rateLimited } = await this.invokeAgentWithRetry(
      agent,
      messages
    );

    if (rateLimited) {
      return {
        reply:
          "I'm getting a lot of requests right now — please try again in a few seconds.",
        toolCalls: [],
        rateLimited: true,
      };
    }

    console.log( "🔍 REMINDER AGENT RESULT:", JSON.stringify(result, null, 2) );

    /* --------------------------------------------------------
       Get result messages
       -------------------------------------------------------- */

    const resultMessages: any[] =
      Array.isArray(result?.messages)
        ? result.messages
        : [];

    /* ========================================================
       EXTRACT TOOL CALLS
       ======================================================== */

    const toolCalls: ReminderToolCall[] = [];

    for (const message of resultMessages) {

      /* ------------------------------------------------------
         AI tool calls
         ------------------------------------------------------ */

      if (
        Array.isArray(message?.tool_calls)
      ) {
        for (const call of message.tool_calls) {

          toolCalls.push({
            tool: call?.name ?? "unknown",
            input: call?.args ?? {},
            output: "",
          });
        }
      }

      /* ------------------------------------------------------
         Tool result
         ------------------------------------------------------ */

      const messageType =
        typeof message?._getType === "function"
          ? message._getType()
          : "";

      if (messageType === "tool") {

        const output =
          typeof message.content === "string"
            ? message.content
            : JSON.stringify(
                message.content
              );

        const toolName =
          message.name ?? "unknown";

        /*
         * Find the corresponding tool call
         * and attach its output.
         */

        const existingCall =
          toolCalls.find(
            (call) =>
              call.tool === toolName &&
              call.output === ""
          );

        if (existingCall) {

          existingCall.output =
            output;

        } else {

          toolCalls.push({
            tool: toolName,
            input: {},
            output,
          });
        }
      }
    }

    /* ========================================================
       EXTRACT FINAL AI RESPONSE
       ======================================================== */

    let reply = "";

    /*
     * Walk backwards through the messages.
     *
     * The last AI message is normally the final response
     * after the tools have finished executing.
     */

    for (
      let i = resultMessages.length - 1;
      i >= 0;
      i--
    ) {

      const message = resultMessages[i];

      const messageType =
        typeof message?._getType === "function"
          ? message._getType()
          : "";

      /*
       * Only look at AI messages.
       */

      if (messageType !== "ai") {
        continue;
      }

      /* ------------------------------------------------------
         String response
         ------------------------------------------------------ */

      if (
        typeof message.content === "string"
      ) {

        reply =
          message.content.trim();
      }

      /* ------------------------------------------------------
         Structured response
         ------------------------------------------------------ */

      else if (
        Array.isArray(message.content)
      ) {

        reply = message.content
          .map((part: any) => {

            if (
              typeof part === "string"
            ) {
              return part;
            }

            if (
              part?.type === "text" &&
              typeof part.text === "string"
            ) {
              return part.text;
            }

            return "";
          })
          .filter(Boolean)
          .join("")
          .trim();
      }

      /*
       * Stop once we have a real text response.
       */

      if (reply) {
        break;
      }
    }

    /* ========================================================
       FALLBACK RESPONSE
       ======================================================== */

    if (!reply) {

      reply =
        "I completed the reminder operation, but I could not generate a response.";
    }

    /* ========================================================
       RETURN RESULT
       ======================================================== */

    return {
      reply,
      toolCalls,
    };
  }
}

/* ============================================================
   DEFAULT EXPORT
   ============================================================ */

export default ReminderAgent;