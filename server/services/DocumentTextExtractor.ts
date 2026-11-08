import { OfficeParser } from "officeparser";

const MAX_EXTRACTED_CHARS = 15000;

export const extractTextFromDocument = async (
  fileBuffer: Buffer,
  _originalFilename: string, // kept for signature compatibility with the controller; unused now
): Promise<string> => {
  // v7.x parses directly from a Buffer — no temp file needed. It auto-detects
  // the format from magic bytes rather than the filename/extension.
  const ast = await OfficeParser.parseOffice(fileBuffer);

  const rawText = ast.toText();
  const cleaned = rawText.replace(/\s+/g, " ").trim();

  if (!cleaned) {
    throw new Error("Could not extract any readable text from this file.");
  }

  return cleaned.length > MAX_EXTRACTED_CHARS
    ? cleaned.slice(0, MAX_EXTRACTED_CHARS)
    : cleaned;
};
