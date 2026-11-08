import { Router, type Request, type Response } from "express";
import Contact from "../models/Contact.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact
router.post("/", async (req: Request, res: Response) => {
  const clean = (v: unknown) => String(v ?? "").replace(/[\r\n]+/g, " ").trim();

  const name = clean(req.body?.name);
  const email = clean(req.body?.email);
  const message = String(req.body?.message ?? "").trim();

  if (
    name.length < 2 ||
    name.length > 100 ||
    !EMAIL_RE.test(email) ||
    email.length > 254 ||
    message.length < 10 ||
    message.length > 5000
  ) {
    return res.status(400).json({ error: "Invalid input." });
  }

  try {
    await Contact.create({ name, email, message });
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Contact save failed:", err);
    return res.status(500).json({ error: "Could not send message." });
  }
});

export default router;