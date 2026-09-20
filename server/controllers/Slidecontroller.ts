import { Request, Response } from "express";
import Groq from "groq-sdk";
import { buildPptxBuffer, SlideInput } from "../utils/Buildpptx.js";
import { extractPdfText } from "../utils/Extractpdftext.js";
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

interface ParsedDeck {
  deckTitle?: string;
  slides?: GeneratedSlide[];
}

function extractJson(raw: string): ParsedDeck {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  if (!cleaned) {
    // Groq occasionally rejects generation server-side and returns an
    // empty completion rather than throwing — treat that the same as a
    // parse failure so it goes through the same retry path.
    throw new Error("Empty generation from model.");
  }
  return JSON.parse(cleaned);
}

// Session-based auth, matching the shape declared in SessionData
// (req.session.teacherId), rather than an attached req.teacher object.
function getTeacherId(req: Request): string | undefined {
  return req.session?.teacherId;
}

/**
 * Runs one deck-generation attempt (API call + JSON parse) and retries
 * once with `strict=true` if EITHER step fails — a malformed/empty
 * completion, or Groq's own server-side JSON validation rejecting the
 * request outright (BadRequestError / json_validate_failed), which
 * throws from the API call itself rather than surfacing as parseable
 * (if broken) text.
 */
async function generateDeckJson(
  buildPrompt: (strict: boolean) => string,
  maxTokens: number,
  logLabel: string,
): Promise<ParsedDeck> {
  async function attempt(strict: boolean): Promise<ParsedDeck> {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: buildPrompt(strict) }],
      temperature: 0.6,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    return extractJson(raw);
  }

  try {
    return await attempt(false);
  } catch (err) {
    console.warn(
      `${logLabel}: first attempt failed, retrying once.`,
      err instanceof Error ? err.message : err,
    );
    try {
      return await attempt(true);
    } catch (err2) {
      console.error(
        `${logLabel}: second attempt also failed.`,
        err2 instanceof Error ? err2.message : err2,
      );
      throw new Error("GENERATION_FAILED");
    }
  }
}

