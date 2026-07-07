"use client";

import React, { useState } from "react";
import SideNavbar from "../components/SideNavbar";

// ---------- Types ----------

type QuestionType = "MCQ" | "TrueFalse" | "ShortAnswer";
type Difficulty = "Easy" | "Medium" | "Hard";

interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
}

interface QuizData {
  _id: string;
  title: string;
  difficulty: Difficulty;
  questions: QuizQuestion[];
}

// ---------- Component ----------

const QUESTION_TYPE_OPTIONS: { label: string; value: QuestionType }[] = [
  { label: "Multiple Choice", value: "MCQ" },
  { label: "True / False", value: "TrueFalse" },
  { label: "Short Answer", value: "ShortAnswer" },
];

const QuizGenerator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("tools");

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    "MCQ",
    "TrueFalse",
    "ShortAnswer",
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [quiz, setQuiz] = useState<QuizData | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const toggleType = (type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const resetQuizState = () => {
    setQuiz(null);
    setCurrentIndex(0);
    setAnswers({});
    setSubmitted(false);
    setError("");
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

    try {
      setLoading(true);
      resetQuizState();

      const response = await fetch("http://localhost:3000/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          topic,
          difficulty,
          questionCount,
          questionTypes: selectedTypes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setQuiz(data.quiz);
      } else {
        setError(data.message || "Something went wrong while generating the quiz.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, value: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitQuiz = () => {
    setSubmitted(true);
  };

  const score = React.useMemo(() => {
    if (!quiz) return 0;
    return quiz.questions.reduce((acc, q) => {
      const given = answers[q.id]?.trim().toLowerCase();
      const correct = q.correctAnswer.trim().toLowerCase();
      return given === correct ? acc + 1 : acc;
    }, 0);
  }, [quiz, answers, submitted]);

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
          <p className="text-gray-400 mt-2">Turn any topic into a ready-to-take quiz</p>
        </div>

        {!quiz ? (
          <div className="max-w-2xl mx-auto">
            <form
              onSubmit={handleGenerate}
              className="bg-white rounded-2xl shadow-2xl p-10 text-gray-800"
            >
              <label className="block font-semibold mb-2">Topic</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g., Cellular respiration, React hooks, WWII causes..."
                className="w-full h-28 px-5 py-4 bg-gray-100 rounded-xl outline-none"
              />

              <label className="block font-semibold mt-6 mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full h-14 px-5 bg-gray-100 rounded-xl"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <label className="block font-semibold mt-6 mb-2">
                Number of Questions: {questionCount}
              </label>
              <input
                type="range"
                min={3}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full"
              />

              <label className="block font-semibold mt-6 mb-2">Question Types</label>
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

              {error && <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-10 w-full h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold text-lg disabled:opacity-50"
              >
                {loading ? "Generating Quiz..." : "Generate Quiz"}
              </button>
            </form>
          </div>
        ) : (
          <QuizRunner
            quiz={quiz}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            answers={answers}
            onSelectAnswer={handleSelectAnswer}
            submitted={submitted}
            onSubmit={handleSubmitQuiz}
            score={score}
            onRestart={resetQuizState}
          />
        )}
      </div>
    </div>
  );
};

// ---------- Quiz Runner (taking + reviewing) ----------

interface QuizRunnerProps {
  quiz: QuizData;
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  answers: Record<string, string>;
  onSelectAnswer: (questionId: string, value: string) => void;
  submitted: boolean;
  onSubmit: () => void;
  score: number;
  onRestart: () => void;
}

const QuizRunner: React.FC<QuizRunnerProps> = ({
  quiz,
  currentIndex,
  setCurrentIndex,
  answers,
  onSelectAnswer,
  submitted,
  onSubmit,
  score,
  onRestart,
}) => {
  const total = quiz.questions.length;
  const question = quiz.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isLast = currentIndex === total - 1;

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-gray-800 text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">{quiz.title}</h2>
          <p className="text-gray-500 mb-6">Results</p>
          <div className="text-6xl font-extrabold text-[#2d5f6e] mb-2">
            {score} / {total}
          </div>
          <p className="text-gray-500">{Math.round((score / total) * 100)}% correct</p>
          <button
            onClick={onRestart}
            className="mt-8 h-12 px-8 rounded-2xl bg-[#2d5f6e] text-white font-bold"
          >
            Generate Another Quiz
          </button>
        </div>

        <div className="space-y-4">
          {quiz.questions.map((q, i) => {
            const given = answers[q.id] ?? "";
            const isCorrect =
              given.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl shadow-lg p-6 text-gray-800 border-l-4 ${
                  isCorrect ? "border-green-500" : "border-red-500"
                }`}
              >
                <p className="font-semibold mb-2">
                  {i + 1}. {q.question}
                </p>
                <p className="text-sm text-gray-500 mb-1">
                  Your answer:{" "}
                  <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                    {given || "No answer"}
                  </span>
                </p>
                {!isCorrect && (
                  <p className="text-sm text-gray-500 mb-1">
                    Correct answer: <span className="text-green-600">{q.correctAnswer}</span>
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-2">{q.explanation}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-10 text-gray-800">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-semibold text-gray-500">
            Question {currentIndex + 1} of {total}
          </span>
          <span className="text-sm font-semibold text-gray-500">
            {answeredCount} / {total} answered
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-[#2d5f6e] transition-all"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>

        <h2 className="text-xl font-bold mb-6">{question.question}</h2>

        {question.type === "MCQ" && question.options && (
          <div className="space-y-3">
            {question.options.map((opt) => (
              <button
                key={opt}
                onClick={() => onSelectAnswer(question.id, opt)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-colors ${
                  answers[question.id] === opt
                    ? "bg-[#2d5f6e] text-white border-[#2d5f6e]"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
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
                onClick={() => onSelectAnswer(question.id, opt)}
                className={`flex-1 h-14 rounded-xl border-2 font-semibold transition-colors ${
                  answers[question.id] === opt
                    ? "bg-[#2d5f6e] text-white border-[#2d5f6e]"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {question.type === "ShortAnswer" && (
          <input
            type="text"
            value={answers[question.id] || ""}
            onChange={(e) => onSelectAnswer(question.id, e.target.value)}
            placeholder="Type your answer..."
            className="w-full h-14 px-5 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none"
          />
        )}

        <div className="flex justify-between mt-10">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="h-12 px-6 rounded-xl bg-gray-100 text-gray-600 font-semibold disabled:opacity-40"
          >
            Back
          </button>

          {isLast ? (
            <button
              onClick={onSubmit}
              className="h-12 px-8 rounded-xl bg-[#2d5f6e] text-white font-bold"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="h-12 px-8 rounded-xl bg-[#2d5f6e] text-white font-bold"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizGenerator;