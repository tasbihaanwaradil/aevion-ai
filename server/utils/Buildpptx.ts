import PptxGenJSImport from "pptxgenjs";

// pptxgenjs's type declarations don't line up cleanly with this project's
// ESM/NodeNext module resolution — depending on the resolver, the default
// import can come through as the actual class or as the module's
// namespace object with the class hanging off `.default`. Resolving
// through `any` here sidesteps that mismatch entirely; the methods used
// below (defineLayout/addSlide/write/etc.) match the library's real
// runtime API either way.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PptxGenJS: any = (PptxGenJSImport as any).default ?? PptxGenJSImport;

export interface BulletInput {
  point: string;
  description: string;
}

export interface SlideInput {
  title: string;
  bullets: BulletInput[];
}

/**
 * Builds a .pptx file in memory from a deck title + edited slide content.
 * Stateless by design — takes exactly what the client currently has
 * displayed/edited, so there's no risk of exporting a stale server copy.
 */
export async function buildPptxBuffer(
  deckTitle: string,
  slides: SlideInput[]
): Promise<Buffer> {
  const pptx = new PptxGenJS();

  pptx.defineLayout({ name: "AEVION_16x9", width: 10, height: 5.63 });
  pptx.layout = "AEVION_16x9";

  // Cover slide
  const cover = pptx.addSlide();
  cover.background = { color: "0A1238" };
  cover.addText(deckTitle || "Untitled Presentation", {
    x: 0.5,
    y: 2.1,
    w: 9,
    h: 1.4,
    fontSize: 34,
    bold: true,
    color: "FFFFFF",
    align: "center",
    fontFace: "Arial",
  });
  cover.addText("Generated with Aevion.AI", {
    x: 0.5,
    y: 3.6,
    w: 9,
    h: 0.5,
    fontSize: 14,
    color: "9AC4D1",
    align: "center",
    fontFace: "Arial",
  });

  // Content slides
  for (const slide of slides) {
    const s = pptx.addSlide();
    s.background = { color: "FFFFFF" };

    s.addText(slide.title || "Untitled slide", {
      x: 0.5,
      y: 0.4,
      w: 9,
      h: 0.9,
      fontSize: 26,
      bold: true,
      color: "2D5F6E",
      fontFace: "Arial",
    });

    if (slide.bullets.length > 0) {
      // Each bullet becomes two lines: a bold, bulleted heading (the
      // "point"), then an indented, smaller, non-bulleted line beneath
      // it carrying the actual explanatory content (the "description").
      const runs = slide.bullets.flatMap((bullet) => {
        const lines: {
          text: string;
          options: Record<string, unknown>;
        }[] = [];

        if (bullet.point) {
          lines.push({
            text: bullet.point,
            options: {
              bullet: { code: "2022" },
              bold: true,
              breakLine: true,
              fontSize: 18,
              color: "222222",
            },
          });
        }

        if (bullet.description) {
          lines.push({
            text: bullet.description,
            options: {
              bullet: false,
              indentLevel: 1,
              breakLine: true,
              fontSize: 14,
              color: "5A5A5A",
              italic: true,
            },
          });
        }

        return lines;
      });

      s.addText(runs, {
        x: 0.7,
        y: 1.5,
        w: 8.6,
        h: 3.7,
        fontFace: "Arial",
        valign: "top",
        lineSpacingMultiple: 1.25,
        paraSpaceAfter: 8,
      });
    }
  }

  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return buffer;
}