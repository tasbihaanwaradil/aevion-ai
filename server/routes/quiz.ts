import express from "express";
import { generateQuiz, getQuizById } from "../controllers/QuizControllers.js";

const router = express.Router();

router.post("/generate", generateQuiz);
router.get("/:id", getQuizById);

export default router;