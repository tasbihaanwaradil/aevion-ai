"use client";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDownIcon, MenuIcon, XIcon, WifiIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

const LiveResults = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const roomName =
    (user as { roomCode?: string })?.roomCode || user?.name || "Your Room";

  const handleLogout = () => {
    logout();
    navigate("/Teacherlogin");
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0A1238]">
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
                  item.label === "Live Results"
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

      {/* Body */}
      <div className="pt-20 h-screen">
        <div className="h-[calc(100vh-5rem)] px-4 md:px-16 lg:px-24 xl:px-32 py-8 flex items-center justify-center">
          <div className="w-full max-w-7xl h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
            <div className="flex flex-col items-center text-center max-w-md px-6">
              <div
                className="w-40 h-40 bg-gray-100 flex items-center justify-center mb-8"
                style={{
                  clipPath:
                    "polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)",
                }}
              >
                <WifiIcon
                  className="w-16 h-16 text-gray-300"
                  strokeWidth={1.5}
                />
              </div>

              <h1 className="text-2xl font-semibold text-gray-800 mb-3">
                Live Results
              </h1>
              <p className="text-gray-500 mb-8">
                You'll see live results for your room's current activity
                here. Launch a new activity to get started!
              </p>

              <button
                type="button"
                onClick={() => navigate("/TeacherDashboard")}
                className="h-10 px-5 rounded-lg bg-sky-50 text-[#007a8c] text-sm font-semibold hover:bg-sky-100 transition"
              >
                Launch Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveResults;