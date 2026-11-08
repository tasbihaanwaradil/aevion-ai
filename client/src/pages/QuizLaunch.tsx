"use client";

import { useEffect, useState } from "react";
import {
  XIcon,
  SearchIcon,
  ChevronLeftIcon,
  ArrowDownIcon,
  PlusIcon,
  FileTextIcon,
  ListChecksIcon,
  NavigationIcon,
  UserCheckIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../configs/Config";

const API_BASE = `${BASE_URL}/api`;

type Quiz = { id: string; name: string; updatedAt: string };
type DeliveryMethod = "instant" | "open" | "teacher-paced";

const formatRelativeTime = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

const QuizLaunch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const [step, setStep] = useState<"select" | "settings">("select");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [launching, setLaunching] = useState(false);

  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("instant");
  const [requireNames, setRequireNames] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleAnswers, setShuffleAnswers] = useState(false);
  const [showQuestionFeedback, setShowQuestionFeedback] = useState(true);
  const [showFinalScore, setShowFinalScore] = useState(false);

  const roomName =
    (user as { roomCode?: string })?.roomCode || user?.name || "Your Room";

  const handleClose = () => navigate(-1);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/quiz`, { credentials: "include" });
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
    setStep("settings");
  };

  const handleLaunch = async () => {
    if (!selectedQuiz) return;
    setLaunching(true);
    try {
      const res = await fetch(`${API_BASE}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          quizId: selectedQuiz.id,
          settings: {
            requireNames,
            shuffleQuestions,
            shuffleAnswers,
            showQuestionFeedback,
            showFinalScore,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/LiveResults/${data.session._id}`);
      } else {
        alert(data.message || "Failed to launch quiz.");
      }
    } catch (err) {
      console.error(err);
      alert("Could not reach the server.");
    } finally {
      setLaunching(false);
    }
  };

  const visibleQuizzes = quizzes.filter((q) =>
    q.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-3 sm:p-4 z-50">
      {/* The card is a flex column capped to the viewport height (dvh, so mobile
          browser bars are accounted for). Only the list / settings area scrolls;
          the header and footer stay visible. */}
      <div className="w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            {step === "settings" && (
              <button
                type="button"
                onClick={() => setStep("select")}
                className="text-gray-500 hover:text-gray-700 shrink-0 p-1.5 -ml-1.5"
                aria-label="Back"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-base sm:text-lg font-bold text-gray-800 truncate">
              {step === "select"
                ? `Launch Quiz in ${roomName}`
                : selectedQuiz?.name}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 transition shrink-0 p-2 -mr-2"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {step === "select" && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="shrink-0 px-4 sm:px-8 pt-4 sm:pt-5">
              <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-xl px-4 h-12">
                <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
                {/* text-base on mobile: iOS Safari zooms into fields below 16px */}
                <input
                  type="text"
                  placeholder="Search Personal"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 min-w-0 h-full bg-transparent outline-none text-base sm:text-sm text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 px-4 sm:px-8 py-3 sm:py-4">
              <ChevronLeftIcon className="w-4 h-4 text-[#2d5f6e]" />
              <span className="font-semibold text-gray-700">Personal</span>
            </div>

            <div className="shrink-0 flex items-center justify-between px-4 sm:px-8 py-3 border-t border-gray-200 text-xs font-bold tracking-wide text-[#2d5f6e]">
              <span>NAME</span>
              <span className="flex items-center gap-1">
                MODIFIED
                <ArrowDownIcon className="w-3 h-3" />
              </span>
            </div>

            <div className="border-t border-gray-100 flex-1 min-h-[140px] sm:min-h-[220px] sm:max-h-[360px] overflow-y-auto">
              {loading ? (
                <div className="min-h-[140px] sm:min-h-[220px] flex items-center justify-center">
                  <p className="text-gray-500">Loading quizzes...</p>
                </div>
              ) : error ? (
                <div className="min-h-[140px] sm:min-h-[220px] flex items-center justify-center px-4 text-center">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : visibleQuizzes.length > 0 ? (
                visibleQuizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    type="button"
                    onClick={() => handleSelectQuiz(quiz)}
                    className="w-full flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-8 py-3.5 sm:py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 active:bg-gray-50 transition text-left"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <FileTextIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {quiz.name}
                      </span>
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 shrink-0">
                      {formatRelativeTime(quiz.updatedAt)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="min-h-[140px] sm:min-h-[220px] flex items-center justify-center">
                  <p className="text-gray-500">This folder is empty</p>
                </div>
              )}
            </div>

            <div className="shrink-0 px-4 sm:px-8 py-4 sm:py-5">
              <button
                type="button"
                onClick={() => navigate("/Library")}
                className="flex items-center gap-2 text-[#2d5f6e] font-semibold hover:underline min-h-[40px] sm:min-h-0"
              >
                <PlusIcon className="w-4 h-4" />
                Add Quiz
              </button>
            </div>
          </div>
        )}

        {step === "settings" && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* One column on phones, two from sm up. Scrolls inside the card
                when the content is taller than the screen. */}
            <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 sm:px-8 py-5 sm:py-6 overflow-y-auto sm:max-h-[420px] content-start">
              <div>
                <p className="text-sm font-bold text-gray-800 mb-3">
                  Delivery Method
                </p>
                <div className="space-y-3">
                  {[
                    {
                      key: "instant",
                      icon: ListChecksIcon,
                      title: "Instant Feedback",
                      desc: "Students answer in order and see feedback after each question.",
                    },
                    {
                      key: "open",
                      icon: NavigationIcon,
                      title: "Open Navigation",
                      desc: "Students can move freely between questions.",
                    },
                    {
                      key: "teacher-paced",
                      icon: UserCheckIcon,
                      title: "Teacher Paced",
                      desc: "You control which question students see.",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() =>
                        setDeliveryMethod(opt.key as DeliveryMethod)
                      }
                      className={`w-full flex items-start gap-3 border rounded-xl p-3 text-left transition ${
                        deliveryMethod === opt.key
                          ? "border-[#2d5f6e] bg-sky-50/40"
                          : "border-gray-200"
                      }`}
                    >
                      <opt.icon className="w-5 h-5 text-[#2d5f6e] shrink-0 mt-0.5" />
                      <span>
                        <span className="block text-sm font-semibold text-gray-800">
                          {opt.title}
                          {opt.key !== "instant" && (
                            <span className="ml-2 text-[10px] font-bold text-gray-400">
                              Coming soon
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          {opt.desc}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-gray-800 mb-3">Settings</p>
                <div className="space-y-4">
                  {[
                    {
                      label: "Require Names",
                      value: requireNames,
                      set: setRequireNames,
                    },
                    {
                      label: "Shuffle Questions",
                      value: shuffleQuestions,
                      set: setShuffleQuestions,
                    },
                    {
                      label: "Shuffle Answers",
                      value: shuffleAnswers,
                      set: setShuffleAnswers,
                    },
                    {
                      label: "Show Question Feedback",
                      value: showQuestionFeedback,
                      set: setShowQuestionFeedback,
                    },
                    {
                      label: "Show Final Score",
                      value: showFinalScore,
                      set: setShowFinalScore,
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-sm text-gray-700">{s.label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={s.value}
                        aria-label={s.label}
                        onClick={() => s.set(!s.value)}
                        className={`w-11 h-6 shrink-0 rounded-full transition relative ${s.value ? "bg-[#2d5f6e]" : "bg-gray-300"}`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${
                            s.value ? "left-5" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="shrink-0 px-4 sm:px-8 py-4 sm:py-5 border-t border-gray-100 flex sm:justify-end pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-5">
              <button
                type="button"
                disabled={launching}
                onClick={handleLaunch}
                className="w-full sm:w-auto h-12 sm:h-11 px-8 rounded-xl bg-[#2d5f6e] text-white font-bold disabled:opacity-50"
              >
                {launching ? "Launching..." : "Launch"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizLaunch;
