import express from "express";
import multer from "multer";
import { generateQuiz, getQuizById } from "../controllers/QuizControllers.js";

const upload = multer({ dest: "uploads/", limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();

router.post("/generate", upload.single("file"), generateQuiz);
router.get("/:id", getQuizById);

export default router;