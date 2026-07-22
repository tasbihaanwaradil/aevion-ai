"use client";

import React, { useState } from "react";
import { XIcon, SearchIcon, FolderIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LaunchSpace = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");

  const handleClose = () => navigate(-1);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">
            Launch Space Race
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

        {/* Step 1 */}
        <div className="px-8 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  step === 1 ? "bg-[#2d5f6e]" : "bg-gray-300"
                }`}
              >
                1
              </div>
              <span
                className={`font-medium ${
                  step === 1 ? "text-gray-800" : "text-gray-400"
                }`}
              >
                Choose Quiz
              </span>
            </div>
            <span className="text-sm text-gray-400">
              Step 1 <em>of</em> 2
            </span>
          </div>

          {step === 1 && (
            <>
              <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 h-12 mb-6">
                <SearchIcon className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Quizzes"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 h-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                />
              </div>

              <p className="text-xs font-bold tracking-wide text-gray-500 mb-4">
                QUIZZES
              </p>

              <div className="min-h-[180px] flex flex-col items-center justify-center gap-3">
                <FolderIcon
                  className="w-12 h-12 text-gray-300"
                  strokeWidth={1.5}
                />
                <p className="text-gray-500 text-sm">This folder is empty</p>
              </div>
            </>
          )}
        </div>

        {/* Step 2 */}
        <div className="px-8 py-5 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === 2
                    ? "bg-[#2d5f6e] text-white"
                    : "border border-gray-300 text-gray-400"
                }`}
              >
                2
              </div>
              <span
                className={`font-medium ${
                  step === 2 ? "text-gray-800" : "text-gray-400"
                }`}
              >
                Choose Settings
              </span>
            </div>
            <span className="text-sm text-gray-400">
              Step 2 <em>of</em> 2
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-gray-200">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="px-6 h-11 rounded-xl border border-[#2d5f6e] text-[#2d5f6e] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(2, s + 1))}
            className="px-6 h-11 rounded-xl bg-[#2d5f6e] text-white font-semibold hover:bg-[#244d5a] transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaunchSpace;