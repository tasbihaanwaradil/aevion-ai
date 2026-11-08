import { Router } from "express";
import {
  generateEmail,
  suggestContent,
  sendGeneratedEmail,
  getEmailHistory,
} from "../controllers/AcademicEmailController.js";
import { protectTeacher } from "../middlewares/auth.js";

import scheduleRouter from "./academic-email-schedule.routes.js";
import bulkRouter from "./academicEmailBulkRoute.js";

const router = Router();

router.post("/generate", protectTeacher, generateEmail);
router.post("/suggest", protectTeacher, suggestContent);
router.post("/send", protectTeacher, sendGeneratedEmail);
router.get("/history", protectTeacher, getEmailHistory);

router.use(protectTeacher, scheduleRouter);
router.use(protectTeacher, bulkRouter);

export default router;