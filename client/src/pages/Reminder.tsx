"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import SideNavbar from "../components/SideNavbar";
import {
  Plus, Trash2, CheckCircle2, Clock, AlertTriangle,
  Bell, Calendar, ChevronDown, ChevronUp, RefreshCw,
  Mail, Tag, Circle, Sparkles, Pencil, Check, X, BookOpen,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type TaskCategory =
  | "email" | "presentation" | "quiz" | "assignment"
  | "meeting" | "study" | "exam" | "project" | "general";

type TaskPriority = "low" | "medium" | "high" | "critical";
type TaskStatus   = "pending" | "in_progress" | "done" | "overdue";

interface SubTask {
  label: string;
  done: boolean;
}

interface ScheduleSlot {
  date: string;
  startTime: string;
  endTime: string;
  label: string;
}

interface NotificationReminder {
  triggerAt: string;
  message: string;
  channel: "in_app" | "email";
}

interface NotificationPlan {
  reminders: NotificationReminder[];
  urgencyLevel: "low" | "medium" | "high";
  escalationNote?: string;
}

interface CalendarEvent {
  title: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  description: string;
}

interface AgentRouting {
  shouldTriggerEmailAgent: boolean;
  shouldTriggerPresentationAgent: boolean;
  shouldTriggerQuizAgent: boolean;
  shouldTriggerPlanner: boolean;
  emailAgentHint?: string;
  presentationAgentHint?: string;
  quizAgentHint?: string;
  plannerHint?: string;
}

interface ParsedTask {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  subject?: string; // NEW — course/subject e.g. "AI", "Database Systems", "FYP"
  dueDate: string;
  daysUntilDue: number;
  estimatedMinutes: number;
  suggestedStartDate: string;
  subTasks: string[];
  tags: string[];
  dueDateAssumed: boolean;
  assumptionNote?: string;
}

interface AgentResult {
  task: ParsedTask;
  schedule: ScheduleSlot[];
  notifications: NotificationPlan;
  calendarEvent: CalendarEvent;
  routing: AgentRouting;
  agentSteps: string[];
  googleEventId?: string;
  googleCalendarWarning?: string; // NEW — set when Calendar sync failed, so the reason is visible instead of silent
}

interface SavedTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  subject?: string; // NEW
  dueDate: string;
  daysUntilDue: number;
  estimatedMinutes: number;
  subTasks: string[];
  tags: string[];
  status: TaskStatus;
  schedule: ScheduleSlot[];
  notifications: NotificationPlan;
  calendarEvent: CalendarEvent;
  routing: AgentRouting;
  createdAt: string;
  dueDateAssumed?: boolean;
  assumptionNote?: string;
  googleEventId?: string; // NEW
}

interface OverdueTask {
  id: string;
  title: string;
  daysOverdue: number;
  suggestion: string;
}

// ─────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; border: string }> = {
  low:      { label: "Low",      color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200" },
  medium:   { label: "Medium",   color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200"   },
  high:     { label: "High",     color: "text-orange-700",  bg: "bg-orange-50",   border: "border-orange-200"  },
  critical: { label: "Critical", color: "text-red-700",     bg: "bg-red-50",      border: "border-red-200"     },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending:     { label: "Pending",     icon: <Circle className="w-3.5 h-3.5" />,          color: "text-gray-500"   },
  in_progress: { label: "In Progress", icon: <RefreshCw className="w-3.5 h-3.5" />,       color: "text-blue-600"   },
  done:        { label: "Done",        icon: <CheckCircle2 className="w-3.5 h-3.5" />,    color: "text-emerald-600"},
  overdue:     { label: "Overdue",     icon: <AlertTriangle className="w-3.5 h-3.5" />,   color: "text-red-600"    },
};

const CATEGORY_EMOJI: Record<TaskCategory, string> = {
  email: "✉️", presentation: "📊", quiz: "📝", assignment: "📋",
  meeting: "🤝", study: "📚", exam: "🎓", project: "🚀", general: "📌",
};

const EXAMPLE_PROMPTS = [
  "Email professor about extension by tomorrow 5pm",
  "Prepare quiz on chapter 5, due Friday",
  "Finish SPM assignment by next Monday, it's worth a lot",
  "Team meeting prep for Thursday",
];

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });

const formatDateShort = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });

