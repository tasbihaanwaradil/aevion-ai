"use client";

import { useEffect, useState, useCallback } from "react";
import SideNavbar from "../components/SideNavbar";
import { clampStyle, formatDateTime } from "../utils/historyClamp";
import { BASE_URL } from "../configs/Config";
import {
  Mail,
  Calendar,
  Clock,
  Copy,
  ChevronDown,
  ChevronUp,
  Loader2,
  Inbox,
  CheckCircle2,
} from "lucide-react";

type EmailTone = "Formal" | "Respectful" | "Semi-Formal";

interface AcademicEmailRecord {
  _id: string;
  recipient: string;
  purpose: string;
  tone: EmailTone;
  subject: string;
  body: string;
  sent: boolean;
  createdAt: string;
}

export default function AcademicEmailHistory() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("email-history");

  const [emails, setEmails] = useState<AcademicEmailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/academic-email/history`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setEmails(data.emails);
      } else {
        setError(data.message || "Couldn't load email history.");
      }
    } catch {
      setError("Cannot connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

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
          <p className="text-xs font-semibold tracking-widest text-green-400 uppercase mb-3">
            Academic Email Agent
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-white flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            Email History
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Every email you've generated, with date and status
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
            <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && emails.length === 0 && !error && (
          <div className="max-w-md mx-auto text-center py-20">
            <Inbox className="w-10 h-10 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300 font-medium">No emails yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Emails you generate will show up here.
            </p>
          </div>
        )}

        {/* Cards */}
        {!loading && emails.length > 0 && (
          <div className="max-w-3xl mx-auto space-y-4">
            {emails.map((email) => {
              const { date, time } = formatDateTime(email.createdAt);
              const expanded = expandedId === email._id;
              return (
                <div
                  key={email._id}
                  className="bg-white rounded-2xl shadow-xl p-4 sm:p-6"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-semibold bg-green-50 text-green-600 rounded-full px-3 py-1">
                      {email.tone}
                    </span>
                    {/* max-w-full + truncate: a long recipient/address can't widen the card */}
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-3 py-1 max-w-full truncate">
                      To: {email.recipient}
                    </span>
                    <span
                      className={`text-xs font-semibold rounded-full px-3 py-1 ${
                        email.sent
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {email.sent ? "Sent" : "Draft"}
                    </span>
                  </div>

                  {/* Subject wraps on mobile so it stays readable; truncates on larger screens */}
                  <h3 className="font-semibold text-gray-800 break-words sm:truncate">
                    {email.subject}
                  </h3>
                  <p
                    className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap break-words"
                    style={clampStyle(expanded)}
                  >
                    {email.body}
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
                        onClick={() => toggleExpanded(email._id)}
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
                        onClick={() => handleCopy(email._id, email.body)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 active:bg-gray-200 text-gray-700 font-medium rounded-lg px-4 sm:px-3 py-2.5 sm:py-1.5 flex items-center gap-1.5 transition-all"
                      >
                        {copiedId === email._id ? (
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
