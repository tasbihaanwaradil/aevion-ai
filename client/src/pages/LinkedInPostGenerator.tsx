// client/LinkedInPostGenerator.tsx
"use client";

import React, { useState, useEffect } from "react";

type PostType =
  | "session_conducted"
  | "student_achievement"
  | "workshop_event"
  | "research_insight"
  | "faculty_development";

type PostTone = "Reflective" | "Informative" | "Celebratory" | "Inspirational";
type Step = "form" | "review";

interface LinkedInStatus {
  connected: boolean;
  name?: string;
  picture?: string;
  email?: string;
  reason?: string;
}

const POST_TYPES: { value: PostType; label: string; example: string }[] = [
  {
    value: "session_conducted",
    label: "Session Conducted",
    example: "e.g. AI Ethics workshop for faculty",
  },
  {
    value: "student_achievement",
    label: "Student Achievement",
    example: "e.g. Students won JIDEA innovation challenge",
  },
  {
    value: "workshop_event",
    label: "Workshop / Event",
    example: "e.g. Conducted session during Indus AI Week",
  },
  {
    value: "research_insight",
    label: "Research / Insight",
    example: "e.g. Reflection on AI's impact on assessments",
  },
  {
    value: "faculty_development",
    label: "Faculty Development",
    example: "e.g. Active learning training for faculty",
  },
];

