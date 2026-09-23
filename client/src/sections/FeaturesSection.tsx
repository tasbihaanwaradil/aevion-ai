"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRightIcon, SparkleIcon } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Features } from "../data/features";
import AnimatedContent from "../components/animated-content";
import SectionTitle from "../components/section-title";

gsap.registerPlugin(ScrollTrigger);

export default function FeaturesSection() {
  const cardsWrapRef = useRef<HTMLDivElement>(null);
  const ctaBoxRef = useRef<HTMLDivElement>(null);
  const exploreLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stagger each feature card in as it scrolls into view
      if (cardsWrapRef.current) {
        const cards = cardsWrapRef.current.querySelectorAll(".feature-card");

        gsap.fromTo(
          cards,
          { opacity: 0, y: 44, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: cardsWrapRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );

        cards.forEach((card) => {
          const icon = card.querySelector(".feature-icon");

          card.addEventListener("mouseenter", () => {
            gsap.to(card, {
              y: -6,
              boxShadow: "0 18px 32px -10px rgba(0,0,0,0.18)",
              duration: 0.3,
              ease: "power2.out",
            });
            if (icon) {
              gsap.to(icon, {
                scale: 1.15,
                rotate: 6,
                duration: 0.3,
                ease: "power2.out",
              });
            }
          });

          card.addEventListener("mouseleave", () => {
            gsap.to(card, {
              y: 0,
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
              duration: 0.3,
              ease: "power2.out",
            });
            if (icon) {
              gsap.to(icon, {
                scale: 1,
                rotate: 0,
                duration: 0.3,
                ease: "power2.out",
              });
            }
          });
        });
      }

      // Left CTA box entrance emphasis + hover on the "Explore use cases" link
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
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      if (exploreLinkRef.current) {
        const arrow = exploreLinkRef.current.querySelector("svg");
        exploreLinkRef.current.addEventListener("mouseenter", () => {
          if (arrow) {
            gsap.to(arrow, {
              x: 3,
              y: -3,
              duration: 0.25,
              ease: "power2.out",
            });
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
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-7xl mx-auto">
        {/* Left Panel */}
        <div>
          <div className="p-4 pt-16 md:p-16 flex flex-col items-start md:sticky md:top-26">
            <SectionTitle
              dir="left"
              icon={SparkleIcon}
              title="Core features"
              subtitle="Everything you need to build, deploy, and scale Aevion.AI agents—designed for speed, reliability, and real-world academic use."
            />

            <AnimatedContent
              distance={12}
              delay={0}
              className="p-8 bg-[#007a8c] w-full rounded-2xl mt-12 shadow-xl shadow-cyan-950/20 border border-white/10"
            >
              <div ref={ctaBoxRef}>
                <p className="text-lg text-white font-medium leading-relaxed">
                  Trusted by educators, institutions, and academic teams
                  building intelligent teaching and learning solutions with AI
                  agents.
                </p>

                <a
                  ref={exploreLinkRef}
                  href="/UseCases"
                  className="bg-white text-[#007a8c] hover:bg-cyan-50 px-6 py-2.5 rounded-full mt-8 flex items-center gap-2 transition-colors duration-300 font-bold w-max shadow-sm"
                >
                  Explore use cases
                  <ArrowUpRightIcon size={20} />
                </a>
              </div>
            </AnimatedContent>
          </div>
        </div>

        {/* Right Features Cards */}
        <div className="p-4 pt-16 md:p-16">
          <AnimatedContent distance={10} delay={0}>
            <div ref={cardsWrapRef} className="space-y-6">
              {Features.map((feature, index) => (
                <div
                  key={index}
                  className={`feature-card ${feature.cardBg} flex flex-col items-start p-6 rounded-xl w-full md:sticky md:top-26 shadow-sm will-change-transform`}
                >
                  <div
                    className={`feature-icon ${feature.iconBg} p-2 text-white rounded-md inline-flex items-center justify-center`}
                  >
                    <feature.icon size={20} />
                  </div>

                  <p className="text-lg font-bold text-zinc-900 mt-4">
                    {feature.title}
                  </p>

                  <p className="text-sm text-zinc-700 mt-2 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}