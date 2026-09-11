"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SideNavbar from "../components/SideNavbar";
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

const API_BASE = "http://localhost:3000/api";
const LETTERS = ["A", "B", "C", "D"];

const TYPE_BADGE: Record<QuestionType, { label: string; className: string }> = {
  MCQ: {
    label: "Multiple choice",
    className: "text-sky-300 bg-sky-400/10 border-sky-400/30",
  },
  TrueFalse: {
    label: "True / False",
    className: "text-violet-300 bg-violet-400/10 border-violet-400/30",
  },
  ShortAnswer: {
    label: "Short answer",
    className: "text-amber-300 bg-amber-400/10 border-amber-400/30",
  },
};

const QuizEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("tools");

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

  return (
    <div className="min-h-screen bg-[#0A1238] relative overflow-hidden font-['Inter']">
      <FontLoader />

      {/* Ambient background glows — consistent with the generator */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-sky-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[30rem] h-[26rem] rounded-full bg-teal-400/10 blur-[130px]" />

      <SideNavbar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        title="AI Tools"
      />

      <div
        className={`relative z-10 px-6 md:px-10 pt-24 pb-16 transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-400 animate-spin" />
            </div>
            <p className="text-gray-400 text-sm">Loading quiz...</p>
          </div>
        ) : (
          <div className="max-w-3xl">
            <button
              type="button"
              onClick={() => navigate("/Library")}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors mb-5"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              Back to library
            </button>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="min-w-0 flex-1 text-2xl md:text-3xl font-semibold text-white bg-transparent border-b border-transparent hover:border-white/15 focus:border-teal-400/60 outline-none transition-colors font-['Sora'] pb-1"
              />
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="shrink-0 h-11 px-6 rounded-full bg-teal-400 text-[#0A1238] font-semibold text-sm hover:bg-teal-300 disabled:opacity-40 transition-colors"
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
                    className={`rounded-2xl border bg-white/[0.03] transition-colors ${
                      isEditing
                        ? "border-teal-400/40"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="p-5 flex items-start gap-4">
                      {/* Reorder controls */}
                      <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, -1)}
                          disabled={index === 0}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-200 hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                          aria-label="Move up"
                        >
                          <ChevronUpIcon className="w-4 h-4" />
                        </button>
                        <GripVerticalIcon className="w-3.5 h-3.5 text-gray-700" />
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, 1)}
                          disabled={index === questions.length - 1}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-200 hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                          aria-label="Move down"
                        >
                          <ChevronDownIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-500 tabular-nums">
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
                            className="w-full text-sm font-medium text-gray-100 bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400/60 mb-3"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-100 mb-3">
                            {q.question}
                          </p>
                        )}

                        {q.options && (
                          <div className="space-y-1.5">
                            {q.options.map((opt, i) => {
                              const letter = LETTERS[i] ?? String(i + 1);
                              const isCorrect = opt === q.correctAnswer;
                              return (
                                <div
                                  key={i}
                                  className="flex items-center gap-2.5"
                                >
                                  <span
                                    className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      isCorrect
                                        ? "bg-emerald-400 text-[#0A1238]"
                                        : "bg-white/10 text-gray-400"
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
                                      className="flex-1 text-sm text-gray-200 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-teal-400/60"
                                    />
                                  ) : (
                                    <span
                                      className={`text-sm ${
                                        isCorrect
                                          ? "text-gray-100"
                                          : "text-gray-400"
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
                                      className="shrink-0 text-xs font-medium text-teal-300 hover:text-teal-200"
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
                          <div className="text-sm text-gray-400">
                            <span className="text-gray-500">
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
                                className="mt-1 w-full text-sm text-gray-100 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-teal-400/60"
                              />
                            ) : (
                              <span className="text-gray-200 font-medium">
                                {q.correctAnswer}
                              </span>
                            )}
                          </div>
                        )}

                        {(q.explanation || isEditing) && (
                          <div className="mt-3 pt-3 border-t border-white/5">
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
                                className="w-full text-xs text-gray-300 bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-teal-400/60 resize-none placeholder:text-gray-600"
                              />
                            ) : (
                              <p className="text-xs text-gray-500">
                                {q.explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Row actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingId(isEditing ? null : q.id)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isEditing
                              ? "bg-teal-400 text-[#0A1238]"
                              : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
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
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          aria-label="Duplicate question"
                        >
                          <CopyIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteQuestion(q.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          aria-label="Delete question"
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {questions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 py-14 text-center">
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
