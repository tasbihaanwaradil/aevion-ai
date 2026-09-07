"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PauseIcon,
  PlayIcon,
  CheckSquareIcon,
  UsersIcon,
  XIcon,
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

  const inviteLink = `${FRONTEND_URL}/join?room=${roomCode}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(inviteLink)}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <TeacherNavbar />
        <p className="pt-28 text-center text-gray-500">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TeacherNavbar />

      <div className="pt-24 px-6 md:px-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePause}
              disabled={status === "finished"}
              className="flex items-center gap-2 h-10 px-4 rounded-lg bg-sky-50 text-[#007a8c] text-sm font-semibold hover:bg-sky-100 transition disabled:opacity-50"
            >
              {status === "paused" ? (
                <PlayIcon className="w-4 h-4" />
              ) : (
                <PauseIcon className="w-4 h-4" />
              )}
              {status === "paused" ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={status === "finished"}
              className="flex items-center gap-2 h-10 px-4 rounded-lg bg-sky-50 text-[#007a8c] text-sm font-semibold hover:bg-sky-100 transition disabled:opacity-50"
            >
              <CheckSquareIcon className="w-4 h-4" />
              Finish Activity
            </button>
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#007a8c] text-white text-sm font-semibold hover:bg-[#005f6a] transition"
            >
              <UsersIcon className="w-4 h-4" />
              Invite Students
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 mb-6">
          {[
            { label: "Show Names", value: showNames, set: setShowNames },
            {
              label: "Show Responses",
              value: showResponses,
              set: setShowResponses,
            },
            { label: "Show Results", value: showResults, set: setShowResults },
          ].map((s) => (
            <label
              key={s.label}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <button
                type="button"
                onClick={() => s.set(!s.value)}
                className={`w-9 h-5 rounded-full transition relative ${s.value ? "bg-green-500" : "bg-gray-300"}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${
                    s.value ? "left-4" : "left-0.5"
                  }`}
                />
              </button>
              {s.label}
            </label>
          ))}
        </div>

        {participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-gray-600">
              Waiting for Students to Join {roomCode}
            </p>
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="h-11 px-6 rounded-lg bg-[#007a8c] text-white font-semibold hover:bg-[#005f6a] transition"
            >
              Invite Students
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs font-bold text-[#007a8c] py-2 pr-4">
                    NAME
                  </th>
                  <th className="text-left text-xs font-bold text-[#007a8c] py-2 pr-4">
                    SCORE %
                  </th>
                  {questions.map((q, i) => (
                    <th
                      key={q.id}
                      className="text-xs font-bold text-gray-500 py-2 px-2 min-w-[90px]"
                    >
                      Q{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr
                    key={p.participantId}
                    className="border-t border-gray-100"
                  >
                    <td className="py-2 pr-4 text-sm font-medium text-gray-800">
                      {showNames ? p.name : "Student"}
                    </td>
                    <td className="py-2 pr-4 text-sm text-gray-600">
                      {scorePercent(p)}%
                    </td>
                    {questions.map((q) => {
                      const ans = p.answers.find((a) => a.questionId === q.id);
                      if (!ans)
                        return (
                          <td
                            key={q.id}
                            className="py-2 px-2 bg-gray-50 text-center text-gray-300"
                          >
                            –
                          </td>
                        );
                      return (
                        <td
                          key={q.id}
                          className={`py-2 px-2 text-center text-sm font-medium ${
                            ans.isCorrect
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
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
                <tr className="border-t-2 border-gray-200 font-semibold">
                  <td className="py-2 pr-4 text-sm text-gray-800">
                    {participants.length} Class Total
                  </td>
                  <td className="py-2 pr-4" />
                  {questions.map((q) => {
                    const pct = classTotalForQuestion(q.id);
                    return (
                      <td
                        key={q.id}
                        className="py-2 px-2 text-center text-sm bg-gray-50 text-gray-600"
                      >
                        {showResults && pct !== null ? `${pct}%` : "–"}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-[70]">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-lg font-bold text-gray-800">
                Invite Students
              </h2>
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-6 text-center">
              <p className="text-gray-700 mb-4">
                Visit{" "}
                <span className="font-bold">
                  {FRONTEND_URL.replace("http://", "")}/join
                </span>{" "}
                and enter room name{" "}
                <span className="font-bold">{roomCode}</span>
              </p>
              <img
                src={qrSrc}
                alt="QR code to join"
                className="mx-auto rounded-lg border border-gray-100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveResults;
