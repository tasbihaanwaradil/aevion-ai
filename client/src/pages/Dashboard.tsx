"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAuth } from "../context/AuthContext";
import {
  LinkedinIcon,
  MailIcon,
  FileQuestionIcon,
  PresentationIcon,
  FileTextIcon,
  CalendarClockIcon,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  {/* Get user from context */}
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState("dashboard");

  const tools = [
    {
      title: "LinkedIn Post Generator",
      description:
        "Generates professional LinkedIn posts for teachers related to achievements, research, or academic events.",
      icon: LinkedinIcon,
      cardBg: "bg-orange-100",
      iconBg: "bg-orange-500",
      route: "/LinkedInPostGenerator",
    },
    {
      title: "Academic Email Writer",
      description:
        "Drafts formal emails for class announcements, deadlines, feedback, and administrative communication.",
      icon: MailIcon,
      cardBg: "bg-green-100",
      iconBg: "bg-green-500",
      route: "/AcademicEmailGenerator",
    },
    {
      title: "Quiz Generator",
      description:
        "Automatically creates quizzes from lecture slides, PDFs, or topic inputs.",
      icon: FileQuestionIcon,
      cardBg: "bg-indigo-100",
      iconBg: "bg-indigo-500",
      route: "/Quizgenerator",
    },
    {
      title: "Auto Slides",
      description: "Generate slides from topics.",
      icon: PresentationIcon,
      cardBg: "bg-pink-100",
      iconBg: "bg-pink-500",
      route: "/AutoCreatePresentationSlides",
    },
    {
      title: "PDF to Slides",
      description: "Convert PDFs to slides.",
      icon: FileTextIcon,
      cardBg: "bg-lime-100",
      iconBg: "bg-lime-500",
      route: "/Pdf-to-SlideConverter",
    },
    {
      title: "Reminder",
      description: "Track schedules and deadlines.",
      icon: CalendarClockIcon,
      cardBg: "bg-gray-100",
      iconBg: "bg-orange-500",
      route: "/Reminder",
    },
  ];

  return (
    <MainLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">

           <h1 className="text-3xl font-bold text-white">
             {/* Welcome message with username */}
            Welcome back, {user?.name || "User"}!
          </h1> 

          <p className="text-gray-300 mt-1 mb-8">
            Unlock smarter workflows with AI tools
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {tools.map((tool, index) => {
              const Icon = tool.icon;

              return (
                <div
                  key={index}
                  className={`${tool.cardBg} rounded-2xl p-6 shadow-md`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg ${tool.iconBg} flex items-center justify-center mb-4 text-white`}
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
                    className="mt-6 w-full bg-[#0A1238] text-white py-2 rounded-xl"
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