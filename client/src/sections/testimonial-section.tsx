"use client";

import { useEffect, useRef, useState } from "react";
import SectionTitle from "../components/section-title";
import { ChevronLeftIcon, ChevronRightIcon, QuoteIcon, StarIcon } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// TODO: replace these placeholders with real feedback from real teachers.
const TESTIMONIALS = [
  {
    quote:
      "Turning my lecture PDFs into a ready-to-use quiz takes minutes now instead of an entire evening.",
    name: "Teacher Name",
    role: "High School Computer Science Teacher",
  },
  {
    quote:
      "Hosting a live quiz room keeps even my quietest students involved, and the results show up instantly.",
    name: "Teacher Name",
    role: "Middle School Science Teacher",
  },
  {
    quote:
      "The student insights help me spot who is struggling early, so I can step in before exams.",
    name: "Teacher Name",
    role: "University Lecturer",
  },
  {
    quote:
      "Lesson slides generated from my own material save me hours every week, and they look professional.",
    name: "Teacher Name",
    role: "Elementary School Teacher",
  },
  {
    quote:
      "Drafting and scheduling academic emails in one place means I finally stay on top of parent and student messages.",
    name: "Teacher Name",
    role: "English Teacher",
  },
  {
    quote:
      "I get more time for actual teaching because the repetitive work is handled for me.",
    name: "Teacher Name",
    role: "Mathematics Teacher",
  },
];

const GAP = 24; // matches gap-6
const AUTOPLAY_MS = 4500;

export default function TestimonialSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const arrowsRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  const [active, setActive] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const getStep = () => {
    const first = trackRef.current?.firstElementChild as HTMLElement | null;
    return first ? first.offsetWidth + GAP : 1;
  };

  const update = () => {
    const track = trackRef.current;
    if (!track) return;
    setActive(Math.round(track.scrollLeft / getStep()));
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  };

  const scrollByCards = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * getStep(), behavior: "smooth" });
  };

  const scrollToIndex = (i: number) => {
    trackRef.current?.scrollTo({ left: i * getStep(), behavior: "smooth" });
  };

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Entrance animation — same ScrollTrigger pattern as the FAQ section.
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      if (trackRef.current) {
        gsap.fromTo(
          trackRef.current.children,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.1,
            ease: "power3.out",
            clearProps: "opacity,transform", // keep CSS hover effects working
            scrollTrigger: {
              trigger: trackRef.current,
              start: "top 82%",
              once: true,
            },
          },
        );
      }

      if (arrowsRef.current) {
        gsap.fromTo(
          arrowsRef.current,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: arrowsRef.current,
              start: "top 90%",
              once: true,
            },
          },
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Auto-play: advance every few seconds, loop back at the end,
  // pause while the user hovers / touches / focuses the slider.
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    const id = setInterval(() => {
      if (pausedRef.current) return;
      const track = trackRef.current;
      if (!track) return;
      const atEnd =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (atEnd) track.scrollTo({ left: 0, behavior: "smooth" });
      else scrollByCards(1);
    }, AUTOPLAY_MS);

    return () => clearInterval(id);
  }, []);

  const pause = () => (pausedRef.current = true);
  const resume = () => (pausedRef.current = false);

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="scroll-mt-20 border-b border-white/10 bg-gradient-to-br from-[#0c4a6e] to-[#0A1238] py-20"
    >
      {/* Section Header */}
      <div className="px-4 md:px-16 lg:px-24 xl:px-32">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
          <SectionTitle
            icon={QuoteIcon}
            title="Why educators love Aevion.AI"
            subtitle="Less time on repetitive work, more time actually teaching. Here's what educators have to say."
          />
        </div>
      </div>

      {/* Slider */}
      <div className="px-4 md:px-16 lg:px-24 xl:px-32 mt-16">
        <div className="max-w-7xl mx-auto">
          <div
            ref={trackRef}
            onScroll={update}
            onMouseEnter={pause}
            onMouseLeave={resume}
            onFocus={pause}
            onBlur={resume}
            onTouchStart={pause}
            onTouchEnd={resume}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-1 pb-6 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TESTIMONIALS.map((t, i) => (
              <figure
                key={i}
                className="group flex w-[85%] shrink-0 snap-start flex-col justify-between rounded-2xl border border-white/20 bg-[#0A1238]/90 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-white/30 hover:bg-[#007a8c]/80 hover:shadow-2xl hover:shadow-black/20 sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl bg-white/20 p-3 text-white transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                      <QuoteIcon size={22} className="fill-current" />
                    </span>
                    <div className="flex gap-0.5" aria-label="5 out of 5 stars">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <StarIcon
                          key={s}
                          size={16}
                          className="fill-[#ffd166] text-[#ffd166]"
                        />
                      ))}
                    </div>
                  </div>

                  <blockquote className="mt-6 text-base leading-relaxed text-white/80 group-hover:text-white/95">
                    {t.quote}
                  </blockquote>
                </div>

                <figcaption className="mt-8 flex items-center gap-3 border-t border-white/15 pt-5">
                  <span className="flex size-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-urbanist text-sm font-bold text-white">
                      {t.name}
                    </p>
                    <p className="text-xs text-white/70">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>

          {/* Arrows + dots */}
          <div
            ref={arrowsRef}
            className="mt-6 flex items-center justify-center gap-5"
          >
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              disabled={!canPrev}
              aria-label="Previous testimonials"
              className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-[#007a8c]/90 text-white shadow-lg transition hover:scale-105 hover:bg-[#007a8c] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
            >
              <ChevronLeftIcon size={22} />
            </button>

            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToIndex(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active
                      ? "w-7 bg-white"
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollByCards(1)}
              disabled={!canNext}
              aria-label="Next testimonials"
              className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-[#007a8c]/90 text-white shadow-lg transition hover:scale-105 hover:bg-[#007a8c] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
            >
              <ChevronRightIcon size={22} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}