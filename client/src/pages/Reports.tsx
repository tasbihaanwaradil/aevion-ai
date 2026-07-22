"use client";

import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  CheckIcon,
  MenuIcon,
  XIcon,
  SearchIcon,
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

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

const statusFilters = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "from-deleted-rooms", label: "From Deleted Rooms" },
  { value: "trash", label: "Trash" },
];

const Reports = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const roomName =
    (user as { roomCode?: string })?.roomCode || user?.name || "Your Room";

  const [filterValue, setFilterValue] = useState<string>(roomName);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const filterLabel =
    filterValue === roomName
      ? roomName
      : statusFilters.find((f) => f.value === filterValue)?.label ?? roomName;

  const handleLogout = () => {
    logout();
    navigate("/Teacherlogin");
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Wire this up to your reports search endpoint once it exists.
    console.log("Searching reports for", search || roomName);
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
                  item.label === "Reports"
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
          <div className="w-full max-w-7xl h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Reports
              </h1>

              {/* Search / Filter bar */}
              <form
                onSubmit={handleSearch}
                className="bg-gray-100 rounded-xl px-4 py-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg h-11 px-3">
                    <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={`Search ${roomName}`}
                      className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 min-w-0"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-11 px-6 rounded-lg bg-[#007a8c] text-white text-sm font-bold hover:bg-sky-700 transition shrink-0"
                  >
                    SEARCH
                  </button>
                </div>

                <div className="flex items-center gap-3 md:ml-auto">
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    Filter by
                  </span>

                  {/* Custom dropdown — replaces the native <select> so we can
                      group "Rooms" vs "All" and show a checkmark on the
                      active choice. */}
                  <div className="relative" ref={filterRef}>
                    <button
                      type="button"
                      onClick={() => setFilterOpen((v) => !v)}
                      className="h-11 min-w-[180px] px-3 flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#007a8c]"
                      aria-haspopup="listbox"
                      aria-expanded={filterOpen}
                    >
                      <span className="truncate">{filterLabel}</span>
                      <ChevronsUpDownIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>

                    {filterOpen && (
                      <>
                        {/* Click-outside catcher */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setFilterOpen(false)}
                        />
                        <div
                          role="listbox"
                          className="absolute right-0 z-50 mt-1 w-64 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                        >
                          <p className="px-3 pt-2 pb-1 text-sm font-bold text-gray-800">
                            Rooms
                          </p>
                          <button
                            type="button"
                            role="option"
                            aria-selected={filterValue === roomName}
                            onClick={() => {
                              setFilterValue(roomName);
                              setFilterOpen(false);
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition ${
                              filterValue === roomName
                                ? "bg-gray-100 text-gray-800"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span className="truncate">{roomName}</span>
                            {filterValue === roomName && (
                              <CheckIcon className="w-4 h-4 text-[#007a8c] shrink-0" />
                            )}
                          </button>

                          <button
                            type="button"
                            role="option"
                            aria-selected={filterValue === "all"}
                            onClick={() => {
                              setFilterValue("all");
                              setFilterOpen(false);
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-bold text-left transition ${
                              filterValue === "all"
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-900 hover:bg-gray-50"
                            }`}
                          >
                            All
                            {filterValue === "all" && (
                              <CheckIcon className="w-4 h-4 text-[#007a8c] shrink-0" />
                            )}
                          </button>

                          {statusFilters
                            .filter((f) => f.value !== "all")
                            .map((f) => (
                              <button
                                key={f.value}
                                type="button"
                                role="option"
                                aria-selected={filterValue === f.value}
                                onClick={() => {
                                  setFilterValue(f.value);
                                  setFilterOpen(false);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition ${
                                  filterValue === f.value
                                    ? "bg-gray-100 text-gray-700"
                                    : "text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                <span className="truncate">{f.label}</span>
                                {filterValue === f.value && (
                                  <CheckIcon className="w-4 h-4 text-[#007a8c] shrink-0" />
                                )}
                              </button>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </form>

              {/* Empty state */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;