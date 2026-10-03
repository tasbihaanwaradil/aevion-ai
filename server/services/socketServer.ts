import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import crypto from "crypto";
import Session from "../models/Session.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

type StudentQuestion = {
  id: string;
  type: "MCQ" | "TrueFalse" | "ShortAnswer";
  question: string;
  options: string[] | null;
};

type SessionQuestion = {
  id: string;
  type: "MCQ" | "TrueFalse" | "ShortAnswer";
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation?: string;
};

type ParticipantAnswer = {
  questionId: string;
  answer: string;
  isCorrect: boolean;
};

type SessionParticipant = {
  participantId: string;
  name: string;
  score: number;
  currentIndex: number;
  completed: boolean;
  answers: ParticipantAnswer[];
  completedAt?: Date;
};

let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer, sessionMiddleware?: any) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [FRONTEND_URL, "http://localhost:3000"],
      credentials: true,
    },
  });

  if (sessionMiddleware) {
    io.engine.use(sessionMiddleware);
  }

  const broadcastParticipants = (
    sessionId: string,
    session: InstanceType<typeof Session>,
  ) => {
    io.to(`session:${sessionId}`).emit("teacher:participant-update", {
      participants: session.participants.map((p: SessionParticipant) => ({
        participantId: p.participantId,
        name: p.name,
        score: p.score,
        currentIndex: p.currentIndex,
        completed: p.completed,
        answers: p.answers,
      })),
    });
  };

  io.on("connection", (socket: Socket) => {
    socket.on(
      "teacher:join-session",
      async ({ sessionId }: { sessionId: string }) => {
        const teacherId = (socket.request as any)?.session?.teacherId;

        if (!teacherId) {
          return socket.emit("teacher:join-error", {
            message: "Unauthorized teacher session.",
          });
        }

        const session = await Session.findById(sessionId);

        if (!session) {
          return socket.emit("teacher:join-error", {
            message: "Session not found.",
          });
        }

        if (String(session.teacherId) !== String(teacherId)) {
          return socket.emit("teacher:join-error", {
            message: "You are not authorized for this session.",
          });
        }

        socket.join(`session:${sessionId}`);
        socket.data.teacherId = String(teacherId);
        socket.data.sessionId = String(sessionId);
      },
    );

    // ----- Student joins a session by room code -----
    socket.on(
      "student:join-session",
      async ({ roomCode, name }: { roomCode: string; name: string }) => {
        try {
          if (socket.data.sessionId || socket.data.participantId) {
            return socket.emit("student:join-error", {
              message: "You are already in a live session.",
            });
          }

          // Read-only validation first — no mutation here yet.
          const existing = await Session.findOne({
            roomCode: roomCode.toUpperCase(),
          });

          if (!existing) {
            return socket.emit("student:join-error", {
              message: "Room not found.",
            });
          }
          if (existing.status === "finished") {
            return socket.emit("student:join-error", {
              message: "This activity has ended.",
            });
          }
          if (existing.status === "paused") {
            return socket.emit("student:join-error", {
              message: "This activity is paused.",
            });
          }
          if (existing.settings.requireNames && !name?.trim()) {
            return socket.emit("student:join-error", {
              message: "Please enter your name.",
            });
          }

          const participantId = crypto.randomUUID();
          const newParticipant = {
            participantId,
            name: name?.trim() || "Anonymous",
            answers: [],
            score: 0,
            currentIndex: 0,
            completed: false,
          };

          // Atomic: push this participant onto the array in a single Mongo
          // operation, so a concurrent join or answer-submit can never
          // overwrite it via a stale full-document save.
          const session = await Session.findOneAndUpdate(
            { _id: existing._id },
            {
              $push: { participants: newParticipant },
              ...(existing.status === "waiting"
                ? { $set: { status: "active" } }
                : {}),
            },
            { new: true },
          );

          if (!session) {
            return socket.emit("student:join-error", {
              message: "Room not found.",
            });
          }

          socket.join(`session:${session._id}`);
          socket.data.participantId = participantId;
          socket.data.sessionId = String(session._id);

          const sanitizedQuestions: StudentQuestion[] = session.questions.map(
            (q: SessionQuestion) => ({
              id: q.id,
              type: q.type,
              question: q.question,
              options: q.options,
            }),
          );

          socket.emit("student:joined", {
            sessionId: session._id,
            participantId,
            title: session.title,
            questions: sanitizedQuestions,
          });

          broadcastParticipants(String(session._id), session);
        } catch (err) {
          console.error(err);
          socket.emit("student:join-error", {
            message: "Something went wrong joining the room.",
          });
        }
      },
    );

    // ----- Student reconnects after a refresh/disconnect -----
    socket.on(
      "student:resume-session",
      async ({
        sessionId,
        participantId,
      }: {
        sessionId: string;
        participantId: string;
      }) => {
        try {
          const session = await Session.findById(sessionId);

          if (!session) {
            return socket.emit("student:resume-error", {
              message: "This session no longer exists.",
            });
          }
          if (session.status === "finished") {
            return socket.emit("student:resume-error", {
              message: "This activity has ended.",
            });
          }

          const participant = session.participants.find(
            (p: SessionParticipant) => p.participantId === participantId,
          );

          if (!participant) {
            return socket.emit("student:resume-error", {
              message: "Could not find your previous progress.",
            });
          }

          socket.join(`session:${session._id}`);
          socket.data.participantId = participantId;
          socket.data.sessionId = String(session._id);

          const sanitizedQuestions: StudentQuestion[] = session.questions.map(
            (q: SessionQuestion) => ({
              id: q.id,
              type: q.type,
              question: q.question,
              options: q.options,
            }),
          );

          socket.emit("student:resumed", {
            sessionId: session._id,
            participantId,
            title: session.title,
            questions: sanitizedQuestions,
            currentIndex: participant.currentIndex,
            completed: participant.completed,
            score:
              session.settings.showFinalScore && participant.completed
                ? participant.score
                : undefined,
            total: session.questions.length,
          });
        } catch (err) {
          console.error(err);
          socket.emit("student:resume-error", {
            message: "Something went wrong reconnecting.",
          });
        }
      },
    );

    // ----- Student submits an answer -----
    socket.on(
      "student:submit-answer",
      async ({
        sessionId,
        participantId,
        questionId,
        answer,
      }: {
        sessionId: string;
        participantId: string;
        questionId: string;
        answer: string;
      }) => {
        try {
          if (
            socket.data.sessionId &&
            socket.data.sessionId !== String(sessionId)
          ) {
            return socket.emit("student:answer-error", {
              message:
                "This socket is already attached to a different session.",
            });
          }
          if (
            socket.data.participantId &&
            socket.data.participantId !== participantId
          ) {
            return socket.emit("student:answer-error", {
              message:
                "This socket is already attached to a different participant.",
            });
          }

          // Read-only lookups to figure out what SHOULD happen — the actual
          // write below is atomic and re-validates via the query filter, so
          // even if this read is slightly stale the write can't corrupt data.
          const snapshot = await Session.findById(sessionId);
          if (!snapshot) return;

          if (snapshot.status === "paused") {
            return socket.emit("student:answer-error", {
              message: "The activity is paused.",
            });
          }

          const participant = snapshot.participants.find(
            (p: SessionParticipant) => p.participantId === participantId,
          );
          if (!participant) return;

          if (participant.completed) {
            return socket.emit("student:answer-error", {
              message: "You have already completed this activity.",
            });
          }

          const expectedQuestion = snapshot.questions[participant.currentIndex];

          if (!expectedQuestion) {
            // Already past the last question — force-complete atomically,
            // only if not already marked complete, and don't touch answers.
            await Session.findOneAndUpdate(
              {
                _id: sessionId,
                "participants.participantId": participantId,
                "participants.completed": false,
              },
              {
                $set: {
                  "participants.$.completed": true,
                  "participants.$.completedAt": new Date(),
                },
              },
            );
            return socket.emit("student:answer-error", {
              message: "This activity is already complete.",
            });
          }

          if (expectedQuestion.id !== questionId) {
            return socket.emit("student:answer-error", {
              message: "This is not the active question.",
            });
          }

          const question = snapshot.questions.find(
            (q: SessionQuestion) => q.id === questionId,
          );
          if (!question) return;

          const isCorrect =
            answer.trim().toLowerCase() ===
            question.correctAnswer.trim().toLowerCase();

          const willComplete =
            participant.currentIndex + 1 >= snapshot.questions.length;

          // Atomic, targeted update: only touches THIS participant's
          // subdocument, and only applies if their currentIndex still
          // matches what we expect — guarding against a concurrent
          // duplicate submission racing in at the same time.
          const updated = await Session.findOneAndUpdate(
            {
              _id: sessionId,
              "participants.participantId": participantId,
              "participants.currentIndex": participant.currentIndex,
            },
            {
              $push: {
                "participants.$.answers": { questionId, answer, isCorrect },
              },
              $inc: {
                "participants.$.score": isCorrect ? 1 : 0,
                "participants.$.currentIndex": 1,
              },
              ...(willComplete
                ? {
                    $set: {
                      "participants.$.completed": true,
                      "participants.$.completedAt": new Date(),
                    },
                  }
                : {}),
            },
            { new: true },
          );

          if (!updated) {
            // Someone else's concurrent write already advanced this
            // participant past the state we expected — treat as a
            // duplicate submission rather than silently losing data.
            return socket.emit("student:answer-error", {
              message: "You have already answered this question.",
            });
          }

          const updatedParticipant = updated.participants.find(
            (p: SessionParticipant) => p.participantId === participantId,
          );

          socket.emit("student:answer-result", {
            isCorrect,
            showFeedback: updated.settings.showQuestionFeedback,
            correctAnswer: updated.settings.showQuestionFeedback
              ? question.correctAnswer
              : undefined,
            explanation: updated.settings.showQuestionFeedback
              ? question.explanation
              : undefined,
            completed: updatedParticipant?.completed ?? willComplete,
            score:
              updated.settings.showFinalScore &&
              (updatedParticipant?.completed ?? willComplete)
                ? updatedParticipant?.score
                : undefined,
            total: updated.questions.length,
          });

          broadcastParticipants(sessionId, updated);
        } catch (err) {
          console.error(err);
        }
      },
    );

    socket.on(
      "teacher:pause-session",
      async ({ sessionId }: { sessionId: string }) => {
        const teacherId = (socket.request as any)?.session?.teacherId;
        const session = await Session.findById(sessionId);

        if (
          !teacherId ||
          !session ||
          String(session.teacherId) !== String(teacherId)
        ) {
          return socket.emit("teacher:join-error", {
            message: "You are not authorized to pause this session.",
          });
        }

        await Session.findByIdAndUpdate(sessionId, { status: "paused" });
        io.to(`session:${sessionId}`).emit("session:status-changed", {
          status: "paused",
        });
      },
    );

    socket.on(
      "teacher:resume-session",
      async ({ sessionId }: { sessionId: string }) => {
        const teacherId = (socket.request as any)?.session?.teacherId;
        const session = await Session.findById(sessionId);

        if (
          !teacherId ||
          !session ||
          String(session.teacherId) !== String(teacherId)
        ) {
          return socket.emit("teacher:join-error", {
            message: "You are not authorized to resume this session.",
          });
        }

        await Session.findByIdAndUpdate(sessionId, { status: "active" });
        io.to(`session:${sessionId}`).emit("session:status-changed", {
          status: "active",
        });
      },
    );

    socket.on(
      "teacher:finish-session",
      async ({ sessionId }: { sessionId: string }) => {
        const teacherId = (socket.request as any)?.session?.teacherId;
        const session = await Session.findById(sessionId);

        if (
          !teacherId ||
          !session ||
          String(session.teacherId) !== String(teacherId)
        ) {
          return socket.emit("teacher:join-error", {
            message: "You are not authorized to finish this session.",
          });
        }

        await Session.findByIdAndUpdate(sessionId, { status: "finished" });
        io.to(`session:${sessionId}`).emit("session:status-changed", {
          status: "finished",
        });
      },
    );

    // ----- Disconnect: never delete participant data. -----
    // A dropped socket (reload, backgrounded tab, brief network loss) does
    // NOT mean the student is done or should lose their progress. Their
    // answers and score stay in the session regardless of connection state.
    socket.on("disconnect", () => {
      // Intentionally does nothing to session.participants. Socket.io
      // rooms are cleaned up automatically on disconnect; no DB write needed.
    });
  });

  return io;
};
