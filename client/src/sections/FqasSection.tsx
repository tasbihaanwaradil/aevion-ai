"use client";

import { useEffect, useRef, useState } from "react";
import AnimatedContent from "../components/animated-content";
import SectionTitle from "../components/section-title";
import { Faqs } from "../data/faqs";
import { ChevronDownIcon, HelpCircleIcon } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Faqsection() {
  const [openStates, setOpenStates] = useState<boolean[]>(() =>
    Faqs.map((_, i) => i === 0)
  );

  const listRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const iconRefs = useRef<(SVGSVGElement | null)[]>([]);
  const supportPanelRef = useRef<HTMLDivElement>(null);
  const contactBtnRef = useRef<HTMLAnchorElement>(null);

  // Initialize open items to their natural height on mount (so index 0
  // starts expanded without a jump), and every item's closed items to 0.
  useEffect(() => {
    contentRefs.current.forEach((el, i) => {
      if (!el) return;
      if (openStates[i]) {
        gsap.set(el, { height: "auto", opacity: 1 });
      } else {
        gsap.set(el, { height: 0, opacity: 0 });
      }
    });
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Entrance + hover animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (listRef.current) {
        const items = listRef.current.querySelectorAll(".faq-item");
        gsap.fromTo(
          items,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: listRef.current,
              start: "top 82%",
              once: true,
            },
          }
        );
      }

      if (supportPanelRef.current) {
        gsap.fromTo(
          supportPanelRef.current,
          { opacity: 0, y: 40, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: supportPanelRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      if (contactBtnRef.current) {
        const el = contactBtnRef.current;
        const enter = () =>
          gsap.to(el, { scale: 1.05, y: -2, duration: 0.25, ease: "power2.out" });
        const leave = () =>
          gsap.to(el, { scale: 1, y: 0, duration: 0.25, ease: "power2.out" });
        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", leave);
      }
    });

    return () => ctx.revert();
  }, []);

  const toggleFaq = (index: number) => {
    const willOpen = !openStates[index];
    const el = contentRefs.current[index];
    const icon = iconRefs.current[index];

    setOpenStates((prev) => {
      const next = [...prev];
      next[index] = willOpen;
      return next;
    });

    if (icon) {
      gsap.to(icon, {
        rotate: willOpen ? 180 : 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    if (!el) return;

    if (willOpen) {
      const targetHeight = el.scrollHeight;
      gsap.fromTo(
        el,
        { height: 0, opacity: 0 },
        {
          height: targetHeight,
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
          onComplete: () => {
            gsap.set(el, { height: "auto" });
          },
        }
      );
    } else {
      gsap.set(el, { height: el.scrollHeight });
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });
    }
  };

  return (
    <section className="bg-gradient-to-br from-[#0c4a6e] to-[#0A1238]">
      {/* Section Header */}
      <div className="px-4 md:px-16 lg:px-24 xl:px-32">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
          <SectionTitle
            icon={HelpCircleIcon}
            title="Got questions?"
            subtitle="Everything you need to know about Aevion.AI, its AI agents, and how educators can get started easily."
          />
        </div>
      </div>

      {/* FAQ Grid */}
      <div className="px-4 md:px-16 lg:px-24 xl:px-32 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* FAQ Accordions */}
          <AnimatedContent distance={10} delay={0} className="space-y-6">
            <div ref={listRef} className="space-y-6">
              {Faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`faq-item bg-[#0A1238]/90 border border-white/20 rounded-2xl overflow-hidden backdrop-blur-sm transition-colors duration-300 ${
                    openStates[index]
                      ? "border-white/30 bg-[#007a8c]/80"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-7 select-none cursor-pointer text-left"
                    aria-expanded={openStates[index]}
                  >
                    <h3 className="font-urbanist font-bold text-lg text-white transition-colors">
                      {faq.question}
                    </h3>

                    <ChevronDownIcon
                      size={22}
                      ref={(el) => {
                        iconRefs.current[index] = el;
                      }}
                      className="text-white shrink-0 ml-4"
                      style={{
                        transform: openStates[index]
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                    />
                  </button>

                  <div
                    ref={(el) => {
                      contentRefs.current[index] = el;
                    }}
                    className="overflow-hidden"
                    style={{ height: openStates[index] ? "auto" : 0 }}
                  >
                    <div className="px-7 pb-7">
                      <p className="text-white/80 text-base leading-relaxed max-w-md">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedContent>

          {/* Support / CTA Panel */}
          <div className="relative">
            <div ref={supportPanelRef} className="md:sticky md:top-32">
              <div className="flex flex-col items-start gap-6 p-10 bg-[#007a8c]/90 w-full rounded-3xl shadow-2xl shadow-black/20 border border-white/10">
                <div className="bg-white/20 p-3 rounded-xl">
                  <HelpCircleIcon className="text-white" size={28} />
                </div>

                <h3 className="text-2xl md:text-4xl font-urbanist font-extrabold text-white leading-tight">
                  Still have questions? <br /> Our team can help.
                </h3>

                <p className="text-white/90 font-medium text-lg">
                  Can't find what you're looking for? Reach out to our
                  academic support specialists.
                </p>

                <a
                  ref={contactBtnRef}
                  href="Contact Us"
                  className="bg-white text-[#007a8c] hover:bg-cyan-50 font-bold px-10 py-4 rounded-full transition-colors duration-300 shadow-lg text-lg"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}