"use client";

import React, { useState } from "react";
import { XIcon, SearchIcon, ChevronLeftIcon, ArrowDownIcon, PlusIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const QuizLaunch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Falls back to the user's name if no dedicated room code exists yet —
  // swap `user?.roomCode` for whatever field actually holds this once
  // rooms are modeled on the backend.
  const roomName = (user as { roomCode?: string })?.roomCode || user?.name || "Your Room";

  const handleClose = () => navigate(-1);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-800">
            Launch Quiz in {roomName}
          </h1>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-8 pt-5">
          <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-xl px-4 h-12">
            <SearchIcon className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Personal"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 h-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-8 py-4">
          <ChevronLeftIcon className="w-4 h-4 text-[#2d5f6e]" />
          <span className="font-semibold text-gray-700">Personal</span>
        </div>

        {/* Table header */}
        <div className="flex items-center justify-between px-8 py-3 border-t border-gray-200 text-xs font-bold tracking-wide text-[#2d5f6e]">
          <span>NAME</span>
          <span className="flex items-center gap-1">
            MODIFIED
            <ArrowDownIcon className="w-3 h-3" />
          </span>
        </div>

        {/* Content */}
        <div className="border-t border-gray-100 min-h-[220px] flex items-center justify-center">
          <p className="text-gray-500">This folder is empty</p>
        </div>

        {/* Footer */}
        <div className="px-8 py-5">
          <button
            type="button"
            onClick={() => navigate("/Library")}
            className="flex items-center gap-2 text-[#2d5f6e] font-semibold hover:underline"
          >
            <PlusIcon className="w-4 h-4" />
            Add Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizLaunch;