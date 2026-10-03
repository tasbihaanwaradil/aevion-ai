import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import SectionTitle from "../components/section-title";
import {
  ArrowLeft,
  ClockIcon,
  LoaderCircleIcon,
  MailIcon,
  MessageSquareIcon,
  SendIcon,
  UserIcon,
} from "lucide-react";
import gsap from "gsap";

type Fields = {
  name: string;
  email: string;
  message: string;
};

type Errors = Partial<Record<keyof Fields, string>>;

type Status = "idle" | "sending" | "success" | "error";

const API_URL =
  import.meta.env.VITE_BASE_URL ?? "http://localhost:3000";

const EMPTY: Fields = {
  name: "",
  email: "",
  message: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function validate(values: Fields): Errors {
  const errors: Errors = {};

  if (values.name.trim().length < 2) {
    errors.name = "Enter your full name.";
  }

  if (!EMAIL_RE.test(values.email.trim())) {
    errors.email =
      "Enter a valid email address, like name@example.com.";
  }

  if (values.message.trim().length < 10) {
    errors.message =
      "Write at least 10 characters so we can help you.";
  }

  return errors;
}

const inputBase =
  "w-full rounded-xl bg-white/5 border pl-12 pr-5 py-4 text-white text-base placeholder:text-white/40 " +
  "outline-none transition-all duration-300 focus:bg-white/10 focus:border-cyan-300 " +
  "focus:shadow-[0_0_0_4px_rgba(103,232,249,0.15)]";

// Keyframes and hover states live here so the file works with no extra CSS setup.
const styles = `
@keyframes ct-orbit {
  to {
    transform: rotate(360deg);
  }
}

@keyframes ct-shimmer {
  0% {
    transform: translateX(-160%) skewX(-20deg);
  }

  55%, 100% {
    transform: translateX(420%) skewX(-20deg);
  }
}

@keyframes ct-pulse {
  0% {
    transform: scale(1);
    opacity: .55;
  }

  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

.ct-orbit {
  animation: ct-orbit 7s linear infinite;
}

.ct-shimmer {
  animation: ct-shimmer 3.4s ease-in-out infinite;
}

.ct-pulse {
  animation: ct-pulse 2.6s ease-out infinite;
}

.ct-spot {
  opacity: 0;
  transition: opacity .3s ease;
  background: radial-gradient(
    420px circle at var(--mx, 50%) var(--my, 50%),
    rgba(103,232,249,.14),
    transparent 60%
  );
}

.ct-card:hover .ct-spot {
  opacity: 1;
}

.ct-icon {
  transition: color .3s ease;
}

.ct-field:focus-within .ct-icon {
  color: #67e8f9;
}

.ct-plane {
  transition: transform .3s ease;
}

.ct-btn:hover:not(:disabled) .ct-plane {
  transform: translate(4px, -4px) rotate(-8deg);
}

.ct-info-row {
  transition: transform .3s ease;
}

.ct-info-row:hover {
  transform: translateX(6px);
}

@media (max-width: 767px) {
  .ct-back {
    position: relative !important;
    right: auto !important;
    top: auto !important;
    align-self: flex-end;
    margin-bottom: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ct-orbit,
  .ct-shimmer,
  .ct-pulse {
    animation: none;
  }
}
`;

export default function ContactSection() {
  const navigate = useNavigate();

  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [sentName, setSentName] = useState("");

  const rootRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const introDone = useRef(false);

  const sent = status === "success";

  // Page entrance: background glow, header, card, panel, then info rows.
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-orb]",
        {
          opacity: 0,
          scale: 0.6,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 1.6,
          stagger: 0.2,
          ease: "power2.out",
        }
      );

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

      gsap.fromTo(
        "[data-anim='header']",
        {
          opacity: 0,
          y: -24,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
        }
      );

      gsap.fromTo(
        "[data-anim='card']",
        {
          opacity: 0,
          x: -60,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          delay: 0.15,
          ease: "power3.out",
          clearProps: "transform",
        }
      );

      gsap.fromTo(
        "[data-anim='panel']",
        {
          opacity: 0,
          x: 60,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          delay: 0.25,
          ease: "power3.out",
          clearProps: "transform",
        }
      );

      gsap.fromTo(
        "[data-info]",
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          delay: 0.7,
          ease: "power2.out",
        }
      );

      gsap.to("[data-float]", {
        y: -8,
        duration: 2.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      gsap.delayedCall(1.4, () => {
        introDone.current = true;
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // Form fields stagger in; success state pops in when message is sent.
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      if (!sent) {
        gsap.fromTo(
          "[data-field]",
          {
            opacity: 0,
            y: 24,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            delay: introDone.current ? 0.05 : 0.6,
            ease: "power3.out",
          }
        );
      } else {
        gsap.fromTo(
          "[data-sent='circle']",
          {
            scale: 0,
            opacity: 0,
          },
          {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: "back.out(2)",
          }
        );

        gsap.fromTo(
          "[data-sent='check']",
          {
            strokeDashoffset: 30,
          },
          {
            strokeDashoffset: 0,
            duration: 0.5,
            delay: 0.3,
            ease: "power2.out",
          }
        );

        gsap.fromTo(
          "[data-sent='text']",
          {
            opacity: 0,
            y: 16,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.35,
            ease: "power2.out",
          }
        );
      }
    }, rootRef);

    return () => ctx.revert();
  }, [sent]);

  // Submit button gently follows the cursor.
  useEffect(() => {
    const btn = btnRef.current;

    if (!btn || prefersReducedMotion()) return;

    const move = (e: MouseEvent) => {
      if (btn.disabled) return;

      const r = btn.getBoundingClientRect();

      gsap.to(btn, {
        x: (e.clientX - r.left - r.width / 2) * 0.2,
        y: (e.clientY - r.top - r.height / 2) * 0.3,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const leave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.4)",
      });
    };

    btn.addEventListener("mousemove", move);
    btn.addEventListener("mouseleave", leave);

    return () => {
      btn.removeEventListener("mousemove", move);
      btn.removeEventListener("mouseleave", leave);
      gsap.killTweensOf(btn);
    };
  }, [sent]);

  // Light that follows the cursor across the form card.
  const handleCardMove = (
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

  const handleChange =
    (field: keyof Fields) =>
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      setValues((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));

      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }

      if (status === "error") {
        setStatus("idle");
      }
    };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const found = validate(values);
    setErrors(found);

    const invalid = Object.keys(found);

    if (invalid.length > 0) {
      // Shake each invalid field and move focus to the first one.
      if (!prefersReducedMotion()) {
        invalid.forEach((key) => {
          const el = rootRef.current?.querySelector(
            `[data-field="${key}"]`
          );

          if (el) {
            gsap.to(el, {
              keyframes: {
                x: [-8, 8, -6, 6, -3, 3, 0],
                easeEach: "power1.inOut",
              },
              duration: 0.4,
            });
          }
        });
      }

      document.getElementById(invalid[0])?.focus();

      return;
    }

    setStatus("sending");

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          message: values.message.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      setSentName(
        values.name.trim().split(" ")[0]
      );

      setValues(EMPTY);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section
      ref={rootRef}
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0c4a6e] to-[#0A1238] pb-24 pt-8"
    >
      <style>{styles}</style>

      {/* Drifting background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div
          data-orb
          className="absolute -left-24 top-20 h-96 w-96 rounded-full bg-cyan-400/25 blur-3xl"
        />

        <div
          data-orb
          className="absolute right-[-6rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-[#007a8c]/40 blur-3xl"
        />

        <div
          data-orb
          className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl"
        />
      </div>

      <div className="relative z-10">
        {/* Section Header */}
        <div className="px-4 md:px-16 lg:px-24 xl:px-32">
          <div
            data-anim="header"
            className="relative mx-auto flex max-w-7xl flex-col items-center justify-center text-center"
          >
            {/* Back Button */}
            <button
              type="button"
              onClick={() => navigate("/")}
              aria-label="Go back to home"
              className="ct-back absolute right-0 top-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <SectionTitle
              icon={MessageSquareIcon}
              title="Contact us"
              subtitle="Send us a message about Aevion.AI and our team will reply by email."
            />
          </div>
        </div>

        {/* Form + Info */}
        <div className="mt-16 px-4 md:px-16 lg:px-24 xl:px-32">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-12 md:grid-cols-2">
            {/* Form card with a light travelling around its border */}
            <div
              data-anim="card"
              onMouseMove={handleCardMove}
              className="ct-card relative overflow-hidden rounded-3xl p-[2px] shadow-2xl shadow-black/30"
            >
              <div
                className="ct-orbit absolute -inset-[60%]"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, #67e8f9 50deg, #007a8c 110deg, transparent 170deg, transparent 360deg)",
                }}
                aria-hidden="true"
              />

              <div className="relative overflow-hidden rounded-[22px] bg-[#0A1238] p-7 md:p-10">
                <div
                  className="ct-spot pointer-events-none absolute inset-0"
                  aria-hidden="true"
                />

                <div className="relative">
                  {sent ? (
                    <div
                      className="flex min-h-[420px] flex-col items-center justify-center text-center"
                      role="status"
                      aria-live="polite"
                    >
                      <div
                        data-sent="circle"
                        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/50 bg-cyan-300/15"
                      >
                        <svg
                          width="36"
                          height="36"
                          viewBox="0 0 32 32"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            data-sent="check"
                            d="M7 17l6 6 12-13"
                            stroke="#67e8f9"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pathLength={30}
                            strokeDasharray={30}
                          />
                        </svg>
                      </div>

                      <h3
                        data-sent="text"
                        className="font-urbanist text-3xl font-extrabold text-white"
                      >
                        Message sent
                      </h3>

                      <p
                        data-sent="text"
                        className="mt-3 max-w-sm text-lg text-white/80"
                      >
                        {sentName
                          ? `Thanks, ${sentName}. `
                          : "Thanks. "}
                        We'll reply to your email within
                        1–2 working days.
                      </p>

                      <button
                        data-sent="text"
                        type="button"
                        onClick={() => setStatus("idle")}
                        className="mt-8 cursor-pointer rounded-full border border-white/30 px-8 py-3 font-bold text-white transition-colors duration-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/50"
                      >
                        Send another message
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSubmit}
                      noValidate
                      className="space-y-6"
                    >
                      {/* Name */}
                      <div data-field="name">
                        <label
                          htmlFor="name"
                          className="mb-2 block font-urbanist text-lg font-bold text-white"
                        >
                          Name
                        </label>

                        <div className="ct-field relative">
                          <UserIcon
                            size={20}
                            className="ct-icon absolute left-4 top-[1.1rem] text-white/50"
                          />

                          <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            placeholder="Your full name"
                            value={values.name}
                            onChange={handleChange("name")}
                            aria-invalid={!!errors.name}
                            aria-describedby={
                              errors.name
                                ? "name-error"
                                : undefined
                            }
                            className={`${inputBase} ${
                              errors.name
                                ? "border-red-300"
                                : "border-white/20"
                            }`}
                          />
                        </div>

                        {errors.name && (
                          <p
                            id="name-error"
                            className="mt-2 text-sm text-red-300"
                          >
                            {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div data-field="email">
                        <label
                          htmlFor="email"
                          className="mb-2 block font-urbanist text-lg font-bold text-white"
                        >
                          Email address
                        </label>

                        <div className="ct-field relative">
                          <MailIcon
                            size={20}
                            className="ct-icon absolute left-4 top-[1.1rem] text-white/50"
                          />

                          <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="name@example.com"
                            value={values.email}
                            onChange={handleChange("email")}
                            aria-invalid={!!errors.email}
                            aria-describedby={
                              errors.email
                                ? "email-error"
                                : undefined
                            }
                            className={`${inputBase} ${
                              errors.email
                                ? "border-red-300"
                                : "border-white/20"
                            }`}
                          />
                        </div>

                        {errors.email && (
                          <p
                            id="email-error"
                            className="mt-2 text-sm text-red-300"
                          >
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Message */}
                      <div data-field="message">
                        <label
                          htmlFor="message"
                          className="mb-2 block font-urbanist text-lg font-bold text-white"
                        >
                          Message
                        </label>

                        <div className="ct-field relative">
                          <MessageSquareIcon
                            size={20}
                            className="ct-icon absolute left-4 top-[1.1rem] text-white/50"
                          />

                          <textarea
                            id="message"
                            name="message"
                            rows={6}
                            placeholder="How can we help?"
                            value={values.message}
                            onChange={handleChange("message")}
                            aria-invalid={!!errors.message}
                            aria-describedby={
                              errors.message
                                ? "message-error"
                                : undefined
                            }
                            className={`${inputBase} resize-y ${
                              errors.message
                                ? "border-red-300"
                                : "border-white/20"
                            }`}
                          />
                        </div>

                        {errors.message && (
                          <p
                            id="message-error"
                            className="mt-2 text-sm text-red-300"
                          >
                            {errors.message}
                          </p>
                        )}
                      </div>

                      {/* Submit */}
                      <div data-field="action">
                        <button
                          ref={btnRef}
                          type="submit"
                          disabled={status === "sending"}
                          className="ct-btn relative inline-flex cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-cyan-300 to-cyan-400 px-10 py-4 text-lg font-bold text-[#0A1238] shadow-lg shadow-cyan-400/30 transition-shadow duration-300 hover:shadow-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/50"
                        >
                          <span
                            className="ct-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                            aria-hidden="true"
                          />

                          {status === "sending" ? (
                            <>
                              <LoaderCircleIcon
                                size={20}
                                className="relative animate-spin"
                              />

                              <span className="relative">
                                Sending…
                              </span>
                            </>
                          ) : (
                            <>
                              <SendIcon
                                size={20}
                                className="ct-plane relative"
                              />

                              <span className="relative">
                                Send message
                              </span>
                            </>
                          )}
                        </button>

                        <div
                          aria-live="polite"
                          role="status"
                          className="mt-4 min-h-[1.5rem]"
                        >
                          {status === "error" && (
                            <p className="font-medium text-red-300">
                              Your message didn't send. Check
                              your connection and try again.
                            </p>
                          )}
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* Info panel */}
            <div
              data-anim="panel"
              className="md:sticky md:top-32"
            >
              <div className="relative flex w-full flex-col items-start gap-6 overflow-hidden rounded-3xl border border-white/10 bg-[#007a8c]/90 p-10 shadow-2xl shadow-black/20">
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
                  aria-hidden="true"
                />

                <div
                  data-info
                  className="relative"
                >
                  <div
                    data-float
                    className="relative"
                  >
                    <span
                      className="ct-pulse absolute inset-0 rounded-xl bg-white/30"
                      aria-hidden="true"
                    />

                    <div className="relative rounded-xl bg-white/20 p-3">
                      <SendIcon
                        className="text-white"
                        size={28}
                      />
                    </div>
                  </div>
                </div>

                <h3
                  data-info
                  className="relative font-urbanist text-2xl font-extrabold leading-tight text-white md:text-4xl"
                >
                  Your feedback matters!
                </h3>

                <p
                  data-info
                  className="relative text-lg font-medium text-white/90"
                >
                  Whether you’re a teacher or a student, we’d
                  love to hear your thoughts and ideas to make
                  Aevion.AI even better.
                </p>

                <ul className="relative space-y-4 text-white">
                  <li
                    data-info
                    className="ct-info-row flex items-center gap-3"
                  >
                    <span className="rounded-lg bg-white/20 p-2">
                      <ClockIcon size={20} />
                    </span>

                    <span className="font-medium">
                      Replies within 1–2 working days
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}