"use client";

import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherSideNavbar from "../components/TeacherSideNavbar";
import { BASE_URL } from "../configs/Config";
import {
  SparklesIcon,
  Wand2Icon,
  UploadCloudIcon,
  FileTextIcon,
  XIcon,
  CheckIcon,
  Layers3Icon,
  ListChecksIcon,
} from "lucide-react";

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
  `}</style>
);

type QuestionType = "MCQ" | "TrueFalse" | "ShortAnswer";
type Difficulty = "Easy" | "Medium" | "Hard";
type InputMode = "topic" | "document";
type Step = "form" | "loading-concepts" | "loading-questions" | "results";

interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
}

const API_BASE = `${BASE_URL}/api`;
const MAX_DOC_SIZE_MB = 20;
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];

const QUESTION_TYPE_OPTIONS: { label: string; value: QuestionType }[] = [
  { label: "Multiple choice", value: "MCQ" },
  { label: "True / False", value: "TrueFalse" },
  { label: "Short answer", value: "ShortAnswer" },
];

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

const getExtension = (filename: string) => {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
};

const QuizGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const [step, setStep] = useState<Step>("form");
  const [mode, setMode] = useState<InputMode>("topic");

  const [topic, setTopic] = useState("");

  const [docFile, setDocFile] = useState<File | null>(null);
  const [docFocus, setDocFocus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(10);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([]);
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

  const switchMode = (next: InputMode) => {
    setMode(next);
    setError("");
  };

  const applyDocFile = (file: File | null) => {
    if (!file) return;
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError("Please upload a PDF, DOC, DOCX, PPT, or PPTX file.");
      return;
    }
    if (file.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
      setError(`File must be smaller than ${MAX_DOC_SIZE_MB}MB.`);
      return;
    }
    setError("");
    setDocFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyDocFile(e.target.files?.[0] ?? null);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    applyDocFile(e.dataTransfer.files?.[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeDoc = () => {
    setDocFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canGenerate =
    mode === "topic" ? topic.trim().length >= 5 : Boolean(docFile);

  const effectiveTypes: QuestionType[] =
    selectedTypes.length > 0
      ? selectedTypes
      : QUESTION_TYPE_OPTIONS.map((o) => o.value);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "topic" && topic.trim().length < 5) {
      setError("Please enter a topic (at least 5 characters).");
      return;
    }
    if (mode === "document" && !docFile) {
      setError("Please upload a document to generate questions from.");
      return;
    }

    setStep("loading-concepts");
    const swapTimer = setTimeout(() => setStep("loading-questions"), 1400);

    try {
      let response: Response;

      if (mode === "document" && docFile) {
        const formData = new FormData();
        formData.append("document", docFile);
        formData.append("difficulty", difficulty);
        formData.append("questionCount", String(questionCount));
        formData.append("questionTypes", JSON.stringify(effectiveTypes));
        formData.append("generateExplanations", String(generateExplanations));
        if (docFocus.trim()) formData.append("focus", docFocus.trim());

        response = await fetch(`${API_BASE}/quiz/generate-preview-document`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
      } else {
        response = await fetch(`${API_BASE}/quiz/generate-preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            topic,
            difficulty,
            questionCount,
            questionTypes: effectiveTypes,
            generateExplanations,
          }),
        });
      }

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

  const addQuestion = (id: string) =>
    setAddedIds((prev) => new Set(prev).add(id));
  const addAll = () => setAddedIds(new Set(questions.map((q) => q.id)));

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
          title:
            mode === "document"
              ? docFile?.name.replace(/\.[^.]+$/i, "") || "Untitled Quiz"
              : "Untitled Quiz",
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

  const loadingLabel =
    step === "loading-concepts"
      ? mode === "document"
        ? "Reading your document and identifying key concepts..."
        : "Identifying key concepts..."
      : "Writing quiz questions...";

  const isLoading = step === "loading-concepts" || step === "loading-questions";
  const addedCount = addedIds.size;

  return (
    <div className="min-h-screen bg-[#0A1238] relative overflow-hidden font-['Inter']">
      <FontLoader />

      <div className="pointer-events-none absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-sky-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[30rem] h-[26rem] rounded-full bg-teal-400/10 blur-[130px]" />

      <TeacherSideNavbar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div
        className={`relative z-10 px-6 md:px-10 pt-10 pb-14 transition-all duration-300 ${isOpen ? "ml-72" : "ml-16"}`}
      >
        <div className="mb-8 max-w-3xl mx-auto text-center">
          <h1 className="flex items-center justify-center gap-2 text-2xl md:text-3xl font-semibold text-white mb-1.5 font-['Sora']">
            <SparklesIcon
              className="w-6 h-6 text-teal-300"
              strokeWidth={1.75}
            />
            Quiz Studio
          </h1>

          <p className="text-gray-400 text-sm md:text-base">
            Turn any topic or lesson document into a ready-to-take quiz.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-6">
          <div className="w-full lg:w-[420px] shrink-0 rounded-2xl bg-white shadow-2xl overflow-hidden">
            <form onSubmit={handleGenerate} className="p-5 md:p-6">
              <div className="grid grid-cols-2 gap-2 mb-5 rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => switchMode("topic")}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === "topic"
                      ? "bg-[#0A1238] text-white"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  From a topic
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("document")}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === "document"
                      ? "bg-[#0A1238] text-white"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  From a document
                </button>
              </div>

              {mode === "topic" && (
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Cellular respiration, React hooks, WWII causes..."
                  rows={4}
                  className="w-full resize-none rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 p-3.5 text-sm outline-none focus:border-blue-400 focus:bg-white transition-colors mb-5"
                />
              )}

              {mode === "document" && (
                <div className="mb-5">
                  {!docFile ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                        isDragging
                          ? "border-blue-400 bg-blue-50"
                          : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <UploadCloudIcon
                          className="w-6 h-6 text-blue-500"
                          strokeWidth={1.5}
                        />
                        <span className="text-sm text-gray-600">
                          Drop a PDF, Word, or PowerPoint file, or{" "}
                          <span className="text-blue-600 underline">
                            browse
                          </span>
                        </span>
                        <span className="text-xs text-gray-400">
                          PDF, DOC, DOCX, PPT, PPTX — up to {MAX_DOC_SIZE_MB}MB
                        </span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-3">
                      <FileTextIcon className="w-5 h-5 text-blue-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800 font-medium truncate">
                          {docFile.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(docFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeDoc}
                        className="shrink-0 text-gray-400 hover:text-gray-700"
                        aria-label="Remove file"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    value={docFocus}
                    onChange={(e) => setDocFocus(e.target.value)}
                    placeholder="Focus areas — optional (e.g. only chapters 3-4)"
                    className="w-full mt-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 px-3.5 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white transition-colors"
                  />
                </div>
              )}

              <div className="h-px bg-gray-100 mb-5" />

              <div className="space-y-4 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Questions</span>
                  <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                    {[5, 10, 15].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setQuestionCount(n as 5 | 10 | 15)}
                        className={`w-8 h-7 rounded-md text-xs font-semibold transition-colors ${
                          questionCount === n
                            ? "bg-[#0A1238] text-white"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Difficulty</span>
                  <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                    {(["Easy", "Medium", "Hard"] as Difficulty[]).map(
                      (level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficulty(level)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            difficulty === level
                              ? "bg-[#0A1238] text-white"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          {level}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Explanations</span>
                  <button
                    type="button"
                    onClick={() => setGenerateExplanations((v) => !v)}
                    className={`w-10 h-6 rounded-full transition relative ${generateExplanations ? "bg-blue-500" : "bg-gray-200"}`}
                    aria-label="Toggle explanations"
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${
                        generateExplanations ? "left-[18px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Layers3Icon className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-sm text-gray-700">Question types</p>
                </div>
                <p className="text-xs text-gray-400 mb-2.5">
                  {selectedTypes.length === 0
                    ? "Mixed by default — tap to narrow it down."
                    : `Only ${selectedTypes.length} type${selectedTypes.length > 1 ? "s" : ""} selected.`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_TYPE_OPTIONS.map((opt) => {
                    const active = selectedTypes.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleType(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-transparent text-gray-500 border-gray-300 hover:border-gray-400 hover:text-gray-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                  {selectedTypes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTypes([])}
                      className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Reset to mixed
                    </button>
                  )}
                </div>
              </div>

              {error && step === "form" && (
                <p className="mb-4 text-sm text-red-600 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={!canGenerate || isLoading}
                className="w-full h-11 rounded-full bg-[#0A1238] text-white font-semibold text-sm transition-colors hover:bg-[#1a2348] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0A1238]"
              >
                {isLoading ? "Generating..." : "Generate quiz"}
              </button>
            </form>
          </div>

          <div className="w-full flex-1 rounded-2xl bg-white shadow-2xl min-h-[420px] overflow-hidden">
            {step === "form" && (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center px-8 py-16">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mb-4">
                  <ListChecksIcon
                    className="w-5 h-5 text-blue-500"
                    strokeWidth={1.75}
                  />
                </div>
                <p className="text-gray-800 font-medium mb-1.5 font-['Sora']">
                  Your questions will show up here
                </p>
                <p className="text-gray-400 text-sm max-w-xs">
                  Set up your quiz on the left, then generate — you'll review
                  every question before any of them are added.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                  <Wand2Icon
                    className="absolute inset-0 m-auto w-5 h-5 text-blue-500"
                    strokeWidth={1.75}
                  />
                </div>
                <p className="text-gray-600 text-sm">{loadingLabel}</p>
              </div>
            )}

            {step === "results" && (
              <div className="flex flex-col h-full">
                <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-base font-semibold text-gray-800 font-['Sora']">
                      Review &amp; add questions
                    </h2>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {addedCount} of {questions.length} added
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={backToForm}
                    className="shrink-0 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    ← Edit setup
                  </button>
                </div>

                <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                  {questions.map((q) => {
                    const isAdded = addedIds.has(q.id);
                    const badge = TYPE_BADGE[q.type];
                    return (
                      <div
                        key={q.id}
                        className="px-6 py-4 flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <span
                            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          <p className="text-sm text-gray-800 mt-2">
                            {q.question}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isAdded}
                          onClick={() => addQuestion(q.id)}
                          className={`shrink-0 h-9 px-4 rounded-full text-sm font-semibold transition flex items-center gap-1.5 ${
                            isAdded
                              ? "bg-gray-100 text-gray-400 cursor-default"
                              : "bg-[#0A1238] text-white hover:bg-[#1a2348]"
                          }`}
                        >
                          {isAdded && <CheckIcon className="w-3.5 h-3.5" />}
                          {isAdded ? "Added" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                  <p className="px-6 py-3 text-xs text-gray-400">
                    Generated questions can make mistakes. Consider checking
                    question accuracy.
                  </p>
                </div>

                {error && (
                  <p className="px-6 pb-2 text-sm text-red-600 font-medium">
                    {error}
                  </p>
                )}

                <div className="mt-auto px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={addAll}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Add all questions
                  </button>
                  <button
                    type="button"
                    disabled={saving || addedCount === 0}
                    onClick={handleDone}
                    className="h-10 px-6 rounded-full bg-[#0A1238] text-white font-semibold text-sm hover:bg-[#1a2348] disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : `Done${addedCount ? ` (${addedCount})` : ""}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizGenerator;