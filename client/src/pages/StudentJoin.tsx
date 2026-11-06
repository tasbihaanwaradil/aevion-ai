"use client";

import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRightIcon,
  CheckIcon,
  XIcon,
  LightbulbIcon,
  PartyPopperIcon,
} from "lucide-react";
import { getSocket } from "../lib/socket";

type Question = {
  id: string;
  type: "MCQ" | "TrueFalse" | "ShortAnswer";
  question: string;
  options: string[] | null;
};

const STORAGE_KEY = "aevion_active_quiz_session";

type SavedSession = {
  roomCode: string;
  sessionId: string;
  participantId: string;
};

const loadSavedSession = (): SavedSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedSession) : null;
  } catch {
    return null;
  }
};

const saveSession = (data: SavedSession) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage might be unavailable (private browsing, etc.) — non-fatal.
  }
};

const clearSavedSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

/* ---------- Shared UI pieces ---------- */

const ACCENT = "#2d5f6e";

const Shell = ({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) => (
  <div className="min-h-screen bg-slate-50 flex flex-col">
    <header className="px-6 py-4 flex items-center">
      <Link to="/">
        <img src="/assets/logo.svg" alt="Aevion.AI" className="h-12 w-auto" />
      </Link>
    </header>
    <main
      className={`flex-1 flex flex-col items-center px-4 pb-12 ${
        center ? "justify-center -mt-12" : "pt-4"
      }`}
    >
      {children}
    </main>
  </div>
);

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`w-full bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const RoomPill = ({ code }: { code: string }) => (
  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1">
    Room
    <span className="font-mono font-semibold text-slate-800">
      {code.toUpperCase()}
    </span>
  </span>
);

const PrimaryButton = ({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className="w-full h-12 rounded-xl bg-slate-900 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.99] transition disabled:opacity-40 disabled:hover:bg-slate-900 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);

const inputClass =
  "w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#2d5f6e] focus:ring-4 focus:ring-[#2d5f6e]/10 transition";

const StudentJoin = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<
    "reconnecting" | "code" | "name" | "quiz" | "done"
  >("reconnecting");

  const [roomCode, setRoomCode] = useState(searchParams.get("room") || "");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const [sessionId, setSessionId] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    showFeedback: boolean;
    correctAnswer?: string;
    explanation?: string;
  } | null>(null);
  const [finalScore, setFinalScore] = useState<{
    score: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.on("student:join-error", ({ message }: { message: string }) => {
      setError(message);
      setJoining(false);
      setStep("code");
    });

    socket.on(
      "student:joined",
      (payload: {
        sessionId: string;
        participantId: string;
        title: string;
        questions: Question[];
      }) => {
        setSessionId(payload.sessionId);
        setParticipantId(payload.participantId);
        setTitle(payload.title);
        setQuestions(payload.questions);
        setCurrentIndex(0);
        setJoining(false);
        setStep("quiz");

        saveSession({
          roomCode: roomCode.trim().toUpperCase(),
          sessionId: payload.sessionId,
          participantId: payload.participantId,
        });
      },
    );

    socket.on(
      "student:resumed",
      (payload: {
        sessionId: string;
        participantId: string;
        title: string;
        questions: Question[];
        currentIndex: number;
        completed: boolean;
        score?: number;
        total?: number;
      }) => {
        setSessionId(payload.sessionId);
        setParticipantId(payload.participantId);
        setTitle(payload.title);
        setQuestions(payload.questions);
        setCurrentIndex(payload.currentIndex);
        setAnswer("");
        setFeedback(null);
        setError("");

        if (payload.completed) {
          if (payload.score !== undefined && payload.total !== undefined) {
            setFinalScore({ score: payload.score, total: payload.total });
          }
          setStep("done");
          clearSavedSession();
        } else {
          setStep("quiz");
        }
      },
    );

    socket.on("student:resume-error", ({ message }: { message: string }) => {
      clearSavedSession();
      setError(message);
      setStep("code");
    });

    socket.on(
      "student:answer-result",
      (payload: {
        isCorrect: boolean;
        showFeedback: boolean;
        correctAnswer?: string;
        explanation?: string;
        completed: boolean;
        score?: number;
        total?: number;
      }) => {
        setSubmitting(false);
        setError("");
        setFeedback({
          isCorrect: payload.isCorrect,
          showFeedback: payload.showFeedback,
          correctAnswer: payload.correctAnswer,
          explanation: payload.explanation,
        });
        if (payload.completed) {
          if (payload.score !== undefined && payload.total !== undefined) {
            setFinalScore({ score: payload.score, total: payload.total });
          }
          clearSavedSession();
        }
      },
    );

    socket.on("student:answer-error", ({ message }: { message: string }) => {
      setSubmitting(false);
      setError(message);
      setFeedback(null);
    });

    socket.on("session:status-changed", ({ status }: { status: string }) => {
      if (status === "finished") {
        clearSavedSession();
        setStep("done");
      }
    });

    // On mount: if there's a saved session, try to resume it before
    // showing the room-code screen at all.
    const saved = loadSavedSession();
    if (saved) {
      socket.emit("student:resume-session", {
        sessionId: saved.sessionId,
        participantId: saved.participantId,
      });
      setRoomCode(saved.roomCode);
    } else {
      setStep("code");
    }

    return () => {
      socket.off("student:join-error");
      socket.off("student:joined");
      socket.off("student:resumed");
      socket.off("student:resume-error");
      socket.off("student:answer-result");
      socket.off("student:answer-error");
      socket.off("session:status-changed");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinueFromCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError("Please enter a room name.");
      return;
    }
    setError("");
    setStep("name");
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setJoining(true);
    getSocket().emit("student:join-session", {
      roomCode: roomCode.trim().toUpperCase(),
      name: name.trim(),
    });
  };

  const handleSubmitAnswer = () => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion || !answer.trim()) return;

    setError("");
    setSubmitting(true);
    getSocket().emit("student:submit-answer", {
      sessionId,
      participantId,
      questionId: currentQuestion.id,
      answer: answer.trim(),
    });
  };

  const handleNext = () => {
    setFeedback(null);
    setAnswer("");
    if (currentIndex + 1 >= questions.length) {
      setStep("done");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  /* ---------- Reconnecting ---------- */
  if (step === "reconnecting") {
    return (
      <Shell center>
        <div
          className="w-9 h-9 rounded-full border-[3px] border-slate-200 animate-spin mb-4"
          style={{ borderTopColor: ACCENT }}
        />
        <p className="text-sm text-slate-500">Reconnecting to your quiz…</p>
      </Shell>
    );
  }

  /* ---------- Room code ---------- */
  if (step === "code") {
    return (
      <Shell center>
        <Card className="max-w-md p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Join an activity
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Enter the room name your teacher shared with you.
          </p>
          <form onSubmit={handleContinueFromCode}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Room name
            </label>
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="e.g. SCIENCE101"
              autoFocus
              className={`${inputClass} uppercase font-mono tracking-wider mb-4`}
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}
            <PrimaryButton type="submit">Join</PrimaryButton>
          </form>
        </Card>
      </Shell>
    );
  }

  /* ---------- Name ---------- */
  if (step === "name") {
    return (
      <Shell center>
        <div className="mb-4">
          <RoomPill code={roomCode} />
        </div>
        <Card className="max-w-md p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            What's your name?
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Your teacher sees this name on their results.
          </p>
          <form onSubmit={handleJoin}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Your name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Last, First"
              autoFocus
              className={`${inputClass} mb-4`}
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}
            <PrimaryButton type="submit" disabled={joining || !name.trim()}>
              {joining ? "Joining…" : "Continue"}
            </PrimaryButton>
          </form>
          <button
            type="button"
            onClick={() => {
              setError("");
              setStep("code");
            }}
            className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 transition"
          >
            Change room
          </button>
        </Card>
      </Shell>
    );
  }

  /* ---------- Quiz ---------- */
  if (step === "quiz") {
    const question = questions[currentIndex];
    if (!question) {
      return (
        <Shell center>
          <p className="text-sm text-slate-500">Loading your question…</p>
        </Shell>
      );
    }

    const typeLabel =
      question.type === "MCQ"
        ? "Multiple choice"
        : question.type === "TrueFalse"
          ? "True or false"
          : "Short answer";

    const progressPct = (currentIndex / questions.length) * 100;
    const isLast = currentIndex + 1 >= questions.length;

    return (
      <Shell>
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="flex items-center justify-between mb-2">
            <RoomPill code={roomCode} />
            <span className="text-xs font-medium text-slate-500 tabular-nums">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct + 100 / questions.length}%`,
                backgroundColor: ACCENT,
              }}
            />
          </div>

          <Card className="p-6 sm:p-8">
            <span className="inline-block text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2.5 py-1 mb-4">
              {typeLabel}
            </span>
            <h2 className="text-xl font-semibold text-slate-900 leading-snug mb-6">
              {question.question}
            </h2>

            {!feedback && (
              <>
                {question.type === "MCQ" && question.options && (
                  <div className="space-y-2.5">
                    {question.options.map((opt, i) => {
                      const selected = answer === opt;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAnswer(opt)}
                          className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border-2 text-left transition ${
                            selected
                              ? "border-[#2d5f6e] bg-[#2d5f6e]/5"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition ${
                              selected
                                ? "bg-[#2d5f6e] text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-slate-800 font-medium">
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {question.type === "TrueFalse" && (
                  <div className="grid grid-cols-2 gap-3">
                    {["True", "False"].map((opt) => {
                      const selected = answer === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswer(opt)}
                          className={`h-16 rounded-xl border-2 font-semibold transition ${
                            selected
                              ? "border-[#2d5f6e] bg-[#2d5f6e] text-white"
                              : "border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {question.type === "ShortAnswer" && (
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer…"
                    className="w-full h-32 p-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none resize-none focus:border-[#2d5f6e] focus:ring-4 focus:ring-[#2d5f6e]/10 transition"
                  />
                )}

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-4">
                    {error}
                  </p>
                )}

                <div className="mt-6">
                  <PrimaryButton
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={!answer.trim() || submitting}
                  >
                    {submitting ? "Submitting…" : "Submit answer"}
                  </PrimaryButton>
                </div>
              </>
            )}

            {feedback && (
              <div>
                <div
                  className={`flex items-center gap-3 rounded-xl px-4 py-3.5 mb-4 ${
                    feedback.isCorrect
                      ? "bg-[#c8e9d1] text-[#2d5a3d]"
                      : "bg-[#f6b3b3] text-[#7a2b2b]"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      feedback.isCorrect ? "bg-[#2d5a3d]" : "bg-[#7a2b2b]"
                    } text-white`}
                  >
                    {feedback.isCorrect ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <XIcon className="w-4 h-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight">
                      {feedback.isCorrect ? "Correct" : "Not quite"}
                    </p>
                    <p className="text-xs opacity-80 truncate">
                      Your answer: {answer}
                    </p>
                  </div>
                </div>

                {feedback.showFeedback &&
                  !feedback.isCorrect &&
                  feedback.correctAnswer && (
                    <p className="text-sm text-slate-600 mb-3">
                      Correct answer:{" "}
                      <span className="font-semibold text-slate-900">
                        {feedback.correctAnswer}
                      </span>
                    </p>
                  )}

                {feedback.showFeedback && feedback.explanation && (
                  <div className="flex gap-3 bg-slate-50 rounded-xl px-4 py-3.5 mb-6">
                    <LightbulbIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feedback.explanation}
                    </p>
                  </div>
                )}

                <PrimaryButton type="button" onClick={handleNext}>
                  {isLast ? "Finish" : "Next question"}
                  <ArrowRightIcon className="w-4 h-4" />
                </PrimaryButton>
              </div>
            )}
          </Card>
        </div>
      </Shell>
    );
  }

  /* ---------- Done ---------- */
  const pct =
    finalScore && finalScore.total > 0
      ? Math.round((finalScore.score / finalScore.total) * 100)
      : null;
  const RADIUS = 52;
  const CIRC = 2 * Math.PI * RADIUS;

  return (
    <Shell center>
      <Card className="max-w-md p-8 text-center">
        {pct !== null ? (
          <div className="relative w-36 h-36 mx-auto mb-6">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke={ACCENT}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC - (pct / 100) * CIRC}
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900 tabular-nums">
                {finalScore!.score}/{finalScore!.total}
              </span>
              <span className="text-xs text-slate-400">{pct}%</span>
            </div>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6">
            <PartyPopperIcon className="w-7 h-7" />
          </div>
        )}
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          You're all done!
        </h2>
        <p className="text-sm text-slate-500">
          Your teacher can see your results.
        </p>
      </Card>
    </Shell>
  );
};

export default StudentJoin;