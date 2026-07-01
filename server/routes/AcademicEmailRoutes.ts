import { Router } from "express";
import {
  generateEmail,
  suggestContent,
  sendGeneratedEmail,
  getEmailHistory,
} from "../controllers/AcademicEmailController.js";

import scheduleRouter from "./academic-email-schedule.routes.js";
import bulkRouter from "./academicEmailBulkRoute.js";

const router = Router();

router.post("/generate", generateEmail);
router.post("/suggest", suggestContent);
router.post("/send", sendGeneratedEmail);
router.get("/history", getEmailHistory);

router.use(scheduleRouter);
router.use(bulkRouter);

export default router;