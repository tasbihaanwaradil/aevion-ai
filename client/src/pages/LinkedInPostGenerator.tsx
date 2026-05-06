"use client";

import React, { useState, useRef, useEffect } from "react";
import SideNavbar from "../components/SideNavbar";

interface FormData {
  topic: string;
  targetAudience: string;
  tone: string;
}

type ReviewStep = "idle" | "generating" | "review" | "approved";

const JUNK_PATTERNS = [
  /^[a-z]{1,3}$/i,
  /^(.)\1+$/i,
  /^[^a-zA-Z]+$/,
  /^(test|asdf|qwerty|lorem|dummy|foo|bar|baz|xyz|zzz|aaa|bbb)$/i,
  /^[\W\d]+$/,
];

const validateTopic = (topic: string): string | null => {
  const t = topic.trim();
  if (!t) return "Please enter a topic.";
  if (t.length < 8) return "Topic is too short — describe your subject in more detail.";
  if (t.length > 300) return "Topic is too long. Keep it under 300 characters.";
  for (const p of JUNK_PATTERNS) {
    if (p.test(t))
      return "That doesn't look like a valid topic. Try something like 'AI agents in web development'.";
  }
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 2) return "Please be more specific — enter at least 2 words.";
  const alphaRatio = (t.match(/[a-zA-Z]/g) || []).length / t.length;
  if (alphaRatio < 0.5) return "Topic must contain meaningful text.";
  return null;
};

const LINKEDIN_LIMIT = 3000;
const getCounterColor = (len: number) => {
  if (len > LINKEDIN_LIMIT) return "#ef4444";
  if (len > LINKEDIN_LIMIT * 0.85) return "#f59e0b";
  return "#6b7280";
};

