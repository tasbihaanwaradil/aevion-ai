"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "lucide-react";
import { useTeacherAuth } from "../context/TeacherAuthContext";
import TeacherNavbar from "../components/TeacherNavabar";

const Reports = () => {
  const navigate = useNavigate();
  const { teacher } = useTeacherAuth();
  const [search, setSearch] = useState("");

  const roomName =
    (teacher as { roomCode?: string })?.roomCode || teacher?.name || "Your Room";

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Wire this up to your reports search endpoint once it exists.
    console.log("Searching reports for", search || roomName);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0A1238]">
      <TeacherNavbar />

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
                    className="h-11 px-6 rounded-lg bg-[#007a8c] text-white text-sm font-bold hover:bg-[#005f6a] transition shrink-0"
                  >
                    SEARCH
                  </button>
                </div>

                <div className="flex items-center gap-3 md:ml-auto">
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    Filter by
                  </span>
                  <select
                    className="h-11 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#007a8c]"
                    defaultValue={roomName}
                  >
                    <option value={roomName}>{roomName}</option>
                  </select>
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