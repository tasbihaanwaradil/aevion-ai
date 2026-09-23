"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import toast from "react-hot-toast";
import MainLayout from "../components/MainLayout";
import { BASE_URL } from "../configs/Config";
import {
  FileUpIcon,
  SparklesIcon,
  PlusIcon,
  Trash2Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  DownloadIcon,
  FileTextIcon,
  XIcon,
} from "lucide-react";

const API_BASE = `${BASE_URL}/api/slides`;
const MAX_FILE_MB = 15;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Tone = "Conversational" | "Formal" | "Academic" | "Simple";

interface Bullet {
  point: string;
  description: string;
}

interface Slide {
  title: string;
  bullets: Bullet[];
}

interface GenerateResponse {
  success: boolean;
  deckId?: string;
  deckTitle?: string;
  slides?: Slide[];
  message?: string;
}

const TONES: Tone[] = ["Conversational", "Formal", "Academic", "Simple"];

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

const PdfToSlideGenerator: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [slideCount, setSlideCount] = useState(8);
  const [tone, setTone] = useState<Tone>("Conversational");

  const [deckId, setDeckId] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState("");
  const [slides, setSlides] = useState<Slide[]>([]);

  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  // ── Entrance animation ───────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (headerRef.current) {
        tl.fromTo(
          headerRef.current.children,
          { opacity: 0, y: -16 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
        );
      }
      if (formRef.current) {
        tl.fromTo(
          formRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.25",
        );
      }
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!deckRef.current || slides.length === 0) return;
    const ctx = gsap.context(() => {
      const cards = deckRef.current!.querySelectorAll(".slide-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 28, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          stagger: 0.07,
          ease: "power3.out",
        },
      );
    });
    return () => ctx.revert();
  }, [slides.length > 0]);

  const handleCardHover = (
    e: React.MouseEvent<HTMLDivElement>,
    entering: boolean,
  ) => {
    gsap.to(e.currentTarget, {
      y: entering ? -3 : 0,
      boxShadow: entering
        ? "0 14px 26px -8px rgba(0,0,0,0.18)"
        : "0 2px 6px -1px rgba(0,0,0,0.06)",
      duration: 0.22,
      ease: "power2.out",
    });
  };

  // ── File selection ───────────────────────────────────────────────────
  const validateAndSetFile = (f: File | null) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("Only PDF files are supported.");
      return;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`That file is over ${MAX_FILE_MB}MB — try a smaller PDF.`);
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    validateAndSetFile(e.dataTransfer.files?.[0] ?? null);
  };

  // ── Generate ─────────────────────────────────────────────────────────
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Upload a PDF first.");
      return;
    }

    setGenerating(true);
    setDeckId(null);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("slideCount", String(slideCount));
      formData.append("tone", tone);

      const res = await fetch(`${API_BASE}/from-pdf`, {
        method: "POST",
        credentials: "include",
        body: formData, // no Content-Type header — the browser sets the multipart boundary
      });
      const data: GenerateResponse = await res.json();

      if (data.success && data.slides) {
        setDeckId(data.deckId ?? null);
        setDeckTitle(data.deckTitle ?? file.name.replace(/\.pdf$/i, ""));
        setSlides(data.slides);
        toast.success(
          `Drafted ${data.slides.length} slides from your PDF — review and edit below.`,
        );
      } else {
        toast.error(data.message ?? "Couldn't generate the deck. Try again.");
      }
    } catch {
      toast.error("Couldn't reach the server. Check your connection.");
    } finally {
      setGenerating(false);
    }
  };

  // ── Slide editing (identical to the Slide Generator) ────────────────
  const updateSlideTitle = (index: number, value: string) => {
    setSlides((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], title: value };
      return next;
    });
  };

  const updateBullet = (
    slideIndex: number,
    bulletIndex: number,
    field: keyof Bullet,
    value: string,
  ) => {
    setSlides((prev) => {
      const next = [...prev];
      const bullets = [...next[slideIndex].bullets];
      bullets[bulletIndex] = { ...bullets[bulletIndex], [field]: value };
      next[slideIndex] = { ...next[slideIndex], bullets };
      return next;
    });
  };

  const addBullet = (slideIndex: number) => {
    setSlides((prev) => {
      const next = [...prev];
      next[slideIndex] = {
        ...next[slideIndex],
        bullets: [...next[slideIndex].bullets, { point: "", description: "" }],
      };
      return next;
    });
  };

  const removeBullet = (slideIndex: number, bulletIndex: number) => {
    setSlides((prev) => {
      const next = [...prev];
      next[slideIndex] = {
        ...next[slideIndex],
        bullets: next[slideIndex].bullets.filter((_, i) => i !== bulletIndex),
      };
      return next;
    });
  };

  const addSlide = () => {
    setSlides((prev) => [
      ...prev,
      { title: "New slide", bullets: [{ point: "", description: "" }] },
    ]);
  };

  const removeSlide = (index: number) => {
    setSlides((prev) => prev.filter((_, i) => i !== index));
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    setSlides((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  // ── Download ─────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (slides.length === 0) {
      toast.error("Generate a deck before downloading.");
      return;
    }
    const emptyTitle = slides.find((s) => !s.title.trim());
    if (emptyTitle) {
      toast.error("Every slide needs a title before exporting.");
      return;
    }

    setDownloading(true);
    try {
      // deckId is included so the server can link this download back to
      // the saved history record and mark it as downloaded — the same
      // record created by /from-pdf when the deck was first generated.
      const payload = {
        deckId,
        deckTitle: deckTitle || "Presentation",
        slides: slides.map((s) => ({
          title: s.title.trim(),
          bullets: s.bullets
            .map((b) => ({
              point: b.point.trim(),
              description: b.description.trim(),
            }))
            .filter((b) => b.point || b.description),
        })),
      };

      const res = await fetch(`${API_BASE}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message ?? "Couldn't build the presentation file.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(deckTitle || "presentation").replace(/[^a-z0-9\-_ ]/gi, "_")}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Downloaded — open it in PowerPoint or Google Slides.");
    } catch {
      toast.error("Couldn't reach the server. Check your connection.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div
            ref={headerRef}
            className="flex flex-col items-center text-center gap-3 mb-8"
          >
            <h1 className="flex items-center justify-center gap-2.5 text-3xl font-bold text-white">
              <FileUpIcon className="w-7 h-7 text-cyan-300" />
              PDF Lesson Studio
            </h1>
            <p className="text-gray-300 max-w-xl">
              Upload lecture notes or a research PDF and turn it directly into a
              structured, editable slide deck.
            </p>
          </div>

          {/* Generation form */}
          <form
            ref={formRef}
            onSubmit={handleGenerate}
            className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 mb-8"
          >
            {/* Drop zone */}
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              PDF document <span className="text-red-400">*</span>
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                dragActive
                  ? "border-[#2d5f6e] bg-[#2d5f6e]/5"
                  : "border-gray-300 hover:border-gray-400 bg-gray-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) =>
                  validateAndSetFile(e.target.files?.[0] ?? null)
                }
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileTextIcon className="w-6 h-6 text-cyan-600 shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    aria-label="Remove file"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <FileUpIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-[#2d5f6e]">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF only, up to {MAX_FILE_MB}MB — must have selectable text
                    (not a scanned image)
                  </p>
                </>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-5 mt-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Number of slides
                </label>
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={slideCount}
                  onChange={(e) =>
                    setSlideCount(
                      Math.min(20, Math.max(3, Number(e.target.value) || 3)),
                    )
                  }
                  className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] text-sm"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={generating || !file}
              className="mt-6 w-full h-12 rounded-xl bg-[#2d5f6e] text-white font-bold hover:bg-[#244d5a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Reading PDF and generating deck...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  {slides.length > 0
                    ? "Regenerate deck"
                    : "Generate deck from PDF"}
                </>
              )}
            </button>
          </form>

          {/* Editable deck — identical UI to the Slide Generator */}
          {slides.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
                <input
                  type="text"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  className="text-xl font-bold text-white bg-transparent border-b border-white/20 focus:border-white/60 outline-none px-1 py-1 flex-1 min-w-[200px]"
                  placeholder="Deck title"
                />

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-900/20 disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Building file...
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="w-4 h-4" />
                      Download PPTX
                    </>
                  )}
                </button>
              </div>

              <div ref={deckRef} className="flex flex-col gap-4">
                {slides.map((slide, sIndex) => (
                  <div
                    key={sIndex}
                    onMouseEnter={(e) => handleCardHover(e, true)}
                    onMouseLeave={(e) => handleCardHover(e, false)}
                    className="slide-card bg-white rounded-2xl p-5 shadow-sm will-change-transform"
                  >
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 mt-2 w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center">
                        {sIndex + 1}
                      </span>

                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) =>
                            updateSlideTitle(sIndex, e.target.value)
                          }
                          placeholder="Slide title"
                          className="w-full text-lg font-semibold text-gray-900 outline-none border-b border-transparent focus:border-gray-200 pb-1"
                        />

                        <div className="mt-3 flex flex-col gap-3">
                          {slide.bullets.map((bullet, bIndex) => (
                            <div
                              key={bIndex}
                              className="flex gap-2 items-start bg-gray-50 rounded-lg p-3"
                            >
                              <span className="text-gray-300 mt-2">•</span>
                              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                <input
                                  type="text"
                                  value={bullet.point}
                                  onChange={(e) =>
                                    updateBullet(
                                      sIndex,
                                      bIndex,
                                      "point",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Point (short heading)"
                                  className="w-full h-9 px-2 text-sm font-semibold text-gray-800 bg-white rounded-lg outline-none focus:ring-2 focus:ring-[#2d5f6e]"
                                />
                                <textarea
                                  value={bullet.description}
                                  onChange={(e) =>
                                    updateBullet(
                                      sIndex,
                                      bIndex,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Description — the fuller explanation for this point"
                                  rows={2}
                                  className="w-full px-2 py-1.5 text-sm text-gray-600 bg-white rounded-lg outline-none focus:ring-2 focus:ring-[#2d5f6e] resize-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeBullet(sIndex, bIndex)}
                                className="text-gray-300 hover:text-red-500 transition-colors p-1 mt-1"
                                aria-label="Remove bullet"
                              >
                                <Trash2Icon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addBullet(sIndex)}
                            className="self-start text-xs text-[#2d5f6e] hover:underline font-medium"
                          >
                            + Add bullet
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveSlide(sIndex, -1)}
                          disabled={sIndex === 0}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                          aria-label="Move slide up"
                        >
                          <ChevronUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSlide(sIndex, 1)}
                          disabled={sIndex === slides.length - 1}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                          aria-label="Move slide down"
                        >
                          <ChevronDownIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSlide(sIndex)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors mt-1"
                          aria-label="Delete slide"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-5">
                <button
                  type="button"
                  onClick={addSlide}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-dashed border-white/30 text-gray-300 hover:bg-white/10 transition-colors font-medium"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add slide
                </button>
              </div>
            </div>
          )}

          {slides.length === 0 && !generating && (
            <div className="bg-white/5 border border-white/10 rounded-2xl py-16 text-center">
              <FileUpIcon className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-300 font-medium">
                Upload a PDF above and generate your first draft.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PdfToSlideGenerator;
