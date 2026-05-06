import { Router } from "express";
import {
  generateLinkedInPost,
  approveLinkedInPost,
  getLinkedInShareUrl,
  getPostHistory,
} from "../controllers/LinkedInPostControllers.js";
import protect from "../middlewares/auth.js"; // ✅ default import, renamed

const router = Router();

router.use(protect); // ✅ matches your export

router.post("/generate", generateLinkedInPost);
router.post("/:id/approve", approveLinkedInPost);
router.get("/share-url", getLinkedInShareUrl);
router.get("/history", getPostHistory);

export default router;