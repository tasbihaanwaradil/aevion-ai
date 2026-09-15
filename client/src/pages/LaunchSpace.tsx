"use client";

import React, { useEffect, useState } from "react";
import {
  XIcon,
  SearchIcon,
  FolderIcon,
  FileTextIcon,
  RocketIcon,
  CheckIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3000/api";
const BRAND = "#007a8c";
const BRAND_DARK = "#005f6a";

// -----------------------------------------------------------------------
// Load fonts. Move this <link> into your index.html for production —
// it's inlined here so the component works as a drop-in preview.
// -----------------------------------------------------------------------
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
  `}</style>
);

type Quiz = { id: string; name: string; updatedAt: string };
type Step = 1 | 2;

const Stepper = ({ step }: { step: Step }) => {
  const items: { n: Step; label: string }[] = [
    { n: 1, label: "Choose quiz" },
    { n: 2, label: "Race settings" },
  ];
  return (
    <div className="flex items-center px-8 pt-4">
      {items.map((item, i) => {
        const active = step === item.n;
        const done = step > item.n;
        return (
          <React.Fragment key={item.n}>
            <div className="flex items-center gap-2.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  active
                    ? "text-white"
                    : done
                      ? "bg-sky-50 text-[#007a8c] border border-sky-200"
                      : "bg-gray-100 text-gray-400 border border-gray-200"
                }`}
                style={active ? { backgroundColor: BRAND } : undefined}
              >
                {done ? <CheckIcon className="w-3.5 h-3.5" /> : item.n}
              </div>
              <span
                className={`text-sm font-medium whitespace-nowrap ${
                  active ? "text-sky-900" : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </div>
            {i < items.length - 1 && (
              <div
                className={`flex-1 h-px mx-4 transition-colors ${
                  done ? "bg-sky-200" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const LaunchSpace = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [search, setSearch] = useState("");

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [launching, setLaunching] = useState(false);

  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // Space Race settings — reuse the same session settings shape the
  // backend already understands (see SessionControllers.ts).
  const [requireNames, setRequireNames] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleAnswers, setShuffleAnswers] = useState(false);

  const handleClose = () => navigate(-1);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/quiz`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setQuizzes(
            data.quizzes.map((q: any) => ({
              id: q._id,
              name: q.title,
              updatedAt: q.updatedAt,
            })),
          );
        } else {
          setError(data.message || "Failed to load quizzes.");
        }
      } catch (err) {
        console.error(err);
        setError("Could not reach the server.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const handleSelectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setStep(2);
  };

  const handleLaunch = async () => {
    if (!selectedQuiz) return;
    setLaunching(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          quizId: selectedQuiz.id,
          mode: "space-race",
          settings: {
            requireNames,
            shuffleQuestions,
            shuffleAnswers,
            showQuestionFeedback: true,
            showFinalScore: true,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        // TODO: once a dedicated Space Race live view exists, point this
        // there instead (e.g. `/SpaceRace/Live/${data.session._id}`).
        navigate(`/LiveResults/${data.session._id}`);
      } else {
        setError(data.message || "Failed to launch Space Race.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not reach the server.");
    } finally {
      setLaunching(false);
    }
  };

  const visibleQuizzes = quizzes.filter((q) =>
    q.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 bg-sky-950/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-sky-100 overflow-hidden font-['Inter']">
        <FontLoader />

        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
              <RocketIcon
                className="w-5 h-5"
                style={{ color: BRAND }}
                strokeWidth={1.75}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sky-900 leading-tight font-['Sora']">
                Launch Space Race
              </h1>
              <p className="text-sky-900/50 text-xs mt-0.5 font-medium">
                Pick a quiz and get your class racing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <Stepper step={step} />

        {/* Content */}
        <div className="px-8 py-6 min-h-[320px]">
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 bg-sky-50 border border-sky-100 rounded-xl px-4 h-12 mb-5 focus-within:ring-2 focus-within:ring-sky-300 transition-shadow">
                <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search quizzes"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 h-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                />
              </div>

              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-bold tracking-wide text-gray-500">
                  QUIZZES
                </p>
                {!loading && !error && quizzes.length > 0 && (
                  <p className="text-xs text-gray-400">
                    {visibleQuizzes.length} of {quizzes.length}
                  </p>
                )}
              </div>

              <div className="min-h-[200px] max-h-[280px] overflow-y-auto rounded-xl border border-sky-100">
                {loading ? (
                  <div className="p-2 space-y-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-11 rounded-lg bg-sky-50 animate-pulse"
                        style={{ animationDelay: `${i * 80}ms` }}
                      />
                    ))}
                  </div>
                ) : error ? (
                  <div className="min-h-[200px] flex items-center justify-center px-6 text-center">
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                ) : quizzes.length === 0 ? (
                  <div className="min-h-[200px] flex flex-col items-center justify-center gap-3">
                    <FolderIcon
                      className="w-10 h-10 text-gray-300"
                      strokeWidth={1.5}
                    />
                    <p className="text-gray-500 text-sm">
                      You don't have any quizzes yet
                    </p>
                  </div>
                ) : visibleQuizzes.length > 0 ? (
                  <div className="p-1.5">
                    {visibleQuizzes.map((quiz) => {
                      const isSelected = selectedQuiz?.id === quiz.id;
                      return (
                        <button
                          key={quiz.id}
                          type="button"
                          onClick={() => handleSelectQuiz(quiz)}
                          className={`w-full flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left transition-colors ${
                            isSelected
                              ? "bg-sky-50 ring-1 ring-sky-300"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <FileTextIcon
                            className="w-4 h-4 shrink-0"
                            style={{ color: isSelected ? BRAND : "#9ca3af" }}
                          />
                          <span
                            className={`text-sm font-medium truncate ${
                              isSelected ? "text-sky-900" : "text-gray-700"
                            }`}
                          >
                            {quiz.name}
                          </span>
                          {isSelected && (
                            <CheckIcon
                              className="w-4 h-4 ml-auto shrink-0"
                              style={{ color: BRAND }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="min-h-[200px] flex flex-col items-center justify-center gap-2 px-6 text-center">
                    <SearchIcon
                      className="w-8 h-8 text-gray-300"
                      strokeWidth={1.5}
                    />
                    <p className="text-gray-500 text-sm">
                      No quizzes match "{search}"
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 2 && selectedQuiz && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 rounded-xl bg-sky-50 border border-sky-100 px-4 py-3">
                <FileTextIcon
                  className="w-4 h-4 shrink-0"
                  style={{ color: BRAND }}
                />
                <span className="text-sm font-semibold text-sky-900 truncate">
                  {selectedQuiz.name}
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto text-xs font-semibold shrink-0 hover:underline"
                  style={{ color: BRAND }}
                >
                  Change
                </button>
              </div>

              <div className="space-y-3.5">
                {[
                  {
                    label: "Require names",
                    hint: "Students must enter a name to join.",
                    value: requireNames,
                    set: setRequireNames,
                  },
                  {
                    label: "Shuffle questions",
                    hint: "Each racer gets a different question order.",
                    value: shuffleQuestions,
                    set: setShuffleQuestions,
                  },
                  {
                    label: "Shuffle answers",
                    hint: "Randomize answer order for multiple choice.",
                    value: shuffleAnswers,
                    set: setShuffleAnswers,
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {s.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.hint}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => s.set(!s.value)}
                      className="w-10 h-6 rounded-full transition relative shrink-0"
                      style={{ backgroundColor: s.value ? BRAND : "#d1d5db" }}
                      aria-label={`Toggle ${s.label}`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                          s.value ? "left-[18px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-sky-100">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(1)}
            className="px-6 py-2.5 rounded-xl border font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sky-50 transition-all"
            style={{ borderColor: BRAND, color: BRAND }}
          >
            Previous
          </button>

          {step === 1 ? (
            <button
              type="button"
              disabled={!selectedQuiz}
              onClick={() => setStep(2)}
              className="px-8 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/10 hover:-translate-y-0.5"
              style={{ backgroundColor: BRAND }}
              onMouseEnter={(e) =>
                !e.currentTarget.disabled &&
                (e.currentTarget.style.backgroundColor = BRAND_DARK)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = BRAND)
              }
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={launching}
              onClick={handleLaunch}
              className="px-8 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-all shadow-lg shadow-black/10 hover:-translate-y-0.5"
              style={{ backgroundColor: BRAND }}
              onMouseEnter={(e) =>
                !e.currentTarget.disabled &&
                (e.currentTarget.style.backgroundColor = BRAND_DARK)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = BRAND)
              }
            >
              {launching ? "Launching…" : "Launch"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaunchSpace;