function finalizeSlides(slides: GeneratedSlide[]): SlideInput[] {
  return slides.map((s) => ({
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
}

// ── GENERATE ────────────────────────────────────────────────────────────
export async function generateSlides(req: Request, res: Response) {
  try {
    const { topic, outline, slideCount, tone } = req.body;

    if (!topic || !String(topic).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "A topic is required." });
    }

    const count = Math.min(Math.max(Number(slideCount) || 8, 3), 20);
    const chosenTone = tone || "Conversational";

    const maxTokens = Math.min(8000, 900 + count * 260);

    const buildPrompt = (
      strict: boolean,
    ) => `You create presentation slide decks for teachers.

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

    let parsed: ParsedDeck;
    try {
      parsed = await generateDeckJson(
        buildPrompt,
        maxTokens,
        "Slide generation",
      );
    } catch {
      return res.status(502).json({
        success: false,
        message:
          "The AI couldn't generate a valid deck. Try again, or request fewer slides.",
      });
    }

    if (
      !parsed ||
      !Array.isArray(parsed.slides) ||
      parsed.slides.length === 0
    ) {
      return res
        .status(502)
        .json({
          success: false,
          message: "No slides were generated. Please try again.",
        });
    }

    const finalSlides = finalizeSlides(parsed.slides);
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
          sourceType: "topic",
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
    return res
      .status(500)
      .json({ success: false, message: "Failed to generate slides." });
  }
}

// ── GENERATE FROM PDF ──────────────────────────────────────────────────
export async function generateSlidesFromPdf(req: Request, res: Response) {
  try {
    const teacherId = getTeacherId(req);
    if (!teacherId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated." });
    }

    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "A PDF file is required." });
    }
    if (file.mimetype !== "application/pdf") {
      return res
        .status(400)
        .json({ success: false, message: "Only PDF files are supported." });
    }

    const { slideCount, tone } = req.body;
    const count = Math.min(Math.max(Number(slideCount) || 8, 3), 20);
    const chosenTone = tone || "Conversational";

    let extractedText: string;
    try {
      extractedText = await extractPdfText(file.buffer);
    } catch (err) {
      console.error("PDF text extraction failed:", err);
      return res.status(422).json({
        success: false,
        message:
          "Couldn't read that PDF — it may be corrupted or password-protected.",
      });
    }

    if (!extractedText || extractedText.length < 40) {
      return res.status(422).json({
        success: false,
        message:
          "No readable text found in that PDF. Scanned documents without a text layer aren't supported yet.",
      });
    }

    const fileTitle = file.originalname
      .replace(/\.pdf$/i, "")
      .replace(/[_-]+/g, " ")
      .trim();
    const maxTokens = Math.min(8000, 900 + count * 260);

    // On the strict retry, the source material is trimmed further on top
    // of the brevity instruction — a common cause of Groq's own
    // json_validate_failed rejection is an overloaded prompt combined
    // with strict JSON-object mode, so shrinking both at once gives the
    // retry a meaningfully better chance rather than repeating the same
    // failure with only a wording tweak.
    const buildReferenceMaterial = (strict: boolean) => {
      const limit = strict ? 8000 : 15000;
      const truncated = extractedText.length > limit;
      return (
        extractedText.slice(0, limit) +
        (truncated ? "\n\n[Document truncated for length.]" : "")
      );
    };

    const buildPrompt = (
      strict: boolean,
    ) => `You create presentation slide decks for teachers.

TOPIC / SOURCE TITLE: ${fileTitle || "Uploaded document"}
SOURCE MATERIAL TO BASE THE DECK ON (extracted text from a PDF — condense and structure it, don't just repeat it verbatim):
${buildReferenceMaterial(strict)}

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
- "point" is a short heading phrase for the bullet (roughly 3-8 words).
- "description" is one or two full sentences explaining or elaborating on that point, drawn from the source material.
- Base the deck's structure and content on the source material, condensing and organizing it into a logical slide flow rather than repeating chunks of it verbatim.
- The first slide introduces the topic; the last slide summarizes or concludes.
${strict ? "- Keep descriptions to a single concise sentence each — brevity matters more than depth here, since the full response must fit in one reply.\n" : ""}- Return ONLY the JSON object — no markdown fences, no commentary, no text before or after it.`;

    let parsed: ParsedDeck;
    try {
      parsed = await generateDeckJson(
        buildPrompt,
        maxTokens,
        "PDF slide generation",
      );
    } catch {
      return res.status(502).json({
        success: false,
        message:
          "The AI couldn't generate a valid deck from this PDF. Try again, request fewer slides, or use a shorter document.",
      });
    }

    if (
      !parsed ||
      !Array.isArray(parsed.slides) ||
      parsed.slides.length === 0
    ) {
      return res
        .status(502)
        .json({
          success: false,
          message: "No slides were generated. Please try again.",
        });
    }

    const finalSlides = finalizeSlides(parsed.slides);
    const finalDeckTitle = parsed.deckTitle || fileTitle || file.originalname;

    let deckId: string | undefined;
    try {
      const doc = await SlideDeck.create({
        teacher: teacherId,
        topic: fileTitle || file.originalname,
        outline: "",
        tone: chosenTone,
        deckTitle: finalDeckTitle,
        slides: finalSlides,
        status: "draft",
        sourceType: "pdf",
        sourceFileName: file.originalname,
      });
      deckId = doc._id.toString();
    } catch (saveErr) {
      console.error("Failed to save PDF slide deck history:", saveErr);
    }

    return res.json({
      success: true,
      deckId,
      deckTitle: finalDeckTitle,
      slides: finalSlides,
    });
  } catch (err) {
    console.error("generateSlidesFromPdf error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to generate slides from the PDF.",
      });
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

    if (deckId) {
      const deck = await SlideDeck.findById(deckId);
      if (!deck) {
        return res
          .status(404)
          .json({ success: false, message: "Deck not found." });
      }

      const teacherId = getTeacherId(req);
      if (!teacherId || deck.teacher.toString() !== teacherId) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized for this deck." });
      }

      finalTitle = deckTitle || deck.deckTitle;
      finalSlides =
        slides && slides.length > 0
          ? slides
          : (deck.slides as unknown as SlideInput[]);
      if (deckTitle) deck.deckTitle = deckTitle;
      if (slides && slides.length > 0) deck.slides = slides as any;
      deck.status = "downloaded";
      await deck.save();
    }

    if (!Array.isArray(finalSlides) || finalSlides.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No slides to export." });
    }

    const badSlide = finalSlides.find((s) => !s.title || !s.title.trim());
    if (badSlide) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Every slide needs a title before exporting.",
        });
    }

    const buffer = await buildPptxBuffer(finalTitle, finalSlides);
    const safeName = (finalTitle || "presentation").replace(
      /[^a-z0-9\-_ ]/gi,
      "_",
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName}.pptx"`,
    );
    return res.send(buffer);
  } catch (err) {
    console.error("downloadDeck error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to build the presentation file.",
      });
  }
}

// ── HISTORY ─────────────────────────────────────────────────────────────
export async function getSlideHistory(req: Request, res: Response) {
  try {
    const teacherId = getTeacherId(req);
    if (!teacherId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated." });
    }

    const decks = await SlideDeck.find({ teacher: teacherId })
      .sort({ createdAt: -1 })
      .select(
        "deckTitle topic tone status sourceType sourceFileName slides createdAt",
      )
      .lean();

    return res.json({
      success: true,
      decks: decks.map((d: any) => ({
        _id: d._id,
        deckTitle: d.deckTitle,
        topic: d.topic,
        tone: d.tone,
        status: d.status,
        sourceType: d.sourceType,
        sourceFileName: d.sourceFileName,
        slideCount: d.slides?.length ?? 0,
        slideTitles: (d.slides ?? []).map((s: any) => s.title),
        createdAt: d.createdAt,
      })),
    });
  } catch (err) {
    console.error("getSlideHistory error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load slide history." });
  }
}
