"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  XIcon,
  UserIcon,
  SearchIcon,
  CopyIcon,
  ClipboardListIcon,
  Trash2Icon,
  MoreVerticalIcon,
  Share2Icon,
  DownloadIcon,
  CheckIcon,
  LinkIcon,
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  Loader2Icon,
} from "lucide-react";
import TeacherNavbar from "../components/TeacherNavabar";
import { BASE_URL } from "../configs/Config";

const API_BASE = `${BASE_URL}/api`;

type Quiz = {
  id: string;
  name: string;
  modified: string;
  modifiedRaw: number;
  isShared: boolean;
  shareCode: string | null;
};

type Toast = { id: number; type: "success" | "error"; message: string };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const mapQuiz = (q: any): Quiz => ({
  id: q._id,
  name: q.title,
  modified: formatDate(q.updatedAt),
  modifiedRaw: new Date(q.updatedAt).getTime(),
  isShared: Boolean(q.isShared),
  shareCode: q.shareCode ?? null,
});

const ROW_GRID = "grid grid-cols-[1fr_auto] md:grid-cols-[1fr_140px_180px]";

const IconButton = ({
  label,
  onClick,
  children,
  active = false,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`w-9 h-9 rounded-lg flex items-center justify-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007a8c] ${
      danger
        ? "text-gray-400 hover:bg-red-50 hover:text-red-500"
        : active
          ? "bg-sky-50 text-[#007a8c]"
          : "text-gray-400 hover:bg-sky-50 hover:text-[#007a8c]"
    }`}
  >
    {children}
  </button>
);

