"use client";

import React, { useEffect, useRef, useState } from "react";
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

  const [activeSection, setActiveSection] = useState("dashboard");

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
      route: "/PdfToSlideGenerator",
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
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (headerRef.current) {
        tl.fromTo(
          headerRef.current.children,
          { opacity: 0, y: -18 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }
        );
      }

      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll(".tool-card");
        const icons = gridRef.current.querySelectorAll(".tool-icon");

        tl.fromTo(
          cards,
          { opacity: 0, y: 32, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.55,
            stagger: 0.08,
          },
          "-=0.25"
        );

        tl.fromTo(
          icons,
          { scale: 0, rotate: -20 },
          {
            scale: 1,
            rotate: 0,
            duration: 0.45,
            stagger: 0.08,
            ease: "back.out(1.7)",
          },
          "-=0.5"
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const handleCardHover = (
    e: React.MouseEvent<HTMLDivElement>,
    entering: boolean
  ) => {
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
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div ref={headerRef}>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {teacher?.name || "Teacher"}!
            </h1>

            <p className="text-gray-300 mt-1 mb-8">
              Unlock smarter workflows with AI tools
            </p>
          </div>

          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {tools.map((tool, index) => {
              const Icon = tool.icon;

              return (
                <div
                  key={index}
                  onMouseEnter={(e) => handleCardHover(e, true)}
                  onMouseLeave={(e) => handleCardHover(e, false)}
                  className={`tool-card ${tool.cardBg} rounded-2xl p-6 shadow-md will-change-transform`}
                >
                  <div
                    className={`tool-icon w-12 h-12 rounded-lg ${tool.iconBg} flex items-center justify-center mb-4 text-white`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <h2 className="font-semibold text-lg text-gray-800">
                    {tool.title}
                  </h2>

                  <p className="text-sm text-gray-600 mt-2">
                    {tool.description}
                  </p>

                  <button
                    onClick={() => navigate(tool.route)}
                    className="mt-6 w-full bg-[#0A1238] text-white py-2 rounded-xl transition-colors hover:bg-[#1a2348]"
                  >
                    Open Tool
                  </button>
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