const toDatetimeLocal = (iso: string): string => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const daysLeft = (iso: string): number =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const c = PRIORITY_CONFIG[priority];
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${c.bg} ${c.color} ${c.border}`}>
      {c.label}
    </span>
  );
};

const SubjectBadge: React.FC<{ subject?: string }> = ({ subject }) => {
  if (!subject) return null;
  return (
    <span className="text-xs bg-[#e8f4f7] text-[#2d5f6e] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
      <BookOpen className="w-2.5 h-2.5" />{subject}
    </span>
  );
};

const GoogleSyncBadge: React.FC<{ synced: boolean }> = ({ synced }) => (
  <span className={`text-xs flex items-center gap-1 ${synced ? "text-emerald-500" : "text-gray-300"}`}>
    <Calendar className="w-3 h-3" /> {synced ? "Synced to Calendar" : "Not synced"}
  </span>
);

const SchedulePanel: React.FC<{ slots: ScheduleSlot[] }> = ({ slots }) => {
  if (!slots.length) return null;
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" /> Work Schedule
      </p>
      <div className="flex flex-col gap-2">
        {slots.map((slot, i) => (
          <div key={i} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-blue-100">
            <span className="text-xs font-bold text-blue-600 w-6 text-center">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">{slot.label}</p>
              <p className="text-xs text-gray-500">
                {formatDateShort(slot.date)} · {slot.startTime} – {slot.endTime}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const NotificationsPanel: React.FC<{ plan: NotificationPlan }> = ({ plan }) => {
  if (!plan.reminders.length) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <Bell className="w-3.5 h-3.5" /> Notifications
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${
          plan.urgencyLevel === "high" ? "bg-red-100 text-red-700" :
          plan.urgencyLevel === "medium" ? "bg-amber-100 text-amber-700" :
          "bg-green-100 text-green-700"
        }`}>{plan.urgencyLevel} urgency</span>
      </p>
      {plan.escalationNote && (
        <p className="text-xs text-red-600 font-medium mb-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {plan.escalationNote}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {plan.reminders.map((r, i) => (
          <div key={i} className="flex items-start gap-2.5 bg-white rounded-lg px-3 py-2 border border-amber-100">
            <span className="text-amber-500 mt-0.5">
              {r.channel === "email" ? <Mail className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            </span>
            <div>
              <p className="text-xs font-semibold text-gray-800">{r.message}</p>
              <p className="text-xs text-gray-400">{formatDate(r.triggerAt)} · {r.channel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Small inline editor to fix an assumed due date without retyping the whole task
const AssumedDueDateBanner: React.FC<{
  note?: string;
  dueDate: string;
  onConfirm: (newDueDate: string) => void;
}> = ({ note, dueDate, onConfirm }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(toDatetimeLocal(dueDate));

  if (editing) {
    return (
      <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-300">
        <input
          type="datetime-local"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="text-xs px-2 py-1 rounded-md bg-gray-100 outline-none"
        />
        <button
          onClick={() => { onConfirm(new Date(value).toISOString()); setEditing(false); }}
          className="text-emerald-600 hover:text-emerald-700 p-1"
          title="Confirm"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-gray-400 hover:text-gray-600 p-1"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-amber-800">
          {note || "I guessed the due date since none was given."}
        </p>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="shrink-0 text-xs text-amber-700 hover:underline flex items-center gap-1"
      >
        <Pencil className="w-3 h-3" /> Fix it
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Task Card
// ─────────────────────────────────────────────────────────────

const TaskCard: React.FC<{
  task: SavedTask;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDueDateFix: (id: string, newDueDate: string) => void;
}> = ({ task, onDelete, onStatusChange, onDueDateFix }) => {
  const [expanded, setExpanded] = useState(false);
  const [subTasks, setSubTasks] = useState<SubTask[]>(
    task.subTasks.map(s => ({ label: s, done: false }))
  );
  const days = daysLeft(task.dueDate);
  const isOverdue = days < 0 && task.status !== "done";

  const toggleSubTask = (i: number) => {
    setSubTasks(prev => prev.map((s, idx) => idx === i ? { ...s, done: !s.done } : s));
  };

  return (
    <div className={`bg-white rounded-2xl shadow-md border-l-4 transition-all ${
      task.status === "done" ? "border-emerald-400 opacity-70" :
      isOverdue ? "border-red-400" :
      task.priority === "critical" ? "border-red-400" :
      task.priority === "high"     ? "border-orange-400" :
      task.priority === "medium"   ? "border-amber-400" :
      "border-gray-300"
    }`}>
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span className="text-2xl mt-0.5 shrink-0">{CATEGORY_EMOJI[task.category]}</span>
            <div className="min-w-0">
              <p className={`font-bold text-gray-900 text-base leading-snug ${task.status === "done" ? "line-through text-gray-400" : ""}`}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <PriorityBadge priority={task.priority} />
                <SubjectBadge subject={task.subject} />
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.estimatedMinutes}min
                </span>
                <span className={`text-xs font-semibold flex items-center gap-1 ${
                  isOverdue ? "text-red-600" : days <= 1 ? "text-orange-600" : days <= 3 ? "text-amber-600" : "text-gray-500"
                }`}>
                  <Calendar className="w-3 h-3" />
                  {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                </span>
                {task.dueDateAssumed && (
                  <span className="text-xs text-amber-600 flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                    <Sparkles className="w-2.5 h-2.5" /> guessed date
                  </span>
                )}
                {task.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={task.status}
              onChange={e => onStatusChange(task.id, e.target.value as TaskStatus)}
              className={`text-xs font-semibold px-2 py-1 rounded-lg border outline-none cursor-pointer ${STATUS_CONFIG[task.status].color}`}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="overdue">Overdue</option>
            </select>
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-gray-400 hover:text-gray-700 transition p-1"
              title="Expand"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="text-gray-300 hover:text-red-500 transition p-1"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {task.dueDateAssumed && !expanded && (
          <div className="mt-3">
            <AssumedDueDateBanner
              note={task.assumptionNote}
              dueDate={task.dueDate}
              onConfirm={newDate => onDueDateFix(task.id, newDate)}
            />
          </div>
        )}
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 flex flex-col gap-4">

          {task.dueDateAssumed && (
            <AssumedDueDateBanner
              note={task.assumptionNote}
              dueDate={task.dueDate}
              onConfirm={newDate => onDueDateFix(task.id, newDate)}
            />
          )}

          {/* Sub-tasks */}
          {subTasks.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Sub-tasks</p>
              <div className="flex flex-col gap-1.5">
                {subTasks.map((s, i) => (
                  <label key={i} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={s.done}
                      onChange={() => toggleSubTask(i)}
                      className="w-4 h-4 accent-[#2d5f6e] rounded"
                    />
                    <span className={`text-sm ${s.done ? "line-through text-gray-400" : "text-gray-700"} group-hover:text-[#2d5f6e] transition`}>
                      {s.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Schedule + Notifications side by side */}
          <div className="grid sm:grid-cols-2 gap-4">
            <SchedulePanel slots={task.schedule} />
            <NotificationsPanel plan={task.notifications} />
          </div>

          {/* Calendar hint + sync status */}
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar event: </span>
            <span className="font-medium text-gray-600">{formatDate(task.calendarEvent?.startDate ?? task.dueDate)}</span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: task.calendarEvent?.color ?? "#6B7280" }}
            />
            <span className="ml-auto">
              <GoogleSyncBadge synced={Boolean(task.googleEventId)} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

const TimetableReminder: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("tools");

  // Quick-add form (minimal input mode)
  const [quickInput, setQuickInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advTitle, setAdvTitle] = useState("");
  const [advDescription, setAdvDescription] = useState("");
  const [advDueDate, setAdvDueDate] = useState("");
  const [advPriority, setAdvPriority] = useState<TaskPriority | "">("");

  // Live preview while typing (debounced)
  const [preview, setPreview] = useState<{ category: TaskCategory; priority: TaskPriority; tags: string[] } | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Agent state
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState("");

  // Task list
  const [tasks, setTasks] = useState<SavedTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");

  // Overdue banner
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);

  // Fetch tasks on mount
  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch("http://localhost:3000/api/reminder/list", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setTasks(data.tasks);
    } catch { /* silent */ }
    finally { setLoadingTasks(false); }
  }, []);

  const fetchOverdue = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3000/api/reminder/overdue", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setOverdueTasks(data.overdue);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchTasks(); fetchOverdue(); }, [fetchTasks, fetchOverdue]);

  // Debounced live preview as the user types their quick-add sentence
  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    if (!quickInput.trim() || quickInput.trim().length < 6) {
      setPreview(null);
      return;
    }
    previewTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("http://localhost:3000/api/reminder/quick-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: quickInput }),
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setPreview({ category: data.category, priority: data.priority, tags: data.tags ?? [] });
        }
      } catch { /* silent — preview is best-effort */ }
    }, 600);
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
  }, [quickInput]);

  const resetForm = () => {
    setQuickInput("");
    setAdvTitle("");
    setAdvDescription("");
    setAdvDueDate("");
    setAdvPriority("");
    setShowAdvanced(false);
    setPreview(null);
  };

  // Add task — minimal (quickInput) or structured (advanced fields)
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const usingAdvanced = showAdvanced && advTitle.trim();
    if (!usingAdvanced && !quickInput.trim()) return;
    if (usingAdvanced && !advDueDate) return;

    setLoading(true);
    setLastResult(null);
    setError("");

    try {
      const body = usingAdvanced
        ? {
            title: advTitle,
            description: advDescription,
            dueDate: advDueDate,
            priority: advPriority || undefined,
          }
        : { input: quickInput };

      const res = await fetch("http://localhost:3000/api/reminder/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setLastResult(data.result);
        setTasks(prev => [{
          id: data.id,
          ...data.result.task,
          schedule: data.result.schedule,
          notifications: data.result.notifications,
          calendarEvent: data.result.calendarEvent,
          routing: data.result.routing,
          status: "pending",
          googleEventId: data.result.googleEventId,
          createdAt: new Date().toISOString(),
        }, ...prev]);
        fetchOverdue();
        resetForm();
      } else {
        setError(data.message ?? "Agent failed.");
      }
    } catch {
      setError("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`http://localhost:3000/api/reminder/${id}`, {
        method: "DELETE", credentials: "include",
      });
      setTasks(prev => prev.filter(t => t.id !== id));
      fetchOverdue();
    } catch { /* silent */ }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      await fetch(`http://localhost:3000/api/reminder/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      fetchOverdue();
    } catch { /* silent */ }
  };

  const handleDueDateFix = async (id: string, newDueDate: string) => {
    try {
      await fetch(`http://localhost:3000/api/reminder/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: newDueDate }),
        credentials: "include",
      });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, dueDate: newDueDate, dueDateAssumed: false, assumptionNote: undefined } : t));
      fetchOverdue();
    } catch { /* silent */ }
  };

  // Filtered + sorted tasks
  const filteredTasks = tasks
    .filter(t => filterStatus === "all" || t.status === filterStatus)
    .filter(t => filterPriority === "all" || t.priority === filterPriority);

  // Stats
  const stats = {
    total:       tasks.length,
    pending:     tasks.filter(t => t.status === "pending").length,
    done:        tasks.filter(t => t.status === "done").length,
    overdue:     tasks.filter(t => daysLeft(t.dueDate) < 0 && t.status !== "done").length,
    critical:    tasks.filter(t => t.priority === "critical" && t.status !== "done").length,
  };

  const canSubmit = showAdvanced ? Boolean(advTitle.trim() && advDueDate) : Boolean(quickInput.trim());

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A1238]">
      <SideNavbar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        title="AI Tools"
      />

      <div className={`px-6 pt-28 pb-16 transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white">Reminder Agent</h1>
          <p className="text-gray-400 mt-2">
            Say what you need to remember — the agent figures out the rest
          </p>
        </div>

        {/* Overdue banner */}
        {overdueTasks.length > 0 && (
          <div className="max-w-5xl mx-auto mb-6 bg-red-500/10 border border-red-400/30 rounded-2xl px-5 py-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
            <p className="text-sm text-red-200">
              <span className="font-bold">{overdueTasks.length} task{overdueTasks.length > 1 ? "s" : ""} overdue:</span>{" "}
              {overdueTasks.slice(0, 3).map(t => t.title).join(", ")}
              {overdueTasks.length > 3 ? ` +${overdueTasks.length - 3} more` : ""}
            </p>
          </div>
        )}

        {/* Stats Bar */}
        {tasks.length > 0 && (
          <div className="max-w-5xl mx-auto mb-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total",    value: stats.total,    color: "text-white"        },
              { label: "Pending",  value: stats.pending,  color: "text-amber-300"    },
              { label: "Done",     value: stats.done,     color: "text-emerald-300"  },
              { label: "Overdue",  value: stats.overdue,  color: "text-red-300"      },
              { label: "Critical", value: stats.critical, color: "text-orange-300"   },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl px-4 py-3 text-center border border-white/10">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-8">

          {/* ── LEFT: Quick-add Form (2 cols) ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <form
              onSubmit={handleAddTask}
              className="bg-white rounded-2xl shadow-2xl p-7 flex flex-col gap-4"
            >
              <div>
                <label className="flex items-center gap-1.5 font-semibold mb-1.5 text-gray-800 text-sm">
                  <Sparkles className="w-4 h-4 text-[#2d5f6e]" />
                  What do you need to remember?
                </label>
                <textarea
                  value={quickInput}
                  onChange={e => setQuickInput(e.target.value)}
                  placeholder={EXAMPLE_PROMPTS[0]}
                  rows={3}
                  disabled={showAdvanced}
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-transparent outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm text-gray-800 placeholder-gray-400 resize-none disabled:opacity-40"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {EXAMPLE_PROMPTS.slice(1).map(p => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setQuickInput(p)}
                      disabled={showAdvanced}
                      className="text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1 transition disabled:opacity-40"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Live preview chips */}
                {!showAdvanced && preview && quickInput.trim().length >= 6 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    <span className="text-xs bg-[#e8f4f7] text-[#2d5f6e] px-2 py-1 rounded-lg font-medium">
                      {CATEGORY_EMOJI[preview.category]} {preview.category}
                    </span>
                    <PriorityBadge priority={preview.priority} />
                    {preview.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced(v => !v)}
                className="text-xs text-gray-400 hover:text-[#2d5f6e] self-start flex items-center gap-1 transition"
              >
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showAdvanced ? "Hide advanced options" : "Set exact date / priority manually"}
              </button>

              {showAdvanced && (
                <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
                  <input
                    type="text"
                    value={advTitle}
                    onChange={e => setAdvTitle(e.target.value)}
                    placeholder="Task title"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-transparent outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm text-gray-800 placeholder-gray-400"
                  />
                  <textarea
                    value={advDescription}
                    onChange={e => setAdvDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-transparent outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm text-gray-800 placeholder-gray-400 resize-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="datetime-local"
                      value={advDueDate}
                      onChange={e => setAdvDueDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-100 border border-transparent outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm text-gray-800"
                    />
                    <select
                      value={advPriority}
                      onChange={e => setAdvPriority(e.target.value as TaskPriority)}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-100 border border-transparent outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm text-gray-800"
                    >
                      <option value="">Let agent decide priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-red-500 text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full py-3.5 rounded-2xl bg-[#2d5f6e] text-white font-bold text-base hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Agent Running...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Task
                  </>
                )}
              </button>
            </form>

            {/* Last Result Summary */}
            {lastResult && !loading && (
              <div className="bg-white rounded-2xl shadow-xl p-5 flex flex-col gap-3">
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Task Analyzed
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-[#e8f4f7] text-[#2d5f6e] px-2 py-1 rounded-lg font-medium">
                    {CATEGORY_EMOJI[lastResult.task.category]} {lastResult.task.category}
                  </span>
                  <PriorityBadge priority={lastResult.task.priority} />
                  <SubjectBadge subject={lastResult.task.subject} />
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {lastResult.task.estimatedMinutes}min estimated
                  </span>
                  <GoogleSyncBadge synced={Boolean(lastResult.googleEventId)} />
                </div>
                {lastResult.task.dueDateAssumed && (
                  <p className="text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    {lastResult.task.assumptionNote || "Guessed a due date — you can fix it from the task card."}
                  </p>
                )}
                {lastResult.task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {lastResult.task.tags.map(t => (
                      <span key={t} className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                {lastResult.googleCalendarWarning && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Couldn't sync to Google Calendar: {lastResult.googleCalendarWarning}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Task List (3 cols) ── */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="text-xs px-3 py-2 rounded-xl bg-white/10 text-white border border-white/20 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="overdue">Overdue</option>
              </select>
              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value as any)}
                className="text-xs px-3 py-2 rounded-xl bg-white/10 text-white border border-white/20 outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                onClick={() => { fetchTasks(); fetchOverdue(); }}
                disabled={loadingTasks}
                className="ml-auto text-xs text-gray-300 hover:text-white flex items-center gap-1 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTasks ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {/* Task Cards */}
            {loadingTasks ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white/10 rounded-2xl h-24 animate-pulse" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-white/5 rounded-2xl border border-white/10 py-16 text-center">
                <p className="text-gray-400 text-sm">No tasks yet.</p>
                <p className="text-gray-500 text-xs mt-1">Type what you need to remember on the left.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    onDueDateFix={handleDueDateFix}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TimetableReminder;