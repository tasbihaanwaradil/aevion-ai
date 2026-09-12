import express from "express";
import {
  createSession,
  getSessionById,
} from "../controllers/SessionControllers.js";

const router = express.Router();

router.post("/", createSession);
router.get("/:id", getSessionById);

export default router;
