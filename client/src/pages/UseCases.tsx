import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BellRingIcon,
  CheckIcon,
  FileTextIcon,
  LayersIcon,
  LinkedinIcon,
  ListChecksIcon,
  MailIcon,
  PauseIcon,
  PlayIcon,
  PresentationIcon,
  type LucideIcon,
} from "lucide-react";
import gsap from "gsap";
import SectionTitle from "../components/section-title";
import {
  UseCases as UseCasesData,
  type UseCaseIcon,
} from "../data/UseCases";

const ICONS: Record<UseCaseIcon, LucideIcon> = {
  linkedin: LinkedinIcon,
  email: MailIcon,
  quiz: ListChecksIcon,
  slides: PresentationIcon,
  pdf: FileTextIcon,
  reminders: BellRingIcon,
};

// Seconds each tool stays on screen during the automatic tour.
const DURATION = 6;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Keyframes and hover states live here so the file works with no extra CSS setup.
const styles = `
@keyframes uc-orbit {
  to {
    transform: rotate(360deg);
  }
}

@keyframes uc-pulse {
  0% {
    transform: scale(1);
    opacity: .5;
  }

  100% {
    transform: scale(1.7);
    opacity: 0;
  }
}

.uc-orbit {
  animation: uc-orbit 8s linear infinite;
}

.uc-pulse {
  animation: uc-pulse 2.6s ease-out infinite;
}

.uc-spot {
  opacity: 0;
  transition: opacity .3s ease;
  background: radial-gradient(
    420px circle at var(--mx, 50%) var(--my, 50%),
    rgba(103,232,249,.14),
    transparent 60%
  );
}

.uc-panel:hover .uc-spot {
  opacity: 1;
}

.uc-header,
.uc-header * {
  opacity: 1 !important;
  visibility: visible !important;
}

.uc-scroll {
  scrollbar-width: none;
}

.uc-scroll::-webkit-scrollbar {
  display: none;
}

@media (max-width: 767px) {
  .uc-scroll-mask {
    -webkit-mask-image: linear-gradient(
      to right,
      transparent 0,
      #000 12px,
      #000 calc(100% - 24px),
      transparent 100%
    );

    mask-image: linear-gradient(
      to right,
      transparent 0,
      #000 12px,
      #000 calc(100% - 24px),
      transparent 100%
    );
  }
}

.uc-tab {
  transition:
    background-color .3s ease,
    border-color .3s ease,
    box-shadow .3s ease;
}

.uc-tab:not([aria-selected="true"]):hover {
  transform: translateX(4px);
}

@media (max-width: 767px) {
  .uc-tab:not([aria-selected="true"]):hover {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .uc-orbit,
  .uc-pulse {
    animation: none;
  }

  .uc-tab:hover {
    transform: none !important;
  }
}

/* Mobile back button */
@media (max-width: 767px) {
  .uc-back {
    position: relative !important;
    top: auto !important;
    right: auto !important;
    align-self: flex-end;
    margin-bottom: 8px;
  }
}
`;

