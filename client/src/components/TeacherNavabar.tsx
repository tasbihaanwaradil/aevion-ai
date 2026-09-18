"use client";

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ChevronDownIcon, MenuIcon, XIcon } from "lucide-react";
import { useTeacherAuth } from "../context/TeacherAuthContext";

const navItems = [
  { label: "Launch", route: "/TeacherDashboard" },
  { label: "Library", route: "/Library" },
  { label: "Discover", route: "/Discover" },
  { label: "Rooms", route: "/Rooms" },
  { label: "Reports", route: "/Reports" },
  { label: "Live Results", route: "/LiveResults" },
];

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

const TeacherNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { teacher, logout } = useTeacherAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Falls back to the teacher's name if no dedicated room code exists yet —
  // swap `teacher?.roomCode` for whatever field actually holds this once
  // rooms are modeled on the backend.
  const roomName =
    (teacher as { roomCode?: string })?.roomCode ||
    teacher?.name ||
    "Your Room";

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    setIsOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <>
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
                  location.pathname.toLowerCase() === item.route.toLowerCase()
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

            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen((v) => !v)}
                className="rounded-full size-8 h-8 bg-[#007a8c] text-white font-semibold"
              >
                {getInitials(teacher?.name)}
              </button>
              {accountMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <div className="absolute z-50 top-10 right-0">
                    <button
                      onClick={handleLogout}
                      className="bg-[#007a8c] text-white font-semibold hover:bg-[#005f6a] transition px-4 py-2 rounded whitespace-nowrap"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
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
          <button onClick={async () => { await logout(); navigate('/'); }} className="bg-[#007a8c] text-white font-semibold hover:bg-[#005f6a] transition px-4 py-2 rounded">
                    Logout
                  </button>
        </div>
      </div>
    </>
  );
};

export default TeacherNavbar;
