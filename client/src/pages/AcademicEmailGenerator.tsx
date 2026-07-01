"use client";

import React, { useState, useEffect } from "react";
import SideNavbar from "../components/SideNavbar";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type DeliveryMode = "single" | "broadcast";
type SendTiming = "now" | "schedule";

interface Recipient {
  email: string;
}

interface FormData {
  purpose: string;
  recipient: string;
  recipientEmail: string;
  tone: "Formal" | "Respectful" | "Semi-Formal";
  senderName: string;
}

interface GeneratedEmail {
  subject: string;
  body: string;
}

interface BulkMeta {
  recipientCount: number;
  deliveryMode: DeliveryMode;
  status: "ready_to_send";
  broadcastEmail?: { subject: string; body: string; bccList: string[] };
}

interface GenerateResponse {
  success: boolean;
  email?: GeneratedEmail;
  emailId?: string;
  bulk?: BulkMeta;
  message?: string;
  agentSteps?: string[];
}

interface SuggestResponse {
  success: boolean;
  suggestions: string[];
}

interface ScheduledEmailEntry {
  id: string;
  deliveryMode: DeliveryMode;
  subject: string;
  body: string;
  senderName: string;
  scheduledFor: string;
  createdAt: string;
  status: "scheduled" | "sent" | "failed" | "cancelled";
  recipientEmail?: string;
  bccList?: string[];
  lastError?: string;
}

interface ScheduleResponse {
  success: boolean;
  scheduled?: ScheduledEmailEntry;
  message?: string;
}

interface ScheduleListResponse {
  success: boolean;
  scheduled: ScheduledEmailEntry[];
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const isValidEmail = (s: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

const EMAIL_RE = /[^\s@,;<>()]+@[^\s@,;<>()]+\.[^\s@,;<>()]{2,}/g;

const parseLine = (line: string): Recipient | null => {
  const s = line.trim();
  if (!s) return null;

  const angleMatch = s.match(/^(.+?)\s*<([^>]+)>$/);
  if (angleMatch) {
    const email = angleMatch[2].trim();
    if (isValidEmail(email)) return { email };
  }

  const parenMatch = s.match(/^([^\s@]+@[^\s@]+\.[^\s@]+)\s*\((.+)\)$/);
  if (parenMatch) {
    const email = parenMatch[1].trim();
    if (isValidEmail(email)) return { email };
  }

  if (s.includes(",")) {
    const parts = s.split(",").map((p) => p.trim());
    const emailPart = parts.find((p) => isValidEmail(p));
    if (emailPart) return { email: emailPart };
  }

  const tabSpaceMatch =
    s.match(/^(.+?)\s{2,}([^\s@]+@[^\s@]+\.[^\s@]+)$/) ||
    s.match(/^(.+?)\t([^\s@]+@[^\s@]+\.[^\s@]+)$/);
  if (tabSpaceMatch) {
    const email = tabSpaceMatch[2].trim();
    if (isValidEmail(email)) return { email };
  }

  if (isValidEmail(s)) return { email: s };
  return null;
};

/**
 * A single raw line may contain MORE THAN ONE email address.
 * This helper extracts ALL emails found in the line via regex.
 * Falls back to the richer `parseLine` when only one address is found
 * (so Name <email> and similar formats still work).
 */
const extractEmailsFromLine = (line: string): Recipient[] => {
  const s = line.trim();
  if (!s) return [];

  const matches = s.match(EMAIL_RE) || [];
  const uniqueValid = Array.from(new Set(matches.filter(isValidEmail)));

  if (uniqueValid.length > 1) {
    return uniqueValid.map((email) => ({ email }));
  }

  const single = parseLine(s);
  return single ? [single] : [];
};

const parseRecipientList = (
  raw: string
): { recipients: Recipient[]; error: string | null } => {
  const trimmed = raw.trim();
  if (!trimmed) return { recipients: [], error: null };

  // JSON array input
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed))
        return { recipients: [], error: "Must be a JSON array." };
      const recipients: Recipient[] = parsed.flatMap((item: any) => {
        if (typeof item === "string") return extractEmailsFromLine(item);
        if (
          typeof item === "object" &&
          item.email &&
          isValidEmail(item.email)
        )
          return [{ email: item.email }];
        return [];
      });
      const deduped = Array.from(
        new Map(recipients.map((r) => [r.email.toLowerCase(), r])).values()
      );
      if (deduped.length === 0)
        return {
          recipients: [],
          error: "No valid email addresses found in array.",
        };
      return { recipients: deduped, error: null };
    } catch {
      return {
        recipients: [],
        error: "Invalid JSON — check your array syntax.",
      };
    }
  }

  // Line-by-line input
  const lines = trimmed
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const recipients: Recipient[] = [];
  const skipped: string[] = [];

  for (const line of lines) {
    const found = extractEmailsFromLine(line);
    if (found.length > 0) {
      recipients.push(...found);
    } else {
      skipped.push(line);
    }
  }

  const deduped = Array.from(
    new Map(recipients.map((r) => [r.email.toLowerCase(), r])).values()
  );

  if (deduped.length === 0) return { recipients: [], error: null };

  if (skipped.length > 0) {
    return {
      recipients: deduped,
      error: `${skipped.length} line${skipped.length > 1 ? "s" : ""} skipped (no email found): ${skipped
        .slice(0, 2)
        .map((s) => `"${s.slice(0, 30)}"`)
        .join(", ")}${skipped.length > 2 ? "…" : ""}`,
    };
  }

  return { recipients: deduped, error: null };
};

