"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SearchIcon,
  LayoutDashboardIcon,
  FileTextIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
} from "lucide-react";
import { useTeacherAuth } from "../context/TeacherAuthContext";
import { BASE_URL } from "../configs/Config";

const API_BASE = `${BASE_URL}/api`;

type RecentQuiz = { id: string; title: string; updatedAt: string };

interface TeacherSideNavbarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
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

const isMobileViewport = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 767px)").matches;

const TeacherSideNavbar: React.FC<TeacherSideNavbarProps> = ({
  isOpen,
  setIsOpen,
  activeQuizId,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { teacher, logout } = useTeacherAuth();

  const [search, setSearch] = useState("");
  const [quizzes, setQuizzes] = useState<RecentQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const onDashboard = location.pathname.toLowerCase() === "/dashboard";

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

  // On mobile the open sidebar is a drawer: close it with Escape and stop the
  // page behind it from scrolling.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    if (isMobileViewport()) document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, setIsOpen]);

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

  // Navigate, and on phones also close the drawer so the new page is visible.
  // On larger screens the sidebar stays open, as before.
  const go = (route: string) => {
    setShowProfileMenu(false);
    if (isMobileViewport()) setIsOpen(false);
    navigate(route);
  };

  const handleLogoClick = () => {
    // Route the logo to the teacher's own dashboard, not the public "/"
    // root — navigating to "/" was landing on a different app entry point
    // that reset the teacher auth state, which looked like an unintended logout.
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    if (isMobileViewport()) setIsOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <>
      {/* --------------------------------------------------
          MOBILE: menu button (shown only when the drawer is closed)
         -------------------------------------------------- */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="md:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-lg bg-sky-50 text-sky-900 border border-sky-200 shadow-md flex items-center justify-center active:bg-[#151d4b] active:text-white transition-colors"
          aria-label="Open menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
      )}

      {/* --------------------------------------------------
          MOBILE: backdrop behind the open drawer
         -------------------------------------------------- */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* --------------------------------------------------
          DESKTOP: collapsed icon rail (hidden on mobile)
         -------------------------------------------------- */}
      {!isOpen && (
        <div className="hidden md:flex fixed top-0 left-0 h-dvh w-16 bg-sky-50 text-sky-900 border-r border-sky-200 flex-col items-center py-4 z-40">
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
            onClick={() => navigate("/Dashboard")}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              onDashboard
                ? "bg-[#151d4b] text-white"
                : "bg-[#151d4b]/10 hover:bg-[#151d4b] hover:text-white"
            }`}
            aria-label="Dashboard"
            title="Dashboard"
          >
            <LayoutDashboardIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* --------------------------------------------------
          EXPANDED SIDEBAR
          Mobile: slide-over drawer above the backdrop (z-50).
          Desktop: fixed sidebar (z-40, as before).
          Always rendered so the slide animation can play; on desktop it is
          removed while collapsed (md:hidden).
         -------------------------------------------------- */}
      <aside
        aria-hidden={!isOpen}
        className={`fixed top-0 left-0 h-dvh w-72 max-w-[85vw] bg-sky-50 text-sky-900 border-r border-sky-200 flex flex-col z-50 md:z-40 shadow-2xl md:shadow-none
          transition-[transform,visibility] duration-300 ease-out
          ${isOpen ? "translate-x-0 visible" : "-translate-x-full invisible md:hidden"}`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link
            to="/QuizGenerator"
            onClick={handleLogoClick}
            className="flex items-center"
          >
            <img
              src="/assets/logo.svg"
              alt="logo"
              className="h-8 w-auto cursor-pointer"
            />
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="hover:bg-[#151d4b] hover:text-white active:bg-[#151d4b] active:text-white rounded-lg p-2 md:p-1.5 transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeftCloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 mb-2">
          <button
            type="button"
            onClick={() => go("/TeacherDashboard")}
            className={`w-full flex items-center gap-2 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-colors group ${
              onDashboard
                ? "bg-[#151d4b] text-white"
                : "hover:bg-[#151d4b] hover:text-white active:bg-[#151d4b] active:text-white"
            }`}
          >
            <LayoutDashboardIcon className="w-4 h-4 group-hover:text-white" />
            Quiz Dashboard
          </button>
        </div>

        <div className="px-3 mb-4">
          <div className="flex items-center gap-2 bg-white border border-sky-200 rounded-lg px-3 h-10 md:h-9 focus-within:border-[#151d4b] transition-colors">
            <SearchIcon className="w-3.5 h-3.5 shrink-0" />
            {/* text-base on mobile: iOS Safari zooms into fields below 16px */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quizzes"
              className="flex-1 bg-transparent outline-none text-base md:text-sm text-[#151d4b] placeholder-[#151d4b] min-w-0"
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
                  onClick={() => go(`/Quiz/Edit/${q.id}`)}
                  className={`w-full flex items-center gap-2 px-2 py-2.5 md:py-2 rounded-lg text-left text-sm transition-colors ${
                    activeQuizId === q.id
                      ? "bg-[#151d4b] text-white"
                      : "hover:bg-[#151d4b] hover:text-white active:bg-[#151d4b] active:text-white"
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

        <div className="relative border-t border-sky-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setShowProfileMenu((v) => !v)}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#151d4b] hover:text-white active:bg-[#151d4b] active:text-white transition-colors text-left group"
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
                onClick={() => go("/Settings")}
                className="w-full flex items-center gap-2 px-3 py-3 md:py-2 text-sm hover:bg-[#151d4b] hover:text-white text-left transition-colors"
              >
                <SettingsIcon className="w-4 h-4" /> Settings
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-3 md:py-2 text-sm text-red-600 hover:bg-[#151d4b] hover:text-white text-left transition-colors"
              >
                <LogOutIcon className="w-4 h-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default TeacherSideNavbar;
