import { Router, type Request, type Response } from "express";
import { sendContactEmail } from "../utils/Mailer.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact
router.post("/", async (req: Request, res: Response) => {
  // Strip line breaks so nothing can be injected into email headers
  const clean = (v: unknown) => String(v ?? "").replace(/[\r\n]+/g, " ").trim();

  const name = clean(req.body?.name);
  const email = clean(req.body?.email);
  const message = String(req.body?.message ?? "").trim();

  if (name.length < 2 || !EMAIL_RE.test(email) || message.length < 10) {
    return res.status(400).json({ error: "Invalid input." });
  }

  try {
    await sendContactEmail(name, email, message);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Contact email failed:", err);
    return res.status(500).json({ error: "Could not send message." });
  }
});

export default router;