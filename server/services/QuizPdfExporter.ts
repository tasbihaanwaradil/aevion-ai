import PDFDocument from "pdfkit";
import path from "path";
import { IQuiz } from "../models/Quiz.js";

const LOGO_PATH = path.join(process.cwd(), "assets", "aevion-logo.png");

export const generateQuizPdf = (quiz: IQuiz): PDFKit.PDFDocument => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // Logo header
  try {
    doc.image(LOGO_PATH, 50, 40, { width: 160 });
  } catch {
    // Logo file missing on disk — skip it rather than crash the export.
  }

  doc.moveDown(5);

  // Name / Date / Score line
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#333333")
    .text(
      "Name: _____________________        Date: ____________        Score: _______",
      {
        align: "left",
      },
    );

  doc.moveDown(1.5);

  // Quiz title
  doc.fontSize(18).font("Helvetica-Bold").fillColor("#0A1238").text(quiz.title);

  doc.moveDown(1);

  // Questions
  doc.fontSize(11).fillColor("#111111");

  quiz.questions.forEach((q, index) => {
    doc.font("Helvetica-Bold").text(`${index + 1}. ${q.question}`);
    doc.font("Helvetica");

    if (q.type === "MCQ" && q.options) {
      const letters = ["A", "B", "C", "D"];
      q.options.forEach((opt, i) => {
        doc.text(`    ${letters[i]}   ${opt}`);
      });
    } else if (q.type === "TrueFalse") {
      doc.text("    T   True");
      doc.text("    F   False");
    } else {
      doc.text("    Answer: ___________________________________");
    }

    doc.moveDown(0.8);

    // Avoid awkward page breaks mid-question when close to the bottom
    if (doc.y > doc.page.height - 100 && index < quiz.questions.length - 1) {
      doc.addPage();
    }
  });

  doc.end();
  return doc;
};
