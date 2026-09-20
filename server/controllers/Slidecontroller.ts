import { Request, Response } from "express";
import Groq from "groq-sdk";
import { buildPptxBuffer, SlideInput } from "../utils/Buildpptx.js";
import SlideDeck from "../models/SlideDeck.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface GeneratedBullet {
  point: string;
  description: string;
}

interface GeneratedSlide {
  title: string;
  bullets: GeneratedBullet[];
}

function extractJson(raw: string): { deckTitle?: string; slides?: GeneratedSlide[] } {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

// Session-based auth, matching the shape declared in SessionData
// (req.session.teacherId), rather than an attached req.teacher object.
function getTeacherId(req: Request): string | undefined {
  return req.session?.teacherId;
}

// ── GENERATE ────────────────────────────────────────────────────────────
export async function generateSlides(req: Request, res: Response) {
  try {
    const { topic, outline, slideCount, tone } = req.body;

    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ success: false, message: "A topic is required." });
    }

    const count = Math.min(Math.max(Number(slideCount) || 8, 3), 20);
    const chosenTone = tone || "Conversational";

    const maxTokens = Math.min(8000, 900 + count * 260);

    const buildPrompt = (strict: boolean) => `You create presentation slide decks for teachers.

TOPIC: ${topic}
${outline ? `ROUGH OUTLINE PROVIDED BY THE USER:\n${outline}\n` : ""}
Return a single JSON object with this exact shape and nothing else:
{
  "deckTitle": string,
  "slides": [
    {
      "title": string,
      "bullets": [
        { "point": string, "description": string }
      ]
    }
  ]
}

Requirements:
- Exactly ${count} slides in the "slides" array.
- Tone: ${chosenTone}.
- Each slide has between 2 and 4 bullets.
- "point" is a short heading phrase for the bullet (roughly 3-8 words) — this is what would normally be the whole bullet.
- "description" is one or two full sentences that explain, elaborate on, or give an example for that point — this is the content a presenter would actually say when covering that bullet.
- If a rough outline was provided, follow its structure and ordering where sensible, expanding sparse points into full point/description pairs.
- The first slide introduces the topic; the last slide summarizes or concludes.
${strict ? "- Keep descriptions to a single concise sentence each — brevity matters more than depth here, since the full response must fit in one reply.\n" : ""}- Return ONLY the JSON object — no markdown fences, no commentary, no text before or after it.`;

    async function requestDeck(strict: boolean) {
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: buildPrompt(strict) }],
        temperature: 0.6,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      });
      return completion.choices?.[0]?.message?.content ?? "";
    }

    let raw = await requestDeck(false);
    let parsed: { deckTitle?: string; slides?: GeneratedSlide[] } | undefined;

    try {
      parsed = extractJson(raw);
    } catch {
      // Most likely cause: the response got cut off before finishing.
      // Retry once with an explicit brevity instruction rather than
      // failing outright on the first hiccup.
      console.warn("Slide generation JSON parse failed, retrying once. Raw length:", raw.length);
      raw = await requestDeck(true);
      try {
        parsed = extractJson(raw);
      } catch {
        console.error("Slide generation returned unparseable output twice:", raw);
        return res.status(502).json({
          success: false,
          message: "The AI response couldn't be parsed. Try again, or request fewer slides.",
        });
      }
    }

    if (!parsed || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
      return res
        .status(502)
        .json({ success: false, message: "No slides were generated. Please try again." });
    }

    const finalSlides = parsed.slides.map((s) => ({
      title: s.title || "Untitled slide",
      bullets: Array.isArray(s.bullets)
        ? s.bullets
            .filter((b) => b && (b.point || b.description))
            .map((b) => ({
              point: b.point || "",
              description: b.description || "",
            }))
        : [],
    }));
    const finalDeckTitle = parsed.deckTitle || String(topic);

    // Persist as history — non-fatal if it fails, the user still gets their deck.
    let deckId: string | undefined;
    const teacherId = getTeacherId(req);
    if (teacherId) {
      try {
        const doc = await SlideDeck.create({
          teacher: teacherId,
          topic: String(topic),
          outline: outline ? String(outline) : "",
          tone: chosenTone,
          deckTitle: finalDeckTitle,
          slides: finalSlides,
          status: "draft",
        });
        deckId = doc._id.toString();
      } catch (saveErr) {
        console.error("Failed to save slide deck history:", saveErr);
      }
    }

    return res.json({
      success: true,
      deckId,
      deckTitle: finalDeckTitle,
      slides: finalSlides,
    });
  } catch (err) {
    console.error("generateSlides error:", err);
    return res.status(500).json({ success: false, message: "Failed to generate slides." });
  }
}

// ── DOWNLOAD ────────────────────────────────────────────────────────────
export async function downloadDeck(req: Request, res: Response) {
  try {
    const { deckId, deckTitle, slides } = req.body as {
      deckId?: string;
      deckTitle?: string;
      slides?: SlideInput[];
    };

    let finalTitle = deckTitle || "Presentation";
    let finalSlides: SlideInput[] | undefined = slides;

    // Downloading from history: load the saved deck, mark it downloaded.
    if (deckId) {
      const deck = await SlideDeck.findById(deckId);
      if (!deck) {
        return res.status(404).json({ success: false, message: "Deck not found." });
      }

      const teacherId = getTeacherId(req);
      if (!teacherId || deck.teacher.toString() !== teacherId) {
        return res.status(403).json({ success: false, message: "Not authorized for this deck." });
      }

      finalTitle = deckTitle || deck.deckTitle;
      finalSlides = slides && slides.length > 0 ? slides : (deck.slides as unknown as SlideInput[]);
      if (deckTitle) deck.deckTitle = deckTitle;
      if (slides && slides.length > 0) deck.slides = slides as any;
      deck.status = "downloaded";
      await deck.save();
    }

    if (!Array.isArray(finalSlides) || finalSlides.length === 0) {
      return res.status(400).json({ success: false, message: "No slides to export." });
    }

    const badSlide = finalSlides.find((s) => !s.title || !s.title.trim());
    if (badSlide) {
      return res
        .status(400)
        .json({ success: false, message: "Every slide needs a title before exporting." });
    }

    const buffer = await buildPptxBuffer(finalTitle, finalSlides);
    const safeName = (finalTitle || "presentation").replace(/[^a-z0-9\-_ ]/gi, "_");

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pptx"`);
    return res.send(buffer);
  } catch (err) {
    console.error("downloadDeck error:", err);
    return res.status(500).json({ success: false, message: "Failed to build the presentation file." });
  }
}

// ── HISTORY ─────────────────────────────────────────────────────────────
export async function getSlideHistory(req: Request, res: Response) {
  try {
    const teacherId = getTeacherId(req);
    if (!teacherId) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }

    const decks = await SlideDeck.find({ teacher: teacherId })
      .sort({ createdAt: -1 })
      .select("deckTitle topic tone status slides createdAt")
      .lean();

    return res.json({
      success: true,
      decks: decks.map((d: any) => ({
        _id: d._id,
        deckTitle: d.deckTitle,
        topic: d.topic,
        tone: d.tone,
        status: d.status,
        slideCount: d.slides?.length ?? 0,
        slideTitles: (d.slides ?? []).map((s: any) => s.title),
        createdAt: d.createdAt,
      })),
    });
  } catch (err) {
    console.error("getSlideHistory error:", err);
    return res.status(500).json({ success: false, message: "Failed to load slide history." });
  }
}