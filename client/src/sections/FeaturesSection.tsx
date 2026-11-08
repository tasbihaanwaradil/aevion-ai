"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRightIcon, SparkleIcon } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Features } from "../data/features";
import { getFeatureVideos } from "../data/featureVideos";
import AnimatedContent from "../components/animated-content";
import SectionTitle from "../components/section-title";
import FeatureVideo from "../components/feature-video";

gsap.registerPlugin(ScrollTrigger);

export default function FeaturesSection() {
  const rowsRef = useRef<HTMLDivElement>(null);
  const ctaBoxRef = useRef<HTMLDivElement>(null);
  const exploreLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Each feature row: text and video slide in from opposite sides
      if (rowsRef.current) {
        const rows = rowsRef.current.querySelectorAll<HTMLElement>(".feature-row");

        rows.forEach((row, i) => {
          const text = row.querySelector(".feature-text");
          const media = row.querySelector(".feature-media");
          const icon = row.querySelector(".feature-icon");
          const fromLeft = i % 2 === 0;

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: row,
              start: "top 80%",
              once: true,
            },
          });

          tl.fromTo(
            row,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
          );

          if (text) {
            tl.fromTo(
              text,
              { opacity: 0, x: fromLeft ? -40 : 40 },
              { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" },
              "<0.1"
            );
          }

          if (media) {
            tl.fromTo(
              media,
              { opacity: 0, x: fromLeft ? 40 : -40, scale: 0.97 },
              { opacity: 1, x: 0, scale: 1, duration: 0.7, ease: "power3.out" },
              "<0.1"
            );
          }

          if (icon) {
            row.addEventListener("mouseenter", () => {
              gsap.to(icon, {
                scale: 1.15,
                rotate: 6,
                duration: 0.3,
                ease: "power2.out",
              });
            });
            row.addEventListener("mouseleave", () => {
              gsap.to(icon, {
                scale: 1,
                rotate: 0,
                duration: 0.3,
                ease: "power2.out",
              });
            });
          }
        });
      }

      // Bottom CTA banner entrance
      if (ctaBoxRef.current) {
        gsap.fromTo(
          ctaBoxRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ctaBoxRef.current,
              start: "top 90%",
              once: true,
            },
          }
        );
      }

      if (exploreLinkRef.current) {
        const arrow = exploreLinkRef.current.querySelector("svg");
        exploreLinkRef.current.addEventListener("mouseenter", () => {
          if (arrow) {
            gsap.to(arrow, { x: 3, y: -3, duration: 0.25, ease: "power2.out" });
          }
        });
        exploreLinkRef.current.addEventListener("mouseleave", () => {
          if (arrow) {
            gsap.to(arrow, { x: 0, y: 0, duration: 0.25, ease: "power2.out" });
          }
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <section id="Features" className="px-4 md:px-16 lg:px-24 xl:px-32">
      <div className="max-w-7xl mx-auto">
        {/* Heading (centered) */}
        <div className="pt-16 pb-10 md:pb-14 flex flex-col items-center text-center [&_*]:mx-auto">
          <SectionTitle
            dir="center"
            icon={SparkleIcon}
            title="Core features"
            subtitle="Everything you need to build, deploy, and scale Aevion.AI agents—designed for speed, reliability, and real-world academic use."
          />
        </div>

        {/* Feature rows: text + large video, alternating sides */}
        <AnimatedContent distance={10} delay={0}>
          <div ref={rowsRef} className="space-y-8 md:space-y-12">
            {Features.map((feature, index) => {
              const clips = getFeatureVideos(feature.title);
              const hasVideo = clips.length > 0;
              const reversed = index % 2 === 1;

              return (
                <div
                  key={index}
                  className={`feature-row ${feature.cardBg} rounded-2xl p-6 md:p-10 shadow-sm grid grid-cols-1 gap-8 lg:gap-14 items-center ${
                    hasVideo ? "md:grid-cols-2" : ""
                  }`}
                >
                  {/* Text */}
                  <div
                    className={`feature-text flex flex-col items-start ${
                      hasVideo && reversed ? "md:order-2" : ""
                    }`}
                  >
                    <div
                      className={`feature-icon ${feature.iconBg} p-2.5 text-white rounded-lg inline-flex items-center justify-center`}
                    >
                      <feature.icon size={22} />
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold text-zinc-900 mt-5">
                      {feature.title}
                    </h3>

                    <p className="text-sm md:text-base text-zinc-700 mt-3 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Video */}
                  {hasVideo && (
                    <div
                      className={`feature-media w-full ${
                        reversed ? "md:order-1" : ""
                      }`}
                    >
                      <FeatureVideo clips={clips} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </AnimatedContent>

        {/* CTA banner */}
        <AnimatedContent
          distance={12}
          delay={0}
          className="mt-12 md:mt-16 mb-16 p-8 md:p-12 bg-[#007a8c] w-full rounded-2xl shadow-xl shadow-cyan-950/20 border border-white/10"
        >
          <div
            ref={ctaBoxRef}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <p className="text-lg md:text-xl text-white font-medium leading-relaxed max-w-2xl">
              Trusted by educators, institutions, and academic teams building
              intelligent teaching and learning solutions with AI agents.
            </p>

            <a
              ref={exploreLinkRef}
              href="/UseCases"
              className="bg-white text-[#007a8c] hover:bg-cyan-50 px-6 py-2.5 rounded-full flex items-center gap-2 transition-colors duration-300 font-bold w-max shrink-0 shadow-sm"
            >
              Explore use cases
              <ArrowUpRightIcon size={20} />
            </a>
          </div>
        </AnimatedContent>
      </div>
    </section>
  );
}