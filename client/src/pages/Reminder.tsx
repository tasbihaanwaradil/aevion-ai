"use client";

import React, { useState, useEffect, useCallback } from "react";
import SideNavbar from "../components/SideNavbar";
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bot,
  User,
  Clock,
  RefreshCw,
  CalendarClock,
} from "lucide-react";

const API_BASE = "http://localhost:3000";

type SubmitState = "idle" | "loading" | "success" | "error";
type ReminderPriority = "HIGH" | "MEDIUM" | "LOW";
type ReminderStatus = "pending" | "overdue" | "completed" | "cancelled";

interface ReminderApiResponse {
  success?: boolean;
  reply?: string;
  toolCalls?: unknown[];
  error?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Attendee {
  name: string;
  email: string;
}

interface Reminder {
  id: string;
  task: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h)
  priority: ReminderPriority;
  status: ReminderStatus;
  category: string;
  notes: string | null;
  attendees: Attendee[];
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RemindersListResponse {
  success?: boolean;
  reminders?: Reminder[];
  error?: string;
}

const SUGGESTIONS = [
  {
    label: "Create a reminder",
    text: "Remind me to submit my FYP report tomorrow at 5 PM.",
  },
  {
    label: "Show all reminders",
    text: "Show me my reminders.",
  },
  {
    label: "Today's reminders",
    text: "What reminders do I have today?",
  },
  {
    label: "Reschedule a reminder",
    text: "Move my FYP report reminder to Friday at 9 AM.",
  },
];

const PRIORITY_STYLES: Record<ReminderPriority, string> = {
  HIGH: "bg-red-50 text-red-700 border-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-gray-50 text-gray-600 border-gray-200",
};

/**
 * `date` is YYYY-MM-DD and `time` is HH:mm — both plain strings, not an
 * ISO timestamp, so we parse them as local wall-clock values rather than
 * doing any UTC conversion.
 */
function formatDueDate(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  const due = new Date(year, (month ?? 1) - 1, day, hour, minute);
  const now = new Date();

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const timeLabel = due.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isSameDay(due, now)) return `Today, ${timeLabel}`;
  if (isSameDay(due, tomorrow)) return `Tomorrow, ${timeLabel}`;

  return (
    due.toLocaleDateString([], { month: "short", day: "numeric" }) +
    `, ${timeLabel}`
  );
}

