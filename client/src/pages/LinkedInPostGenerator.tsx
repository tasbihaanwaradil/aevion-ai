// ProfessorLinkedInAgent.tsx
"use client";

import React, { useState } from "react";

type PostType =
  | "session_conducted"
  | "student_achievement"
  | "workshop_event"
  | "research_insight"
  | "faculty_development";

type PostTone = "Reflective" | "Informative" | "Celebratory" | "Inspirational";
type Step = "form" | "review";

const POST_TYPES: { value: PostType; label: string; example: string }[] = [
  { value: "session_conducted", label: "Session Conducted", example: "e.g. AI Ethics workshop for faculty" },
  { value: "student_achievement", label: "Student Achievement", example: "e.g. Students won JIDEA innovation challenge" },
  { value: "workshop_event", label: "Workshop / Event", example: "e.g. Conducted session during Indus AI Week" },
  { value: "research_insight", label: "Research / Insight", example: "e.g. Reflection on AI's impact on assessments" },
  { value: "faculty_development", label: "Faculty Development", example: "e.g. Active learning training for faculty" },
];

const TONES: PostTone[] = ["Reflective", "Informative", "Celebratory", "Inspirational"];

interface FormState {
  topic: string;
  postType: PostType;
  tone: PostTone;
}

export default function ProfessorLinkedInAgent() {
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
  const [approved, setApproved] = useState(false);

  const selectedType = POST_TYPES.find((t) => t.value === form.postType);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.topic.trim() || form.topic.trim().length < 8) {
      setError("Please enter a meaningful topic (at least 8 characters) — e.g. 'AI Ethics session for faculty members'");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/linkedin-posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setGeneratedPost(data.post);
        setEditablePost(data.post);
        setPostId(data.postId);
        setApproved(false);
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

  const handleApprove = async () => {
    if (!postId) return;
    try {
      await fetch(`http://localhost:3000/api/linkedin-posts/${postId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: editablePost }),
      });
      setApproved(true);
    } catch {
      setError("Failed to save approved post.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editablePost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkedIn = () => {
    const encoded = encodeURIComponent(editablePost);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?text=${encoded}`, "_blank");
  };

  const handleRegenerate = () => {
    setStep("form");
    setGeneratedPost("");
    setEditablePost("");
    setApproved(false);
  };

  // ─── STEP 1: Form ────────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="min-h-screen bg-[#0A1238] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">
              LinkedIn Post Agent
            </p>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Generate Your Post
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              Tailored for university professors — sessions, achievements, workshops
            </p>
          </div>

          <form onSubmit={handleGenerate} className="bg-white rounded-2xl p-8 space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Post Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                What are you posting about?
              </label>
              <div className="grid grid-cols-1 gap-2">
                {POST_TYPES.map((pt) => (
                  <label
                    key={pt.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.postType === pt.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="postType"
                      value={pt.value}
                      checked={form.postType === pt.value}
                      onChange={() => setForm((p) => ({ ...p, postType: pt.value }))}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{pt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{pt.example}</p>
                    </div>
                  </label>
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
                onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                placeholder={selectedType?.example.replace("e.g. ", "") + " — add any specific details"}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-blue-400 focus:bg-white resize-none transition-all"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                The more specific you are, the better the post. Include event names, student outcomes, key themes discussed.
              </p>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tone</label>
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
              className="w-full h-12 bg-[#0A1238] text-white font-semibold rounded-xl hover:bg-[#1a2348] disabled:opacity-50 transition-all text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Generating post...
                </span>
              ) : (
                "Generate Post →"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── STEP 2: Human Review ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A1238] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-2">
            Step 2 of 2
          </p>
          <h1 className="text-3xl font-bold text-white">Review Your Post</h1>
          <p className="text-gray-400 text-sm mt-1">
            Edit the content below, then approve and post to LinkedIn
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {approved && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
              ✓ Post saved to your history
            </div>
          )}

          {/* Editable post */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Post content — edit freely before posting
            </label>
            <textarea
              value={editablePost}
              onChange={(e) => setEditablePost(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-blue-400 focus:bg-white resize-none transition-all font-mono leading-relaxed"
            />
            <p className="text-xs text-gray-400 mt-1">
              {editablePost.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {/* Primary: Post to LinkedIn */}
            <button
              onClick={() => { handleApprove(); handleLinkedIn(); }}
              className="w-full h-12 bg-[#0077B5] text-white font-semibold rounded-xl hover:bg-[#006097] transition-all text-sm flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Post to LinkedIn
            </button>

            {/* Secondary row */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopy}
                className="h-10 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all text-sm"
              >
                {copied ? "✓ Copied" : "Copy Text"}
              </button>
              <button
                onClick={handleApprove}
                disabled={approved}
                className="h-10 bg-green-50 text-green-700 font-medium rounded-xl hover:bg-green-100 disabled:opacity-50 transition-all text-sm border border-green-200"
              >
                {approved ? "✓ Saved" : "Save Draft"}
              </button>
            </div>

            {/* Regenerate */}
            <button
              onClick={handleRegenerate}
              className="w-full h-10 text-gray-500 text-sm hover:text-gray-700 transition-all"
            >
              ← Generate a new post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}