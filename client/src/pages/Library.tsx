"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDownIcon,
  XIcon,
  PlusIcon,
  UserIcon,
  SearchIcon,
  FolderPlusIcon,
  SparklesIcon,
  FileTextIcon,
  CopyIcon,
  FileInputIcon,
  FilePlusIcon,
  ClipboardListIcon,
  Trash2Icon,
} from "lucide-react";
import TeacherNavbar from "../components/TeacherNavabar";

const addQuizOptions = {
  ai: [
    {
      icon: FileTextIcon,
      title: "Generate Questions",
      description: "Create questions using a prompt and/or a file upload.",
      route: "/Quiz/Generate",
    },
  ],
  import: [
    {
      icon: CopyIcon,
      title: "Copy-Paste Questions",
      description: "Import questions by pasting them from another resource.",
      route: "/Quiz/CopyPaste",
    },
    {
      icon: FileInputIcon,
      title: "Extract Questions from Document",
      description: "Upload a file, and we'll find and extract the questions in it.",
      pro: true,
      route: "/Quiz/ExtractFromDocument",
    },
  ],
  scratch: [
    {
      icon: FilePlusIcon,
      title: "Blank Quiz",
      description: "Jump right in and build something great.",
      route: "/Quiz/Blank",
    },
  ],
};

type Quiz = {
  id: string;
  name: string;
  modified: string;
};

// Swap this for your real fetch-on-mount once the quizzes endpoint
// exists. Starts empty so the folder shows its empty state, same as
// a freshly created Personal library.
const quizzes: Quiz[] = [];

