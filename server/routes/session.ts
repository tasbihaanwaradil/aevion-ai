import express from "express";
import {
  createSession,
  getSessionById,
  getFinishedSessions,
  toggleSessionSharing,
  getPublicReport,
} from "../controllers/SessionControllers.js";

const router = express.Router();

router.post("/", createSession);
router.get("/", getFinishedSessions);
router.get("/public/:shareCode", getPublicReport);
router.get("/:id", getSessionById);
router.post("/:id/share", toggleSessionSharing);

export default router;