const Library = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [shareModalQuiz, setShareModalQuiz] = useState<Quiz | null>(null);
  const [shareSaving, setShareSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<"link" | "code" | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = (type: Toast["type"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3500,
    );
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/quiz`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setQuizzes(data.quizzes.map(mapQuiz));
      } else {
        setError(data.message || "Failed to load quizzes.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/quiz/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setQuizzes((prev) => prev.filter((q) => q.id !== deleteTarget.id));
        notify("success", `Deleted "${deleteTarget.name}"`);
        setDeleteTarget(null);
      } else {
        notify("error", data.message || "Failed to delete quiz.");
      }
    } catch (err) {
      console.error(err);
      notify("error", "Could not reach the server.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/quiz/${id}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setQuizzes((prev) => [mapQuiz(data.quiz), ...prev]);
        notify("success", "Quiz duplicated");
      } else {
        notify("error", data.message || "Failed to duplicate quiz.");
      }
    } catch (err) {
      console.error(err);
      notify("error", "Could not reach the server.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (id: string, name: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/quiz/${id}/export-pdf`, {
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        notify("error", data.message || "Failed to download quiz.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.replace(/[^a-z0-9]/gi, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      notify("error", "Could not reach the server.");
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenShare = (quiz: Quiz) => {
    setShareModalQuiz(quiz);
    setCopiedField(null);
  };

  const handleToggleSharing = async (enabled: boolean) => {
    if (!shareModalQuiz) return;
    setShareSaving(true);
    try {
      const res = await fetch(`${API_BASE}/quiz/${shareModalQuiz.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = {
          ...shareModalQuiz,
          isShared: data.quiz.isShared,
          shareCode: data.quiz.shareCode ?? null,
        };
        setShareModalQuiz(updated);
        setQuizzes((prev) =>
          prev.map((q) => (q.id === updated.id ? updated : q)),
        );
      } else {
        notify("error", data.message || "Failed to update sharing.");
      }
    } catch (err) {
      console.error(err);
      notify("error", "Could not reach the server.");
    } finally {
      setShareSaving(false);
    }
  };

  const copyToClipboard = (text: string, field: "link" | "code") => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const visibleQuizzes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return quizzes
      .filter((quiz) => quiz.name.toLowerCase().includes(q))
      .sort((a, b) =>
        sortDesc
          ? b.modifiedRaw - a.modifiedRaw
          : a.modifiedRaw - b.modifiedRaw,
      );
  }, [quizzes, searchQuery, sortDesc]);

  const shareLink = shareModalQuiz?.shareCode
    ? `${window.location.origin}/Quiz/Import/${shareModalQuiz.shareCode}`
    : "";

  return (
    <div className="min-h-screen bg-[#0A1238]">
      <TeacherNavbar />

      <div className="pt-20 h-screen">
        <div className="h-[calc(100vh-5rem)] px-3 sm:px-6 md:px-12 lg:px-20 xl:px-28 py-6 flex justify-center">
          <div className="w-full max-w-7xl h-full min-h-0 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/60 px-5 py-5 md:py-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-6">
                Library
              </h1>
              <div className="w-full flex items-center justify-between gap-2 bg-white border border-[#007a8c]/30 ring-1 ring-[#007a8c]/10 rounded-xl px-3 h-11 text-sm font-semibold text-gray-900">
                <span className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#007a8c] text-white flex items-center justify-center">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  Personal
                </span>
                <span className="text-xs font-semibold text-[#007a8c] bg-sky-50 rounded-full px-2 py-0.5">
                  {quizzes.length}
                </span>
              </div>
            </aside>

            {/* Main */}
            <main className="flex-1 min-h-0 flex flex-col">
              {/* Toolbar */}
              <div className="px-5 sm:px-8 pt-6 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-900 pb-2.5 -mb-px border-b-2 border-[#007a8c]">
                    Quizzes
                  </h2>

                  <div className="flex items-center gap-2 h-9 w-full sm:w-64 sm:mb-2 px-3 rounded-lg border border-gray-200 bg-gray-50 transition-colors focus-within:bg-white focus-within:border-[#007a8c]">
                    <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search quizzes"
                      aria-label="Search quizzes"
                      className="flex-1 min-w-0 h-full bg-transparent border-0 p-0 text-sm text-gray-700 placeholder-gray-400 outline-none focus:outline-none focus:ring-0 focus:shadow-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="text-gray-400 hover:text-gray-600 shrink-0"
                        aria-label="Clear search"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 pb-6">
                <>
                  <div
                    className={`${ROW_GRID} items-center gap-4 sticky top-0 bg-white z-10 py-3 text-xs font-semibold text-gray-500 border-b border-gray-100`}
                  >
                    <span>Name</span>
                    <button
                      type="button"
                      onClick={() => setSortDesc((s) => !s)}
                      className="hidden md:flex items-center gap-1 hover:text-[#007a8c] transition text-left"
                      aria-label="Toggle sort by modified date"
                    >
                      Modified
                      {sortDesc ? (
                        <ArrowDownIcon className="w-3 h-3" />
                      ) : (
                        <ArrowUpIcon className="w-3 h-3" />
                      )}
                    </button>
                    <span className="text-right">Actions</span>
                  </div>

                  {loading ? (
                    <div className="space-y-2 pt-3" aria-busy="true">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-14 rounded-xl bg-gray-100 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : error ? (
                    <div className="min-h-[260px] flex flex-col items-center justify-center text-center gap-3">
                      <AlertCircleIcon className="w-8 h-8 text-red-400" />
                      <p className="text-sm text-gray-600">{error}</p>
                      <button
                        type="button"
                        onClick={fetchQuizzes}
                        className="h-9 px-4 rounded-lg bg-[#007a8c] text-white text-sm font-semibold hover:bg-[#005f6a] transition"
                      >
                        Try again
                      </button>
                    </div>
                  ) : visibleQuizzes.length > 0 ? (
                    <ul>
                      {visibleQuizzes.map((quiz) => (
                        <li
                          key={quiz.id}
                          className={`${ROW_GRID} items-center gap-4 py-3 px-2 -mx-2 rounded-xl border-b border-gray-100 last:border-b-0 hover:bg-sky-50/40 transition-colors`}
                        >
                          <button
                            type="button"
                            onClick={() => navigate(`/Quiz/Edit/${quiz.id}`)}
                            className="flex items-center gap-3 min-w-0 text-left"
                          >
                            <span className="w-9 h-9 rounded-lg bg-sky-50 text-[#007a8c] flex items-center justify-center shrink-0">
                              <ClipboardListIcon className="w-4 h-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-gray-800 truncate hover:underline">
                                {quiz.name}
                              </span>
                              <span className="flex items-center gap-2 text-xs text-gray-500 md:hidden">
                                {quiz.modified}
                              </span>
                            </span>
                            {quiz.isShared && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 rounded-full px-2 py-0.5 shrink-0">
                                <LinkIcon className="w-3 h-3" />
                                Shared
                              </span>
                            )}
                          </button>

                          <span className="hidden md:block text-sm text-gray-500">
                            {quiz.modified}
                          </span>

                          <div className="flex items-center justify-end gap-0.5">
                            {busyId === quiz.id ? (
                              <span className="w-9 h-9 flex items-center justify-center">
                                <Loader2Icon className="w-4 h-4 text-[#007a8c] animate-spin" />
                              </span>
                            ) : (
                              <>
                                <IconButton
                                  label={`Share ${quiz.name}`}
                                  onClick={() => handleOpenShare(quiz)}
                                  active={quiz.isShared}
                                >
                                  <Share2Icon className="w-4 h-4" />
                                </IconButton>
                                <IconButton
                                  label={`Duplicate ${quiz.name}`}
                                  onClick={() => handleDuplicate(quiz.id)}
                                >
                                  <CopyIcon className="w-4 h-4" />
                                </IconButton>
                                <IconButton
                                  label={`Download ${quiz.name}`}
                                  onClick={() =>
                                    handleDownload(quiz.id, quiz.name)
                                  }
                                >
                                  <DownloadIcon className="w-4 h-4" />
                                </IconButton>
                              </>
                            )}

                            <div className="relative">
                              <IconButton
                                label={`More options for ${quiz.name}`}
                                active={openMenuId === quiz.id}
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === quiz.id ? null : quiz.id,
                                  )
                                }
                              >
                                <MoreVerticalIcon className="w-4 h-4" />
                              </IconButton>

                              {openMenuId === quiz.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setOpenMenuId(null)}
                                  />
                                  <div className="absolute right-0 top-10 z-50 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setDeleteTarget(quiz);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 text-left"
                                    >
                                      <Trash2Icon className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="min-h-[260px] flex flex-col items-center justify-center text-center gap-2">
                      <span className="w-12 h-12 rounded-2xl bg-sky-50 text-[#007a8c] flex items-center justify-center">
                        <ClipboardListIcon className="w-6 h-6" />
                      </span>
                      <p className="text-sm font-semibold text-gray-800">
                        {searchQuery
                          ? "No quizzes match your search"
                          : "No quizzes yet"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {searchQuery
                          ? "Try a different title."
                          : "Quizzes you create will appear here."}
                      </p>
                    </div>
                  )}
                </>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-[70]"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
              <Trash2Icon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Delete quiz?</h2>
            <p className="text-sm text-gray-600 mt-1">
              "{deleteTarget.name}" will be permanently deleted. This can't be
              undone.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="h-10 px-4 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="h-10 px-4 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60 flex items-center gap-2"
              >
                {deleting && <Loader2Icon className="w-4 h-4 animate-spin" />}
                Delete quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Quiz modal */}
      {shareModalQuiz && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-[70]"
          onClick={() => setShareModalQuiz(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-6 py-5 gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">Share quiz</h2>
                <p className="text-sm text-gray-500 truncate">
                  {shareModalQuiz.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareModalQuiz(null)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 border-t border-gray-100 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-800">Enable sharing</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Anyone with the link or code can import a copy of this quiz
                    into their library.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={shareModalQuiz.isShared}
                  disabled={shareSaving}
                  onClick={() => handleToggleSharing(!shareModalQuiz.isShared)}
                  className={`w-11 h-6 rounded-full transition relative shrink-0 disabled:opacity-50 ${
                    shareModalQuiz.isShared ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      shareModalQuiz.isShared ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {shareModalQuiz.isShared && shareModalQuiz.shareCode && (
                <>
                  {(
                    [
                      ["link", "Link", shareLink],
                      ["code", "Code", shareModalQuiz.shareCode],
                    ] as const
                  ).map(([field, label, value]) => (
                    <div key={field}>
                      <label className="block text-sm text-gray-600 mb-2">
                        {label}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={value}
                          className={`flex-1 min-w-0 h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none ${
                            field === "code"
                              ? "font-semibold tracking-wide"
                              : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(value, field)}
                          className={`h-11 px-3 shrink-0 rounded-lg border flex items-center gap-1.5 text-sm font-medium transition ${
                            copiedField === field
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                          aria-label={`Copy ${label.toLowerCase()}`}
                        >
                          {copiedField === field ? (
                            <>
                              <CheckIcon className="w-4 h-4" /> Copied
                            </>
                          ) : (
                            <>
                              <CopyIcon className="w-4 h-4" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div
        className="fixed bottom-5 right-5 z-[80] space-y-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg text-white ${
              t.type === "success" ? "bg-gray-900" : "bg-red-600"
            }`}
          >
            {t.type === "success" ? (
              <CheckIcon className="w-4 h-4 text-green-400" />
            ) : (
              <AlertCircleIcon className="w-4 h-4" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;
