"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import toast from "react-hot-toast";
import MainLayout from "../components/MainLayout";
import {
  AlarmClockIcon,
  PlusIcon,
  UsersIcon,
  FileTextIcon,
  BookOpenIcon,
  BellIcon,
  CheckIcon,
  Trash2Icon,
  PencilIcon,
  XIcon,
  ClockIcon,
  CalendarIcon,
} from "lucide-react";

const API_BASE = "http://localhost:3000/api/reminders";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Category = "General" | "Assignment" | "Exam" | "Meeting" | "Other";
type Priority = "Low" | "Medium" | "High";
type Tab = "all" | "today" | "upcoming" | "overdue" | "completed";

interface Attendee {
  name: string;
  email: string;
}

interface Reminder {
  _id: string;
  title: string;
  description?: string;
  category: Category;
  deadline: string; // ISO
  priority: Priority;
  completed: boolean;
  overdue?: boolean;
  attendees?: Attendee[];
  createdAt: string;
}

interface FormState {
  id: string | null;
  title: string;
  description: string;
  category: Category;
  deadlineLocal: string; // datetime-local value
  attendees: Attendee[];
}

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  description: "",
  category: "General",
  deadlineLocal: "",
  attendees: [],
};

const CATEGORY_META: Record<
  Category,
  { icon: React.ElementType; badge: string }
> = {
  General: { icon: BellIcon, badge: "bg-slate-100 text-slate-600" },
  Assignment: { icon: FileTextIcon, badge: "bg-indigo-100 text-indigo-700" },
  Exam: { icon: BookOpenIcon, badge: "bg-rose-100 text-rose-700" },
  Meeting: { icon: UsersIcon, badge: "bg-cyan-100 text-cyan-700" },
  Other: { icon: BellIcon, badge: "bg-amber-100 text-amber-700" },
};

