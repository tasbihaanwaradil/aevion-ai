import { Router } from "express";
import {
  generateEmail,
  suggestContent,
  sendGeneratedEmail,
  getEmailHistory,
  sendBulkEmail, // <-- add this
} from "../controllers/AcademicEmailController.js";

import scheduleRouter from "./academic-email-schedule.routes.js";

const router = Router();

router.post("/generate", generateEmail);
router.post("/suggest", suggestContent);
router.post("/send", sendGeneratedEmail);
router.post("/send-bulk", sendBulkEmail); // <-- add this
router.get("/history", getEmailHistory);

router.use(scheduleRouter);

export default router;