// routes/linkedInPostRoutes.ts

import { Router } from "express";
import {
  generateLinkedInPost,
  approvePost,
  getPostHistory,
} from "../controllers/LinkedInPostControllers.js";

const router = Router();

router.post("/generate", generateLinkedInPost);
router.patch("/:id/approve", approvePost);
router.get("/history", getPostHistory);

export default router;