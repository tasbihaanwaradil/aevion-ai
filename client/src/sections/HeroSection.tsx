"use client";

import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ArrowRightIcon } from "lucide-react";

export default function HeroSection() {
  const navigate = useNavigate();

  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (badgeRef.current) {
        tl.fromTo(
          badgeRef.current,
          { opacity: 0, y: -14, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5 },
        );
      }

      if (headingRef.current) {
        const lines = headingRef.current.querySelectorAll(".hero-line");
        tl.fromTo(
          lines,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 },
          "-=0.15",
        );
      }

      if (descRef.current) {
        tl.fromTo(
          descRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.35",
        );
      }

      if (ctaRef.current) {
        tl.fromTo(
          ctaRef.current.children,
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1 },
          "-=0.3",
        );
      }

      // Ambient floating glow orbs — subtle, continuous
      if (orb1Ref.current) {
        gsap.to(orb1Ref.current, {
          x: 30,
          y: -20,
          duration: 6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
      if (orb2Ref.current) {
        gsap.to(orb2Ref.current, {
          x: -25,
          y: 25,
          duration: 7,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
      if (glowRef.current) {
        gsap.fromTo(
          glowRef.current,
          { opacity: 0.15 },
          {
            opacity: 0.35,
            duration: 4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          },
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const handleCtaHover = (
    e: React.MouseEvent<HTMLButtonElement>,
    entering: boolean,
  ) => {
    gsap.to(e.currentTarget, {
      scale: entering ? 1.04 : 1,
      y: entering ? -3 : 0,
      duration: 0.25,
      ease: "power2.out",
    });
  };

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
      {/* Subtle radial glow for depth */}
      <div
        ref={glowRef}
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, #1e3a8a 0%, #0c4a6e 80%)",
          opacity: 0.3,
        }}
      />

      {/* Floating ambient orbs */}
      <div
        ref={orb1Ref}
        className="pointer-events-none absolute top-24 left-[10%] w-72 h-72 rounded-full bg-sky-400/20 blur-[100px] z-0"
      />
      <div
        ref={orb2Ref}
        className="pointer-events-none absolute bottom-16 right-[8%] w-80 h-80 rounded-full bg-cyan-300/10 blur-[110px] z-0"
      />

      {/* Hero Content */}
      <div
        className="
          relative
          z-10
          max-w-7xl
          mx-auto
          flex
          flex-col
          items-center
          justify-center
          text-center
        "
      >
        {/* Badge */}
        <div
          ref={badgeRef}
          className="
            inline-flex items-center gap-2
            px-4 py-1.5 mb-6
            rounded-full
            bg-white/10
            border border-white/20
            text-white/90
            text-sm font-medium
            backdrop-blur-sm
          "
        >
          {/* <SparklesIcon className="w-4 h-4 text-sky-300" /> */}
          Your AI Teaching Assistant, Always On
        </div>

        {/* Heading */}
        <div className="relative overflow-hidden">
          <h1
            ref={headingRef}
            className="
              font-urbanist
              text-4xl
              md:text-6xl
              font-extrabold
              max-w-5xl
              leading-tight
              text-white
              drop-shadow-2xl
            "
          >
            <span className="hero-line block">Empower Educators with AI</span>
            <span className="hero-line block">
              <span className="text-sky-300">Automate</span>,{" "}
              <span className="text-sky-300">Create</span> &{" "}
              <span className="text-sky-300">Share</span> Instantly
            </span>
          </h1>
        </div>

        {/* Description */}
        <p
          ref={descRef}
          className="
            mt-8
            max-w-2xl
            text-lg
            md:text-xl
            text-white/90
            font-medium
            leading-relaxed
          "
        >
          Create teaching materials, generate quizzes, and track student
          progress—all in one place. Simplify everyday tasks so you can spend
          more time teaching and supporting your students.
        </p>

        {/* CTA Buttons */}
        <div
          ref={ctaRef}
          className="
            mt-12
            flex
            flex-col
            sm:flex-row
            items-center
            gap-5
          "
        >
          {/* Teacher Login */}
          <button
            type="button"
            onClick={() => navigate("/TeacherLogin")}
            onMouseEnter={(e) => handleCtaHover(e, true)}
            onMouseLeave={(e) => handleCtaHover(e, false)}
            className="
              group
              min-w-[200px]
              px-10
              py-4
              rounded-xl
              bg-white
              text-sky-900
              font-bold
              text-lg
              transition-colors
              duration-300
              shadow-lg
              shadow-black/20
              flex items-center justify-center gap-2
            "
          >
            Get Started
            <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
}
