"use client";

import React, { useState } from "react";
import SideNavbar from "../components/SideNavbar";

type PostType =
  | "session_conducted"
  | "student_achievement"
  | "workshop_event"
  | "research_insight"
  | "faculty_development";

type PostTone = "Reflective" | "Informative" | "Celebratory" | "Inspirational";
type Step = "form" | "review";

const POST_TYPES: {
  value: PostType;
  label: string;
  hint: string;
  icon: string;
}[] = [
  {
    value: "session_conducted",
    label: "Session conducted",
    hint: "Workshops, lectures, panel sessions",
    icon: "🎓",
  },
  {
    value: "student_achievement",
    label: "Student achievement",
    hint: "Awards, competitions, showcases",
    icon: "🏆",
  },
  {
    value: "workshop_event",
    label: "Workshop / event",
    hint: "Events you organized or spoke at",
    icon: "📅",
  },
  {
    value: "research_insight",
    label: "Research / insight",
    hint: "Reflections, findings, opinions",
    icon: "💡",
  },
  {
    value: "faculty_development",
    label: "Faculty development",
    hint: "Training programs, mentoring initiatives",
    icon: "👥",
  },
];

const TONES: PostTone[] = [
  "Reflective",
  "Informative",
  "Celebratory",
  "Inspirational",
];

const TYPE_LABELS: Record<PostType, string> = {
  session_conducted: "Session conducted",
  student_achievement: "Student achievement",
  workshop_event: "Workshop / event",
  research_insight: "Research / insight",
  faculty_development: "Faculty development",
};

interface FormState {
  topic: string;
  postType: PostType;
  tone: PostTone;
}

function isGibberish(str: string): boolean {
  const clean = str.trim().toLowerCase();
  if (clean.length < 8) return true;
  const words = clean.split(/\s+/);
  if (words.length < 2) return true;
  const bad = words.filter((w) => {
    const hasNoVowel = !/[aeiou]/.test(w) && w.length > 3;
    const isRepeating = /(.)\1{3,}/.test(w);
    const isKeyboardSmash = /^[qwrtypsdfghjklzxcvbnm]{5,}$/.test(w);
    return hasNoVowel || isRepeating || isKeyboardSmash;
  });
  return bad.length > words.length * 0.5;
}

