"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SideNavbar from "../components/SideNavbar";

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
    <div className="min-h-screen bg-[#0A1238]">
      <SideNavbar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        title="AI Tools"
      />

      <div
        className={`px-6 pt-28 pb-16 transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}
      >
        {loading ? (
          <p className="text-center text-gray-400">Loading quiz...</p>
        ) : (
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-10 text-gray-800">
            <div className="flex items-center justify-between mb-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold border-b border-transparent hover:border-gray-300 focus:border-[#2d5f6e] outline-none bg-transparent"
              />
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="h-11 px-6 rounded-xl bg-[#2d5f6e] text-white font-bold disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save and Exit"}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium mb-4">{error}</p>
            )}

            <div className="divide-y divide-gray-100 border-t border-gray-200">
              {questions.map((q, index) => {
                const isEditing = editingId === q.id;
                return (
                  <div
                    key={q.id}
                    className="py-4 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold mb-2">
                        {index + 1}.{" "}
                        {isEditing ? (
                          <input
                            value={q.question}
                            onChange={(e) =>
                              updateQuestionField(q.id, {
                                question: e.target.value,
                              })
                            }
                            className="border-b border-[#2d5f6e] outline-none w-full max-w-md"
                          />
                        ) : (
                          q.question
                        )}
                      </p>

                      {q.options && (
                        <div className="space-y-1 ml-1">
                          {q.options.map((opt, i) => {
                            const letter = LETTERS[i] ?? String(i + 1);
                            const isCorrect = opt === q.correctAnswer;
                            return (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isCorrect
                                      ? "bg-green-500 text-white"
                                      : "bg-gray-100 text-gray-500"
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
                                    className="border-b border-gray-300 outline-none flex-1"
                                  />
                                ) : (
                                  <span className="text-gray-700">{opt}</span>
                                )}
                                {isEditing && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuestionField(q.id, {
                                        correctAnswer: opt,
                                      })
                                    }
                                    className="text-xs text-[#2d5f6e] hover:underline"
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
                        <p className="text-sm text-gray-600 ml-1">
                          Expected answer:{" "}
                          {isEditing ? (
                            <input
                              value={q.correctAnswer}
                              onChange={(e) =>
                                updateQuestionField(q.id, {
                                  correctAnswer: e.target.value,
                                })
                              }
                              className="border-b border-[#2d5f6e] outline-none"
                            />
                          ) : (
                            <span className="font-medium">
                              {q.correctAnswer}
                            </span>
                          )}
                        </p>
                      )}

                      {(q.explanation || isEditing) && (
                        <div className="mt-2 text-xs text-gray-500">
                          {isEditing ? (
                            <textarea
                              value={q.explanation}
                              onChange={(e) =>
                                updateQuestionField(q.id, {
                                  explanation: e.target.value,
                                })
                              }
                              className="border border-gray-200 rounded outline-none p-1 w-full"
                              rows={2}
                            />
                          ) : (
                            <span>{q.explanation}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingId(isEditing ? null : q.id)}
                        className="w-8 h-8 rounded bg-gray-100 text-[#2d5f6e] flex items-center justify-center hover:bg-gray-200 text-xs font-bold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteQuestion(q.id)}
                        className="text-gray-400 hover:text-red-500 text-xs font-bold"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(index, -1)}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(index, 1)}
                        disabled={index === questions.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateQuestion(q.id)}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizEditor;