const PRIORITY_META: Record<Priority, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
};

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const isValidEmail = (s: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

const localToISOString = (localValue: string): string =>
  new Date(localValue).toISOString();

const isoToLocalInput = (iso: string): string => {
  const d = new Date(iso);
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
};

const formatDeadline = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const timeUntil = (iso: string): string => {
  const diffMs = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const mins = Math.floor(abs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  const label =
    days > 0
      ? `${days}d ${hours % 24}h`
      : hours > 0
      ? `${hours}h ${mins % 60}m`
      : `${mins}m`;

  return diffMs < 0 ? `${label} overdue` : `in ${label}`;
};

const ENDPOINT_FOR_TAB: Record<Tab, string> = {
  all: API_BASE,
  today: `${API_BASE}/today`,
  upcoming: `${API_BASE}/upcoming`,
  overdue: `${API_BASE}/overdue`,
  completed: `${API_BASE}?completed=true`,
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

const ReminderAgent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const headerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);

  // ── Fetch reminders for the active tab ──────────────────────────────
  const fetchReminders = useCallback(async (tab: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINT_FOR_TAB[tab], { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setReminders(data.reminders ?? data.data ?? []);
      } else {
        toast.error(data.message ?? "Couldn't load reminders.");
      }
    } catch {
      toast.error("Couldn't reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders(activeTab);
  }, [activeTab, fetchReminders]);

  // ── Entrance animation ───────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: -16 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }
        );
      }
    });
    return () => ctx.revert();
  }, []);

  // Re-run stagger whenever the visible list changes
  useEffect(() => {
    if (!listRef.current || loading) return;
    const ctx = gsap.context(() => {
      const cards = listRef.current!.querySelectorAll(".reminder-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 24, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          stagger: 0.06,
          ease: "power3.out",
        }
      );
    });
    return () => ctx.revert();
  }, [reminders, loading]);

  // Slide the create/edit panel open/closed
  useEffect(() => {
    if (!formPanelRef.current) return;
    if (showForm) {
      gsap.fromTo(
        formPanelRef.current,
        { opacity: 0, y: -16, height: 0 },
        {
          opacity: 1,
          y: 0,
          height: "auto",
          duration: 0.4,
          ease: "power3.out",
        }
      );
    }
  }, [showForm]);

  const handleCardHover = (e: React.MouseEvent<HTMLDivElement>, entering: boolean) => {
    gsap.to(e.currentTarget, {
      y: entering ? -4 : 0,
      boxShadow: entering
        ? "0 14px 28px -8px rgba(0,0,0,0.18)"
        : "0 2px 6px -1px rgba(0,0,0,0.08)",
      duration: 0.25,
      ease: "power2.out",
    });
  };

  // ── Form handlers ───────────────────────────────────────────────────
  const openCreateForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (r: Reminder) => {
    setForm({
      id: r._id,
      title: r.title,
      description: r.description ?? "",
      category: r.category,
      deadlineLocal: isoToLocalInput(r.deadline),
      attendees: r.attendees ?? [],
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const addAttendeeRow = () => {
    setForm((prev) => ({
      ...prev,
      attendees: [...prev.attendees, { name: "", email: "" }],
    }));
  };

  const updateAttendee = (index: number, field: keyof Attendee, value: string) => {
    setForm((prev) => {
      const next = [...prev.attendees];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, attendees: next };
    });
  };

  const removeAttendeeRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Give the reminder a title.");
      return;
    }
    if (!form.deadlineLocal) {
      toast.error("Pick a deadline.");
      return;
    }
    if (form.category === "Meeting") {
      const badAttendee = form.attendees.find(
        (a) => !a.name.trim() || !isValidEmail(a.email)
      );
      if (form.attendees.length === 0) {
        toast.error("Add at least one attendee for a meeting reminder.");
        return;
      }
      if (badAttendee) {
        toast.error("Every attendee needs a name and a valid email.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const isEdit = Boolean(form.id);
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        deadline: localToISOString(form.deadlineLocal),
      };
      if (form.category === "Meeting") {
        payload.attendees = form.attendees;
      }

      const res = await fetch(isEdit ? `${API_BASE}/${form.id}` : API_BASE, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(isEdit ? "Reminder updated." : "Reminder created.");
        closeForm();
        fetchReminders(activeTab);
      } else {
        toast.error(data.message ?? "Couldn't save the reminder.");
      }
    } catch {
      toast.error("Couldn't reach the server. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/${id}/complete`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Marked complete.");
        fetchReminders(activeTab);
      } else {
        toast.error(data.message ?? "Couldn't update the reminder.");
      }
    } catch {
      toast.error("Couldn't reach the server. Check your connection.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Reminder deleted.");
        setReminders((prev) => prev.filter((r) => r._id !== id));
      } else {
        toast.error(data.message ?? "Couldn't delete the reminder.");
      }
    } catch {
      toast.error("Couldn't reach the server. Check your connection.");
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div ref={headerRef} className="relative flex flex-col items-center text-center gap-3 mb-8">
            <h1 className="flex items-center justify-center gap-2.5 text-3xl font-bold text-white">
              <AlarmClockIcon className="w-7 h-7 text-amber-300" />
              Reminders
            </h1>
            <p className="text-gray-300 max-w-xl">
              Manage teaching tasks, deadlines, and meetings — with alerts
              before due dates so nothing slips.
            </p>

            <button
              type="button"
              onClick={showForm ? closeForm : openCreateForm}
              className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 flex items-center gap-2 px-5 py-3 rounded-xl bg-[#2d5f6e] text-white font-semibold hover:bg-[#244d5a] transition-colors shadow-lg shadow-[#2d5f6e]/30"
            >
              {showForm ? (
                <>
                  <XIcon className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4" />
                  New Reminder
                </>
              )}
            </button>
          </div>

          {/* Create / Edit panel */}
          {showForm && (
            <div
              ref={formPanelRef}
              className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 mb-8 overflow-hidden"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-5">
                {form.id ? "Edit reminder" : "New reminder"}
              </h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="E.g. Submit midterm grades"
                    className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          category: e.target.value as Category,
                        }))
                      }
                      className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm"
                    >
                      <option value="General">General</option>
                      <option value="Assignment">Assignment</option>
                      <option value="Exam">Exam</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Deadline <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={form.deadlineLocal}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, deadlineLocal: e.target.value }))
                      }
                      className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    rows={2}
                    placeholder="Optional details"
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm resize-none"
                  />
                </div>

                {/* Attendees — only for Meeting category */}
                {form.category === "Meeting" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-semibold text-gray-700">
                        Attendees <span className="text-red-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={addAttendeeRow}
                        className="text-xs text-[#2d5f6e] hover:underline font-medium"
                      >
                        + Add attendee
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {form.attendees.length === 0 && (
                        <p className="text-xs text-gray-400">
                          No attendees yet — add at least one to send them a
                          meeting notice.
                        </p>
                      )}
                      {form.attendees.map((a, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={a.name}
                            onChange={(e) => updateAttendee(i, "name", e.target.value)}
                            placeholder="Name"
                            className="flex-1 h-10 px-3 bg-gray-100 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e]"
                          />
                          <input
                            type="email"
                            value={a.email}
                            onChange={(e) => updateAttendee(i, "email", e.target.value)}
                            placeholder="email@school.edu"
                            className="flex-1 h-10 px-3 bg-gray-100 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e]"
                          />
                          <button
                            type="button"
                            onClick={() => removeAttendeeRow(i)}
                            className="shrink-0 text-red-400 hover:text-red-600 px-2"
                            aria-label="Remove attendee"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-12 rounded-xl bg-[#2d5f6e] text-white font-bold hover:bg-[#244d5a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting && (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {form.id ? "Save changes" : "Create reminder"}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-6 h-12 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
                  activeTab === tab.key
                    ? "bg-[#2d5f6e] text-white border-[#2d5f6e]"
                    : "bg-white/10 text-gray-300 border-white/20 hover:bg-white/20"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/10 animate-pulse" />
              ))}
            </div>
          ) : reminders.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl py-16 text-center">
              <AlarmClockIcon className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-300 font-medium">
                {activeTab === "completed"
                  ? "Nothing completed yet."
                  : "Nothing here — you're all caught up."}
              </p>
            </div>
          ) : (
            <div ref={listRef} className="flex flex-col gap-4">
              {reminders.map((r) => {
                const meta = CATEGORY_META[r.category] ?? CATEGORY_META.General;
                const Icon = meta.icon;
                const overdue = !r.completed && new Date(r.deadline).getTime() < Date.now();

                return (
                  <div
                    key={r._id}
                    onMouseEnter={(e) => handleCardHover(e, true)}
                    onMouseLeave={(e) => handleCardHover(e, false)}
                    className={`reminder-card bg-white rounded-2xl p-5 shadow-sm border-l-4 will-change-transform ${
                      r.completed
                        ? "border-emerald-400 opacity-70"
                        : overdue
                        ? "border-red-400"
                        : "border-amber-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${meta.badge} shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              className={`font-semibold text-gray-900 ${
                                r.completed ? "line-through" : ""
                              }`}
                            >
                              {r.title}
                            </h3>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                PRIORITY_META[r.priority] ?? PRIORITY_META.Low
                              }`}
                            >
                              {r.priority}
                            </span>
                          </div>

                          {r.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {r.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {formatDeadline(r.deadline)}
                            </span>
                            {!r.completed && (
                              <span
                                className={`flex items-center gap-1 ${
                                  overdue ? "text-red-500 font-semibold" : ""
                                }`}
                              >
                                <ClockIcon className="w-3.5 h-3.5" />
                                {timeUntil(r.deadline)}
                              </span>
                            )}
                          </div>

                          {r.category === "Meeting" &&
                            r.attendees &&
                            r.attendees.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {r.attendees.map((a, i) => (
                                  <span
                                    key={i}
                                    className="text-[11px] bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full"
                                  >
                                    {a.name}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!r.completed && (
                          <button
                            type="button"
                            onClick={() => handleComplete(r._id)}
                            disabled={busyId === r._id}
                            title="Mark complete"
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditForm(r)}
                          title="Edit"
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>

                        {confirmDeleteId === r._id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(r._id)}
                              disabled={busyId === r._id}
                              className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs font-semibold text-gray-500 px-2 py-1.5"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(r._id)}
                            title="Delete"
                            className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ReminderAgent;