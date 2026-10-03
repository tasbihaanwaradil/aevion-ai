"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PauseIcon,
  PlayIcon,
  CheckSquareIcon,
  UsersIcon,
  XIcon,
  CheckCircle2Icon,
  ArrowUpIcon,
  ArrowDownIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  UsersRoundIcon,
  ListChecksIcon,
} from "lucide-react";
import TeacherNavbar from "../components/TeacherNavabar";
import { getSocket } from "../lib/socket";

const API_BASE = "http://localhost:3000/api";
const FRONTEND_URL = "http://localhost:5173";

type Answer = { questionId: string; answer: string; isCorrect: boolean };
type Participant = {
  participantId: string;
  name: string;
  score: number;
  currentIndex: number;
  completed: boolean;
  answers: Answer[];
};
type Question = {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
};

type SortKey = "name" | "score";
type SortDir = "asc" | "desc";

const RANK_STYLES = [
  { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" },
  { bg: "bg-slate-200", text: "text-slate-600", ring: "ring-slate-300" },
  { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-200" },
];

const LiveResults = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [status, setStatus] = useState<
    "waiting" | "active" | "paused" | "finished"
  >("waiting");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNames, setShowNames] = useState(true);
  const [showResponses, setShowResponses] = useState(true);
  const [showResults, setShowResults] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    if (!id) return;

    const fetchSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/session/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setTitle(data.session.title);
          setRoomCode(data.session.roomCode);
          setStatus(data.session.status);
          setQuestions(data.session.questions);
          setParticipants(data.session.participants);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();

    const socket = getSocket();
    socket.emit("teacher:join-session", { sessionId: id });

    socket.on(
      "teacher:participant-update",
      ({ participants: p }: { participants: Participant[] }) => {
        setParticipants(p);
      },
    );
    socket.on(
      "session:status-changed",
      ({ status: s }: { status: typeof status }) => {
        setStatus(s);
      },
    );

    return () => {
      socket.off("teacher:participant-update");
      socket.off("session:status-changed");
    };
  }, [id]);

  const togglePause = () => {
    const socket = getSocket();
    if (status === "paused") {
      socket.emit("teacher:resume-session", { sessionId: id });
    } else {
      socket.emit("teacher:pause-session", { sessionId: id });
    }
  };

  const handleFinish = () => {
    if (
      !window.confirm(
        "Finish this activity? Students won't be able to submit further answers.",
      )
    )
      return;
    const socket = getSocket();
    socket.emit("teacher:finish-session", { sessionId: id });
    navigate("/Reports");
  };

  const scorePercent = (p: Participant) =>
    questions.length > 0 ? Math.round((p.score / questions.length) * 100) : 0;

  const classTotalForQuestion = (qId: string) => {
    const relevant = participants
      .map((p) => p.answers.find((a) => a.questionId === qId))
      .filter((a): a is Answer => Boolean(a));
    if (relevant.length === 0) return null;
    const correct = relevant.filter((a) => a.isCorrect).length;
    return Math.round((correct / relevant.length) * 100);
  };

  const attemptedCount = participants.length;

  const averageScore = useMemo(() => {
    if (participants.length === 0) return null;
    const total = participants.reduce((sum, p) => sum + scorePercent(p), 0);
    return Math.round(total / participants.length);
  }, [participants, questions.length]);

  const completedCount = useMemo(
    () => participants.filter((p) => p.completed).length,
    [participants],
  );

  const hardestQuestionId = useMemo(() => {
    let worstId: string | null = null;
    let worstPct = 101;
    for (const q of questions) {
      const pct = classTotalForQuestion(q.id);
      if (pct !== null && pct < worstPct) {
        worstPct = pct;
        worstId = q.id;
      }
    }
    return worstPct <= 50 ? worstId : null;
  }, [questions, participants]);

  const topPerformers = useMemo(() => {
    return [...participants]
      .filter((p) => p.answers.length > 0)
      .sort((a, b) => {
        const scoreDiff = scorePercent(b) - scorePercent(a);
        if (scoreDiff !== 0) return scoreDiff;
        return b.answers.length - a.answers.length;
      })
      .slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, questions.length]);

  const sortedParticipants = useMemo(() => {
    const copy = [...participants];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = scorePercent(a) - scorePercent(b);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, sortKey, sortDir, questions.length]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const statusLabel: Record<
    typeof status,
    { text: string; className: string }
  > = {
    waiting: {
      text: "Waiting for students",
      className: "bg-slate-100 text-slate-600",
    },
    active: { text: "Live", className: "bg-emerald-100 text-emerald-700" },
    paused: { text: "Paused", className: "bg-amber-100 text-amber-700" },
    finished: { text: "Finished", className: "bg-slate-100 text-slate-500" },
  };

  const inviteLink = `${FRONTEND_URL}/join?room=${roomCode}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(inviteLink)}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TeacherNavbar />
        <p className="pt-28 text-center text-slate-400 text-sm">
          Loading session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TeacherNavbar />

      <div className="pt-24 pb-16 px-6 md:px-10 max-w-7xl mx-auto">
        {/* ---------- Header ---------- */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusLabel[status].className}`}
              >
                {statusLabel[status].text}
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Room code{" "}
              <span className="font-mono font-medium text-slate-600">
                {roomCode}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePause}
              disabled={status === "finished"}
              className="flex items-center gap-2 h-9 px-3.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-40"
            >
              {status === "paused" ? (
                <PlayIcon className="w-3.5 h-3.5" />
              ) : (
                <PauseIcon className="w-3.5 h-3.5" />
              )}
              {status === "paused" ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={status === "finished"}
              className="flex items-center gap-2 h-9 px-3.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-40"
            >
              <CheckSquareIcon className="w-3.5 h-3.5" />
              Finish
            </button>
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition"
            >
              <UsersIcon className="w-3.5 h-3.5" />
              Invite
            </button>
          </div>
        </div>

        {participants.length > 0 && (
          <>
            {/* ---------- Stat cards ---------- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <TrendingUpIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Average Score</p>
                  <p className="text-lg font-semibold text-slate-900 leading-tight">
                    {averageScore !== null ? `${averageScore}%` : "—"}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <UsersRoundIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Attempted</p>
                  <p className="text-lg font-semibold text-slate-900 leading-tight">
                    {attemptedCount}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Completed</p>
                  <p className="text-lg font-semibold text-slate-900 leading-tight">
                    {completedCount}{" "}
                    <span className="text-slate-400 font-normal">
                      / {attemptedCount}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <AlertTriangleIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Hardest Question</p>
                  <p className="text-lg font-semibold text-slate-900 leading-tight">
                    {hardestQuestionId
                      ? `Q${questions.findIndex((q) => q.id === hardestQuestionId) + 1}`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* ---------- Top performers ---------- */}
            {topPerformers.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Top Performers
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {topPerformers.map((p, i) => {
                    const rank = RANK_STYLES[i];
                    return (
                      <div
                        key={p.participantId}
                        className="flex items-center gap-2.5 bg-slate-50 rounded-lg pl-2 pr-3.5 py-2"
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rank.bg} ${rank.text}`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-800">
                          {showNames ? p.name : "Student"}
                        </span>
                        <span className="text-sm text-slate-400">
                          {scorePercent(p)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ---------- Display toggles ---------- */}
        <div className="flex items-center gap-5 mb-3 px-1">
          {[
            { label: "Names", value: showNames, set: setShowNames },
            { label: "Responses", value: showResponses, set: setShowResponses },
            { label: "Results", value: showResults, set: setShowResults },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => s.set(!s.value)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500"
            >
              <span
                className={`w-7 h-4 rounded-full transition relative ${s.value ? "bg-slate-900" : "bg-slate-200"}`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition ${
                    s.value ? "left-3.5" : "left-0.5"
                  }`}
                />
              </span>
              Show {s.label}
            </button>
          ))}
        </div>

        {/* ---------- Results table ---------- */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                <ListChecksIcon className="w-5 h-5 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-slate-600 font-medium text-sm">
                  Waiting for students to join
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Share room code{" "}
                  <span className="font-mono font-medium text-slate-500">
                    {roomCode}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInvite(true)}
                className="h-9 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition"
              >
                Invite Students
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th
                      onClick={() => toggleSort("name")}
                      className="text-left text-xs font-semibold text-slate-500 py-3 pl-5 pr-4 cursor-pointer select-none sticky left-0 bg-slate-50 whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1">
                        NAME
                        {sortKey === "name" &&
                          (sortDir === "asc" ? (
                            <ArrowUpIcon className="w-3 h-3" />
                          ) : (
                            <ArrowDownIcon className="w-3 h-3" />
                          ))}
                      </span>
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 py-3 pr-4 whitespace-nowrap">
                      PROGRESS
                    </th>
                    <th
                      onClick={() => toggleSort("score")}
                      className="text-left text-xs font-semibold text-slate-500 py-3 pr-4 cursor-pointer select-none whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1">
                        SCORE
                        {sortKey === "score" &&
                          (sortDir === "asc" ? (
                            <ArrowUpIcon className="w-3 h-3" />
                          ) : (
                            <ArrowDownIcon className="w-3 h-3" />
                          ))}
                      </span>
                    </th>
                    {questions.map((q, i) => (
                      <th
                        key={q.id}
                        className={`text-xs font-semibold py-3 px-3 min-w-[100px] whitespace-nowrap ${
                          q.id === hardestQuestionId
                            ? "text-orange-600"
                            : "text-slate-500"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {q.id === hardestQuestionId && (
                            <AlertTriangleIcon className="w-3 h-3" />
                          )}
                          Q{i + 1}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedParticipants.map((p, rowIdx) => (
                    <tr
                      key={p.participantId}
                      className={`border-b border-slate-100 last:border-b-0 ${
                        rowIdx % 2 === 1 ? "bg-slate-50/50" : "bg-white"
                      }`}
                    >
                      <td className="py-3 pl-5 pr-4 sticky left-0 bg-inherit">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 whitespace-nowrap">
                          {p.completed && (
                            <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                          {showNames ? p.name : "Student"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                p.completed ? "bg-emerald-400" : "bg-sky-400"
                              }`}
                              style={{
                                width: `${
                                  questions.length > 0
                                    ? (p.currentIndex / questions.length) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 shrink-0 tabular-nums">
                            {p.currentIndex}/{questions.length}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-600 font-medium tabular-nums">
                        {scorePercent(p)}%
                      </td>
                      {questions.map((q) => {
                        const ans = p.answers.find(
                          (a) => a.questionId === q.id,
                        );
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
                            {showResponses
                              ? ans.answer
                              : ans.isCorrect
                                ? "✓"
                                : "✗"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
                    <td className="py-3 pl-5 pr-4 text-slate-700 sticky left-0 bg-slate-50 whitespace-nowrap">
                      {participants.length} students
                    </td>
                    <td className="py-3 pr-4" />
                    <td className="py-3 pr-4" />
                    {questions.map((q) => {
                      const pct = classTotalForQuestion(q.id);
                      return (
                        <td
                          key={q.id}
                          className="py-3 px-3 text-center text-slate-500"
                        >
                          {showResults && pct !== null ? `${pct}%` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-[70]">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                Invite Students
              </h2>
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6 text-center">
              <p className="text-slate-600 text-sm mb-4">
                Visit{" "}
                <span className="font-medium text-slate-900">
                  {FRONTEND_URL.replace("http://", "")}/join
                </span>{" "}
                and enter room name{" "}
                <span className="font-mono font-semibold text-slate-900">
                  {roomCode}
                </span>
              </p>
              <img
                src={qrSrc}
                alt="QR code to join"
                className="mx-auto rounded-lg border border-slate-100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveResults;
