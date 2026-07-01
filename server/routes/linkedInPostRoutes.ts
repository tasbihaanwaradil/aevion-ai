// server/routes/linkedInPostRoutes.ts

import { Router } from "express";
import {
  generateLinkedInPost,
  approvePost,
  getPostHistory,
  publishToLinkedIn,
} from "../controllers/LinkedInPostControllers.js";
import linkedInAuthRoutes from "./linkedInAuthRoutes.js";
import protect from "../middlewares/auth.js";

const router = Router();

// LinkedIn OAuth routes — no auth middleware needed
// These handle the OAuth redirect so professor is not logged in yet at this point
router.use("/auth/linkedin", linkedInAuthRoutes);

// Protected post routes — require app session (your existing protect middleware)
router.post("/generate", protect, generateLinkedInPost);
router.patch("/:id/approve", protect, approvePost);
router.get("/history", protect, getPostHistory);
router.post("/publish", protect, publishToLinkedIn);

export default router;