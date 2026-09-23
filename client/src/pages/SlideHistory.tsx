"use client";

import React, { useEffect, useState, useCallback } from "react";
import SideNavbar from "../components/SideNavbar";
import { formatDateTime } from "../utils/historyClamp";
import { BASE_URL } from "../configs/Config";
import {
  Presentation,
  FileText,
  Calendar,
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  Inbox,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

type SlideTone = "Conversational" | "Formal" | "Academic" | "Simple";
type SlideDeckStatus = "draft" | "downloaded";
type SlideDeckSource = "topic" | "pdf";

interface SlideDeckRecord {
  _id: string;
  deckTitle: string;
  topic: string;
  tone: SlideTone;
  status: SlideDeckStatus;
  sourceType: SlideDeckSource;
  sourceFileName?: string;
  slideCount: number;
  slideTitles: string[];
  createdAt: string;
}

const API_BASE = `${BASE_URL}/api/slides`;

export default function SlideHistory() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("slide-history");

  const [decks, setDecks] = useState<SlideDeckRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchDecks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/history`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setDecks(data.decks);
      } else {
        setError(data.message || "Couldn't load slide history.");
      }
    } catch {
      setError("Cannot connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  const toggleExpanded = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  const handleDownload = async (deck: SlideDeckRecord) => {
    setDownloadingId(deck._id);
    try {
      const res = await fetch(`${API_BASE}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deckId: deck._id }),
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
      a.download = `${deck.deckTitle.replace(/[^a-z0-9\-_ ]/gi, "_")}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Downloaded — open it in PowerPoint or Google Slides.");
      setDecks((prev) =>
        prev.map((d) => (d._id === deck._id ? { ...d, status: "downloaded" } : d))
      );
    } catch {
      toast.error("Couldn't reach the server. Check your connection.");
    } finally {
      setDownloadingId(null);
    }
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

      <div
        className={`px-6 pt-28 pb-16 transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest text-rose-300 uppercase mb-3">
            Lesson Slide Studio
          </p>
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Presentation className="w-8 h-8 text-rose-300" />
            Slide Deck History
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Every deck you've generated — from a topic or a PDF — with date and status
          </p>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto mb-6 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-rose-300 animate-spin" />
          </div>
        )}

        {!loading && decks.length === 0 && !error && (
          <div className="max-w-md mx-auto text-center py-20">
            <Inbox className="w-10 h-10 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300 font-medium">No slide decks yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Decks you generate — from a topic or a PDF — will show up here.
            </p>
          </div>
        )}

        {!loading && decks.length > 0 && (
          <div className="max-w-3xl mx-auto space-y-4">
            {decks.map((deck) => {
              const { date, time } = formatDateTime(deck.createdAt);
              const expanded = expandedId === deck._id;
              const titlesToShow = expanded
                ? deck.slideTitles
                : deck.slideTitles.slice(0, 3);
              const isPdf = deck.sourceType === "pdf";

              return (
                <div key={deck._id} className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-semibold rounded-full px-3 py-1 flex items-center gap-1 ${
                        isPdf
                          ? "bg-cyan-50 text-cyan-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {isPdf ? (
                        <>
                          <FileText className="w-3 h-3" /> From PDF
                        </>
                      ) : (
                        <>
                          <Presentation className="w-3 h-3" /> From topic
                        </>
                      )}
                    </span>
                    <span className="text-xs font-semibold bg-gray-50 text-gray-600 rounded-full px-3 py-1">
                      {deck.tone}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-3 py-1">
                      {deck.slideCount} slides
                    </span>
                    <span
                      className={`text-xs font-semibold rounded-full px-3 py-1 ${
                        deck.status === "downloaded"
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {deck.status === "downloaded" ? "Downloaded" : "Draft"}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-800 truncate">{deck.deckTitle}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">
                    {isPdf && deck.sourceFileName ? deck.sourceFileName : deck.topic}
                  </p>

                  <ul className="text-sm text-gray-600 mt-3 space-y-1 list-disc list-inside">
                    {titlesToShow.map((title, i) => (
                      <li key={i} className="truncate">
                        {title}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {deck.slideTitles.length > 3 && (
                        <button
                          onClick={() => toggleExpanded(deck._id)}
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium"
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
                      )}
                      <button
                        onClick={() => handleDownload(deck)}
                        disabled={downloadingId === deck._id}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {downloadingId === deck._id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Building
                          </>
                        ) : deck.status === "downloaded" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Download again
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" /> Download
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