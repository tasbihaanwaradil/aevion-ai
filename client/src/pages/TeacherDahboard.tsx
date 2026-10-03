"use client";

import { useNavigate } from "react-router-dom";
import {
  ClipboardListIcon,
  RocketIcon,
  Share2Icon,
  SparklesIcon,
} from "lucide-react";
import { useTeacherAuth } from "../context/TeacherAuthContext";
import TeacherNavbar from "../components/TeacherNavabar";

const activityTypes = [
  {
    title: "Quiz Studio",
    icon: ClipboardListIcon,
    route: "/QuizGenerator",
    border: "border-sky-400",
    text: "text-sky-300",
    glow: "group-hover:shadow-[0_0_35px_-5px_rgba(56,189,248,0.6)]",
    fill: "from-sky-400/20 to-sky-400/0",
  },
  {
    title: "Lauch Pad",
    icon: RocketIcon,
    route: "/LaunchSpace",
    border: "border-violet-400",
    text: "text-violet-300",
    glow: "group-hover:shadow-[0_0_35px_-5px_rgba(167,139,250,0.6)]",
    fill: "from-violet-400/20 to-violet-400/0",
  },
  {
    title: "Share Results",
    icon: Share2Icon,
    route: "/Reports",
    border: "border-amber-400",
    text: "text-amber-300",
    glow: "group-hover:shadow-[0_0_35px_-5px_rgba(251,191,36,0.6)]",
    fill: "from-amber-400/20 to-amber-400/0",
  },
];

const quickQuestionTypes = [
  {
    label: "MC",
    title: "Multiple Choice",
    border: "border-yellow-400",
    text: "text-yellow-300",
    glow: "group-hover:shadow-[0_0_28px_-6px_rgba(250,204,21,0.6)]",
    fill: "from-yellow-400/20 to-yellow-400/0",
    route: "/QuickQuestion/MultipleChoice",
  },
  {
    label: "TF",
    title: "True / False",
    border: "border-purple-400",
    text: "text-purple-300",
    glow: "group-hover:shadow-[0_0_28px_-6px_rgba(192,132,252,0.6)]",
    fill: "from-purple-400/20 to-purple-400/0",
    route: "/QuickQuestion/TrueFalse",
  },
  {
    label: "SA",
    title: "Short Answer",
    border: "border-orange-400",
    text: "text-orange-300",
    glow: "group-hover:shadow-[0_0_28px_-6px_rgba(251,146,60,0.6)]",
    fill: "from-orange-400/20 to-orange-400/0",
    route: "/QuickQuestion/ShortAnswer",
  },
];

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { teacher } = useTeacherAuth();

  return (
    <div className="min-h-screen bg-[#0A1238] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-sky-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-[26rem] h-[26rem] rounded-full bg-violet-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-[24rem] h-[24rem] rounded-full bg-amber-500/10 blur-[120px]" />

      <TeacherNavbar />

      <div className="pt-20 relative z-10">
        <div className="min-h-[calc(100vh-5rem)] p-8 flex items-center justify-center">
          <div className="w-full max-w-3xl">
            {/* Welcome heading */}
            <div className="text-center mb-12">
              <p className="flex items-center justify-center gap-2 text-xs font-bold tracking-[0.2em] text-sky-300 uppercase mb-3">
                <SparklesIcon className="w-4 h-4" />
                Ready when you arezz
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Welcome back, {teacher?.name || "Teacher"}!
              </h1>
              <p className="text-gray-400">
                What would you like to launch today?
              </p>
            </div>

            {/* Activity types */}
            <div className="grid grid-cols-3 gap-6 md:gap-10 justify-items-center">
              {activityTypes.map((activity) => {
                const Icon = activity.icon;

                return (
                  <button
                    key={activity.title}
                    type="button"
                    onClick={() => navigate(activity.route)}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div
                      className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full border-2 ${activity.border} ${activity.text} bg-gradient-to-br ${activity.fill} flex items-center justify-center transition-all duration-300 ${activity.glow} group-hover:scale-110 group-hover:-translate-y-1`}
                    >
                      <Icon
                        className="w-9 h-9 md:w-10 md:h-10"
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className="text-sm md:text-base font-semibold text-gray-100 group-hover:text-white transition-colors text-center">
                      {activity.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-12">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-500/50 to-gray-500/50" />
              <span className="text-xs font-bold tracking-[0.2em] text-gray-300 uppercase">
                Quick Question
              </span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-500/50 to-gray-500/50" />
            </div>

            {/* Quick question types */}
            <div className="grid grid-cols-3 gap-6 md:gap-10 justify-items-center">
              {quickQuestionTypes.map((question) => (
                <button
                  key={question.label}
                  type="button"
                  onClick={() => navigate(question.route)}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-2 ${question.border} ${question.text} bg-gradient-to-br ${question.fill} flex items-center justify-center text-lg font-bold transition-all duration-300 ${question.glow} group-hover:scale-110 group-hover:-translate-y-1`}
                  >
                    {question.label}
                  </div>
                  <span className="text-sm font-semibold text-gray-100 group-hover:text-white text-center transition-colors">
                    {question.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
