import express from "express";
import {
  generateQuizPreview,
  createQuiz,
  getQuizById,
  getMyQuizzes,
  updateQuiz,
  deleteQuiz,
} from "../controllers/QuizControllers.js";

const router = express.Router();

router.post("/generate-preview", generateQuizPreview);
router.post("/", createQuiz);
router.get("/", getMyQuizzes);
router.get("/:id", getQuizById);
router.patch("/:id", updateQuiz);
router.delete("/:id", deleteQuiz);

export default router;