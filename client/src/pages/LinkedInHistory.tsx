"use client";

import { useEffect, useState, useCallback } from "react";
import SideNavbar from "../components/SideNavbar";
import { clampStyle, formatDateTime } from "../utils/historyClamp";
import { BASE_URL } from "../configs/Config";
import {
  Linkedin,
  Calendar,
  Clock,
  Copy,
  ChevronDown,
  ChevronUp,
  Loader2,
  Inbox,
  CheckCircle2,
} from "lucide-react";

type PostType =
  | "session_conducted"
  | "student_achievement"
  | "workshop_event"
  | "research_insight"
  | "faculty_development";

type PostTone = "Reflective" | "Informative" | "Celebratory" | "Inspirational";
type PostStatus = "draft" | "approved" | "posted";

interface LinkedInPostRecord {
  _id: string;
  topic: string;
  postType: PostType;
  tone: PostTone;
  content: string;
  status: PostStatus;
  createdAt: string;
}

const POST_TYPE_LABELS: Record<PostType, string> = {
  session_conducted: "Session conducted",
  student_achievement: "Student achievement",
  workshop_event: "Workshop / event",
  research_insight: "Research / insight",
  faculty_development: "Faculty development",
};

export default function LinkedInHistory() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("linkedin-history");

  const [posts, setPosts] = useState<LinkedInPostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/linkedin-posts/history`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      } else {
        setError(data.message || "Couldn't load LinkedIn post history.");
      }
    } catch {
      setError("Cannot connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#0A1238]">
      <SideNavbar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        title="AI Tools"
      />

      {/* Content
          - Mobile: full width (the sidebar is an overlay drawer there).
          - md and up: shift right to clear the sidebar (w-72) or the icon rail (w-16).
          - min-w-0 stops wide children from stretching the page sideways. */}
      <div
        className={`min-w-0 px-4 sm:px-6 pt-20 sm:pt-28 pb-12 sm:pb-16 transition-[margin] duration-300 ${
          isOpen ? "md:ml-72" : "md:ml-16"
        }`}
      >
        {/* Page header */}
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">
            LinkedIn Post Agent
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-white flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <Linkedin className="w-6 h-6 sm:w-8 sm:h-8 text-[#0077B5]" />
            LinkedIn History
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Every post you've generated, with date and status
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto mb-6 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && !error && (
          <div className="max-w-md mx-auto text-center py-20">
            <Inbox className="w-10 h-10 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300 font-medium">No LinkedIn posts yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Posts you generate will show up here.
            </p>
          </div>
        )}

        {/* Cards */}
        {!loading && posts.length > 0 && (
          <div className="max-w-3xl mx-auto space-y-4">
            {posts.map((post) => {
              const { date, time } = formatDateTime(post.createdAt);
              const expanded = expandedId === post._id;
              return (
                <div
                  key={post._id}
                  className="bg-white rounded-2xl shadow-xl p-4 sm:p-6"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-semibold bg-blue-50 text-blue-600 rounded-full px-3 py-1">
                      {POST_TYPE_LABELS[post.postType]}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-3 py-1">
                      {post.tone}
                    </span>
                    <span
                      className={`text-xs font-semibold rounded-full px-3 py-1 ${
                        post.status === "approved"
                          ? "bg-green-50 text-green-600"
                          : post.status === "posted"
                            ? "bg-[#0077B5]/10 text-[#0077B5]"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {post.status === "approved"
                        ? "Approved"
                        : post.status === "posted"
                          ? "Posted"
                          : "Draft"}
                    </span>
                  </div>

                  {/* Topic wraps on mobile so it stays readable; truncates on larger screens */}
                  <h3 className="font-semibold text-gray-800 break-words sm:truncate">
                    {post.topic}
                  </h3>
                  <p
                    className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap break-words"
                    style={clampStyle(expanded)}
                  >
                    {post.content}
                  </p>

                  {/* Footer: stacks on mobile so the date/time and buttons both fit */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <button
                        onClick={() => toggleExpanded(post._id)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium min-h-[40px] sm:min-h-0 pr-2"
                      >
                        {expanded ? (
                          <>
                            Show less <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            Show more <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(post._id, post.content)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 active:bg-gray-200 text-gray-700 font-medium rounded-lg px-4 sm:px-3 py-2.5 sm:py-1.5 flex items-center gap-1.5 transition-all"
                      >
                        {copiedId === post._id ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