/** Returns the minimum allowed value for a datetime-local input (now + 1 min, local tz) */
const getMinScheduleLocal = (): string => {
  const d = new Date(Date.now() + 60 * 1000);
  d.setSeconds(0, 0);
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
};

/** Converts a datetime-local input value (local time) to an ISO string (UTC) */
const localToISOString = (localValue: string): string =>
  new Date(localValue).toISOString();

/** Friendly label for a scheduled time */
const formatScheduledFor = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

const AcademicEmailGenerator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("tools");

  // Form state
  const [formData, setFormData] = useState<FormData>({
    purpose: "",
    recipient: "",
    recipientEmail: "",
    tone: "Formal",
    senderName: "",
  });

  // Bulk mode state
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("single");
  const [recipientListRaw, setRecipientListRaw] = useState("");
  const [parsedRecipients, setParsedRecipients] = useState<Recipient[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  /**
   * Snapshot of the recipients that were used to generate the current email.
   * Send/schedule should validate against this — NOT the live `parsedRecipients`,
   * which can drift if the user edits the textarea after generating.
   */
  const [committedRecipients, setCommittedRecipients] = useState<Recipient[]>([]);

  // Email output state
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [editableEmail, setEditableEmail] = useState<GeneratedEmail | null>(null);
  const [bulkMeta, setBulkMeta] = useState<BulkMeta | null>(null);
  const [agentSteps, setAgentSteps] = useState<string[]>([]);
  const [emailId, setEmailId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);

  // UI state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle");
  const [sendErrorMsg, setSendErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [showBccPreview, setShowBccPreview] = useState(false);

  // Scheduler state
  const [sendTiming, setSendTiming] = useState<SendTiming>("now");
  const [scheduledForLocal, setScheduledForLocal] = useState<string>("");
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<"idle" | "success" | "error">("idle");
  const [scheduleErrorMsg, setScheduleErrorMsg] = useState("");
  const [scheduledList, setScheduledList] = useState<ScheduledEmailEntry[]>([]);
  const [loadingScheduledList, setLoadingScheduledList] = useState(false);
  const [showScheduledPanel, setShowScheduledPanel] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const debouncedPurpose = useDebounce(formData.purpose, 700);

  // ── Parse recipient list on change ───────────────────────────────────────────
  useEffect(() => {
    const { recipients, error } = parseRecipientList(recipientListRaw);
    setParsedRecipients(recipients);
    setParseError(error);
  }, [recipientListRaw]);

  // ── Suggestions ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!debouncedPurpose || debouncedPurpose.trim().length < 8) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      setLoadingSuggest(true);
      try {
        const res = await fetch(
          "http://localhost:3000/api/academic-email/suggest",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              purpose: debouncedPurpose,
              recipient: formData.recipient,
              tone: formData.tone,
            }),
            credentials: "include",
          }
        );
        const data: SuggestResponse = await res.json();
        if (data.success) setSuggestions(data.suggestions || []);
      } catch {
        /* silent */
      } finally {
        setLoadingSuggest(false);
      }
    };
    fetchSuggestions();
  }, [debouncedPurpose, formData.recipient, formData.tone]);

  // ── Fetch scheduled list ─────────────────────────────────────────────────────
  const fetchScheduledList = async () => {
    setLoadingScheduledList(true);
    try {
      const res = await fetch(
        "http://localhost:3000/api/academic-email/schedule?status=scheduled",
        { credentials: "include" }
      );
      const data: ScheduleListResponse = await res.json();
      if (data.success) setScheduledList(data.scheduled || []);
    } catch {
      /* silent */
    } finally {
      setLoadingScheduledList(false);
    }
  };

  useEffect(() => {
    if (showScheduledPanel) fetchScheduledList();
  }, [showScheduledPanel]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "purpose") setSuggestions([]);
    setSendStatus("idle");
    setSendErrorMsg("");
    setScheduleStatus("idle");
    setScheduleErrorMsg("");
  };

  const applySuggestion = (s: string) => {
    setFormData((prev) => ({ ...prev, purpose: s }));
    setSuggestions([]);
  };

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.purpose.trim() || !formData.recipient.trim()) return;
    if (deliveryMode !== "single" && parsedRecipients.length === 0) {
      alert("Please enter at least one recipient email address.");
      return;
    }

    setLoadingGenerate(true);
    setGeneratedEmail(null);
    setEditableEmail(null);
    setBulkMeta(null);
    setCommittedRecipients([]);
    setAgentSteps([]);
    setEmailId(null);
    setIsEditing(false);
    setHasEdited(false);
    setSendStatus("idle");
    setSendErrorMsg("");
    setScheduleStatus("idle");
    setScheduleErrorMsg("");

    try {
      const body: any = { ...formData, deliveryMode };
      if (deliveryMode !== "single" && parsedRecipients.length > 0) {
        body.recipients = parsedRecipients;
      }

      const res = await fetch(
        "http://localhost:3000/api/academic-email/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        }
      );
      const data: GenerateResponse = await res.json();

      if (data.success && data.email) {
        setGeneratedEmail(data.email);
        setEditableEmail(data.email);
        setEmailId(data.emailId ?? null);

        // Snapshot the recipients at generation time
        if (deliveryMode !== "single") {
          setCommittedRecipients(parsedRecipients);
        } else {
          setCommittedRecipients([]);
        }

        if (data.bulk) {
          setBulkMeta(data.bulk);
        } else if (deliveryMode !== "single") {
          // Backend didn't return bulk metadata — synthesize locally
          setBulkMeta({
            recipientCount: parsedRecipients.length,
            deliveryMode,
            status: "ready_to_send",
          });
        } else {
          setBulkMeta(null);
        }

        if (data.agentSteps) setAgentSteps(data.agentSteps);
      } else {
        alert(data.message ?? "Something went wrong");
      }
    } catch {
      alert("Error connecting to server");
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleEditChange = (field: "subject" | "body", value: string) => {
    setEditableEmail((prev) => (prev ? { ...prev, [field]: value } : prev));
    setHasEdited(true);
  };

  const handleResetEdit = () => {
    setEditableEmail(generatedEmail);
    setHasEdited(false);
  };
  const handleDoneEditing = () => setIsEditing(false);

  const handleSend = async () => {
    if (!editableEmail) return;

    if (sendTiming === "schedule") {
      await handleSchedule();
      return;
    }

    if (deliveryMode !== "single" && bulkMeta) {
      await handleBulkSend();
      return;
    }

    if (!formData.recipientEmail.trim()) {
      alert("Please enter the recipient's email address.");
      return;
    }

    setLoadingSend(true);
    setSendStatus("idle");
    setSendErrorMsg("");
    try {
      const res = await fetch("http://localhost:3000/api/academic-email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: formData.recipientEmail,
          subject: editableEmail.subject,
          body: editableEmail.body,
          senderName: formData.senderName,
          emailId,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSendStatus("success");
        setIsEditing(false);
      } else {
        setSendStatus("error");
        setSendErrorMsg(data.message ?? "Failed to send email.");
      }
    } catch {
      setSendStatus("error");
      setSendErrorMsg("Error connecting to server.");
    } finally {
      setLoadingSend(false);
    }
  };

  const handleBulkSend = async () => {
    if (!editableEmail || !bulkMeta) return;

    if (committedRecipients.length === 0) {
      alert("No recipients to send to. Please regenerate the email.");
      return;
    }

    setLoadingSend(true);
    setSendStatus("idle");
    setSendErrorMsg("");
    try {
      // Use broadcastEmail.bccList if server returned it, otherwise fall back to committed snapshot
      const bccList = bulkMeta.broadcastEmail?.bccList ?? committedRecipients.map((r) => r.email);

      const payload = {
        deliveryMode: bulkMeta.deliveryMode,
        senderName: formData.senderName,
        emailId,
        subject: editableEmail.subject,
        body: editableEmail.body,
        bccList,
      };

      const res = await fetch(
        "http://localhost:3000/api/academic-email/send-bulk",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.success) {
        setSendStatus("success");
        setIsEditing(false);
      } else {
        setSendStatus("error");
        setSendErrorMsg(data.message ?? "Bulk send failed.");
      }
    } catch {
      setSendStatus("error");
      setSendErrorMsg("Error connecting to server.");
    } finally {
      setLoadingSend(false);
    }
  };

  // ── Scheduler handler ────────────────────────────────────────────────────────
  const handleSchedule = async () => {
    if (!editableEmail) return;

    if (!scheduledForLocal) {
      setScheduleStatus("error");
      setScheduleErrorMsg("Please pick a date and time.");
      return;
    }

    if (deliveryMode === "single" && !formData.recipientEmail.trim()) {
      alert("Please enter the recipient's email address.");
      return;
    }

    if (deliveryMode !== "single" && committedRecipients.length === 0) {
      alert("No recipients to schedule for. Please regenerate the email.");
      return;
    }

    setLoadingSchedule(true);
    setScheduleStatus("idle");
    setScheduleErrorMsg("");

    try {
      const scheduledForISO = localToISOString(scheduledForLocal);

      const payload: any = {
        deliveryMode,
        subject: editableEmail.subject,
        body: editableEmail.body,
        senderName: formData.senderName,
        scheduledFor: scheduledForISO,
        emailId,
      };

      if (deliveryMode === "single") {
        payload.recipientEmail = formData.recipientEmail;
      } else {
        // FIX: map Recipient[] → string[] so EmailScheduler can call .trim() on each entry
        payload.bccList = committedRecipients.map((r) => r.email);
      }

      const res = await fetch(
        "http://localhost:3000/api/academic-email/schedule",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        }
      );
      const data: ScheduleResponse = await res.json();

      if (data.success) {
        setScheduleStatus("success");
        setIsEditing(false);
        if (showScheduledPanel) fetchScheduledList();
      } else {
        setScheduleStatus("error");
        setScheduleErrorMsg(data.message ?? "Failed to schedule email.");
      }
    } catch {
      setScheduleStatus("error");
      setScheduleErrorMsg("Error connecting to server.");
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleCancelScheduled = async (id: string) => {
    setCancellingId(id);
    try {
      const res = await fetch(
        `http://localhost:3000/api/academic-email/schedule/${id}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setScheduledList((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert(data.message ?? "Failed to cancel.");
      }
    } catch {
      alert("Error connecting to server.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleCopy = () => {
    if (!editableEmail) return;
    const text = `Subject: ${editableEmail.subject}\n\n${editableEmail.body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBulkMode = deliveryMode !== "single";

  // After generation, use committed snapshot for counts; before generation, use live parsed list
  const effectiveBulkRecipients = bulkMeta ? committedRecipients : parsedRecipients;
  const recipientCount = isBulkMode
    ? effectiveBulkRecipients.length
    : formData.recipientEmail
    ? 1
    : 0;

  const sendDisabled =
    loadingSend ||
    loadingSchedule ||
    (deliveryMode === "single" && !formData.recipientEmail) ||
    (isBulkMode && bulkMeta != null && committedRecipients.length === 0) ||
    (sendTiming === "schedule" && !scheduledForLocal);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

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
        className={`px-6 pt-28 pb-16 transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Header */}
        <div className="text-center mb-10 flex flex-col items-center gap-3">
          <h1 className="text-4xl font-bold text-white">
            Academic Email Generator
          </h1>
          <p className="text-gray-400 mt-2">
            Generate, edit, schedule, and send professional academic emails —
            single or broadcast
          </p>

          <button
            type="button"
            onClick={() => setShowScheduledPanel((v) => !v)}
            className="mt-1 text-xs px-4 py-2 rounded-full bg-white/10 text-gray-200 border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
          >
             {showScheduledPanel ? "Hide" : "View"} Scheduled Emails
          </button>
        </div>

        {/* ── Scheduled Emails Panel ── */}
        {showScheduledPanel && (
          <div className="max-w-6xl mx-auto mb-8 bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                 Scheduled Emails
              </h3>
              <button
                type="button"
                onClick={fetchScheduledList}
                className="text-xs text-[#2d5f6e] hover:underline font-medium"
              >
                {loadingScheduledList ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>

            {loadingScheduledList ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Loading...
              </p>
            ) : scheduledList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No scheduled emails yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                {scheduledList.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            entry.deliveryMode === "broadcast"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {entry.deliveryMode === "broadcast"
                            ? " Broadcast"
                            : " Single"}
                        </span>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {entry.subject}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {entry.deliveryMode === "single"
                          ? `To: ${entry.recipientEmail}`
                          : `To: ${entry.bccList?.length ?? 0} recipients (BCC)`}
                        {" · "}
                        Scheduled for{" "}
                        <strong>
                          {formatScheduledFor(entry.scheduledFor)}
                        </strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCancelScheduled(entry.id)}
                      disabled={cancellingId === entry.id}
                      className="shrink-0 text-xs font-semibold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      {cancellingId === entry.id ? "Cancelling..." : "Cancel"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delivery Mode Switcher */}
        <div className="max-w-6xl mx-auto mb-6 flex justify-center gap-3">
          {(["single", "broadcast"] as DeliveryMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setDeliveryMode(mode);
                setGeneratedEmail(null);
                setEditableEmail(null);
                setBulkMeta(null);
                setCommittedRecipients([]); // clear stale snapshot on mode switch
              }}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
                deliveryMode === mode
                  ? "bg-[#2d5f6e] text-white border-[#2d5f6e] shadow-lg"
                  : "bg-white/10 text-gray-300 border-white/20 hover:bg-white/20"
              }`}
            >
              {mode === "single" && "✉️ Single Email"}
              {mode === "broadcast" && "📣 Broadcast (BCC)"}
            </button>
          ))}
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">

          {/* ── LEFT: Input ── */}
          <form
            onSubmit={handleGenerate}
            className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-5"
          >
            {/* Sender name */}
            <div>
              <label className="block font-semibold mb-1.5 text-gray-800 text-sm">
                Your Name
              </label>
              <input
                type="text"
                name="senderName"
                value={formData.senderName}
                onChange={handleChange}
                placeholder="E.g. Dr. Jane Smith"
                className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm"
              />
            </div>

            {/* Recipient name / group label */}
            <div>
              <label className="block font-semibold mb-1.5 text-gray-800 text-sm">
                {isBulkMode ? "Recipient Group Label" : "Recipient Name"}
              </label>
              <input
                type="text"
                name="recipient"
                value={formData.recipient}
                onChange={handleChange}
                placeholder={
                  isBulkMode
                    ? "E.g. Students, Class, All Faculty"
                    : "E.g. Dr. Smith"
                }
                required
                className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm"
              />
            </div>

            {/* Single email OR bulk list */}
            {deliveryMode === "single" ? (
              <div>
                <label className="block font-semibold mb-1.5 text-gray-800 text-sm">
                  Recipient Email
                </label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleChange}
                  placeholder="E.g. drsmith@university.edu"
                  className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-gray-800 text-sm">
                    Recipient List
                  </label>
                  {parsedRecipients.length > 0 && (
                    <span className="text-xs text-emerald-600 font-medium">
                      ✓ {parsedRecipients.length} valid email
                      {parsedRecipients.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <textarea
                  value={recipientListRaw}
                  onChange={(e) => setRecipientListRaw(e.target.value)}
                  placeholder={`One email per line (or comma-separated on one line):\nalice@university.edu\nnimra@gmail.com\ndua@university.edu\n\nOr JSON: ["alice@uni.edu", "bob@uni.edu"]`}
                  className="w-full h-28 px-4 py-3 bg-gray-100 rounded-xl text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm font-mono resize-none"
                />

                {parseError && (
                  <p className="text-red-500 text-xs">⚠️ {parseError}</p>
                )}

                {parsedRecipients.length > 0 && !parseError && (
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                      parsedRecipients.length >= 60
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-[#e8f4f7] text-[#2d5f6e] border border-[#2d5f6e]/20"
                    }`}
                  >
                    <span className="text-base">
                      {parsedRecipients.length >= 60 ? "" : "✓"}
                    </span>
                    <span className="font-semibold">
                      {parsedRecipients.length} recipient
                      {parsedRecipients.length !== 1 ? "s" : ""} ready
                    </span>
                    {parsedRecipients.length >= 60 && (
                      <span className="ml-auto">No approval needed</span>
                    )}
                  </div>
                )}

                {/* Warn if recipient list drifted after generation */}
                {bulkMeta &&
                  committedRecipients.length !== parsedRecipients.length && (
                    <p className="text-xs text-amber-600">
                       Recipient list changed since this email was generated (
                      {committedRecipients.length} committed vs{" "}
                      {parsedRecipients.length} now). Regenerate to update.
                    </p>
                  )}
              </div>
            )}

            {/* Purpose */}
            <div className="relative">
              <label className="block font-semibold mb-1.5 text-gray-800 text-sm">
                Email Purpose
                {loadingSuggest && (
                  <span className="ml-2 text-xs font-normal text-[#2d5f6e] animate-pulse">
                    Generating suggestions...
                  </span>
                )}
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
                placeholder="E.g. Inform students that the AI Quiz is postponed to Monday June 9..."
                className="w-full h-24 px-4 py-3 bg-gray-100 rounded-xl text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] resize-none text-sm"
              />

              {suggestions.length > 0 &&
                (() => {
                  const safeSuggestions = suggestions
                    .flatMap((s) => {
                      if (typeof s !== "string") return [];
                      if (s.length > 120) {
                        const parts = s
                          .split(
                            /(?<=[.!?])\s+(?=[A-Z])|(?<=\w)\s+(?=\d+[.)]\s)/
                          )
                          .map((p) => p.replace(/^\d+[.)]\s*/, "").trim())
                          .filter((p) => p.length > 10);
                        if (parts.length >= 2) return parts.slice(0, 3);
                      }
                      return [s.trim()];
                    })
                    .filter((s) => s.length > 5)
                    .slice(0, 3);

                  return (
                    <div className="mt-2 flex flex-col gap-1.5">
                      <p className="text-xs text-gray-500 font-medium">
                         Suggestions — click to apply:
                      </p>
                      {safeSuggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => applySuggestion(s)}
                          className="text-left text-xs px-3 py-2.5 bg-[#e8f4f7] text-[#2d5f6e] rounded-xl border border-[#2d5f6e]/20 hover:bg-[#2d5f6e] hover:text-white transition-all leading-relaxed"
                        >
                          <span className="inline-flex items-start gap-1.5">
                            <span className="mt-0.5 text-[#2d5f6e]/50 font-bold shrink-0">
                              {i + 1}.
                            </span>
                            <span>{s}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                })()}
            </div>

            {/* Tone */}
            <div>
              <label className="block font-semibold mb-1.5 text-gray-800 text-sm">
                Tone
              </label>
              <select
                name="tone"
                value={formData.tone}
                onChange={handleChange}
                className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm"
              >
                <option value="Formal">Formal</option>
                <option value="Respectful">Respectful</option>
                <option value="Semi-Formal">Semi-Formal</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={
                loadingGenerate ||
                (isBulkMode &&
                  parsedRecipients.length === 0 &&
                  recipientListRaw.trim().length > 0 &&
                  !!parseError)
              }
              className="mt-1 w-full h-13 py-3.5 rounded-2xl bg-[#2d5f6e] text-white font-bold text-base hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)] disabled:opacity-50"
            >
              {loadingGenerate
                ? "Generating..."
                : isBulkMode && parsedRecipients.length > 0
                ? `Generate for ${parsedRecipients.length} Recipients`
                : "Generate Email"}
            </button>
          </form>

          {/* ── RIGHT: Preview ── */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col">

            {/* Header row */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-gray-900">
                  Email Preview
                </h2>
                {isEditing && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
                    Editing
                  </span>
                )}
                {bulkMeta && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                     BCC Broadcast
                  </span>
                )}
              </div>

              {editableEmail && (
                <div className="flex items-center gap-2.5">
                  {hasEdited && !isEditing && (
                    <button
                      onClick={handleResetEdit}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      Reset
                    </button>
                  )}
                  {isEditing ? (
                    <button
                      onClick={handleDoneEditing}
                      className="text-sm font-semibold text-white bg-[#2d5f6e] px-3 py-1.5 rounded-lg hover:bg-[#244d5a] transition-all"
                    >
                      ✓ Done
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm font-semibold text-[#2d5f6e] border border-[#2d5f6e] px-3 py-1.5 rounded-lg hover:bg-[#2d5f6e] hover:text-white transition-all"
                    >
                       Edit
                    </button>
                  )}
                  <button
                    onClick={handleCopy}
                    className="text-sm text-[#2d5f6e] hover:underline font-medium"
                  >
                    {copied ? " Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3 mt-1">
              {emailId && (
                <span className="text-xs text-teal-600 font-medium">
                  Saved to database
                </span>
              )}
              {hasEdited && (
                <span className="text-xs text-yellow-600 font-medium">
                 Edited by you
                </span>
              )}
              {bulkMeta && (
                <span className="text-xs text-gray-500">
                  {recipientCount} recipient{recipientCount !== 1 ? "s" : ""} ·{" "}
                  {bulkMeta.status}
                </span>
              )}
            </div>

            {/* Email content */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 bg-gray-50 flex-1 overflow-y-auto min-h-[260px]">
              {loadingGenerate ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-8 h-8 border-3 border-[#2d5f6e] border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500 text-sm animate-pulse">
                    Generating email
                    {isBulkMode
                      ? ` for ${parsedRecipients.length} recipients`
                      : ""}
                    ...
                  </p>
                </div>
              ) : editableEmail ? (
                <div className="flex flex-col gap-3 h-full">
                  {/* Subject */}
                  <div className="pb-3 border-b border-gray-200">
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                      Subject
                    </p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editableEmail.subject}
                        onChange={(e) =>
                          handleEditChange("subject", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white border-2 border-[#2d5f6e] rounded-lg text-gray-900 font-semibold outline-none text-sm"
                      />
                    ) : (
                      <p className="text-gray-900 font-semibold text-sm">
                        {editableEmail.subject}
                      </p>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
                      Body
                    </p>
                    {isEditing ? (
                      <textarea
                        value={editableEmail.body}
                        onChange={(e) =>
                          handleEditChange("body", e.target.value)
                        }
                        className="w-full h-56 px-3 py-3 bg-white border-2 border-[#2d5f6e] rounded-lg text-gray-800 text-sm leading-relaxed outline-none resize-none"
                      />
                    ) : (
                      <p className="text-gray-800 whitespace-pre-line leading-relaxed text-sm">
                        {editableEmail.body}
                      </p>
                    )}
                  </div>

                  {!isEditing && (
                    <p className="text-xs text-gray-400 text-center">
                      Click <strong>Edit</strong> to modify before sending
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-center mt-16 text-sm">
                  Fill in the form and click Generate Email
                </p>
              )}
            </div>

            {/* ── Bulk metadata panel ── */}
            {bulkMeta && editableEmail && (
              <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    📣 Broadcast Details
                  </p>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      bulkMeta.status === "ready_to_send"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {bulkMeta.status === "ready_to_send"
                      ? "✓ Ready"
                      : bulkMeta.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                  <div>
                    <span className="font-medium text-gray-700">
                      Recipients:
                    </span>{" "}
                    {recipientCount}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Mode:</span>{" "}
                    {bulkMeta.deliveryMode}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Privacy:</span>{" "}
                    All addresses hidden via BCC ✓
                  </div>
                </div>

                {(bulkMeta.broadcastEmail ||
                  committedRecipients.length > 0) && (
                  <div>
                    <button
                      onClick={() => setShowBccPreview((v) => !v)}
                      className="text-xs text-[#2d5f6e] hover:underline font-medium"
                    >
                      {showBccPreview ? "▲ Hide" : "▼ Preview"} BCC list (
                      {bulkMeta.broadcastEmail?.bccList.length ??
                        committedRecipients.length}
                      )
                    </button>
                    {showBccPreview && (
                      <div className="mt-2 max-h-24 overflow-y-auto bg-white rounded-lg p-2 border border-gray-200">
                        {(
                          bulkMeta.broadcastEmail?.bccList ??
                          committedRecipients.map((r) => r.email)
                        ).map((email, i) => (
                          <p
                            key={i}
                            className="text-xs text-gray-500 font-mono"
                          >
                            {email}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Send / Schedule section ── */}
            {editableEmail && (
              <div className="mt-5 pt-4 border-t border-gray-200">

                {/* Timing toggle */}
                {!isEditing && (
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSendTiming("now");
                        setScheduleStatus("idle");
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        sendTiming === "now"
                          ? "bg-[#2d5f6e] text-white border-[#2d5f6e]"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                       Send Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSendTiming("schedule");
                        setSendStatus("idle");
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        sendTiming === "schedule"
                          ? "bg-[#2d5f6e] text-white border-[#2d5f6e]"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                       Schedule for Later
                    </button>
                  </div>
                )}

                {/* Date/time picker */}
                {!isEditing && sendTiming === "schedule" && (
                  <div className="mb-3">
                    <label className="block font-semibold mb-1.5 text-gray-800 text-xs">
                      Send Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledForLocal}
                      min={getMinScheduleLocal()}
                      onChange={(e) => {
                        setScheduledForLocal(e.target.value);
                        setScheduleStatus("idle");
                      }}
                      className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {isBulkMode
                        ? `This will broadcast to ${recipientCount} recipients at the scheduled time.`
                        : "This email will be sent automatically at the scheduled time."}
                    </p>
                  </div>
                )}

                {/* Status messages */}
                {sendStatus === "success" && (
                  <p className="text-teal-600 font-medium text-sm mb-3 text-center">
                    ✓{" "}
                    {isBulkMode
                      ? `Email sent to ${recipientCount} recipients!`
                      : "Email sent successfully!"}
                  </p>
                )}
                {sendStatus === "error" && (
                  <p className="text-red-500 font-medium text-sm mb-3 text-center">
                     {sendErrorMsg}
                  </p>
                )}
                {scheduleStatus === "success" && (
                  <p className="text-teal-600 font-medium text-sm mb-3 text-center">
                    ✓ Scheduled for{" "}
                    {formatScheduledFor(localToISOString(scheduledForLocal))}
                    {isBulkMode ? ` — ${recipientCount} recipients` : ""}!
                  </p>
                )}
                {scheduleStatus === "error" && (
                  <p className="text-red-500 font-medium text-sm mb-3 text-center">
                     {scheduleErrorMsg}
                  </p>
                )}

                {isEditing ? (
                  <button
                    onClick={handleDoneEditing}
                    className="w-full py-3.5 rounded-2xl bg-[#245463] text-white font-bold text-base hover:bg-[#245463] transition-all"
                  >
                    ✓ Done Editing — Ready to Send
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={sendDisabled}
                    className="w-full py-3.5 rounded-2xl bg-[#2d5f6e] text-white font-bold text-base hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingSend || loadingSchedule
                      ? sendTiming === "schedule"
                        ? "Scheduling..."
                        : "Sending..."
                      : deliveryMode === "single" && !formData.recipientEmail
                      ? "Enter Recipient Email to Send"
                      : isBulkMode &&
                        bulkMeta != null &&
                        committedRecipients.length === 0
                      ? "No Recipients — Regenerate Email"
                      : sendTiming === "schedule"
                      ? scheduledForLocal
                        ? `Schedule for ${formatScheduledFor(localToISOString(scheduledForLocal))}`
                        : "Pick a Date & Time"
                      : isBulkMode
                      ? `Send to ${recipientCount} Recipients`
                      : "Send Email"}
                  </button>
                )}

                {isBulkMode &&
                  bulkMeta &&
                  !isEditing &&
                  sendStatus === "idle" &&
                  scheduleStatus === "idle" && (
                    <p className="text-xs text-center text-gray-400 mt-2">
                      All recipients will be BCC'd — nobody sees other addresses
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicEmailGenerator;