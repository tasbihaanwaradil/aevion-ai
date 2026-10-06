"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  SearchIcon,
  XIcon,
  CopyIcon,
  EyeIcon,
  Share2Icon,
  CheckIcon,
  LinkIcon,
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  FileBarChartIcon,
} from "lucide-react";
import { useTeacherAuth } from "../context/TeacherAuthContext";
import TeacherNavbar from "../components/TeacherNavabar";
import { BASE_URL } from "../configs/Config";

const API_BASE = `${BASE_URL}/api`;
const FRONTEND_URL = window.location.origin;

type Report = {
  id: string;
  title: string;
  roomCode: string;
  updatedAt: string;
  attempted: number;
  avgScore: number;
  isShared: boolean;
  shareCode: string | null;
};

type SortKey = "date" | "attempted";
type Toast = { id: number; message: string };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const GRID = "grid grid-cols-[1fr_auto] md:grid-cols-[1fr_130px_150px_90px]";

const Reports = () => {
  const navigate = useNavigate();
  const { teacher } = useTeacherAuth();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDesc, setSortDesc] = useState(true);

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [shareReport, setShareReport] = useState<Report | null>(null);
  const [shareSaving, setShareSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const roomName =
    (teacher as { roomCode?: string })?.roomCode ||
    teacher?.name ||
    "your room";

  const notify = (message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3500,
    );
  };

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/session`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
      } else {
        setError(data.message || "Failed to load reports.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (!shareReport) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShareReport(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shareReport]);

  const handleOpenShare = (report: Report) => {
    setShareReport(report);
    setCopied(false);
  };

  const handleToggleSharing = async (enabled: boolean) => {
    if (!shareReport) return;
    setShareSaving(true);
    try {
      const res = await fetch(`${API_BASE}/session/${shareReport.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = {
          ...shareReport,
          isShared: data.session.isShared,
          shareCode: data.session.shareCode ?? null,
        };
        setShareReport(updated);
        setReports((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)),
        );
      } else {
        notify(data.message || "Failed to update sharing.");
      }
    } catch (err) {
      console.error(err);
      notify("Could not reach the server.");
    } finally {
      setShareSaving(false);
    }
  };

  const copyLink = (shareCode: string) => {
    navigator.clipboard.writeText(`${FRONTEND_URL}/Report/${shareCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc((d) => !d);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const visibleReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    const value = (r: Report) =>
      sortKey === "date" ? new Date(r.updatedAt).getTime() : r.attempted;
    return reports
      .filter((r) => r.title.toLowerCase().includes(q))
      .sort((a, b) => (sortDesc ? value(b) - value(a) : value(a) - value(b)));
  }, [reports, search, sortKey, sortDesc]);

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className={`hidden md:flex items-center gap-1 text-left transition hover:text-[#007a8c] ${
        sortKey === k ? "text-[#007a8c]" : ""
      }`}
    >
      {label}
      {sortKey === k &&
        (sortDesc ? (
          <ArrowDownIcon className="w-3 h-3" />
        ) : (
          <ArrowUpIcon className="w-3 h-3" />
        ))}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0A1238]">
      <TeacherNavbar />

      <div className="pt-20 h-screen">
        <div className="h-[calc(100vh-5rem)] px-3 sm:px-6 md:px-12 lg:px-20 xl:px-28 py-6 flex justify-center">
          <div className="w-full max-w-7xl h-full min-h-0 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 sm:px-8 pt-7 pb-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                {!loading && !error && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {reports.length}{" "}
                    {reports.length === 1 ? "activity" : "activities"}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 h-10 w-full sm:w-72 px-3 rounded-lg border border-gray-200 bg-gray-50 transition-colors focus-within:bg-white focus-within:border-[#007a8c]">
                <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${roomName}`}
                  aria-label="Search reports"
                  className="flex-1 min-w-0 h-full bg-transparent border-0 p-0 text-sm text-gray-700 placeholder-gray-400 outline-none focus:outline-none focus:ring-0 focus:shadow-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                    aria-label="Clear search"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 pb-6">
              {loading ? (
                <div className="space-y-2 pt-4" aria-busy="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-14 rounded-xl bg-gray-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : error ? (
                <div className="min-h-[300px] flex flex-col items-center justify-center text-center gap-3">
                  <AlertCircleIcon className="w-8 h-8 text-red-400" />
                  <p className="text-sm text-gray-600">{error}</p>
                  <button
                    type="button"
                    onClick={fetchReports}
                    className="h-9 px-4 rounded-lg bg-[#007a8c] text-white text-sm font-semibold hover:bg-[#005f6a] transition"
                  >
                    Try again
                  </button>
                </div>
              ) : visibleReports.length === 0 ? (
                <div className="min-h-[340px] flex flex-col items-center justify-center text-center gap-2">
                  <span className="w-12 h-12 rounded-2xl bg-sky-50 text-[#007a8c] flex items-center justify-center">
                    <FileBarChartIcon className="w-6 h-6" />
                  </span>
                  {search ? (
                    <>
                      <h2 className="text-base font-semibold text-gray-800">
                        No reports match your search
                      </h2>
                      <p className="text-sm text-gray-500">
                        Try a different activity name.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-base font-semibold text-gray-800">
                        No reports yet
                      </h2>
                      <p className="text-sm text-gray-500 max-w-sm">
                        Launch an activity to see graded reports of your
                        students' progress.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/TeacherDashboard")}
                        className="mt-3 h-10 px-5 rounded-lg bg-[#007a8c] text-white text-sm font-semibold hover:bg-[#005f6a] transition"
                      >
                        Launch activity
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div
                    className={`${GRID} items-center gap-4 sticky top-0 bg-white z-10 py-3 px-2 text-xs font-semibold text-gray-500 border-b border-gray-100`}
                  >
                    <span>Activity</span>
                    <SortHeader label="Date" k="date" />
                    <SortHeader label="Attempted" k="attempted" />
                    <span className="text-right">Actions</span>
                  </div>

                  <ul>
                    {visibleReports.map((r) => {
                      return (
                        <li
                          key={r.id}
                          className={`${GRID} items-center gap-4 py-3 px-2 rounded-xl border-b border-gray-100 last:border-b-0 hover:bg-sky-50/40 transition-colors`}
                        >
                          <button
                            type="button"
                            onClick={() => navigate(`/LiveResults/${r.id}`)}
                            className="flex items-center gap-3 min-w-0 text-left"
                          >
                            <span className="w-9 h-9 rounded-lg bg-sky-50 text-[#007a8c] flex items-center justify-center shrink-0">
                              <FileBarChartIcon className="w-4 h-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-gray-800 truncate hover:underline">
                                {r.title}
                              </span>
                              <span className="block text-xs text-gray-500 md:hidden">
                                {formatDate(r.updatedAt)} · {r.attempted}{" "}
                                attempted
                              </span>
                            </span>
                            {r.isShared && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 rounded-full px-2 py-0.5 shrink-0">
                                <LinkIcon className="w-3 h-3" />
                                Shared
                              </span>
                            )}
                          </button>

                          <span className="hidden md:block text-sm text-gray-500">
                            {formatDate(r.updatedAt)}
                          </span>
                          <span className="hidden md:block text-sm text-gray-600">
                            {r.attempted}{" "}
                            <span className="text-gray-400">
                              {r.attempted === 1 ? "student" : "students"}
                            </span>
                          </span>

                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              onClick={() => navigate(`/LiveResults/${r.id}`)}
                              aria-label={`View ${r.title}`}
                              title="View results"
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-sky-50 hover:text-[#007a8c] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007a8c]"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenShare(r)}
                              aria-label={`Share ${r.title}`}
                              title="Share results"
                              className={`w-9 h-9 rounded-lg flex items-center justify-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007a8c] ${
                                r.isShared
                                  ? "bg-sky-50 text-[#007a8c]"
                                  : "text-gray-400 hover:bg-sky-50 hover:text-[#007a8c]"
                              }`}
                            >
                              <Share2Icon className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share modal */}
      {shareReport && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-[70]"
          onClick={() => setShareReport(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-6 py-5">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">
                  Share results
                </h2>
                <p className="text-sm text-gray-500 truncate">
                  {shareReport.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareReport(null)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 border-t border-gray-100 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-800">
                    Enable public link
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Anyone with the link can view the full class results,
                    including student names, scores, and answers.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={shareReport.isShared}
                  disabled={shareSaving}
                  onClick={() => handleToggleSharing(!shareReport.isShared)}
                  className={`w-11 h-6 rounded-full transition relative shrink-0 disabled:opacity-50 ${
                    shareReport.isShared ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      shareReport.isShared ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {shareReport.isShared && shareReport.shareCode && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={`${FRONTEND_URL}/Report/${shareReport.shareCode}`}
                      className="flex-1 min-w-0 h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyLink(shareReport.shareCode!)}
                      className={`h-11 px-3 shrink-0 rounded-lg border flex items-center gap-1.5 text-sm font-medium transition ${
                        copied
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                      aria-label="Copy link"
                    >
                      {copied ? (
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
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg text-white bg-red-600"
          >
            <AlertCircleIcon className="w-4 h-4" />
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
