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

let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer, sessionMiddleware?: any) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [FRONTEND_URL, "http://localhost:3000"],
      credentials: true,
    },
  });

  if (sessionMiddleware) {
    io.use((socket, next) => {
      sessionMiddleware(socket.request, {}, next);
    });
  }

  const broadcastParticipants = (
    sessionId: string,
    session: InstanceType<typeof Session>,
  ) => {
    io.to(`session:${sessionId}`).emit("teacher:participant-update", {
      participants: session.participants.map((p) => ({
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

    socket.on(
      "student:join-session",
      async ({ roomCode, name }: { roomCode: string; name: string }) => {
        try {
          if (socket.data.sessionId || socket.data.participantId) {
            return socket.emit("student:join-error", {
              message: "You are already in a live session.",
            });
          }

          const session = await Session.findOne({
            roomCode: roomCode.toUpperCase(),
          });

          if (!session) {
            return socket.emit("student:join-error", {
              message: "Room not found.",
            });
          }
          if (session.status === "finished") {
            return socket.emit("student:join-error", {
              message: "This activity has ended.",
            });
          }
          if (session.status === "paused") {
            return socket.emit("student:join-error", {
              message: "This activity is paused.",
            });
          }
          if (session.settings.requireNames && !name?.trim()) {
            return socket.emit("student:join-error", {
              message: "Please enter your name.",
            });
          }

          const participantId = crypto.randomUUID();
          session.participants.push({
            participantId,
            name: name?.trim() || "Anonymous",
            answers: [],
            score: 0,
            currentIndex: 0,
            completed: false,
          });

          if (session.status === "waiting") {
            session.status = "active";
          }

          await session.save();

          socket.join(`session:${session._id}`);
          socket.data.participantId = participantId;
          socket.data.sessionId = String(session._id);

          const sanitizedQuestions: StudentQuestion[] = session.questions.map(
            ({ id, type, question, options }) => ({
              id,
              type,
              question,
              options,
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
          const session = await Session.findById(sessionId);
          if (!session) return;

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

          if (session.status === "paused") {
            return socket.emit("student:answer-error", {
              message: "The activity is paused.",
            });
          }

          const participant = session.participants.find(
            (p) => p.participantId === participantId,
          );
          if (!participant) return;

          if (participant.completed) {
            return socket.emit("student:answer-error", {
              message: "You have already completed this activity.",
            });
          }

          const expectedQuestion = session.questions[participant.currentIndex];
          if (!expectedQuestion) {
            participant.completed = true;
            participant.completedAt = new Date();
            await session.save();
            return socket.emit("student:answer-error", {
              message: "This activity is already complete.",
            });
          }

          if (expectedQuestion.id !== questionId) {
            return socket.emit("student:answer-error", {
              message: "This is not the active question.",
            });
          }

          const hasAlreadyAnswered = participant.answers.some(
            (entry) => entry.questionId === questionId,
          );
          if (hasAlreadyAnswered) {
            return socket.emit("student:answer-error", {
              message: "You have already answered this question.",
            });
          }

          const question = session.questions.find((q) => q.id === questionId);
          if (!question) return;

          const isCorrect =
            answer.trim().toLowerCase() ===
            question.correctAnswer.trim().toLowerCase();

          participant.answers.push({ questionId, answer, isCorrect });
          if (isCorrect) participant.score += 1;
          participant.currentIndex += 1;
          if (participant.currentIndex >= session.questions.length) {
            participant.completed = true;
            participant.completedAt = new Date();
          }

          await session.save();

          socket.emit("student:answer-result", {
            isCorrect,
            showFeedback: session.settings.showQuestionFeedback,
            correctAnswer: session.settings.showQuestionFeedback
              ? question.correctAnswer
              : undefined,
            explanation: session.settings.showQuestionFeedback
              ? question.explanation
              : undefined,
            completed: participant.completed,
            score:
              session.settings.showFinalScore && participant.completed
                ? participant.score
                : undefined,
            total: session.questions.length,
          });

          broadcastParticipants(sessionId, session);
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

    socket.on("disconnect", async () => {
      const sessionId = socket.data.sessionId as string | undefined;
      const participantId = socket.data.participantId as string | undefined;

      if (!sessionId || !participantId) return;

      const session = await Session.findById(sessionId);
      if (!session) return;

      session.participants = session.participants.filter(
        (participant) => participant.participantId !== participantId,
      );

      if (session.participants.length === 0 && session.status !== "finished") {
        session.status = "waiting";
      }

      await session.save();
      broadcastParticipants(String(sessionId), session);
    });
  });

  return io;
};