export default function LinkedInPostGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("tools");

  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>({
    topic: "",
    postType: "session_conducted",
    tone: "Reflective",
  });

  const [generatedPost, setGeneratedPost] = useState("");
  const [editablePost, setEditablePost] = useState("");
  const [postId, setPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.topic.trim() || form.topic.trim().length < 8) {
      setError(
        "Enter a meaningful topic — at least 8 characters. E.g. 'AI Ethics session for faculty members'",
      );
      return;
    }

    if (isGibberish(form.topic)) {
      setError(
        "That doesn't look like a valid topic. Try something like: 'AI Ethics workshop for faculty under HEC program'.",
      );
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        "http://localhost:3000/api/linkedin-posts/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();

      if (data.success) {
        setGeneratedPost(data.post);
        setEditablePost(data.post);
        setPostId(data.postId ?? null);
        setSaved(false);
        setSuccessMsg("");
        setStep("review");
      } else {
        setError(data.message || "Failed to generate post. Please try again.");
      }
    } catch {
      setError("Cannot connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!postId) return;
    try {
      await fetch(
        `http://localhost:3000/api/linkedin-posts/${postId}/approve`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: editablePost }),
        },
      );
      setSaved(true);
      setSuccessMsg("Draft saved to your history.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setError("Failed to save draft.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editablePost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostToLinkedIn = () => {
    const encoded = encodeURIComponent(editablePost);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?text=${encoded}`,
      "_blank",
    );
  };

  const wordCount = editablePost.trim().split(/\s+/).filter(Boolean).length;

  // ── Step 1: Form ─────────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="min-h-screen bg-[#0A1238]">
        <SideNavbar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          title="AI Tools"
        />

        <div
          className={`px-6 pt-28 pb-16 transition-all duration-300 ${
            isOpen ? "ml-64" : "ml-0"
          }`}
        >
          {/* Page header */}
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">
              LinkedIn Post Agent
            </p>
            <h1 className="text-4xl font-bold text-white">
              LinkedIn Post Generator
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              Tailored for university professors — sessions, achievements,
              workshops
            </p>
          </div>

          {/* Step indicator */}
          <div className="max-w-2xl mx-auto flex items-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                1
              </div>
              <span className="text-white text-sm font-medium">
                Create post
              </span>
            </div>
            <div className="flex-1 h-px bg-gray-600 mx-2" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-gray-600 flex items-center justify-center text-gray-500 text-xs font-semibold">
                2
              </div>
              <span className="text-gray-500 text-sm">
                Review &amp; publish
              </span>
            </div>
          </div>

          {/* Form card */}
          <form
            onSubmit={handleGenerate}
            className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8 space-y-6"
          >
            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Post Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                What are you posting about?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POST_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, postType: pt.value }))
                    }
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      form.postType === pt.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    } ${pt.value === "faculty_development" ? "col-span-2" : ""}`}
                  >
                    <span className="text-lg mt-0.5">{pt.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {pt.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                        {pt.hint}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Describe your topic or experience
              </label>
              <textarea
                value={form.topic}
                onChange={(e) =>
                  setForm((p) => ({ ...p, topic: e.target.value }))
                }
                placeholder="e.g. Conducted a session on AI Ethics for faculty under the HEC Mentoring Program — explored academic integrity, bias, and responsible use of generative AI"
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-blue-400 focus:bg-white resize-none transition-all"
                required
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-400">
                  The more specific you are, the better the post.
                </p>
                <p
                  className={`text-xs ${
                    form.topic.length < 8 ? "text-gray-400" : "text-green-500"
                  }`}
                >
                  {form.topic.length} chars
                </p>
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tone
              </label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, tone: t }))}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      form.tone === t
                        ? "bg-[#0A1238] text-white border-[#0A1238]"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#0A1238] text-white font-semibold rounded-xl hover:bg-[#1a2348] disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Generating post…
                </>
              ) : (
                "Generate post →"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Step 2: Review ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A1238]">
      <SideNavbar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        title="AI Tools"
      />

      <div
        className={`px-6 pt-28 pb-16 transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Page header */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">
            LinkedIn Post Agent
          </p>
          <h1 className="text-4xl font-bold text-white">Review Your Post</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Edit the content below, then publish to LinkedIn
          </p>
        </div>

        {/* Step indicator */}
        <div className="max-w-2xl mx-auto flex items-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-semibold">
              ✓
            </div>
            <span className="text-gray-400 text-sm">Create post</span>
          </div>
          <div className="flex-1 h-px bg-blue-500 mx-2" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
              2
            </div>
            <span className="text-white text-sm font-medium">
              Review &amp; publish
            </span>
          </div>
        </div>

        {/* Review card */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8 space-y-5">
          {/* Errors / success */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
              ✓ {successMsg}
            </div>
          )}

          {/* Meta tags */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <span className="text-xs bg-gray-100 border border-gray-200 rounded-full px-3 py-1 text-gray-500">
                {TYPE_LABELS[form.postType]}
              </span>
              <span className="text-xs bg-gray-100 border border-gray-200 rounded-full px-3 py-1 text-gray-500">
                {form.tone}
              </span>
            </div>
            <button
              onClick={() => {
                setStep("form");
                setError("");
                setSuccessMsg("");
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
            >
              ← Edit inputs
            </button>
          </div>

          {/* Editable post */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Post content — edit freely before publishing
            </label>
            <textarea
              value={editablePost}
              onChange={(e) => setEditablePost(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-blue-400 focus:bg-white resize-none transition-all font-mono leading-relaxed"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-400">{wordCount} words</p>
              <button
                onClick={() => setEditablePost(generatedPost)}
                className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
              >
                Reset to original
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Post to LinkedIn — primary */}
          <button
            onClick={handlePostToLinkedIn}
            className="w-full h-12 bg-[#0077B5] text-white font-semibold rounded-xl hover:bg-[#006097] transition-all text-sm flex items-center justify-center gap-2"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Post to LinkedIn
          </button>

          {/* Secondary actions */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleCopy}
              className="h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-1.5"
            >
              {copied ? "✓ Copied" : "Copy text"}
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saved}
              className="h-10 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-xl transition-all text-sm border border-green-200 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saved ? "✓ Saved" : "Save draft"}
            </button>
            <button
              onClick={() => {
                setStep("form");
                setGeneratedPost("");
                setEditablePost("");
                setSaved(false);
                setError("");
                setSuccessMsg("");
              }}
              className="h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-1.5"
            >
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
