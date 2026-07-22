"use client";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ClipboardListIcon,
  RocketIcon,
  LogOutIcon,
  ChevronDownIcon,
  MenuIcon,
  XIcon,
  SparklesIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Launch", route: "/TeacherDashboard" },
  { label: "Library", route: "/Library" },
  { label: "Discover", route: "/Discover" },
  { label: "Rooms", route: "/Rooms" },
  { label: "Reports", route: "/Reports" },
  { label: "Live Results", route: "/LiveResults" },
];

const activityTypes = [
  {
    title: "Quiz",
    icon: ClipboardListIcon,
    route: "/QuizLaunch",
    border: "border-sky-400",
    text: "text-sky-300",
    glow: "group-hover:shadow-[0_0_35px_-5px_rgba(56,189,248,0.6)]",
    fill: "from-sky-400/20 to-sky-400/0",
  },
  {
    title: "Space Race",
    icon: RocketIcon,
    route: "/LaunchSpace",
    border: "border-violet-400",
    text: "text-violet-300",
    glow: "group-hover:shadow-[0_0_35px_-5px_rgba(167,139,250,0.6)]",
    fill: "from-violet-400/20 to-violet-400/0",
  },
  {
    title: "Exit Ticket",
    icon: LogOutIcon,
    route: "/ExitTicket",
    border: "border-amber-400",
    text: "text-amber-300",
    glow: "group-hover:shadow-[0_0_35px_-5px_rgba(251,191,36,0.6)]",
    fill: "from-amber-400/20 to-amber-400/0",
  },
];

const quickQuestionTypes = [
  {
    label: "MC",
    title: "Multiple Choice",
    border: "border-yellow-400",
    text: "text-yellow-300",
    glow: "group-hover:shadow-[0_0_28px_-6px_rgba(250,204,21,0.6)]",
    fill: "from-yellow-400/20 to-yellow-400/0",
    route: "/QuickQuestion/MultipleChoice",
  },
  {
    label: "TF",
    title: "True / False",
    border: "border-purple-400",
    text: "text-purple-300",
    glow: "group-hover:shadow-[0_0_28px_-6px_rgba(192,132,252,0.6)]",
    fill: "from-purple-400/20 to-purple-400/0",
    route: "/QuickQuestion/TrueFalse",
  },
  {
    label: "SA",
    title: "Short Answer",
    border: "border-orange-400",
    text: "text-orange-300",
    glow: "group-hover:shadow-[0_0_28px_-6px_rgba(251,146,60,0.6)]",
    fill: "from-orange-400/20 to-orange-400/0",
    route: "/QuickQuestion/ShortAnswer",
  },
];

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Falls back to the user's name if no dedicated room code exists yet —
  // swap `user?.roomCode` for whatever field actually holds this once
  // rooms are modeled on the backend.
  const roomName =
    (user as { roomCode?: string })?.roomCode || user?.name || "Your Room";

  const handleLogout = () => {
    logout();
    navigate("/Teacherlogin");
  };

  return (
    <div className="min-h-screen bg-[#0A1238] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-sky-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-[26rem] h-[26rem] rounded-full bg-violet-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-[24rem] h-[24rem] rounded-full bg-amber-500/10 blur-[120px]" />

      {/* Navbar */}
      <nav
        className="
          fixed top-0 z-50 w-full
          h-20
          px-4 md:px-16 lg:px-24 xl:px-32
          bg-sky-50 backdrop-blur-lg
          border-b border-sky-100
        "
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/">
            <img src="/assets/logo.svg" alt="logo" className="h-16.5 w-auto" />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-8 h-full">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.route)}
                className={`h-full flex items-center text-sm font-semibold border-b-2 transition-colors ${
                  item.label === "Launch"
                    ? "text-sky-900 border-[#007a8c]"
                    : "text-sky-900/70 border-transparent hover:text-sky-600"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="hidden sm:flex items-center gap-1 bg-white border border-sky-100 rounded-lg px-3 h-9 text-sm font-medium text-sky-900 hover:bg-sky-100 transition"
            >
              {roomName}
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            <div className="relative group">
              <button className="rounded-full size-8 h-8 bg-[#007a8c] text-white font-semibold">
                {getInitials(user?.name)}
              </button>
              <div className="absolute hidden group-hover:block top-8 right-0 pt-4">
                <button
                  onClick={handleLogout}
                  className="bg-[#007a8c] text-white font-semibold hover:bg-[#005f6a] transition px-4 py-2 rounded whitespace-nowrap"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Mobile */}
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden text-sky-900"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[60] bg-white transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <img src="/assets/logo.svg" alt="logo" className="h-8" />
          <XIcon onClick={() => setIsOpen(false)} className="cursor-pointer" />
        </div>

        <div className="flex flex-col gap-6 p-8">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setIsOpen(false);
                navigate(item.route);
              }}
              className="text-lg font-medium text-sky-900 hover:text-sky-600 text-left"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="text-lg font-medium text-sky-900 hover:text-sky-600 text-left"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="pt-20 relative z-10">
        <div className="min-h-[calc(100vh-5rem)] p-8 flex items-center justify-center">
          <div className="w-full max-w-3xl">
            {/* Welcome heading */}
            <div className="text-center mb-12">
              <p className="flex items-center justify-center gap-2 text-xs font-bold tracking-[0.2em] text-sky-300 uppercase mb-3">
                <SparklesIcon className="w-4 h-4" />
                Ready when you are
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Welcome back, {user?.name || "Teacher"}!
              </h1>
              <p className="text-gray-400">
                What would you like to launch today?
              </p>
            </div>

            {/* Activity types */}
            <div className="grid grid-cols-3 gap-6 md:gap-10 justify-items-center">
              {activityTypes.map((activity) => {
                const Icon = activity.icon;

                return (
                  <button
                    key={activity.title}
                    type="button"
                    onClick={() => navigate(activity.route)}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div
                      className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full border-2 ${activity.border} ${activity.text} bg-gradient-to-br ${activity.fill} flex items-center justify-center transition-all duration-300 ${activity.glow} group-hover:scale-110 group-hover:-translate-y-1`}
                    >
                      <Icon className="w-9 h-9 md:w-10 md:h-10" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm md:text-base font-semibold text-gray-100 group-hover:text-white transition-colors">
                      {activity.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-12">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-500/50 to-gray-500/50" />
              <span className="text-xs font-bold tracking-[0.2em] text-gray-300 uppercase">
                Quick Question
              </span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-500/50 to-gray-500/50" />
            </div>

            {/* Quick question types */}
            <div className="grid grid-cols-3 gap-6 md:gap-10 justify-items-center">
              {quickQuestionTypes.map((question) => (
                <button
                  key={question.label}
                  type="button"
                  onClick={() => navigate(question.route)}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-2 ${question.border} ${question.text} bg-gradient-to-br ${question.fill} flex items-center justify-center text-lg font-bold transition-all duration-300 ${question.glow} group-hover:scale-110 group-hover:-translate-y-1`}
                  >
                    {question.label}
                  </div>
                  <span className="text-sm font-semibold text-gray-100 group-hover:text-white text-center transition-colors">
                    {question.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;