const Library = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"quizzes" | "deleted">("quizzes");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showAddQuizModal, setShowAddQuizModal] = useState(false);

  const handleJoinLibrary = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Wire this up to your join-library endpoint once it exists.
    console.log("Joining library with code", joinCode);
    setShowJoinModal(false);
    setJoinCode("");
  };

  const visibleQuizzes = quizzes.filter((quiz) =>
    quiz.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="h-screen overflow-hidden bg-[#0A1238]">
      <TeacherNavbar />

      {/* Body */}
      <div className="pt-20 h-screen">
        <div className="h-[calc(100vh-5rem)] px-4 md:px-16 lg:px-24 xl:px-32 py-8 flex items-center justify-center">
          <div className="w-full max-w-7xl h-full min-h-0 bg-white rounded-2xl shadow-2xl overflow-hidden flex">
            {/* Sidebar */}
            <aside className="w-64 shrink-0 border-r border-gray-200 px-6 py-8 overflow-y-auto min-h-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Library</h1>

              <button
                type="button"
                onClick={() => setShowJoinModal(true)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition mb-6"
              >
                <PlusIcon className="w-4 h-4" />
                Join or Create Library
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-between gap-2 bg-gray-100 rounded-lg px-3 h-11 text-sm font-medium text-gray-800 hover:bg-gray-200 transition"
              >
                <span className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  Personal
                </span>
                <span className="text-gray-500">{quizzes.length}</span>
              </button>
            </aside>

            {/* Main panel */}
            <main className="flex-1 min-h-0 px-8 py-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-4 gap-4">
                <div className="flex items-center gap-6 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTab("quizzes")}
                    className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                      tab === "quizzes"
                        ? "text-gray-900 border-[#007a8c]"
                        : "text-gray-500 border-transparent hover:text-gray-800"
                    }`}
                  >
                    Quizzes
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("deleted")}
                    className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                      tab === "deleted"
                        ? "text-gray-900 border-[#007a8c]"
                        : "text-gray-500 border-transparent hover:text-gray-800"
                    }`}
                  >
                    Deleted
                  </button>
                </div>

                <div className="flex items-center gap-3 flex-1 justify-end">
                  {showSearch ? (
                    <div className="flex items-center gap-2 bg-gray-50 border border-sky-400 rounded-lg h-10 px-3 w-full max-w-xs">
                      <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search "Personal"'
                        className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowSearch(false);
                          setSearchQuery("");
                        }}
                        className="text-gray-400 hover:text-gray-600 shrink-0"
                        aria-label="Close search"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSearch(true)}
                      className="w-10 h-10 rounded-lg bg-sky-50 text-[#007a8c] flex items-center justify-center hover:bg-sky-100 transition shrink-0"
                      aria-label="Search"
                    >
                      <SearchIcon className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    className="flex items-center gap-2 h-10 px-4 rounded-lg bg-sky-50 text-[#007a8c] text-sm font-semibold hover:bg-sky-100 transition shrink-0"
                  >
                    <FolderPlusIcon className="w-4 h-4" />
                    New Folder
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddQuizModal(true)}
                    className="h-10 px-4 rounded-lg bg-[#007a8c] text-white text-sm font-semibold hover:bg-[#005f6a] transition shrink-0"
                  >
                    Add Quiz
                  </button>
                </div>
              </div>

              {tab === "quizzes" ? (
                <>
                  {/* Table header */}
                  <div className="grid grid-cols-[28px_1fr_140px_60px] items-center gap-4 border-t border-gray-200 py-3 text-xs font-bold tracking-wide text-[#007a8c]">
                    <span className="w-4 h-4 rounded-full border border-gray-300" />
                    <span>NAME</span>
                    <span className="flex items-center gap-1">
                      MODIFIED
                      <ChevronDownIcon className="w-3 h-3" />
                    </span>
                    <span className="text-center">DELETE</span>
                  </div>

                  {/* Rows */}
                  {visibleQuizzes.length > 0 ? (
                    visibleQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="grid grid-cols-[28px_1fr_140px_60px] items-center gap-4 border-t border-gray-100 py-3"
                      >
                        <span className="w-4 h-4 rounded-full border border-gray-300" />
                        <div className="flex items-center gap-2 min-w-0">
                          <ClipboardListIcon className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {quiz.name}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{quiz.modified}</span>

                        {/* Visual only for now — not wired up to a delete action yet. */}
                        <button
                          type="button"
                          aria-label={`Delete ${quiz.name}`}
                          className="text-gray-400 hover:text-red-500 transition flex justify-center"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="border-t border-gray-100 min-h-[240px] flex items-center justify-center">
                      <p className="text-gray-500">This folder is empty</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Table header */}
                  <div className="flex items-center justify-between border-t border-gray-200 py-3 text-xs font-bold tracking-wide text-[#007a8c]">
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 rounded-full border border-gray-300" />
                      <span>NAME</span>
                    </div>
                    <span className="flex items-center gap-1">
                      DELETED
                      <ChevronDownIcon className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="border-t border-gray-100 min-h-[240px] flex items-center justify-center">
                    <p className="text-gray-500">Nothing in Deleted</p>
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Join Library modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-[70]">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-lg font-bold text-gray-800">Join Library</h2>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="px-6 py-4 border-t border-gray-100 text-sm text-gray-600">
              Create, edit, and share quizzes with your peers
            </p>

            <form
              onSubmit={handleJoinLibrary}
              className="px-6 py-5 border-t border-gray-100 flex items-end gap-3"
            >
              <div className="flex-1">
                <label
                  htmlFor="joinCode"
                  className="block text-sm text-gray-600 mb-2"
                >
                  Library Join Code
                </label>
                <input
                  id="joinCode"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="LIB-XXXXXX"
                  className="w-full h-11 px-3 bg-gray-50 border border-sky-400 rounded-lg outline-none text-sm text-gray-700 placeholder-gray-400 uppercase"
                  required
                />
              </div>
              <button
                type="submit"
                className="h-11 px-5 rounded-lg bg-[#007a8c] text-white text-sm font-semibold hover:bg-[#005f6a] transition whitespace-nowrap"
              >
                Join Library
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Quiz modal */}
      {showAddQuizModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-[70]">
          <div className="w-full max-w-lg max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">Add Quiz</h2>
              <button
                type="button"
                onClick={() => setShowAddQuizModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto border-t border-gray-100 px-6 py-5 space-y-6">
              {/* Create with AI */}
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-800 mb-3">
                  Create with AI
                  <SparklesIcon className="w-4 h-4 text-[#007a8c]" />
                </h3>
                <div className="space-y-3">
                  {addQuizOptions.ai.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.title}
                        type="button"
                        onClick={() => {
                          setShowAddQuizModal(false);
                          navigate(option.route);
                        }}
                        className="w-full flex items-start gap-3 border border-gray-200 rounded-xl p-4 text-left hover:border-sky-300 hover:bg-sky-50/40 transition"
                      >
                        <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#007a8c] flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#007a8c]">
                            {option.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Import Questions */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  Import Questions
                </h3>
                <div className="space-y-3">
                  {addQuizOptions.import.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.title}
                        type="button"
                        onClick={() => {
                          setShowAddQuizModal(false);
                          navigate(option.route);
                        }}
                        className="w-full flex items-start gap-3 border border-gray-200 rounded-xl p-4 text-left hover:border-sky-300 hover:bg-sky-50/40 transition"
                      >
                        <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#007a8c] flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#007a8c] flex items-center gap-2">
                            {option.title}
                            {/* {option.pro && (
                              <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                PRO
                              </span>
                            )} */}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start From Scratch */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  Start From Scratch
                </h3>
                <div className="space-y-3">
                  {addQuizOptions.scratch.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.title}
                        type="button"
                        onClick={() => {
                          setShowAddQuizModal(false);
                          navigate(option.route);
                        }}
                        className="w-full flex items-start gap-3 border border-gray-200 rounded-xl p-4 text-left hover:border-sky-300 hover:bg-sky-50/40 transition"
                      >
                        <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#007a8c] flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#007a8c]">
                            {option.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;