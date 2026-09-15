"use client";

import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherSideNavbar from "../components/TeacherSideNavbar";
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

const API_BASE = "http://localhost:3000/api";
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

  const resetToBlankForm = () => {
    setStep("form");
    setMode("topic");
    setTopic("");
    setDocFile(null);
    setDocFocus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDifficulty("Medium");
    setQuestionCount(10);
    setSelectedTypes([]);
    setGenerateExplanations(true);
    setError("");
    setQuestions([]);
    setAddedIds(new Set());
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

      <TeacherSideNavbar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        onNewQuiz={resetToBlankForm}
      />

      <div
        className={`relative z-10 px-6 md:px-10 pt-10 pb-14 transition-all duration-300 ${isOpen ? "ml-72" : "ml-16"}`}
      >
        <div className="mb-8 max-w-3xl">
          <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-semibold text-white mb-1.5 font-['Sora']">
            <SparklesIcon
              className="w-5 h-5 text-teal-300"
              strokeWidth={1.75}
            />
            Quiz generator
          </h1>
          <p className="text-gray-400 text-sm">
            Turn any topic or lesson document into a ready-to-take quiz.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-6">
          <div className="w-full lg:w-[420px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <form onSubmit={handleGenerate} className="p-5 md:p-6">
              <div className="grid grid-cols-2 gap-2 mb-5 rounded-xl border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => switchMode("topic")}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === "topic"
                      ? "bg-teal-400 text-[#0A1238]"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  From a topic
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("document")}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === "document"
                      ? "bg-teal-400 text-[#0A1238]"
                      : "text-gray-300 hover:text-white"
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
                  className="w-full resize-none rounded-xl bg-white/5 border border-white/10 text-gray-100 placeholder:text-gray-500 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/60 mb-5"
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
                          ? "border-teal-400 bg-teal-400/10"
                          : "border-white/15 bg-white/[0.03] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <UploadCloudIcon
                          className="w-6 h-6 text-teal-300"
                          strokeWidth={1.5}
                        />
                        <span className="text-sm text-gray-300">
                          Drop a PDF, Word, or PowerPoint file, or{" "}
                          <span className="text-teal-300 underline">
                            browse
                          </span>
                        </span>
                        <span className="text-xs text-gray-500">
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
                    <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-3.5 py-3">
                      <FileTextIcon className="w-5 h-5 text-teal-300 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-100 font-medium truncate">
                          {docFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(docFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeDoc}
                        className="shrink-0 text-gray-400 hover:text-white"
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
                    className="w-full mt-3 rounded-xl bg-white/5 border border-white/10 text-gray-100 placeholder:text-gray-500 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/60"
                  />
                </div>
              )}

              <div className="h-px bg-white/10 mb-5" />

              <div className="space-y-4 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Questions</span>
                  <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
                    {[5, 10, 15].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setQuestionCount(n as 5 | 10 | 15)}
                        className={`w-8 h-7 rounded-md text-xs font-semibold transition-colors ${
                          questionCount === n
                            ? "bg-white/15 text-white"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Difficulty</span>
                  <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1">
                    {(["Easy", "Medium", "Hard"] as Difficulty[]).map(
                      (level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficulty(level)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            difficulty === level
                              ? "bg-white/15 text-white"
                              : "text-gray-400 hover:text-gray-200"
                          }`}
                        >
                          {level}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Explanations</span>
                  <button
                    type="button"
                    onClick={() => setGenerateExplanations((v) => !v)}
                    className={`w-10 h-6 rounded-full transition relative ${generateExplanations ? "bg-teal-400" : "bg-white/15"}`}
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
                  <p className="text-sm text-gray-300">Question types</p>
                </div>
                <p className="text-xs text-gray-500 mb-2.5">
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
                            ? "bg-teal-400/15 text-teal-300 border-teal-400/40"
                            : "bg-transparent text-gray-400 border-white/15 hover:border-white/30 hover:text-gray-200"
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
                      className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Reset to mixed
                    </button>
                  )}
                </div>
              </div>

              {error && step === "form" && (
                <p className="mb-4 text-sm text-red-400 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={!canGenerate || isLoading}
                className="w-full h-11 rounded-full bg-teal-400 text-[#0A1238] font-semibold text-sm transition-colors hover:bg-teal-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-teal-400"
              >
                {isLoading ? "Generating..." : "Generate quiz"}
              </button>
            </form>
          </div>

          <div className="w-full flex-1 rounded-2xl border border-teal-400/25 bg-gradient-to-b from-teal-400/[0.06] to-white/[0.02] min-h-[420px] overflow-hidden">
            {step === "form" && (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center px-8 py-16">
                <div className="w-12 h-12 rounded-full bg-teal-400/10 border border-teal-400/30 flex items-center justify-center mb-4">
                  <ListChecksIcon
                    className="w-5 h-5 text-teal-300"
                    strokeWidth={1.75}
                  />
                </div>
                <p className="text-gray-200 font-medium mb-1.5 font-['Sora']">
                  Your questions will show up here
                </p>
                <p className="text-gray-500 text-sm max-w-xs">
                  Set up your quiz on the left, then generate — you'll review
                  every question before any of them are added.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-400 animate-spin" />
                  <Wand2Icon
                    className="absolute inset-0 m-auto w-5 h-5 text-teal-300"
                    strokeWidth={1.75}
                  />
                </div>
                <p className="text-gray-300 text-sm">{loadingLabel}</p>
              </div>
            )}

            {step === "results" && (
              <div className="flex flex-col h-full">
                <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4 border-b border-white/10">
                  <div>
                    <h2 className="text-base font-semibold text-white font-['Sora']">
                      Review &amp; add questions
                    </h2>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {addedCount} of {questions.length} added
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={backToForm}
                    className="shrink-0 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    ← Edit setup
                  </button>
                </div>

                <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
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
                          <p className="text-sm text-gray-100 mt-2">
                            {q.question}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isAdded}
                          onClick={() => addQuestion(q.id)}
                          className={`shrink-0 h-9 px-4 rounded-full text-sm font-semibold transition flex items-center gap-1.5 ${
                            isAdded
                              ? "bg-white/5 text-gray-500 cursor-default"
                              : "bg-teal-400 text-[#0A1238] hover:bg-teal-300"
                          }`}
                        >
                          {isAdded && <CheckIcon className="w-3.5 h-3.5" />}
                          {isAdded ? "Added" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                  <p className="px-6 py-3 text-xs text-gray-500">
                    Generated questions can make mistakes. Consider checking
                    question accuracy.
                  </p>
                </div>

                {error && (
                  <p className="px-6 pb-2 text-sm text-red-400 font-medium">
                    {error}
                  </p>
                )}

                <div className="mt-auto px-6 py-4 border-t border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={addAll}
                    className="text-sm font-semibold text-teal-300 hover:text-teal-200"
                  >
                    Add all questions
                  </button>
                  <button
                    type="button"
                    disabled={saving || addedCount === 0}
                    onClick={handleDone}
                    className="h-10 px-6 rounded-full bg-teal-400 text-[#0A1238] font-semibold text-sm hover:bg-teal-300 disabled:opacity-40"
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
