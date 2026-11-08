"use client";

import React, { useState } from "react";
import SideNavbar from "../components/SideNavbar";
import { BASE_URL } from "../configs/Config";
import {
  LinkedinIcon,
  SparklesIcon,
  CopyIcon,
  SaveIcon,
  RotateCcwIcon,
  CheckIcon,
  FileTextIcon,
  Loader2Icon,
  ExternalLinkIcon,
  PencilIcon,
  EyeIcon,
  AlertCircleIcon,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────

type PostType =
  | "general"
  | "session_conducted"
  | "student_achievement"
  | "workshop_event"
  | "research_insight"
  | "faculty_development";

type PostTone =
  | "Professional"
  | "Reflective"
  | "Informative"
  | "Celebratory"
  | "Inspirational"
  | "Creative";

interface FormState {
  topic: string;
  postType: PostType;
  tone: PostTone;
}

interface GenerateResponse {
  success?: boolean;
  post?: string;
  postId?: string;
  message?: string;
  error?: string;
}

const POST_TYPES: {
  value: PostType;
  label: string;
}[] = [
  { value: "general", label: "General post" },
  { value: "session_conducted", label: "Session conducted" },
  { value: "student_achievement", label: "Student achievement" },
  { value: "workshop_event", label: "Workshop / event" },
  { value: "research_insight", label: "Research / insight" },
  { value: "faculty_development", label: "Faculty development" },
];

const TONES: PostTone[] = [
  "Professional",
  "Reflective",
  "Informative",
  "Celebratory",
  "Inspirational",
  "Creative",
];

// ─── Component ──────────────────────────────────────────

export default function LinkedInPostGenerator() {
  const [isOpen, setIsOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );

  const [activeSection, setActiveSection] = useState("tools");

  const [form, setForm] = useState<FormState>({
    topic: "",
    postType: "general",
    tone: "Professional",
  });

  const [generatedPost, setGeneratedPost] = useState("");
  const [editablePost, setEditablePost] = useState("");
  const [postId, setPostId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const [previewMode, setPreviewMode] = useState<"preview" | "edit">("preview");

  const hasPost = Boolean(editablePost.trim());

  const wordCount = editablePost.trim().split(/\s+/).filter(Boolean).length;

  const contentClass = `
    relative z-10 min-w-0
    px-4 sm:px-6 md:px-8
    pt-20 md:pt-9
    pb-12
    transition-[margin] duration-300
    ${isOpen ? "md:ml-72" : "md:ml-16"}
  `;

  // ─── Generate Post ────────────────────────────────────

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setError("");
    setSuccessMsg("");

    const topic = form.topic.trim();

    if (!topic) {
      setError("Please enter a topic for your post.");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      setSaved(false);
      setCopied(false);
      setPostId(null);
      setGeneratedPost("");
      setEditablePost("");
      setPreviewMode("preview");

      // Keep the existing API contract.
      // General posts omit the academic postType.
      const payload = {
        topic,
        tone: form.tone,
        ...(form.postType !== "general" ? { postType: form.postType } : {}),
      };

      const res = await fetch(`${BASE_URL}/api/linkedin-posts/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data: GenerateResponse = await res.json();

      if (!res.ok || !data.success || !data.post) {
        throw new Error(
          data.message || data.error || "Failed to generate the post.",
        );
      }

      setGeneratedPost(data.post);
      setEditablePost(data.post);
      setPostId(data.postId ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to generate the post.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Save Draft ───────────────────────────────────────

  const handleSaveDraft = async () => {
    if (!postId || !editablePost.trim() || saving) {
      return;
    }

    setError("");
    setSuccessMsg("");

    try {
      setSaving(true);

      const res = await fetch(
        `${BASE_URL}/api/linkedin-posts/${postId}/approve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            content: editablePost,
          }),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to save the draft.");
      }

      setSaved(true);
      setSuccessMsg("Draft saved to your history.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save the draft.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── Copy Post ────────────────────────────────────────

  const handleCopy = async () => {
    if (!editablePost.trim()) return;

    try {
      await navigator.clipboard.writeText(editablePost);
      setCopied(true);
      setSuccessMsg("Post copied to clipboard.");
    } catch {
      setError("Unable to copy the post.");
    }
  };

  // ─── Open LinkedIn ────────────────────────────────────

  const handleOpenLinkedIn = async () => {
    if (!editablePost.trim()) return;

    // Open synchronously to avoid popup blockers.
    window.open(
      "https://www.linkedin.com/feed/",
      "_blank",
      "noopener,noreferrer",
    );

    try {
      await navigator.clipboard.writeText(editablePost);
      setSuccessMsg("Post copied. Paste it into LinkedIn to publish.");
    } catch {
      setSuccessMsg("LinkedIn opened. Copy your post to publish it.");
    }
  };

  // ─── Reset to Original ────────────────────────────────

  const handleReset = () => {
    setEditablePost(generatedPost);
    setSaved(false);
    setError("");
    setSuccessMsg("");
  };

  // ─── Update Post ──────────────────────────────────────

  const handlePostChange = (value: string) => {
    setEditablePost(value);
    setSaved(false);
    setSuccessMsg("");
  };

  // ─── UI ───────────────────────────────────────────────

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A1238]">
      {/* Background decorations */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-sky-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/10 blur-[130px]" />

      {/* Existing sidebar */}
      <SideNavbar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        title="AI Tools"
      />

      <main className={contentClass}>
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="mb-8 text-center">
            <h1 className="flex items-center justify-center gap-2 font-['Sora'] text-2xl font-semibold text-white md:text-3xl">
              <SparklesIcon className="h-6 w-6 text-teal-300" />
              LinkedIn Post Studio
            </h1>

            <p className="mt-2 text-sm text-slate-400 md:text-base">
              Turn any topic or idea into a professional, ready-to-share
              LinkedIn post.
            </p>
          </header>

          {/* Error / success */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              <CheckIcon className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Two-panel layout */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
            {/* LEFT: Configuration */}
            <form
              onSubmit={handleGenerate}
              className="rounded-2xl bg-white p-5 shadow-xl sm:p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#0A1238]">
                    Create your post
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Customize your topic and writing style.
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                  AI powered
                </span>
              </div>

              {/* Topic */}
              <div className="mb-5">
                <label
                  htmlFor="linkedin-topic"
                  className="mb-2 block text-sm font-medium text-[#0A1238]"
                >
                  What would you like to post about?
                </label>

                <textarea
                  id="linkedin-topic"
                  value={form.topic}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      topic: e.target.value,
                    }))
                  }
                  placeholder="e.g. React.js, my first internship, AI in healthcare, leadership..."
                  rows={5}
                  required
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base leading-relaxed text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:bg-white sm:text-sm"
                />

                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">
                    Add details for a more personalized post.
                  </p>
                  <span className="shrink-0 text-xs text-slate-400">
                    {form.topic.length} chars
                  </span>
                </div>
              </div>

              <div className="my-5 h-px bg-slate-100" />

              {/* Post Type */}
              <div className="mb-5">
                <label
                  htmlFor="linkedin-post-type"
                  className="mb-2 block text-sm font-medium text-[#0A1238]"
                >
                  Post type
                </label>

                <select
                  id="linkedin-post-type"
                  value={form.postType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      postType: e.target.value as PostType,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400"
                >
                  {POST_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-slate-400">
                  Choose General post for any topic.
                </p>
              </div>

              {/* Tone */}
              <div className="mb-6">
                <label className="mb-3 block text-sm font-medium text-[#0A1238]">
                  Writing tone
                </label>

                <div className="flex flex-wrap gap-2">
                  {TONES.map((tone) => {
                    const selected = form.tone === tone;

                    return (
                      <button
                        key={tone}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            tone,
                          }))
                        }
                        className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                          selected
                            ? "border-[#0A1238] bg-[#0A1238] text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {tone}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generate */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0A1238] text-sm font-semibold text-white transition-colors hover:bg-[#172650] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Generating post...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4" />
                    {hasPost ? "Regenerate post" : "Generate post"}
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-slate-400">
                Review your post before publishing.
              </p>
            </form>

            {/* RIGHT: Preview */}
            <section
              aria-label="LinkedIn post preview"
              className="flex min-h-[500px] min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            >
              {/* Preview header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                    <LinkedinIcon className="h-5 w-5 text-[#0077B5]" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-[#0A1238]">
                      Post preview
                    </h2>
                    <p className="text-xs text-slate-400">
                      {hasPost
                        ? `${wordCount} words`
                        : "Your generated content"}
                    </p>
                  </div>
                </div>

                {hasPost && (
                  <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("preview")}
                      className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                        previewMode === "preview"
                          ? "bg-[#0A1238] text-white"
                          : "text-slate-500"
                      }`}
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                      Preview
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewMode("edit")}
                      className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                        previewMode === "edit"
                          ? "bg-[#0A1238] text-white"
                          : "text-slate-500"
                      }`}
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Loading */}
              {loading ? (
                <div
                  role="status"
                  className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"
                >
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                    <Loader2Icon className="h-7 w-7 animate-spin text-blue-500" />
                  </div>

                  <h3 className="text-base font-semibold text-[#0A1238]">
                    Creating your LinkedIn post
                  </h3>

                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
                    Our AI is preparing content based on your topic and selected
                    tone.
                  </p>
                </div>
              ) : !hasPost ? (
                /* Empty state */
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-blue-100 bg-blue-50">
                    <FileTextIcon className="h-6 w-6 text-blue-500" />
                  </div>

                  <h3 className="text-sm font-semibold text-[#0A1238]">
                    Your LinkedIn post will appear here
                  </h3>

                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
                    Enter a topic and choose your writing style on the left,
                    then generate your post.
                  </p>
                </div>
              ) : (
                <>
                  {/* Preview body */}
                  <div className="min-w-0 flex-1 px-5 py-5 sm:px-6">
                    {previewMode === "preview" ? (
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A1238]">
                            <LinkedinIcon className="h-5 w-5 text-white" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">
                              LinkedIn post preview
                            </p>
                            <p className="text-xs text-slate-400">
                              Preview only · Not published
                            </p>
                          </div>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto px-4 py-5">
                          <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                            {editablePost}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor="linkedin-edit-post"
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Edit your post
                        </label>

                        <textarea
                          id="linkedin-edit-post"
                          value={editablePost}
                          onChange={(e) => handlePostChange(e.target.value)}
                          rows={16}
                          className="min-h-[340px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base leading-relaxed text-slate-700 outline-none focus:border-blue-400 sm:text-sm"
                        />

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-400">
                            {wordCount} words
                          </span>

                          <button
                            type="button"
                            onClick={handleReset}
                            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            <RotateCcwIcon className="h-3.5 w-3.5" />
                            Reset to original
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action footer */}
                  <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {copied ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <CopyIcon className="h-4 w-4" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={!postId || saved || saving}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                        ) : saved ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <SaveIcon className="h-4 w-4" />
                        )}
                        {saving ? "Saving" : saved ? "Saved" : "Save draft"}
                      </button>

                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={editablePost === generatedPost}
                        className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-1"
                      >
                        <RotateCcwIcon className="h-4 w-4" />
                        Reset
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenLinkedIn}
                      className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0077B5] text-sm font-semibold text-white transition-colors hover:bg-[#00669b]"
                    >
                      <LinkedinIcon className="h-4 w-4" />
                      Open LinkedIn
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                    </button>

                    <p className="mt-2 text-center text-xs text-slate-400">
                      Copy your post and paste it into LinkedIn to publish.
                    </p>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