const TONES: PostTone[] = [
  "Reflective",
  "Informative",
  "Celebratory",
  "Inspirational",
];

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

  // LinkedIn state
  const [linkedInStatus, setLinkedInStatus] = useState<LinkedInStatus>({
    connected: false,
  });
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  const selectedType = POST_TYPES.find((t) => t.value === form.postType);

  // ─── Check LinkedIn connection on mount ──────────────────────────────────────
  useEffect(() => {
    const checkStatus = async () => {
      setStatusLoading(true);
      try {
        const res = await fetch(
          "http://localhost:3000/api/linkedin-posts/auth/linkedin/status",
          { credentials: "include" }
        );
        const data = await res.json();
        console.log("[LinkedIn Status]", data);
        setLinkedInStatus(data);
      } catch (err) {
        console.error("[LinkedIn Status Error]", err);
        setLinkedInStatus({ connected: false });
      } finally {
        setStatusLoading(false);
      }
    };

    // Handle return from LinkedIn OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const linkedInParam = params.get("linkedin");

    if (linkedInParam === "connected") {
      const savedPost = sessionStorage.getItem("pendingPost");
      const savedPostId = sessionStorage.getItem("pendingPostId");
      if (savedPost) {
        setEditablePost(savedPost);
        setGeneratedPost(savedPost);
        setPostId(savedPostId || null);
        setStep("review");
        sessionStorage.removeItem("pendingPost");
        sessionStorage.removeItem("pendingPostId");
      }
      window.history.replaceState({}, "", window.location.pathname);
    } else if (linkedInParam === "ratelimit") {
      setError(
        "LinkedIn is temporarily limiting requests. Please wait 2–3 minutes and try connecting again."
      );
      window.history.replaceState({}, "", window.location.pathname);
    } else if (linkedInParam === "error") {
      setError("LinkedIn connection failed. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (linkedInParam === "denied") {
      setError("LinkedIn access was denied. Please try connecting again.");
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Always check status after handling URL params
    checkStatus();
  }, []);

  // ─── Generate post ───────────────────────────────────────────────────────────
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.topic.trim() || form.topic.trim().length < 8) {
      setError(
        "Please enter a meaningful topic (at least 8 characters) — e.g. 'AI Ethics session for faculty members'"
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
        }
      );
      const data = await res.json();

      if (data.success) {
        setGeneratedPost(data.post);
        setEditablePost(data.post);
        setPostId(data.postId);
        setApproved(false);
        setPublishSuccess(false);
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

  // ─── Save draft ──────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!postId) return;
    try {
      await fetch(
        `http://localhost:3000/api/linkedin-posts/${postId}/approve`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: editablePost }),
        }
      );
      setApproved(true);
    } catch {
      setError("Failed to save draft.");
    }
  };

  // ─── Copy to clipboard ───────────────────────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(editablePost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Back to form ────────────────────────────────────────────────────────────
  const handleRegenerate = () => {
    setStep("form");
    setGeneratedPost("");
    setEditablePost("");
    setApproved(false);
    setPublishSuccess(false);
    setError("");
  };

  // ─── Connect LinkedIn ────────────────────────────────────────────────────────
  const handleConnectLinkedIn = () => {
    if (editablePost) {
      sessionStorage.setItem("pendingPost", editablePost);
      sessionStorage.setItem("pendingPostId", postId || "");
    }
    window.location.href =
      "http://localhost:3000/api/linkedin-posts/auth/linkedin/login";
  };

  // ─── Disconnect LinkedIn ─────────────────────────────────────────────────────
  const handleDisconnectLinkedIn = async () => {
    try {
      await fetch(
        "http://localhost:3000/api/linkedin-posts/auth/linkedin/disconnect",
        { credentials: "include" }
      );
      setLinkedInStatus({ connected: false });
    } catch {
      setError("Failed to disconnect. Please try again.");
    }
  };

  // ─── Publish to LinkedIn ─────────────────────────────────────────────────────
  const handlePublishToLinkedIn = async () => {
    if (!linkedInStatus.connected) {
      handleConnectLinkedIn();
      return;
    }

    try {
      setPublishing(true);
      setError("");

      await handleApprove();

      const res = await fetch(
        "http://localhost:3000/api/linkedin-posts/publish",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: editablePost, postId }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setPublishSuccess(true);
      } else if (data.requiresAuth) {
        setLinkedInStatus({ connected: false });
        setError(
          data.message || "LinkedIn session expired. Please reconnect."
        );
      } else {
        setError(data.message || "Failed to publish. Please try again.");
      }
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setPublishing(false);
    }
  };

  // ─── LinkedIn status banner — shared across both steps ───────────────────────
  const LinkedInStatusBanner = () => {
    if (statusLoading) {
      return (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <svg
            className="animate-spin h-4 w-4 text-gray-400"
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
          <p className="text-sm text-gray-500">
            Checking LinkedIn connection...
          </p>
        </div>
      );
    }

    if (linkedInStatus.connected) {
      return (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          {linkedInStatus.picture && (
            <img
              src={linkedInStatus.picture}
              alt={linkedInStatus.name}
              className="w-8 h-8 rounded-full border border-blue-200 shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-800">
              ✓ Connected as {linkedInStatus.name}
            </p>
            {linkedInStatus.email && (
              <p className="text-xs text-blue-500 truncate">
                {linkedInStatus.email}
              </p>
            )}
          </div>
          <button
            onClick={handleDisconnectLinkedIn}
            className="text-xs text-blue-400 hover:text-blue-600 whitespace-nowrap shrink-0"
          >
            Disconnect
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-yellow-800">
            LinkedIn not connected
          </p>
          <p className="text-xs text-yellow-600 mt-0.5">
            Connect once to publish posts directly — no copy-pasting
          </p>
        </div>
        <button
          onClick={handleConnectLinkedIn}
          className="text-xs bg-[#0077B5] text-white px-3 py-1.5 rounded-lg font-medium whitespace-nowrap shrink-0 hover:bg-[#006097] flex items-center gap-1.5"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          Connect
        </button>
      </div>
    );
  };

  // ─── STEP 1: Form ─────────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="min-h-screen bg-[#0A1238] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">
              LinkedIn Post Agent
            </p>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Generate Your Post
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              Tailored for university professors — sessions, achievements,
              workshops
            </p>
          </div>

          <form
            onSubmit={handleGenerate}
            className="bg-white rounded-2xl p-8 space-y-6"
          >
            {/* LinkedIn status — visible on form step */}
            <LinkedInStatusBanner />

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
                      onChange={() =>
                        setForm((p) => ({ ...p, postType: pt.value }))
                      }
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {pt.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {pt.example}
                      </p>
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
                onChange={(e) =>
                  setForm((p) => ({ ...p, topic: e.target.value }))
                }
                placeholder={
                  selectedType?.example.replace("e.g. ", "") +
                  " — add any specific details"
                }
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-blue-400 focus:bg-white resize-none transition-all"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                The more specific you are, the better the post. Include event
                names, student outcomes, key themes discussed.
              </p>
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
              className="w-full h-12 bg-[#0A1238] text-white font-semibold rounded-xl hover:bg-[#1a2348] disabled:opacity-50 transition-all text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
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

  // ─── STEP 2: Review ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A1238] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-2">
            Step 2 of 2
          </p>
          <h1 className="text-3xl font-bold text-white">Review Your Post</h1>
          <p className="text-gray-400 text-sm mt-1">
            Edit if needed, then publish directly to LinkedIn
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 space-y-5">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Publish success */}
          {publishSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
              <span>✓</span>
              <span>Successfully published to LinkedIn!</span>
            </div>
          )}

          {/* LinkedIn status — visible on review step too */}
          <LinkedInStatusBanner />

          {/* Editable post */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Post content — edit freely before publishing
            </label>
            <textarea
              value={editablePost}
              onChange={(e) => setEditablePost(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-blue-400 focus:bg-white resize-none transition-all leading-relaxed"
            />
            <p className="text-xs text-gray-400 mt-1">
              {editablePost.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {/* PRIMARY: Publish to LinkedIn */}
            <button
              onClick={handlePublishToLinkedIn}
              disabled={publishing || publishSuccess}
              className="w-full h-12 bg-[#0077B5] text-white font-semibold rounded-xl hover:bg-[#006097] disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
            >
              <svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              {publishing ? (
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
                  Publishing...
                </>
              ) : publishSuccess ? (
                "✓ Published to LinkedIn!"
              ) : linkedInStatus.connected ? (
                "Publish to LinkedIn"
              ) : (
                "Connect LinkedIn & Publish"
              )}
            </button>

            {/* SECONDARY row */}
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

            {/* Back */}
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