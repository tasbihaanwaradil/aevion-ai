"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideNavbar from "../components/SideNavbar";

// ---------- Types ----------

type QuestionType = "MCQ" | "TrueFalse" | "ShortAnswer";
type Difficulty = "Easy" | "Medium" | "Hard";

interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
}

const API_BASE = "http://localhost:3000/api";

const QUESTION_TYPE_OPTIONS: { label: string; value: QuestionType }[] = [
  { label: "Multiple Choice", value: "MCQ" },
  { label: "True / False", value: "TrueFalse" },
  { label: "Short Answer", value: "ShortAnswer" },
];

type Step = "form" | "loading-concepts" | "loading-questions" | "results";

const QuizGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("tools");

  const [step, setStep] = useState<Step>("form");

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(10);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    "MCQ",
    "TrueFalse",
    "ShortAnswer",
  ]);
  const [generateExplanations, setGenerateExplanations] = useState(true);

  const [error, setError] = useState<string>("");
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggleType = (type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (topic.trim().length < 5) {
      setError("Please enter a topic (at least 5 characters).");
      return;
    }
    if (selectedTypes.length === 0) {
      setError("Select at least one question type.");
      return;
    }

    setStep("loading-concepts");
    const swapTimer = setTimeout(() => setStep("loading-questions"), 1400);

    try {
      const response = await fetch(`${API_BASE}/quiz/generate-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          topic,
          difficulty,
          questionCount,
          questionTypes: selectedTypes,
          generateExplanations,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions);
        setAddedIds(new Set());
        setStep("results");
      } else {
        setError(
          data.message || "Something went wrong while generating questions.",
        );
        setStep("form");
      }
    } catch (err) {
      console.error(err);
      setError("Could not reach the server. Please try again.");
      setStep("form");
    } finally {
      clearTimeout(swapTimer);
    }
  };

  const addQuestion = (id: string) => {
    setAddedIds((prev) => new Set(prev).add(id));
  };

  const addAll = () => {
    setAddedIds(new Set(questions.map((q) => q.id)));
  };

  const handleDone = async () => {
    const selected = questions.filter((q) => addedIds.has(q.id));
    if (selected.length === 0) {
      setError("Add at least one question before finishing.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "Untitled Quiz",
          difficulty,
          questions: selected,
        }),
      });

      const data = await response.json();

      if (data.success) {
        navigate(`/Quiz/Edit/${data.quiz._id}`);
      } else {
        setError(data.message || "Failed to save quiz.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const backToForm = () => setStep("form");

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
        className={`px-6 pt-28 pb-16 transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white">Quiz Generator</h1>
          <p className="text-gray-400 mt-2">
            Turn any topic into a ready-to-take quiz
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl text-gray-800 overflow-hidden">
            {step === "results" && (
              <div className="px-10 pt-8 flex items-center gap-2">
                <button
                  type="button"
                  onClick={backToForm}
                  className="text-gray-500 hover:text-gray-700 text-sm font-semibold"
                >
                  ← Back
                </button>
              </div>
            )}

            {step === "form" && (
              <form onSubmit={handleGenerate} className="p-10">
                <label className="block font-semibold mb-2">Topic</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="E.g., Cellular respiration, React hooks, WWII causes..."
                  className="w-full h-28 px-5 py-4 bg-gray-100 rounded-xl outline-none"
                />

                <label className="block font-semibold mt-6 mb-2">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full h-14 px-5 bg-gray-100 rounded-xl"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                <div className="flex items-center justify-between mt-6">
                  <label className="font-semibold">Generate explanations</label>
                  <button
                    type="button"
                    onClick={() => setGenerateExplanations((v) => !v)}
                    className={`w-11 h-6 rounded-full transition relative ${
                      generateExplanations ? "bg-[#2d5f6e]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${
                        generateExplanations ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                <label className="block font-semibold mt-6 mb-2">
                  Number of Questions
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQuestionCount(n as 5 | 10 | 15)}
                      className={`w-14 h-11 rounded-xl text-sm font-semibold border-2 transition-colors ${
                        questionCount === n
                          ? "bg-[#2d5f6e] text-white border-[#2d5f6e]"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <label className="block font-semibold mt-6 mb-2">
                  Question Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleType(opt.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
                        selectedTypes.includes(opt.value)
                          ? "bg-[#2d5f6e] text-white border-[#2d5f6e]"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {error && (
                  <p className="mt-4 text-sm text-red-600 font-medium">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="mt-10 w-full h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold text-lg"
                >
                  Generate Questions
                </button>
              </form>
            )}

            {(step === "loading-concepts" || step === "loading-questions") && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-[#2d5f6e] animate-spin" />
                <p className="text-gray-600 text-sm">
                  {step === "loading-concepts"
                    ? "Identifying questions and key concepts..."
                    : "Generating quiz questions..."}
                </p>
              </div>
            )}

            {step === "results" && (
              <>
                <div className="px-10 pt-2 pb-4">
                  <h2 className="text-xl font-bold">
                    Add questions to your quiz
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Review each question, then add the ones you want.
                  </p>
                </div>

                <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
                  {questions.map((q) => {
                    const isAdded = addedIds.has(q.id);
                    return (
                      <div
                        key={q.id}
                        className="px-10 py-4 flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-500">
                            {q.type === "MCQ"
                              ? "Multiple Choice"
                              : q.type === "TrueFalse"
                                ? "True / False"
                                : "Short Answer"}
                          </p>
                          <p className="text-sm text-gray-800 mt-1">
                            {q.question}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isAdded}
                          onClick={() => addQuestion(q.id)}
                          className={`shrink-0 h-9 px-4 rounded-lg text-sm font-semibold transition ${
                            isAdded
                              ? "bg-gray-100 text-gray-400 cursor-default"
                              : "bg-[#2d5f6e] text-white hover:bg-[#234a56]"
                          }`}
                        >
                          {isAdded ? "Added" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                  <p className="px-10 py-3 text-xs text-gray-400">
                    Generated questions can make mistakes. Consider checking
                    question accuracy.
                  </p>
                </div>

                {error && (
                  <p className="px-10 pb-2 text-sm text-red-600 font-medium">
                    {error}
                  </p>
                )}

                <div className="px-10 py-5 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={addAll}
                    className="text-sm font-semibold text-[#2d5f6e] hover:underline"
                  >
                    Add All Questions
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleDone}
                    className="h-11 px-6 rounded-xl bg-[#2d5f6e] text-white font-bold disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Done"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizGenerator;
