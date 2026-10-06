"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeacherSideNavbar from "../components/TeacherSideNavbar";
import { BASE_URL } from "../configs/Config";
import {
  PencilIcon,
  CheckIcon,
  Trash2Icon,
  CopyIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  GripVerticalIcon,
} from "lucide-react";

// -----------------------------------------------------------------------
// Load fonts. Move this <link> into your index.html for production —
// it's inlined here so the component works as a drop-in preview.
// -----------------------------------------------------------------------
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
  `}</style>
);

type QuestionType = "MCQ" | "TrueFalse" | "ShortAnswer";

interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
}

const API_BASE = `${BASE_URL}/api`;
const LETTERS = ["A", "B", "C", "D"];

const TYPE_BADGE: Record<QuestionType, { label: string; className: string }> = {
  MCQ: {
    label: "Multiple choice",
    className: "text-blue-600 bg-blue-50 border-blue-200",
  },
  TrueFalse: {
    label: "True / False",
    className: "text-violet-600 bg-violet-50 border-violet-200",
  },
  ShortAnswer: {
    label: "Short answer",
    className: "text-amber-600 bg-amber-50 border-amber-200",
  },
};

const QuizEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Open by default on desktop; closed on phones, where the open sidebar
  // is a full-height drawer that would otherwise cover the page on load.
  const [isOpen, setIsOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );

  const [title, setTitle] = useState("Untitled Quiz");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/quiz/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTitle(data.quiz.title);
          setQuestions(data.quiz.questions);
        } else {
          setError(data.message || "Quiz not found.");
        }
      })
      .catch(() => setError("Could not reach the server."))
      .finally(() => setLoading(false));
  }, [id]);

  const moveQuestion = (index: number, dir: -1 | 1) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const deleteQuestion = (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
    if (editingId === qId) setEditingId(null);
  };

  const duplicateQuestion = (qId: string) => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === qId);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: crypto.randomUUID() };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const updateQuestionField = (qId: string, patch: Partial<QuizQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, ...patch } : q)),
    );
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/quiz/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, questions }),
      });
      const data = await response.json();
      if (data.success) {
        navigate("/Library");
      } else {
        setError(data.message || "Failed to save quiz.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  };

  // Text inputs use text-base on mobile: iOS Safari zooms into fields below 16px.
  return (
    <div className="min-h-screen bg-[#0A1238] relative overflow-hidden font-['Inter']">
      <FontLoader />

      {/* Ambient background glows — consistent with the generator */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-sky-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[30rem] h-[26rem] rounded-full bg-teal-400/10 blur-[130px]" />

      <TeacherSideNavbar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeQuizId={id ?? null}
      />

      {/* Content
          - Mobile: full width (the sidebar is an overlay drawer there); pt-20
            leaves room for the floating menu button.
          - md and up: shift right to clear the sidebar (w-72) or the icon rail (w-16).
          - min-w-0 stops wide children from stretching the page sideways. */}
      <div
        className={`relative z-10 min-w-0 px-4 sm:px-6 md:px-10 pt-20 md:pt-10 pb-12 md:pb-16 transition-[margin] duration-300 ${
          isOpen ? "md:ml-72" : "md:ml-16"
        }`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            </div>
            <p className="text-gray-400 text-sm">Loading quiz...</p>
          </div>
        ) : (
          <div className="max-w-3xl">
            <button
              type="button"
              onClick={() => navigate("/Library")}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors mb-5 min-h-[36px] sm:min-h-0"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              Back to library
            </button>

            {/* Header: title and Save stack on phones, sit side by side from sm up */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="min-w-0 sm:flex-1 text-2xl md:text-3xl font-semibold text-white bg-transparent border-b border-transparent hover:border-white/15 focus:border-blue-400/60 outline-none transition-colors font-['Sora'] pb-1"
              />
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="shrink-0 w-full sm:w-auto h-12 sm:h-11 px-6 rounded-full bg-blue-500 text-white font-semibold text-sm hover:bg-blue-400 disabled:opacity-40 transition-colors"
              >
                {saving ? "Saving..." : "Save and exit"}
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              {questions.length} question{questions.length === 1 ? "" : "s"}
            </p>

            {error && (
              <p className="mb-4 text-sm text-red-400 font-medium">{error}</p>
            )}

            {/* Question list */}
            <div className="space-y-3">
              {questions.map((q, index) => {
                const isEditing = editingId === q.id;
                const badge = TYPE_BADGE[q.type];
                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow border ${
                      isEditing ? "border-blue-300" : "border-gray-100"
                    }`}
                  >
                    {/* Phones: a toolbar row on top (reorder left, actions right)
                        with the question below at full width.
                        sm and up: reorder | content | actions in one row.
                        Done with flex-wrap + order so there is a single DOM tree. */}
                    <div className="p-4 sm:p-5 flex flex-wrap sm:flex-nowrap items-start gap-x-4 gap-y-3">
                      {/* Reorder controls */}
                      <div className="order-1 flex sm:flex-col items-center gap-0.5 shrink-0 sm:pt-0.5">
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, -1)}
                          disabled={index === 0}
                          className="w-9 h-9 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                          aria-label="Move up"
                        >
                          <ChevronUpIcon className="w-4 h-4" />
                        </button>
                        <GripVerticalIcon className="hidden sm:block w-3.5 h-3.5 text-gray-300" />
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, 1)}
                          disabled={index === questions.length - 1}
                          className="w-9 h-9 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                          aria-label="Move down"
                        >
                          <ChevronDownIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Row actions */}
                      <div className="order-2 sm:order-3 ml-auto sm:ml-0 flex items-center gap-1.5 sm:gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingId(isEditing ? null : q.id)}
                          className={`w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isEditing
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200"
                          }`}
                          aria-label={
                            isEditing ? "Done editing" : "Edit question"
                          }
                        >
                          {isEditing ? (
                            <CheckIcon className="w-4 h-4" />
                          ) : (
                            <PencilIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateQuestion(q.id)}
                          className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                          aria-label="Duplicate question"
                        >
                          <CopyIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteQuestion(q.id)}
                          className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Delete question"
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Main content */}
                      <div className="order-3 sm:order-2 basis-full sm:basis-0 sm:flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-400 tabular-nums">
                            {index + 1}
                          </span>
                          <span
                            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {isEditing ? (
                          <input
                            value={q.question}
                            onChange={(e) =>
                              updateQuestionField(q.id, {
                                question: e.target.value,
                              })
                            }
                            className="w-full text-base sm:text-sm font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400/60 mb-3"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-800 mb-3 break-words">
                            {q.question}
                          </p>
                        )}

                        {q.options && (
                          <div className="space-y-2 sm:space-y-1.5">
                            {q.options.map((opt, i) => {
                              const letter = LETTERS[i] ?? String(i + 1);
                              const isCorrect = opt === q.correctAnswer;
                              return (
                                <div
                                  key={i}
                                  className="flex flex-wrap items-center gap-x-2.5 gap-y-1"
                                >
                                  <span
                                    className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      isCorrect
                                        ? "bg-emerald-500 text-white"
                                        : "bg-gray-100 text-gray-400"
                                    }`}
                                  >
                                    {letter}
                                  </span>
                                  {isEditing ? (
                                    <input
                                      value={opt}
                                      onChange={(e) => {
                                        const newOptions = [...q.options!];
                                        const wasCorrect =
                                          opt === q.correctAnswer;
                                        newOptions[i] = e.target.value;
                                        updateQuestionField(q.id, {
                                          options: newOptions,
                                          correctAnswer: wasCorrect
                                            ? e.target.value
                                            : q.correctAnswer,
                                        });
                                      }}
                                      className="flex-1 min-w-[8rem] text-base sm:text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-400/60"
                                    />
                                  ) : (
                                    <span
                                      className={`min-w-0 flex-1 text-sm break-words ${
                                        isCorrect
                                          ? "text-gray-800"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      {opt}
                                    </span>
                                  )}
                                  {isEditing && !isCorrect && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuestionField(q.id, {
                                          correctAnswer: opt,
                                        })
                                      }
                                      className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800 py-1.5 sm:py-0"
                                    >
                                      Mark correct
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {!q.options && (
                          <div className="text-sm text-gray-500">
                            <span className="text-gray-400">
                              Expected answer:{" "}
                            </span>
                            {isEditing ? (
                              <input
                                value={q.correctAnswer}
                                onChange={(e) =>
                                  updateQuestionField(q.id, {
                                    correctAnswer: e.target.value,
                                  })
                                }
                                className="mt-1 w-full text-base sm:text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-400/60"
                              />
                            ) : (
                              <span className="text-gray-800 font-medium break-words">
                                {q.correctAnswer}
                              </span>
                            )}
                          </div>
                        )}

                        {(q.explanation || isEditing) && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            {isEditing ? (
                              <textarea
                                value={q.explanation}
                                onChange={(e) =>
                                  updateQuestionField(q.id, {
                                    explanation: e.target.value,
                                  })
                                }
                                placeholder="Explanation — optional"
                                rows={2}
                                className="w-full text-base sm:text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-blue-400/60 resize-none placeholder:text-gray-400"
                              />
                            ) : (
                              <p className="text-xs text-gray-500 break-words">
                                {q.explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {questions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center">
                  <p className="text-gray-400 text-sm">
                    No questions left in this quiz.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizEditor;
