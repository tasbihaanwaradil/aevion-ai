"use client";

import { SparkleIcon } from "lucide-react";
import CustomIcon from "../components/custom-icon";

export default function HeroSection() {
  return (
    <section
      className="
        relative
        pt-32
        min-h-screen
        px-4 md:px-16 lg:px-24 xl:px-32
        overflow-hidden
        flex items-center justify-center
        bg-sky-900
      "
    >
      {/* Optional subtle radial glow for depth */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(circle at 50% 40%, #1e3a8a 0%, #0c4a6e 80%)",
          opacity: 0.3,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="relative">
          <h1 className="font-urbanist text-4xl md:text-6xl font-extrabold max-w-4xl leading-tight text-white drop-shadow-2xl">
            Empower Educators with AI
            <br />
            <span className="text-white">Automate</span>,{" "}
            <span className="text-white">Create</span> &{" "}
            <span className="text-white">Share</span> Instantly
          </h1>
        </div>

        <p className="mt-8 max-w-2xl text-lg md:text-xl text-white/90 font-medium leading-relaxed">
          Aevion.AI helps teachers generate quizzes, slides, academic emails,
          summarize & merge multiple slides, and manage reminders.
        </p>

        <div className="mt-12 flex flex-col md:flex-row items-center gap-6">
          <a
            href="/"
            className="
              px-10 py-4 rounded-xl
              bg-white text-sky-900 font-bold text-lg
              hover:bg-white/90
              transition-all duration-300
              shadow-lg shadow-black/20
            "
          >
            Get Started
          </a>

          <a
  href="/"
  className="
    px-10 py-4 rounded-xl
    bg-white text-sky-900 font-bold text-lg
    hover:bg-white/90
    transition-all duration-300
    shadow-lg shadow-black/20
  "
>
  Watch Demo
</a>

        </div>
      </div>
    </section>
  );
}
