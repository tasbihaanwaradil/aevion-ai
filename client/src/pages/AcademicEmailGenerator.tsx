"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import SideNavbar from "../components/SideNavbar";
import { MailIcon } from "lucide-react";

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

type ToastKind = "info" | "success" | "error";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
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

const PURPOSE_MAX = 400;

// ─────────────────────────────────────────────────────────────
// Toast (replaces blocking alert() calls)
// ─────────────────────────────────────────────────────────────

const ToastStack: React.FC<{ toasts: Toast[]; onDismiss: (id: number) => void }> = ({
  toasts,
  onDismiss,
}) => (
  <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm">
    {toasts.map((t) => (
      <div
        key={t.id}
        role="status"
        className={`flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border animate-[fadeIn_0.15s_ease-out] ${
          t.kind === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : t.kind === "error"
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-white text-gray-700 border-gray-200"
        }`}
      >
        <span className="mt-0.5">
          {t.kind === "success" ? "✓" : t.kind === "error" ? "⚠️" : "ℹ️"}
        </span>
        <span className="flex-1 leading-snug">{t.message}</span>
        <button
          onClick={() => onDismiss(t.id)}
          aria-label="Dismiss notification"
          className="text-gray-400 hover:text-gray-600 shrink-0"
        >
          ✕
        </button>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

const AcademicEmailGenerator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("tools");

  // Form state
  const [formData, setFormData] = useState<FormData>({
    purpose: "",
    recipient: "",
    recipientEmail: "",
    tone: "Formal",
    senderName: "",
  });
  const [recipientEmailTouched, setRecipientEmailTouched] = useState(false);

  // Bulk mode state
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("single");
  const [pendingModeSwitch, setPendingModeSwitch] = useState<DeliveryMode | null>(null);
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
  const [showAgentSteps, setShowAgentSteps] = useState(false);
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
  const [toasts, setToasts] = useState<Toast[]>([]);

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
  const purposeRef = useRef<HTMLTextAreaElement>(null);
  const recipientListRef = useRef<HTMLTextAreaElement>(null);
  const senderNameRef = useRef<HTMLInputElement>(null);

  // Grows a textarea to fit its content (up to a cap) instead of always
  // reserving a fixed block of empty space for short input.
  const autoResize = (el: HTMLTextAreaElement | null, maxPx = 220) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxPx)}px`;
  };

  useEffect(() => {
    autoResize(purposeRef.current);
  }, [formData.purpose]);

  useEffect(() => {
    autoResize(recipientListRef.current);
  }, [recipientListRaw]);

  // ── Toast helpers ────────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, kind === "error" ? 6000 : 4000);
  }, []);
  const dismissToast = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Autofocus the first field on mount ───────────────────────────────────────
  useEffect(() => {
    senderNameRef.current?.focus();
  }, []);

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
        /* silent — suggestions are a non-critical enhancement */
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
      showToast("Couldn't load scheduled emails. Try refreshing.", "error");
    } finally {
      setLoadingScheduledList(false);
    }
  };

  useEffect(() => {
    if (showScheduledPanel) fetchScheduledList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showScheduledPanel]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "purpose" && value.length > PURPOSE_MAX) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "purpose") setSuggestions([]);
    setSendStatus("idle");
    setSendErrorMsg("");
    setScheduleStatus("idle");
    setScheduleErrorMsg("");
  };

  const applySuggestion = (s: string) => {
    setFormData((prev) => ({ ...prev, purpose: s.slice(0, PURPOSE_MAX) }));
    setSuggestions([]);
  };

  const hasUnsentContent = generatedEmail !== null && sendStatus !== "success" && scheduleStatus !== "success";

  const requestModeSwitch = (mode: DeliveryMode) => {
    if (mode === deliveryMode) return;
    if (hasUnsentContent) {
      setPendingModeSwitch(mode);
      return;
    }
    switchMode(mode);
  };

  const switchMode = (mode: DeliveryMode) => {
    setDeliveryMode(mode);
    setGeneratedEmail(null);
    setEditableEmail(null);
    setBulkMeta(null);
    setAgentSteps([]);
    setCommittedRecipients([]); // clear stale snapshot on mode switch
    setPendingModeSwitch(null);
  };

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.purpose.trim() || !formData.recipient.trim()) {
      showToast("Fill in the recipient and purpose fields first.", "error");
      return;
    }
    if (deliveryMode !== "single" && parsedRecipients.length === 0) {
      showToast("Add at least one recipient email address.", "error");
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
        showToast("Email drafted — review it before sending.", "success");
      } else {
        showToast(data.message ?? "Couldn't generate the email. Try again.", "error");
      }
    } catch {
      showToast("Couldn't reach the server. Check your connection and try again.", "error");
    } finally {
      setLoadingGenerate(false);
    }
  };

  // Ctrl/Cmd+Enter from the purpose field submits the form
  const handlePurposeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      purposeRef.current?.closest("form")?.requestSubmit();
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
      setRecipientEmailTouched(true);
      showToast("Enter the recipient's email address first.", "error");
      return;
    }
    if (!isValidEmail(formData.recipientEmail)) {
      setRecipientEmailTouched(true);
      showToast("That doesn't look like a valid email address.", "error");
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
        showToast("Email sent successfully.", "success");
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
      showToast("No recipients to send to — regenerate the email.", "error");
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
        showToast(`Sent to ${bccList.length} recipient${bccList.length !== 1 ? "s" : ""}.`, "success");
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
      setRecipientEmailTouched(true);
      showToast("Enter the recipient's email address first.", "error");
      return;
    }

    if (deliveryMode !== "single" && committedRecipients.length === 0) {
      showToast("No recipients to schedule for — regenerate the email.", "error");
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
        showToast(`Scheduled for ${formatScheduledFor(scheduledForISO)}.`, "success");
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
        showToast("Scheduled email cancelled.", "success");
      } else {
        showToast(data.message ?? "Failed to cancel.", "error");
      }
    } catch {
      showToast("Error connecting to server.", "error");
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

  const recipientEmailInvalid =
    recipientEmailTouched &&
    formData.recipientEmail.trim().length > 0 &&
    !isValidEmail(formData.recipientEmail);

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
    <div className="min-h-screen bg-[#0A1238] relative overflow-hidden">

      {/* Background decoration — matches LinkedIn Post Generator */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-sky-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[30rem] h-[26rem] rounded-full bg-teal-400/10 blur-[130px]" />

      <SideNavbar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        title="AI Tools"
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <div
        className={`relative z-10 px-6 md:px-10 pt-10 pb-14 transition-all duration-300 ${
          isOpen ? "ml-72" : "ml-16"
        }`}
      >
        {/* Header */}
        <div className="mb-8 max-w-3xl mx-auto text-center flex flex-col items-center gap-3">
          <h1 className="flex items-center justify-center gap-2 text-2xl md:text-3xl font-semibold text-white mb-2 font-['Sora']">
            <MailIcon className="w-6 h-6 text-sky-300" strokeWidth={1.75} />
           Academic Email Assistant
          </h1>

          <p className="text-gray-400 text-sm md:text-base">
            Generate, edit, schedule, and send professional academic emails —
            single or broadcast
          </p>

          <button
            type="button"
            onClick={() => setShowScheduledPanel((v) => !v)}
            className="text-xs px-4 py-2 rounded-full bg-white/10 text-gray-200 border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
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
              <div className="flex flex-col gap-2 py-4">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : scheduledList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Nothing scheduled yet — emails you schedule for later will show up here.
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
                            : "Single"}
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
              onClick={() => requestModeSwitch(mode)}
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

        {/* Mode-switch confirmation — replaces a jarring window.confirm() */}
        {pendingModeSwitch && (
          <div className="max-w-6xl mx-auto mb-6 flex items-center justify-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
            <span>
              Switching modes will discard the drafted email above — it hasn't been sent yet.
            </span>
            <button
              onClick={() => switchMode(pendingModeSwitch)}
              className="font-semibold underline shrink-0"
            >
              Switch anyway
            </button>
            <button
              onClick={() => setPendingModeSwitch(null)}
              className="text-amber-600 shrink-0"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-start">

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
                ref={senderNameRef}
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
                <span className="text-red-400 ml-0.5">*</span>
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
                  <span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleChange}
                  onBlur={() => setRecipientEmailTouched(true)}
                  placeholder="E.g. drsmith@university.edu"
                  aria-invalid={recipientEmailInvalid}
                  className={`w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 placeholder-gray-400 outline-none focus:ring-2 text-sm ${
                    recipientEmailInvalid
                      ? "ring-2 ring-red-300 focus:ring-red-400"
                      : "focus:ring-[#2d5f6e]"
                  }`}
                />
                {recipientEmailInvalid && (
                  <p className="text-red-500 text-xs mt-1">
                    That doesn't look like a valid email address.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-gray-800 text-sm">
                    Recipient List
                    <span className="text-red-400 ml-0.5">*</span>
                  </label>
                  {parsedRecipients.length > 0 && (
                    <span className="text-xs text-emerald-600 font-medium">
                      ✓ {parsedRecipients.length} valid email
                      {parsedRecipients.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <textarea
                  ref={recipientListRef}
                  value={recipientListRaw}
                  onChange={(e) => setRecipientListRaw(e.target.value)}
                  rows={3}
                  placeholder={`One email per line (or comma-separated on one line):\nalice@university.edu\nnimra@gmail.com\ndua@university.edu\n\nOr JSON: ["alice@uni.edu", "bob@uni.edu"]`}
                  className="w-full min-h-[72px] max-h-[220px] px-4 py-3 bg-gray-100 rounded-xl text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm font-mono resize-none overflow-y-auto"
                />

                {parseError && (
                  <p className="text-red-500 text-xs"> {parseError}</p>
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
                      {parsedRecipients.length >= 60 ? "🚀" : "✓"}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold text-gray-800 text-sm">
                  Email Purpose
                  <span className="text-red-400 ml-0.5">*</span>
                  {loadingSuggest && (
                    <span className="ml-2 text-xs font-normal text-[#2d5f6e] animate-pulse">
                      Generating suggestions...
                    </span>
                  )}
                </label>
                <span
                  className={`text-xs ${
                    formData.purpose.length >= PURPOSE_MAX
                      ? "text-red-400"
                      : "text-gray-300"
                  }`}
                >
                  {formData.purpose.length}/{PURPOSE_MAX}
                </span>
              </div>
              <textarea
                ref={purposeRef}
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                onKeyDown={handlePurposeKeyDown}
                required
                rows={2}
                placeholder="E.g. Inform students that the AI Quiz is postponed to Monday June 9..."
                className="w-full min-h-[64px] max-h-[220px] px-4 py-3 bg-gray-100 rounded-xl text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] resize-none text-sm overflow-y-auto"
              />
              <p className="text-[11px] text-gray-300 mt-1">
                Tip: press ⌘/Ctrl + Enter to generate
              </p>

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
                        💡 Suggestions — click to apply:
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
              className="mt-1 w-full h-13 py-3.5 rounded-2xl bg-[#2d5f6e] text-white font-bold text-base hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingGenerate && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
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
                       Done
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
                    {copied ? "✓ Copied!" : "Copy"}
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
              {/* {agentSteps.length > 0 && (
                // <button
                //   onClick={() => setShowAgentSteps((v) => !v)}
                //   className="text-xs text-gray-500 hover:text-[#2d5f6e] underline"
                // >
                //   {showAgentSteps ? "Hide" : "Show"} how this was drafted ({agentSteps.length} steps)
                // </button>
              )} */}
            </div>

            {/* Agent thinking log — shows work the agent already does, previously hidden */}
            {showAgentSteps && agentSteps.length > 0 && (
              <div className="mb-3 bg-gray-900 rounded-xl p-3 max-h-32 overflow-y-auto">
                {agentSteps.map((step, i) => (
                  <p key={i} className="text-[11px] text-emerald-400 font-mono leading-relaxed">
                    <span className="text-gray-500">[{i + 1}]</span> {step}
                  </p>
                ))}
              </div>
            )}

            {/* Email content */}
            <div
              className={`border-2 border-dashed border-gray-300 rounded-xl p-5 bg-gray-50 overflow-y-auto ${
                editableEmail && !loadingGenerate
                  ? "max-h-[480px]"
                  : "min-h-[260px] flex-1"
              }`}
            >
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
                  <p className="text-gray-300 text-xs">This usually takes a few seconds</p>
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
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                  {/* <span className="text-3xl">📝</span>
                  <p className="text-gray-400 text-sm">
                    Fill in the form and click Generate Email
                  </p> */}
                </div>
              )}
            </div>

            {/* ── Bulk metadata panel ── */}
            {bulkMeta && editableEmail && (
              <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                     Broadcast Details
                  </p>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      bulkMeta.status === "ready_to_send"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {bulkMeta.status === "ready_to_send"
                      ? " Ready"
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
                    All addresses hidden via BCC 
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
                    {" "}
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
                    Scheduled for{" "}
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
                    Done Editing — Ready to Send
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={sendDisabled}
                    className="w-full py-3.5 rounded-2xl bg-[#2d5f6e] text-white font-bold text-base hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {(loadingSend || loadingSchedule) && (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
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