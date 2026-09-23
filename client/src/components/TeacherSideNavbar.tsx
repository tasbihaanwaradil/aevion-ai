"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { BASE_URL } from "../configs/Config";

const API_BASE = `${BASE_URL}/api`;

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

  const handleLogoClick = () => {
    // Route the logo to the teacher's own dashboard, not the public "/"
    // root — navigating to "/" was landing on a different app entry point
    // that reset the teacher auth state, which looked like an unintended logout.
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate("/");
  };

  // ---------- Collapsed rail ----------
  if (!isOpen) {
    return (
      <div className="fixed top-0 left-0 h-screen w-16 bg-sky-50 text-sky-900 border-r border-sky-200 flex flex-col items-center py-4 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="hover:bg-[#151d4b] hover:text-white rounded-lg p-1.5 mb-6 transition-colors"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpenIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onNewQuiz}
          className="w-9 h-9 rounded-full bg-[#151d4b]/10 flex items-center justify-center hover:bg-[#151d4b] hover:text-white transition-colors"
          aria-label="New quiz"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ---------- Expanded sidebar ----------
  return (
    <div className="fixed top-0 left-0 h-screen w-72 bg-sky-50 text-sky-900 border-r border-sky-200 flex flex-col z-40">
      <div className="flex items-center justify-between px-4 py-4">
        <Link to="/Dashboard" onClick={handleLogoClick} className="flex items-center">
          <img
            src="/assets/logo.svg"
            alt="logo"
            className="h-8 w-auto cursor-pointer"
          />
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="hover:bg-[#151d4b] hover:text-white rounded-lg p-1.5 transition-colors"
          aria-label="Collapse sidebar"
        >
          <PanelLeftCloseIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="px-3 mb-2">
        <button
          type="button"
          onClick={onNewQuiz}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-[#151d4b] hover:text-white transition-colors group"
        >
          <PlusIcon className="w-4 h-4 group-hover:text-white" />
          New quiz
        </button>
      </div>

      <div className="px-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-sky-200 rounded-lg px-3 h-9 focus-within:border-[#151d4b] transition-colors">
          <SearchIcon className="w-3.5 h-3.5 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes"
            className="flex-1 bg-transparent outline-none text-sm text-[#151d4b] placeholder-[#151d4b] min-w-0"
          />
        </div>
      </div>

      <div className="relative z-0 flex-1 min-h-0 overflow-y-auto px-3 pb-3">
        <p className="px-2 mb-1.5 text-xs font-semibold uppercase tracking-wide">
          Recent
        </p>
        {loading ? (
          <p className="px-2 text-xs">Loading...</p>
        ) : visibleQuizzes.length === 0 ? (
          <p className="px-2 text-xs">No quizzes yet</p>
        ) : (
          <div className="space-y-0.5">
            {visibleQuizzes.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => navigate(`/Quiz/Edit/${q.id}`)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm transition-colors ${
                  activeQuizId === q.id
                    ? "bg-[#151d4b] text-white"
                    : "hover:bg-[#151d4b] hover:text-white"
                }`}
              >
                <FileTextIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate flex-1">{q.title}</span>
                <span className="text-[10px] shrink-0 opacity-60">
                  {formatRelativeTime(q.updatedAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative border-t border-sky-200 p-3">
        <button
          type="button"
          onClick={() => setShowProfileMenu((v) => !v)}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#151d4b] hover:text-white transition-colors text-left group"
        >
          <span className="w-7 h-7 rounded-full bg-[#151d4b]/10 text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-white/20 group-hover:text-white">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm truncate group-hover:text-white">
              {teacher?.name || "Teacher"}
            </span>
            <span className="block text-xs truncate group-hover:text-white/70">
              {teacher?.email || ""}
            </span>
          </span>
        </button>

        {showProfileMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 z-50 bg-white border border-sky-200 rounded-lg shadow-2xl py-1 text-sky-900">
            <button
              type="button"
              onClick={() => navigate("/Settings")}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#151d4b] hover:text-white text-left transition-colors"
            >
              <SettingsIcon className="w-4 h-4" /> Settings
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-[#151d4b] hover:text-white text-left transition-colors"
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