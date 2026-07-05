import fs from "fs";
import { createRequire } from "module";

// pdf-parse and officeparser are CommonJS-only packages.
// Node's native ESM loader can't cleanly interop their exports,
// so we pull them in via createRequire instead of `import ... from`.
//
// Some versions of these packages wrap the real export under `.default`
// (a "dual package hazard") depending on how their package.json `exports`
// field is set up. We defensively unwrap that here so this keeps working
// regardless of which shape the installed version uses.
const require = createRequire(import.meta.url);

const pdfParseModule = require("pdf-parse");
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> =
  typeof pdfParseModule === "function"
    ? pdfParseModule
    : pdfParseModule.default;

const officeParserModule = require("officeparser");
const officeParser =
  typeof officeParserModule.parseOfficeAsync === "function"
    ? officeParserModule
    : officeParserModule.default;

export const extractTextFromFile = async (
  filePath: string,
  mimeType: string
): Promise<string> => {
  if (mimeType === "application/pdf") {
    if (typeof pdfParse !== "function") {
      throw new Error(
        "pdf-parse did not load as expected. Check the installed version's export shape."
      );
    }
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    const text = await officeParser.parseOfficeAsync(filePath);
    return text as unknown as string;
  }

  throw new Error("Unsupported file type. Only PDF and PPTX are supported.");
};