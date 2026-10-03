// routes/linkedInPostRoutes.ts

import { Router } from "express";
import {
  generateLinkedInPost,
  approvePost,
  getPostHistory,
} from "../controllers/LinkedInPostControllers.js";
import { protectTeacher } from "../middlewares/auth.js";

const router = Router();

router.post("/generate", protectTeacher, generateLinkedInPost);
router.patch("/:id/approve", protectTeacher, approvePost);
router.get("/history", protectTeacher, getPostHistory);

export default router;