const TimetableReminder: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("tools");

  // Agent input
  const [message, setMessage] = useState("");

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Submission state
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Sidebar: upcoming reminders
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [remindersError, setRemindersError] = useState("");

  const fetchReminders = useCallback(async () => {
    setRemindersLoading(true);
    setRemindersError("");

    try {
      const res = await fetch(`${API_BASE}/api/reminders`, {
        method: "GET",
        credentials: "include",
      });

      const responseText = await res.text();

      if (!responseText.trim()) {
        throw new Error("Empty response from server.");
      }

      let data: RemindersListResponse;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("Couldn't parse the reminders response.");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Couldn't load reminders.");
      }

      setReminders(data.reminders ?? []);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
      setRemindersError(
        err instanceof Error ? err.message : "Couldn't load reminders."
      );
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setSubmitState("error");
      setErrorMessage(
        "Please tell me what reminder you want to create or manage."
      );
      return;
    }

    setSubmitState("loading");
    setErrorMessage("");

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmedMessage,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/agents/reminder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: trimmedMessage,
          chatHistory: messages,
        }),
      });

      const responseText = await res.text();

      if (!responseText.trim()) {
        throw new Error(
          `The server returned an empty response (HTTP ${res.status}).`
        );
      }

      let data: ReminderApiResponse;

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse server response:", parseError);

        throw new Error(
          `The server returned an invalid response (HTTP ${res.status}).`
        );
      }

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            `The reminder agent couldn't process that request (HTTP ${res.status}).`
        );
      }

      const assistantReply =
        data.reply || "I completed the reminder operation.";

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: assistantReply,
        },
      ]);

      setSubmitState("success");

      // The agent may have created/updated/completed a reminder — refresh sidebar
      fetchReminders();
    } catch (err) {
      console.error("Reminder request failed:", err);

      setSubmitState("error");

      setErrorMessage(
        err instanceof Error
          ? err.message
          : "I couldn't process that reminder request. Please try again."
      );
    }
  }

  function handleExample(example: string) {
    setMessage(example);
    setSubmitState("idle");
    setErrorMessage("");
  }

  return (
    <div className="min-h-screen bg-[#0A1238]">
      <SideNavbar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        title="AI Tools"
      />

      <div
        className={`px-6 pt-16 pb-10 transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2d5f6e] flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white">Reminder Agent</h1>

          <p className="text-gray-400 mt-1 text-sm">
            Tell me what you need to remember in natural language.
          </p>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
          {/* Chat Card */}
          <div className="flex-1 w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="min-h-[280px] max-h-[560px] overflow-y-auto p-6 bg-gray-50 flex flex-col">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-[#2d5f6e] flex items-center justify-center mb-4">
                    <Bot className="w-7 h-7 text-white" />
                  </div>

                  <h2 className="text-lg font-semibold text-gray-800">
                    How can I help?
                  </h2>

                  <p className="text-gray-500 mt-1 max-w-md text-sm">
                    Create, view, update, complete, cancel, or reschedule
                    reminders.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-lg text-left">
                    {SUGGESTIONS.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleExample(item.text)}
                        className="px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 hover:border-[#2d5f6e] transition text-left"
                      >
                        <span className="font-medium block">
                          {item.label}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((chatMessage, index) => {
                    const isUser = chatMessage.role === "user";

                    return (
                      <div
                        key={index}
                        className={`flex gap-3 ${
                          isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isUser && (
                          <div className="w-9 h-9 shrink-0 rounded-full bg-[#2d5f6e] flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                        )}

                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                            isUser
                              ? "bg-[#2d5f6e] text-white rounded-br-md"
                              : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"
                          }`}
                        >
                          {chatMessage.content}
                        </div>

                        {isUser && (
                          <div className="w-9 h-9 shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {submitState === "loading" && (
                    <div className="flex gap-3 items-start">
                      <div className="w-9 h-9 shrink-0 rounded-full bg-[#2d5f6e] flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>

                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Thinking...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {submitState === "error" && errorMessage && (
              <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {submitState === "success" && (
              <div className="mx-6 mt-4 flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Request completed successfully.</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="p-5 border-t border-gray-200 bg-white"
            >
              <div className="flex items-end gap-3">
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setSubmitState("idle");
                    setErrorMessage("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="e.g. Remind me to submit my FYP report tomorrow at 5 PM..."
                  rows={2}
                  disabled={submitState === "loading"}
                  className="flex-1 resize-none px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 outline-none focus:ring-2 focus:ring-[#2d5f6e] focus:border-[#2d5f6e] text-gray-800 disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={submitState === "loading" || !message.trim()}
                  className="w-12 h-12 shrink-0 bg-[#2d5f6e] text-white rounded-xl flex items-center justify-center hover:bg-[#244d5a] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitState === "loading" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Press Enter to send • Shift + Enter for a new line
              </p>
            </form>
          </div>

          {/* Sidebar: Upcoming Reminders */}
          <div className="w-full lg:w-[340px] shrink-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#2d5f6e]" />
                <h3 className="font-semibold text-gray-800 text-sm">
                  Upcoming Reminders
                </h3>
              </div>

              <button
                type="button"
                onClick={fetchReminders}
                disabled={remindersLoading}
                className="text-gray-400 hover:text-[#2d5f6e] transition disabled:opacity-50"
                aria-label="Refresh reminders"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    remindersLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>

            <div className="max-h-[520px] overflow-y-auto p-4">
              {remindersLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : remindersError ? (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-red-800 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{remindersError}</span>
                </div>
              ) : reminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Clock className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">
                    No upcoming reminders yet.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {reminders.map((reminder) => (
                    <li
                      key={reminder.id}
                      className="px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:border-[#2d5f6e] transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-800 font-medium leading-snug">
                          {reminder.task}
                        </p>

                        <span
                          className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                            PRIORITY_STYLES[reminder.priority]
                          }`}
                        >
                          {reminder.priority}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDueDate(reminder.date, reminder.time)}
                        {reminder.status === "overdue" && (
                          <span className="text-red-500 font-medium ml-1">
                            · Overdue
                          </span>
                        )}
                      </p>

                      {reminder.category && (
                        <p className="text-[11px] text-gray-400 mt-1">
                          {reminder.category}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableReminder;