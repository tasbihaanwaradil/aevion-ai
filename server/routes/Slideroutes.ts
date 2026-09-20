import { Router } from "express";
import { protectTeacher } from "../middlewares/protectTeacher.js"; // reuses the same session guard as the Reminder feature
import { generateSlides, downloadDeck, getSlideHistory } from "../controllers/Slidecontroller.js";

const router = Router();

router.use(protectTeacher);

router.post("/generate", generateSlides);
router.post("/download", downloadDeck);
router.get("/history", getSlideHistory);

export default router;