"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

  if (step === "reconnecting") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin mb-4" />
        <p className="text-gray-600">Reconnecting to your quiz...</p>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Aevion.AI</h1>
        <p className="text-xl font-semibold text-gray-800 mb-1">
          Join an activity
        </p>
        <p className="text-gray-500 mb-6">
          Enter your room name to join an activity
        </p>
        <form onSubmit={handleContinueFromCode} className="w-full max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Room name
          </label>
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="E.G. SCIENCE101"
            className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none mb-4 uppercase text-gray-900 placeholder:text-gray-500 bg-white"
          />
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <button
            type="submit"
            className="w-full h-12 rounded-lg bg-gray-900 text-white font-bold"
          >
            Join
          </button>
        </form>
      </div>
    );
  }

  if (step === "name") {
    return (
      <div className="min-h-screen bg-white px-6 py-8">
        <p className="text-sm text-gray-500">Room</p>
        <p className="text-xl font-bold text-gray-900 mb-8">
          {roomCode.toUpperCase()}
        </p>
        <form onSubmit={handleJoin} className="max-w-md">
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            What's your name?
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Your teacher sees this name on their results.
          </p>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter your name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Last, First"
            className="w-full h-12 px-4 border border-gray-300 rounded-lg outline-none mb-4 text-gray-900 placeholder:text-gray-500 bg-white"
          />
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <button
            type="submit"
            disabled={joining}
            className="w-full h-12 rounded-lg bg-gray-900 text-white font-bold disabled:opacity-50"
          >
            {joining ? "Joining..." : "Continue"}
          </button>
        </form>
      </div>
    );
  }

  if (step === "quiz") {
    const question = questions[currentIndex];
    if (!question) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <p className="text-gray-500">Loading your question...</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-white px-6 py-8">
        <p className="text-sm text-gray-500">Room</p>
        <p className="text-xl font-bold text-gray-900 mb-8">
          {roomCode.toUpperCase()}
        </p>

        <div className="max-w-2xl">
          <p className="text-sm text-gray-500 mb-1">
            Question {currentIndex + 1} of {questions.length} ·{" "}
            {question.type === "MCQ"
              ? "Multiple Choice"
              : question.type === "TrueFalse"
                ? "True / False"
                : "Short Answer"}
          </p>
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            {question.question}
          </h2>

          {!feedback && (
            <>
              {question.type === "MCQ" && question.options && (
                <div className="space-y-3">
                  {question.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAnswer(opt)}
                      className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-left transition text-gray-900 ${
                        answer === opt
                          ? "border-[#2d5f6e] bg-sky-50"
                          : "border-gray-200"
                      }`}
                    >
                      <span className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-xs font-bold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {question.type === "TrueFalse" && (
                <div className="flex gap-4">
                  {["True", "False"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswer(opt)}
                      className={`flex-1 h-14 rounded-xl border-2 font-semibold transition text-gray-900 ${
                        answer === opt
                          ? "border-[#2d5f6e] bg-sky-50"
                          : "border-gray-200"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {question.type === "ShortAnswer" && (
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-xl outline-none text-gray-900 placeholder:text-gray-500 bg-white"
                />
              )}

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || submitting}
                className="w-full h-12 mt-6 rounded-xl bg-gray-900 text-white font-bold disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Answer"}
              </button>
            </>
          )}

          {feedback && (
            <div>
              <div
                className={`rounded-xl px-4 py-3 mb-3 font-semibold ${
                  feedback.isCorrect
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {feedback.isCorrect ? "Correct" : "Not quite"}
              </div>
              {feedback.showFeedback && feedback.explanation && (
                <p className="text-sm text-gray-600 mb-6">
                  {feedback.explanation}
                </p>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="w-full h-12 rounded-xl bg-gray-900 text-white font-bold"
              >
                {currentIndex + 1 >= questions.length
                  ? "Finish"
                  : "Next Question"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        You're all done!
      </h2>
      {finalScore && (
        <p className="text-gray-600">
          You scored {finalScore.score} / {finalScore.total}
        </p>
      )}
      <p className="text-gray-500 mt-2">Your teacher can see your results.</p>
    </div>
  );
};

export default StudentJoin;
