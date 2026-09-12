"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SearchIcon,
  PlusIcon,
  FileTextIcon,
  SettingsIcon,
  LogOutIcon,
} from "lucide-react";
import { useTeacherAuth } from "../context/TeacherAuthContext";

const API_BASE = "http://localhost:3000/api";

type RecentQuiz = { id: string; title: string; updatedAt: string };

interface TeacherSideNavbarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onNewQuiz?: () => void;
  activeQuizId?: string | null;
}

const formatRelativeTime = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const TeacherSideNavbar: React.FC<TeacherSideNavbarProps> = ({
  isOpen,
  setIsOpen,
  onNewQuiz,
  activeQuizId,
}) => {
  const navigate = useNavigate();
  const { teacher, logout } = useTeacherAuth();

  const [search, setSearch] = useState("");
  const [quizzes, setQuizzes] = useState<RecentQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/quiz`, { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setQuizzes(
            data.quizzes.map((q: any) => ({
              id: q._id,
              title: q.title,
              updatedAt: q.updatedAt,
            })),
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const visibleQuizzes = useMemo(
    () =>
      quizzes.filter((q) =>
        q.title.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [quizzes, search],
  );

  const initials = (teacher?.name || "T")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate("/Teacherlogin");
  };

  // ---------- Collapsed rail ----------
  if (!isOpen) {
    return (
      <div className="fixed top-0 left-0 h-screen w-16 bg-[#0d1230] border-r border-white/10 flex flex-col items-center py-4 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-gray-400 hover:text-white mb-6"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpenIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onNewQuiz}
          className="w-9 h-9 rounded-full bg-teal-400/10 text-teal-300 flex items-center justify-center hover:bg-teal-400/20 transition"
          aria-label="New quiz"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ---------- Expanded sidebar ----------
  return (
    <div className="fixed top-0 left-0 h-screen w-72 bg-[#0d1230] border-r border-white/10 flex flex-col z-40">
      <div className="flex items-center justify-between px-4 py-4">
        <span className="text-sm font-semibold text-white font-['Sora']">
          Aevion.AI
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
          aria-label="Collapse sidebar"
        >
          <PanelLeftCloseIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="px-3 mb-2">
        <button
          type="button"
          onClick={onNewQuiz}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-200 hover:bg-white/5 transition"
        >
          <PlusIcon className="w-4 h-4 text-teal-300" />
          New quiz
        </button>
      </div>

      <div className="px-3 mb-4">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 h-9">
          <SearchIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes"
            className="flex-1 bg-transparent outline-none text-sm text-gray-200 placeholder-gray-500 min-w-0"
          />
        </div>
      </div>

      <div className="relative z-0 flex-1 min-h-0 overflow-y-auto px-3 pb-3">
        <p className="px-2 mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Recent
        </p>
        {loading ? (
          <p className="px-2 text-xs text-gray-500">Loading...</p>
        ) : visibleQuizzes.length === 0 ? (
          <p className="px-2 text-xs text-gray-500">No quizzes yet</p>
        ) : (
          <div className="space-y-0.5">
            {visibleQuizzes.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => navigate(`/Quiz/Edit/${q.id}`)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm transition ${
                  activeQuizId === q.id
                    ? "bg-teal-400/10 text-teal-200"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                <FileTextIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span className="truncate flex-1">{q.title}</span>
                <span className="text-[10px] text-gray-600 shrink-0">
                  {formatRelativeTime(q.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => setShowProfileMenu((v) => !v)}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition text-left"
        >
          <span className="w-7 h-7 rounded-full bg-teal-400/20 text-teal-300 text-xs font-bold flex items-center justify-center shrink-0">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-gray-100 truncate">
              {teacher?.name || "Teacher"}
            </span>
            <span className="block text-xs text-gray-500 truncate">
              {teacher?.email || ""}
            </span>
          </span>
        </button>

        {showProfileMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 z-50 bg-[#151a3d] border border-white/10 rounded-lg shadow-2xl py-1">
            <button
              type="button"
              onClick={() => navigate("/Settings")}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 text-left"
            >
              <SettingsIcon className="w-4 h-4" /> Settings
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5 text-left"
            >
              <LogOutIcon className="w-4 h-4" /> Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSideNavbar;
