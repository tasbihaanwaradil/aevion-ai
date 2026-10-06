"use client";

import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import MainLayout from "../components/MainLayout";
import { useTeacherAuth } from "../context/TeacherAuthContext";
import {
  LinkedinIcon,
  MailIcon,
  FileQuestionIcon,
  PresentationIcon,
  FileUpIcon,
  AlarmClockIcon,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { teacher } = useTeacherAuth();

  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const tools = [
    {
      title: "LinkedIn Post Studio",
      description:
        "Generates professional LinkedIn posts for teachers related to achievements, research, or academic events.",
      icon: LinkedinIcon,
      cardBg: "bg-orange-100",
      iconBg: "bg-orange-500",
      route: "/LinkedInPostGenerator",
    },
    {
      title: "Academic Email Assistant",
      description:
        "Drafts formal emails for class announcements, deadlines, feedback, and administrative communication.",
      icon: MailIcon,
      cardBg: "bg-green-100",
      iconBg: "bg-green-500",
      route: "/AcademicEmailGenerator",
    },
    {
      title: "Quiz Studio",
      description:
        "Automatically creates quizzes from lecture slides, PDFs, or topic inputs.",
      icon: FileQuestionIcon,
      cardBg: "bg-indigo-100",
      iconBg: "bg-indigo-500",
      route: "/TeacherDashboard",
    },
    {
      title: "Lesson Slide Studio",
      description:
        "Turns a topic or a rough outline into a ready-to-present slide deck in minutes.",
      icon: PresentationIcon,
      cardBg: "bg-rose-100",
      iconBg: "bg-rose-500",
      route: "/Slidegenerator",
    },
    {
      title: "PDF Lesson Studio",
      description:
        "Converts lecture notes or research PDFs directly into a structured, presentable slide deck.",
      icon: FileUpIcon,
      cardBg: "bg-cyan-100",
      iconBg: "bg-cyan-500",
      route: "/Pdftoslidegenerator",
    },
    {
      title: "Reminder",
      description:
        "Manages teaching tasks, deadlines, and reminders — with alerts before due dates so nothing slips.",
      icon: AlarmClockIcon,
      cardBg: "bg-amber-100",
      iconBg: "bg-amber-500",
      route: "/ReminderAgent",
    },
  ];

  useEffect(() => {
    // Skip the entrance animation entirely for people who prefer reduced motion.
    // (Elements are visible by default, so nothing gets stuck at opacity 0.)
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const isMobile = window.matchMedia("(max-width: 639px)").matches;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (headerRef.current) {
        tl.fromTo(
          headerRef.current.children,
          { opacity: 0, y: -18 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
        );
      }

      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll(".tool-card");
        const icons = gridRef.current.querySelectorAll(".tool-icon");

        // Tighter stagger on mobile: cards stack in one column, so a long
        // stagger would make the lower cards feel slow to appear.
        tl.fromTo(
          cards,
          { opacity: 0, y: isMobile ? 20 : 32, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: isMobile ? 0.05 : 0.08,
          },
          "-=0.25",
        );

        tl.fromTo(
          icons,
          { scale: 0, rotate: -20 },
          {
            scale: 1,
            rotate: 0,
            duration: 0.45,
            stagger: isMobile ? 0.05 : 0.08,
            ease: "back.out(1.7)",
          },
          "-=0.5",
        );
      }
    });

    return () => mm.revert();
  }, []);

  const handleCardHover = (
    e: React.PointerEvent<HTMLDivElement>,
    entering: boolean,
  ) => {
    // Touch screens fire "enter" on tap and may never fire "leave", which
    // leaves cards stuck in the lifted state. Only animate for mouse/pen.
    if (e.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const card = e.currentTarget;
    const icon = card.querySelector(".tool-icon");

    gsap.to(card, {
      y: entering ? -6 : 0,
      boxShadow: entering
        ? "0 20px 35px -10px rgba(0,0,0,0.25)"
        : "0 4px 10px -2px rgba(0,0,0,0.08)",
      duration: 0.3,
      ease: "power2.out",
    });

    if (icon) {
      gsap.to(icon, {
        scale: entering ? 1.12 : 1,
        rotate: entering ? 6 : 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div ref={headerRef}>
            <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">
              Welcome back, {teacher?.name || "Teacher"}!
            </h1>

            <p className="text-sm sm:text-base text-gray-300 mt-1 mb-6 sm:mb-8">
              Unlock smarter workflows with AI tools
            </p>
          </div>

          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {tools.map((tool, index) => {
              const Icon = tool.icon;

              return (
                <div
                  key={index}
                  onPointerEnter={(e) => handleCardHover(e, true)}
                  onPointerLeave={(e) => handleCardHover(e, false)}
                  className={`tool-card ${tool.cardBg} rounded-2xl p-5 sm:p-6 shadow-md will-change-transform flex flex-col`}
                >
                  <div
                    className={`tool-icon w-11 h-11 sm:w-12 sm:h-12 rounded-lg ${tool.iconBg} flex items-center justify-center mb-3 sm:mb-4 text-white shrink-0`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  <h2 className="font-semibold text-base sm:text-lg text-gray-800">
                    {tool.title}
                  </h2>

                  <p className="text-sm text-gray-600 mt-2">
                    {tool.description}
                  </p>

                  {/* mt-auto pins the button to the bottom so buttons line up
                      across cards of different text lengths in the grid;
                      pt-6 keeps a minimum gap above it */}
                  <div className="mt-auto pt-6">
                    <button
                      onClick={() => navigate(tool.route)}
                      className="w-full min-h-[44px] bg-[#0A1238] text-white py-2.5 sm:py-2 rounded-xl transition-colors hover:bg-[#1a2348] active:bg-[#1a2348] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      Open Tool
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
