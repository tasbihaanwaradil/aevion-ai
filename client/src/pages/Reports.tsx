"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon, XIcon, CopyIcon, EyeIcon, Share2Icon } from "lucide-react";
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

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const Reports = () => {
  const navigate = useNavigate();
  const { teacher } = useTeacherAuth();
  const [search, setSearch] = useState("");

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [shareReport, setShareReport] = useState<Report | null>(null);
  const [shareSaving, setShareSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const roomName =
    (teacher as { roomCode?: string })?.roomCode ||
    teacher?.name ||
    "Your Room";

  useEffect(() => {
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
    fetchReports();
  }, []);

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
        alert(data.message || "Failed to update sharing.");
      }
    } catch (err) {
      console.error(err);
      alert("Could not reach the server.");
    } finally {
      setShareSaving(false);
    }
  };

  const copyLink = (shareCode: string) => {
    const link = `${FRONTEND_URL}/Report/${shareCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const visibleReports = reports.filter((r) =>
    r.title.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="h-screen overflow-hidden bg-[#0A1238]">
      <TeacherNavbar />

      <div className="pt-20 h-screen">
        <div className="h-[calc(100vh-5rem)] px-4 md:px-16 lg:px-24 xl:px-32 py-8 flex items-center justify-center">
          <div className="w-full max-w-7xl h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

              <div className="bg-gray-100 rounded-xl px-4 py-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-6">
                <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-lg h-11 px-3">
                  <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${roomName}`}
                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 min-w-0"
                  />
                </div>
              </div>

              {loading ? (
                <p className="text-center text-gray-500 py-24">
                  Loading reports...
                </p>
              ) : error ? (
                <p className="text-center text-red-500 py-24">{error}</p>
              ) : visibleReports.length === 0 ? (
                <div className="flex flex-col items-center text-center py-24">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    No Reports Found
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Launch an activity to see graded reports of your students'
                    progress.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/TeacherDashboard")}
                    className="h-10 px-5 rounded-lg bg-sky-50 text-[#007a8c] text-sm font-semibold hover:bg-sky-100 transition"
                  >
                    Launch Activity
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <div className="grid grid-cols-[1fr_120px_110px_110px_160px] gap-4 px-2 py-2 text-xs font-bold text-[#007a8c] uppercase tracking-wide">
                    <span>Activity</span>
                    <span>Date</span>
                    <span>Attempted</span>
                    <span>Avg Score</span>
                    <span className="text-right">Actions</span>
                  </div>
                  {visibleReports.map((r) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-[1fr_120px_110px_110px_160px] gap-4 px-2 py-4 items-center"
                    >
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {r.title}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(r.updatedAt)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {r.attempted}
                      </span>
                      <span className="text-sm text-gray-600">
                        {r.avgScore}%
                      </span>
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/LiveResults/${r.id}`)}
                          aria-label={`View ${r.title}`}
                          className="text-gray-400 hover:text-[#007a8c] transition"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenShare(r)}
                          aria-label={`Share ${r.title}`}
                          className={`transition ${r.isShared ? "text-[#007a8c]" : "text-gray-400 hover:text-[#007a8c]"}`}
                        >
                          <Share2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {shareReport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-[70]">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-lg font-bold text-gray-800">Share Results</h2>
              <button
                type="button"
                onClick={() => setShareReport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 border-t border-gray-100 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-800">
                    Enable Public Link
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Anyone with the link can view the full class results — all
                    student names, scores, and answers.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={shareSaving}
                  onClick={() => handleToggleSharing(!shareReport.isShared)}
                  className={`w-11 h-6 rounded-full transition relative shrink-0 disabled:opacity-50 ${
                    shareReport.isShared ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${
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
                      className="flex-1 h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyLink(shareReport.shareCode!)}
                      className="h-11 w-11 shrink-0 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                      aria-label="Copy link"
                    >
                      <CopyIcon className="w-4 h-4" />
                    </button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-600 mt-1">Copied!</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