export default function UseCases() {
  const navigate = useNavigate();

  const rootRef = useRef<HTMLElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const barRef = useRef<HTMLSpanElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const isFirstDetail = useRef(true);

  const [reduceMotion] = useState(prefersReducedMotion);
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(
    () => !prefersReducedMotion()
  );
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);

  const item = UseCasesData[active];
  const Icon = ICONS[item.icon] ?? LayersIcon;

  /*
   * Scroll to the top whenever the Use Cases route mounts.
   *
   * This is important when coming from another page through
   * React Router because the browser can preserve the previous
   * scroll position.
   */
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, []);

  /*
   * Page entrance animation.
   *
   * IMPORTANT:
   * This intentionally does NOT use ScrollTrigger.
   *
   * The previous version depended on ScrollTrigger firing after
   * React Router navigation. That could leave the tabs and panel
   * at opacity: 0 until the page was refreshed.
   */
  useLayoutEffect(() => {
    if (!layoutRef.current) return;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        gsap.set("[data-uc-tab]", {
          opacity: 1,
          x: 0,
        });

        gsap.set("[data-uc-panel]", {
          opacity: 1,
          x: 0,
          scale: 1,
        });

        gsap.set("[data-orb]", {
          opacity: 1,
          scale: 1,
        });

        return;
      }

      // Background glow entrance.
      gsap.fromTo(
        "[data-orb]",
        {
          opacity: 0,
          scale: 0.6,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 1.2,
          stagger: 0.15,
          ease: "power2.out",
        }
      );

      // Background glow movement.
      gsap.utils
        .toArray<HTMLElement>("[data-orb]")
        .forEach((el, i) => {
          gsap.to(el, {
            x: i % 2 ? 40 : -40,
            y: i % 2 ? -30 : 30,
            duration: 7 + i * 2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        });

      // Tool tabs enter from the left.
      gsap.fromTo(
        "[data-uc-tab]",
        {
          opacity: 0,
          x: -40,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.06,
          ease: "power3.out",
          clearProps: "transform",
        }
      );

      // Detail panel enters from the right.
      gsap.fromTo(
        "[data-uc-panel]",
        {
          opacity: 0,
          x: 40,
          scale: 0.98,
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.6,
          delay: 0.1,
          ease: "power3.out",
          clearProps: "transform",
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  /*
   * Panel content animation whenever a different tool is selected.
   */
  useLayoutEffect(() => {
    if (isFirstDetail.current) {
      isFirstDetail.current = false;
      return;
    }

    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .fromTo(
          "[data-d='badge']",
          {
            scale: 0.5,
            rotate: -20,
            opacity: 0,
          },
          {
            scale: 1,
            rotate: 0,
            opacity: 1,
            duration: 0.5,
            ease: "back.out(2)",
          }
        )
        .fromTo(
          "[data-d='text']",
          {
            opacity: 0,
            y: 14,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.07,
            ease: "power2.out",
          },
          "<0.05"
        )
        .fromTo(
          "[data-d='point']",
          {
            opacity: 0,
            x: -18,
          },
          {
            opacity: 1,
            x: 0,
            duration: 0.4,
            stagger: 0.09,
            ease: "power2.out",
          },
          "<0.15"
        );
    }, rootRef);

    return () => ctx.revert();
  }, [active]);

  /*
   * Detect when the tool layout is visible.
   */
  useEffect(() => {
    const el = layoutRef.current;

    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  /*
   * Automatic tour.
   */
  useLayoutEffect(() => {
    const bar = barRef.current;

    if (!autoplay || !inView || !bar || reduceMotion) {
      if (bar) {
        gsap.set(bar, {
          scaleX: 0,
        });
      }

      return;
    }

    gsap.set(bar, {
      scaleX: 0,
    });

    const tween = gsap.to(bar, {
      scaleX: 1,
      duration: DURATION,
      ease: "none",
      onComplete: () => {
        setActive(
          (i) => (i + 1) % UseCasesData.length
        );
      },
    });

    tweenRef.current = tween;

    return () => {
      tween.kill();
      tweenRef.current = null;
    };
  }, [active, autoplay, inView, reduceMotion]);

  /*
   * Pause/play the automatic tour when hovering over the layout.
   */
  useLayoutEffect(() => {
    const tween = tweenRef.current;

    if (!tween) return;

    if (paused) {
      tween.pause();
    } else {
      tween.play();
    }
  }, [paused, active, autoplay, inView]);

  /*
   * Keep selected tool visible on mobile.
   */
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.matchMedia("(max-width: 767px)").matches
    ) {
      return;
    }

    const list = listRef.current;
    const tab = tabRefs.current[active];

    if (!list || !tab) return;

    list.scrollTo({
      left:
        tab.offsetLeft -
        (list.clientWidth - tab.clientWidth) / 2,
      behavior: "smooth",
    });
  }, [active]);

  /*
   * Select a tool manually.
   */
  const select = (index: number) => {
    setActive(index);

    // Visitor took control.
    setAutoplay(false);
  };

  /*
   * Keyboard navigation for tabs.
   */
  const handleKeyDown = (
    e: ReactKeyboardEvent<HTMLDivElement>
  ) => {
    const n = UseCasesData.length;
    let next = active;

    if (
      e.key === "ArrowDown" ||
      e.key === "ArrowRight"
    ) {
      next = (active + 1) % n;
    } else if (
      e.key === "ArrowUp" ||
      e.key === "ArrowLeft"
    ) {
      next = (active - 1 + n) % n;
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = n - 1;
    } else {
      return;
    }

    e.preventDefault();

    select(next);
    tabRefs.current[next]?.focus();
  };

  /*
   * Light that follows the cursor across the panel.
   */
  const handlePanelMove = (
    e: ReactMouseEvent<HTMLDivElement>
  ) => {
    const r = e.currentTarget.getBoundingClientRect();

    e.currentTarget.style.setProperty(
      "--mx",
      `${e.clientX - r.left}px`
    );

    e.currentTarget.style.setProperty(
      "--my",
      `${e.clientY - r.top}px`
    );
  };

  return (
    <section
      ref={rootRef}
      id="UseCases"
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0c4a6e] to-[#0A1238] px-4 py-8 md:px-16 md:py-10 lg:px-24 xl:px-32"
    >
      <style>{styles}</style>

      {/* =========================================================
          DRIFTING BACKGROUND GLOW
      ========================================================= */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div
          data-orb
          className="absolute -left-24 top-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl"
        />

        <div
          data-orb
          className="absolute right-[-6rem] top-1/2 h-[28rem] w-[28rem] rounded-full bg-[#007a8c]/40 blur-3xl"
        />

        <div
          data-orb
          className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl"
        />
      </div>

      <div className="relative z-10">
        {/* =========================================================
            HEADER
        ========================================================= */}
        <div className="uc-header relative mx-auto flex max-w-7xl flex-col items-center justify-center text-center">
          <SectionTitle
            icon={LayersIcon}
            title="Use Cases"
            subtitle="AI agents built for the everyday work of teaching, from planning lessons to keeping in touch."
          />

          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Go back to home"
            className="uc-back absolute right-0 top-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* =========================================================
            MAIN USE CASE LAYOUT
        ========================================================= */}
        <div
          ref={layoutRef}
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") {
              setPaused(true);
            }
          }}
          onPointerLeave={() => setPaused(false)}
          className="mx-auto mt-10 grid w-full max-w-7xl grid-cols-1 items-start gap-5 md:mt-16 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10"
        >
          {/* =======================================================
              TOOL SELECTOR
          ======================================================= */}
          <div
            ref={listRef}
            role="tablist"
            aria-label="Aevion.AI tools"
            aria-orientation="vertical"
            onKeyDown={handleKeyDown}
            className="uc-scroll uc-scroll-mask relative -mx-3 flex min-w-0 gap-2.5 overflow-x-auto px-3 py-1.5 md:mx-0 md:flex-col md:gap-3 md:overflow-visible md:p-0"
          >
            {UseCasesData.map((tool, i) => {
              const TabIcon =
                ICONS[tool.icon] ?? LayersIcon;

              const isActive = i === active;

              return (
                <button
                  key={tool.title}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  data-uc-tab
                  id={`uc-tab-${i}`}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls="uc-panel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => select(i)}
                  className={`uc-tab relative flex shrink-0 cursor-pointer items-center gap-2.5 overflow-hidden rounded-2xl border px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/50 md:gap-4 md:px-4 md:py-4 ${
                    isActive
                      ? "border-cyan-300/60 bg-white/10 shadow-lg shadow-cyan-400/10"
                      : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  {/* Icon */}
                  <span
                    className={`shrink-0 rounded-xl p-2 transition-colors duration-300 md:p-2.5 ${
                      isActive
                        ? "bg-cyan-300 text-[#0A1238]"
                        : "bg-cyan-300/15 text-[#00d4ff]"
                    }`}
                  >
                    <TabIcon size={22} />
                  </span>

                  {/* Text */}
                  <span className="min-w-0">
                    <span className="block whitespace-nowrap font-urbanist text-sm font-bold text-white md:whitespace-normal md:text-lg">
                      {tool.title}
                    </span>

                    <span className="hidden text-sm text-white/60 md:block">
                      {tool.subtitle}
                    </span>
                  </span>

                  {/* Autoplay progress */}
                  {isActive &&
                    autoplay &&
                    !reduceMotion && (
                      <span
                        ref={barRef}
                        className="absolute bottom-0 left-0 h-[3px] w-full bg-cyan-300"
                        style={{
                          transform: "scaleX(0)",
                          transformOrigin: "left",
                        }}
                        aria-hidden="true"
                      />
                    )}
                </button>
              );
            })}
          </div>

          {/* =======================================================
              DETAIL PANEL
          ======================================================= */}
          <div
            data-uc-panel
            id="uc-panel"
            role="tabpanel"
            aria-labelledby={`uc-tab-${active}`}
            onMouseMove={handlePanelMove}
            className="uc-panel relative min-w-0 overflow-hidden rounded-3xl p-[2px] shadow-2xl shadow-black/30 md:sticky md:top-28"
          >
            {/* Animated border */}
            <div
              className="uc-orbit absolute -inset-[60%]"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, #67e8f9 50deg, #007a8c 110deg, transparent 170deg, transparent 360deg)",
              }}
              aria-hidden="true"
            />

            <div className="relative min-h-[440px] overflow-hidden rounded-[22px] bg-[#0A1238] p-5 sm:p-7 md:min-h-[420px] md:p-10">
              {/* Cursor spotlight */}
              <div
                className="uc-spot pointer-events-none absolute inset-0"
                aria-hidden="true"
              />

              {/* Large background icon */}
              <Icon
                size={160}
                className="pointer-events-none absolute -bottom-8 -right-8 text-white opacity-[0.05] md:-bottom-10 md:-right-10"
                aria-hidden="true"
              />

              <div className="relative flex h-full flex-col">
                {/* Counter + autoplay */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-white/20 px-3 py-1 text-sm font-semibold text-white/70">
                    {active + 1} / {UseCasesData.length}
                  </span>

                  {!reduceMotion && (
                    <button
                      type="button"
                      onClick={() =>
                        setAutoplay((v) => !v)
                      }
                      aria-label={
                        autoplay
                          ? "Pause automatic tour"
                          : "Play automatic tour"
                      }
                      className="flex cursor-pointer items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80 transition-colors duration-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/50 sm:text-sm"
                    >
                      {autoplay ? (
                        <PauseIcon size={14} />
                      ) : (
                        <PlayIcon size={14} />
                      )}

                      {autoplay
                        ? "Pause tour"
                        : "Play tour"}
                    </button>
                  )}
                </div>

                {/* Icon */}
                <div className="relative mt-6 w-fit md:mt-8">
                  <span
                    className="uc-pulse absolute inset-0 rounded-2xl bg-cyan-300/30"
                    aria-hidden="true"
                  />

                  <div
                    data-d="badge"
                    className="relative rounded-2xl bg-cyan-300 p-3 text-[#0A1238] md:p-4"
                  >
                    <Icon size={32} />
                  </div>
                </div>

                {/* Title */}
                <h2
                  data-d="text"
                  className="mt-5 font-urbanist text-2xl font-extrabold leading-tight text-white sm:text-3xl md:mt-6 md:text-4xl"
                >
                  {item.title}
                </h2>

                {/* Subtitle */}
                <p
                  data-d="text"
                  className="mt-2 text-base font-semibold text-[#00d4ff] md:text-lg"
                >
                  {item.subtitle}
                </p>

                {/* Description */}
                <p
                  data-d="text"
                  className="mt-3 max-w-xl text-base leading-relaxed text-white/80 md:mt-4 md:text-lg"
                >
                  {item.description}
                </p>

                {/* Points */}
                <ul className="mt-5 space-y-3 border-t border-white/10 pt-5 md:mt-6 md:pt-6">
                  {item.points.map((point) => (
                    <li
                      key={point}
                      data-d="point"
                      className="flex items-start gap-3 text-sm text-white/85 md:text-base"
                    >
                      <span className="mt-0.5 shrink-0 rounded-full bg-cyan-300/20 p-0.5">
                        <CheckIcon
                          size={16}
                          className="text-cyan-300"
                          aria-hidden="true"
                        />
                      </span>

                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}