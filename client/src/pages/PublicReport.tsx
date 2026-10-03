"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = "http://localhost:3000/api";

type Answer = { questionId: string; answer: string; isCorrect: boolean };
type Participant = { name: string; score: number; answers: Answer[] };
type Question = { id: string; question: string; type: string };

const PublicReport = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [title, setTitle] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareCode) return;
    fetch(`${API_BASE}/session/public/${shareCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTitle(data.report.title);
          setUpdatedAt(data.report.updatedAt);
          setQuestions(data.report.questions);
          setParticipants(data.report.participants);
        } else {
          setError(data.message || "Report not found.");
        }
      })
      .catch(() => setError("Could not reach the server."))
      .finally(() => setLoading(false));
  }, [shareCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <p className="text-slate-500 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">{title}</h1>
        <p className="text-sm text-slate-400 mb-6">
          {new Date(updatedAt).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-500 py-3 pl-5 pr-4">
                    NAME
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 py-3 pr-4">
                    SCORE
                  </th>
                  {questions.map((q, i) => (
                    <th
                      key={q.id}
                      className="text-xs font-semibold text-slate-500 py-3 px-3 min-w-[100px]"
                    >
                      Q{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((p, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="py-3 pl-5 pr-4 font-medium text-slate-800">
                      {p.name}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 tabular-nums">
                      {questions.length > 0
                        ? Math.round((p.score / questions.length) * 100)
                        : 0}
                      %
                    </td>
                    {questions.map((q) => {
                      const ans = p.answers.find((a) => a.questionId === q.id);
                      if (!ans)
                        return (
                          <td
                            key={q.id}
                            className="py-3 px-3 text-center text-slate-300"
                          >
                            —
                          </td>
                        );
                      return (
                        <td
                          key={q.id}
                          className={`py-3 px-3 text-center font-medium ${
                            ans.isCorrect
                              ? "text-emerald-700"
                              : "text-orange-600"
                          }`}
                        >
                          {ans.answer}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicReport;