const LinkedInPostGenerator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("tools");

  const [formData, setFormData] = useState<FormData>({
    topic: "",
    targetAudience: "Professionals",
    tone: "Professional",
  });

  const [step, setStep] = useState<ReviewStep>("idle");
  const [generatedPost, setGeneratedPost] = useState("");
  const [editedPost, setEditedPost] = useState("");
  const [postId, setPostId] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [editedPost]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "topic") setFieldError(null);
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

    const topicError = validateTopic(formData.topic);
    if (topicError) {
      setFieldError(topicError);
      return;
    }

    try {
      setStep("generating");
      setGeneratedPost("");

      const response = await fetch("http://localhost:3000/api/linkedin-posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedPost(data.post);
        setEditedPost(data.post);
        setPostId(data.postId ?? null);
        setStep("review");
        setShowReview(true);
      } else {
        setApiError(data.message || "Something went wrong. Please try again.");
        setStep("idle");
      }
    } catch (error) {
      console.error(error);
      setApiError("Error connecting to server. Please check your connection.");
      setStep("idle");
    }
  };

  const handleApprove = async () => {
    setIsSaving(true);
    try {
      if (postId) {
        await fetch(`http://localhost:3000/api/linkedin-posts/${postId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ editedContent: editedPost }),
          credentials: "include",
        });
      }
      setStep("approved");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareToLinkedIn = () => {
    const text = encodeURIComponent(editedPost.slice(0, 3000));
    const url = `https://www.linkedin.com/sharing/share-offsite/?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer,width=750,height=600");
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedPost);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = editedPost;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleReset = () => {
    setStep("idle");
    setShowReview(false);
    setGeneratedPost("");
    setEditedPost("");
    setPostId(null);
    setFieldError(null);
    setApiError(null);
    setCopySuccess(false);
    setShareSuccess(false);
  };

  const loading = step === "generating";
  const charCount = editedPost.length;

  return (
    <div className="min-h-screen bg-[#0A1238]">
      <SideNavbar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        title="AI Tools"
      />

      <div className={`px-6 pt-28 pb-16 transition-all duration-300 ${isOpen ? "ml-64" : "ml-0"}`}>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white">LinkedIn Post Generator</h1>
          <p className="text-gray-400 mt-2">
            Create engaging LinkedIn posts tailored to your audience and tone
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 text-gray-800">

          {/* Input Card */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-10">
            <label className="block font-semibold mb-2 text-gray-800">Topic</label>
            <textarea
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="E.g., LangChain vs raw OpenAI SDK for production AI agents..."
              className={`w-full h-28 px-5 py-4 bg-gray-100 rounded-xl outline-none resize-none transition-colors ${
                fieldError ? "ring-2 ring-red-400 bg-red-50" : "focus:ring-2 focus:ring-[#2d5f6e]"
              }`}
              required
            />
            {fieldError && (
              <div className="mt-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-red-500 text-sm mt-0.5">⚠</span>
                <p className="text-red-600 text-sm leading-snug">{fieldError}</p>
              </div>
            )}

            <label className="block font-semibold mt-6 mb-2 text-gray-800">Target Audience</label>
            <select
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleChange}
              className="w-full h-14 px-5 bg-gray-100 rounded-xl"
            >
              <option value="Professionals">Professionals</option>
              <option value="Entrepreneurs">Entrepreneurs</option>
              <option value="Students">Students</option>
              <option value="Developers">Developers</option>
            </select>

            <label className="block font-semibold mt-6 mb-2 text-gray-800">Tone</label>
            <select
              name="tone"
              value={formData.tone}
              onChange={handleChange}
              className="w-full h-14 px-5 bg-gray-100 rounded-xl"
            >
              <option value="Professional">Professional</option>
              <option value="Casual">Casual</option>
              <option value="Inspirational">Inspirational</option>
              <option value="Informative">Informative</option>
            </select>

            {apiError && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-red-500 text-sm mt-0.5">⚠</span>
                <p className="text-red-600 text-sm leading-snug">{apiError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-10 w-full h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold text-lg disabled:opacity-50 hover:bg-[#235069] transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                "Generate Post"
              )}
            </button>
          </form>

          {/* Preview Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-10">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">LinkedIn Preview</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 min-h-[300px] bg-gray-50 flex items-center justify-center">
              {loading ? (
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <svg className="animate-spin h-8 w-8 text-[#2d5f6e]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Generating post...</p>
                  <p className="text-gray-400 text-sm mt-1">This may take a few seconds</p>
                </div>
              ) : generatedPost ? (
                <div className="w-full">
                  <p className="text-gray-800 whitespace-pre-line text-sm leading-relaxed">
                    {generatedPost}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2 flex-wrap">
                    <button
                      onClick={() => setShowReview(true)}
                      className="flex-1 h-10 bg-[#2d5f6e] text-white rounded-xl text-sm font-semibold hover:bg-[#235069] transition-colors"
                    >
                      ✏️ Edit & Review
                    </button>
                    <button
                      onClick={handleShareToLinkedIn}
                      className="flex-1 h-10 bg-[#0077B5] text-white rounded-xl text-sm font-semibold hover:bg-[#005e8f] transition-colors flex items-center justify-center gap-1"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      Post to LinkedIn
                    </button>
                    <button
                      onClick={handleReset}
                      className="h-10 px-4 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-100 transition-colors"
                    >
                      New Post
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center">Generated content will appear here</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Human Review Modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {step === "approved" ? "✅ Post Approved" : "✏️ Review & Edit Post"}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {step === "approved"
                    ? "Your post is ready to share on LinkedIn."
                    : "Edit your post before publishing. Click Approve when ready."}
                </p>
              </div>
              <button
                onClick={() => setShowReview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex gap-2 mb-4 flex-wrap">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  🎯 {formData.targetAudience}
                </span>
                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                  🎨 {formData.tone}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  📝 {formData.topic.slice(0, 40)}{formData.topic.length > 40 ? "…" : ""}
                </span>
              </div>

              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={editedPost}
                  onChange={(e) => setEditedPost(e.target.value)}
                  disabled={step === "approved"}
                  className={`w-full px-5 py-4 bg-gray-50 border rounded-xl text-sm text-gray-800 leading-relaxed resize-none outline-none transition-colors overflow-hidden ${
                    step === "approved"
                      ? "border-green-300 bg-green-50 cursor-default"
                      : "border-gray-300 focus:border-[#2d5f6e] focus:ring-1 focus:ring-[#2d5f6e]"
                  }`}
                  style={{ minHeight: "300px" }}
                  placeholder="Your post content..."
                />
                <div
                  className="absolute bottom-3 right-4 text-xs font-medium"
                  style={{ color: getCounterColor(charCount) }}
                >
                  {charCount.toLocaleString()} / {LINKEDIN_LIMIT.toLocaleString()}
                  {charCount > LINKEDIN_LIMIT && <span className="ml-1 text-red-500">⚠ Over limit</span>}
                </div>
              </div>

              {charCount > LINKEDIN_LIMIT && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">
                    LinkedIn limits posts to {LINKEDIN_LIMIT.toLocaleString()} characters. Please shorten by{" "}
                    <strong>{(charCount - LINKEDIN_LIMIT).toLocaleString()}</strong> characters.
                  </p>
                </div>
              )}

              {step === "approved" && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-green-800 font-semibold text-sm">Post approved and saved!</p>
                    <p className="text-green-700 text-sm">You can now share it directly to LinkedIn.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 space-y-3">
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-5 h-11 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  {copySuccess ? (
                    <>✅ Copied!</>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copy Text
                    </>
                  )}
                </button>

                {step !== "approved" && (
                  <button
                    onClick={handleApprove}
                    disabled={isSaving || charCount > LINKEDIN_LIMIT}
                    className="flex-1 h-11 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? "Saving..." : "✅ Approve Post"}
                  </button>
                )}

                <button
                  onClick={handleShareToLinkedIn}
                  disabled={charCount > LINKEDIN_LIMIT}
                  className="flex-1 h-11 bg-[#0077B5] text-white rounded-xl text-sm font-bold hover:bg-[#005e8f] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  {shareSuccess ? "Opened LinkedIn!" : "Post to LinkedIn"}
                </button>
              </div>

              <button
                onClick={handleReset}
                className="w-full h-10 text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                ← Generate a new post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedInPostGenerator;