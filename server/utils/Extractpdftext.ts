import { PDFParse } from "pdf-parse";

/**
 * Extracts plain text from a PDF buffer using pdf-parse v2's class-based
 * API (the package was rewritten — v1's `pdf(buffer).then(...)` function
 * call no longer exists; this version exports a PDFParse class instead).
 *
 * Returns an empty string (not a throw) if the PDF has no extractable
 * text layer — e.g. a scanned document with no OCR — so callers can give
 * a clear, specific error message rather than a confusing failure
 * downstream.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result?.text || "").trim();
  } finally {
    // Releases the underlying pdf.js worker/resources — the docs' own
    // examples call this in a finally block after getText().
    await parser.destroy();
  }
}