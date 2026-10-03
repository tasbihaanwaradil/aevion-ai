import express from "express";
import {
  generateQuizPreview,
  generateQuizPreviewFromDocument,
  createQuiz,
  getQuizById,
  getMyQuizzes,
  updateQuiz,
  deleteQuiz,
  toggleQuizSharing,
  duplicateQuiz,
  exportQuizPdf,
} from "../controllers/QuizControllers.js";
import { uploadDocument } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/generate-preview", generateQuizPreview);

// Wrapped manually so multer's file-type/size errors return clean JSON
// instead of Express's default HTML error page.
router.post(
  "/generate-preview-document",
  (req, res, next) => {
    uploadDocument(req, res, (err: any) => {
      if (err) {
        return res
          .status(400)
          .json({ message: err.message || "Upload failed." });
      }
      next();
    });
  },
  generateQuizPreviewFromDocument,
);

router.post("/", createQuiz);
router.get("/", getMyQuizzes);
router.get("/:id", getQuizById);
router.patch("/:id", updateQuiz);
router.delete("/:id", deleteQuiz);
router.post("/:id/share", toggleQuizSharing);
router.post("/:id/duplicate", duplicateQuiz);
router.get("/:id/export-pdf", exportQuizPdf);

export default router;
