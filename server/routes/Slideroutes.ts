import { Router } from "express";
import multer from "multer";
import { protectTeacher } from "../middlewares/protectTeacher.js"; // reuses the same session guard as the Reminder feature
import {
  generateSlides,
  generateSlidesFromPdf,
  downloadDeck,
  getSlideHistory,
} from "../controllers/Slidecontroller.js";

const router = Router();

// Memory storage — the PDF only needs to exist long enough to extract
// text; it's never written to disk or persisted itself.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

router.use(protectTeacher);

router.post("/generate", generateSlides);
router.post("/from-pdf", upload.single("pdf"), generateSlidesFromPdf);
router.post("/download", downloadDeck);
router.get("/history", getSlideHistory);

export default router;