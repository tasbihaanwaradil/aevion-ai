import React, { useEffect, useRef, useState } from "react";
import { useTeacherAuth } from "../context/TeacherAuthContext";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import gsap from "gsap";
import { BASE_URL } from "../configs/Config";
import PasswordInput from "../components/PasswordInput";

// Short product clips (files live in public/videos/login/).
// Each clip plays once, then the next one starts automatically.
const CLIPS = [
  {
    id: "quiz-topic",
    label: "Quiz from a topic",
    caption: "Describe a topic, get a ready-to-use quiz",
    src: "/videos/login/quiz-topic.mp4",
    poster: "/videos/login/quiz-topic.jpg",
  },
  {
    id: "quiz-pdf",
    label: "Quiz from a PDF",
    caption: "Turn any document into a quiz in seconds",
    src: "/videos/login/quiz-pdf.mp4",
    poster: "/videos/login/quiz-pdf.jpg",
  },
  {
    id: "slides",
    label: "Lesson slides",
    caption: "Generate a complete slide deck from a single topic",
    src: "/videos/login/slides.mp4",
    poster: "/videos/login/slides.jpg",
  },
  {
    id: "email",
    label: "Academic email",
    caption: "Draft professional emails instantly",
    src: "/videos/login/email.mp4",
    poster: "/videos/login/email.jpg",
  },
  {
    id: "linkedin",
    label: "LinkedIn post",
    caption: "Share your achievements with a polished post",
    src: "/videos/login/linkedin.mp4",
    poster: "/videos/login/linkedin.jpg",
  },
  {
    id: "reminders",
    label: "Reminders",
    caption: "Stay on top of every deadline",
    src: "/videos/login/reminders.mp4",
    poster: "/videos/login/reminders.jpg",
  },
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const TeacherLogin = () => {
  const { teacher, login } = useTeacherAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Only true once the user has actually submitted this form — this is
  // what distinguishes "just logged in, please redirect" from "a stale
  // session cookie from days ago happened to still be valid on mount".
  const [attemptingLogin, setAttemptingLogin] = useState(false);

  // Video showcase state.
  const [active, setActive] = useState(0);
  const [reduced] = useState(prefersReducedMotion);
  const clip = CLIPS[active];

  const rootRef = useRef<HTMLDivElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const googleBtnRef = useRef<HTMLButtonElement>(null);
  const createBtnRef = useRef<HTMLButtonElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAttemptingLogin(true);
    login(formData);
  };

  const nextClip = () => setActive((i) => (i + 1) % CLIPS.length);

  // Google sign-in now creates the account automatically on the backend
  // for first-time users, so "notfound" is no longer a possible status —
  // only genuine errors are surfaced here.
  useEffect(() => {
    const status = searchParams.get("authStatus");

    if (status === "error") {
      toast.error(
        "Something went wrong signing in with Google. Please try again.",
      );
    }
  }, [searchParams]);

  // Redirect only after a login attempt made on THIS page just succeeded —
  // visiting /Teacherlogin directly always shows the form, even if a
  // previous session is still technically valid, so the teacher can
  // choose which account to sign in with.
  useEffect(() => {
    if (teacher && attemptingLogin) {
      navigate("/Dashboard");
    }
  }, [teacher, attemptingLogin, navigate]);

  // Entrance animation — the form rises in, then the left panel cascades.
  useEffect(() => {
    if (reduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (formPanelRef.current) {
        tl.fromTo(
          formPanelRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.6 },
        );
      }

      tl.fromTo(
        ".left-item",
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.12,
          clearProps: "opacity,transform",
        },
        "-=0.4",
      );
    }, rootRef);

    return () => ctx.revert();
  }, [reduced]);

  // When the clip changes: reset progress, animate the caption in,
  // and warm the browser cache with the next clip.
  useEffect(() => {
    if (progressRef.current) progressRef.current.style.width = "0%";

    if (!reduced && captionRef.current) {
      gsap.fromTo(
        captionRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" },
      );
    }

    fetch(CLIPS[(active + 1) % CLIPS.length].src).catch(() => {});

    return () => {
      if (captionRef.current) gsap.killTweensOf(captionRef.current);
    };
  }, [active, reduced]);

  const handleBtnHover = (
    ref: React.RefObject<HTMLButtonElement | null>,
    entering: boolean,
  ) => {
    if (!ref.current) return;
    gsap.to(ref.current, {
      scale: entering ? 1.01 : 1,
      duration: 0.2,
      ease: "power2.out",
    });
  };

  return (
    <div ref={rootRef} className="min-h-screen flex bg-white">
      {/* ───────────── LEFT: product video showcase ───────────── */}
      <div className="hidden lg:flex w-[48%] flex-col justify-center px-10 xl:px-14 py-10 bg-gradient-to-br from-[#0c4a6e] to-[#0A1238] relative overflow-hidden">
        {/* soft glows for depth */}
        <div className="absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full bg-[#007a8c] opacity-30 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 w-[26rem] h-[26rem] rounded-full bg-[#615fff] opacity-20 blur-3xl" />

        <div className="relative z-10 w-full max-w-xl mx-auto">
          {/* badge */}
          <div className="left-item inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7be0c3] opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-[#7be0c3]" />
            </span>
            See it in action
          </div>

          {/* headline */}
          <h2 className="left-item mt-5 font-urbanist text-[2.5rem] xl:text-5xl font-extrabold text-white leading-[1.08] tracking-tight">
            Your AI Teaching Assistant,{" "}
            <span className="bg-gradient-to-r from-[#7be0c3] to-[#8fb2ff] bg-clip-text text-transparent">
              Always Ready
            </span>
          </h2>

          {/* video window */}
          <div className="left-item mt-8 overflow-hidden rounded-2xl border border-white/20 bg-[#0A1238] shadow-2xl shadow-black/40">
            {/* title bar */}
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                <span className="size-2.5 rounded-full bg-[#febc2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="truncate text-xs font-medium text-white/70">
                Aevion.AI — {clip.label}
              </span>
            </div>

            {/* video */}
            <div className="relative aspect-[800/400] w-full bg-[#0A1238]">
              <video
                key={clip.id}
                src={clip.src}
                poster={clip.poster}
                muted
                playsInline
                autoPlay={!reduced}
                preload="auto"
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  if (progressRef.current && v.duration) {
                    progressRef.current.style.width = `${(v.currentTime / v.duration) * 100}%`;
                  }
                }}
                onEnded={reduced ? undefined : nextClip}
                className="h-full w-full object-contain"
              />

              {/* progress bar */}
              {!reduced && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                  <div
                    ref={progressRef}
                    className="h-full w-0 bg-gradient-to-r from-[#7be0c3] to-[#8fb2ff]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* caption */}
          <p
            ref={captionRef}
            className="left-item mt-5 flex min-h-[2rem] items-center gap-2 font-urbanist text-lg xl:text-xl font-semibold text-[#7be0c3]"
          >
            <span aria-hidden="true">✦</span>
            {clip.caption}
          </p>

          {/* clip selector */}
          <div className="left-item mt-4 flex flex-wrap gap-2">
            {CLIPS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={i === active}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ${
                  i === active
                    ? "border-[#007a8c] bg-[#007a8c] text-white shadow-lg shadow-black/20"
                    : "border-white/20 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ───────────── RIGHT: sign in form ───────────── */}
      <div className="flex-1 flex items-center justify-center px-2 py-12">
        <div ref={formPanelRef} className="w-full max-w-md">
          <Link to="/" className="inline-block mb-8">
            <img src="/assets/logo.svg" alt="logo" className="h-20 w-auto" />
          </Link>

          <h1 className="text-3xl font-semibold text-gray-900">
            Sign in or create an account
          </h1>
          <p className="mt-2 text-gray-700">Then start using</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-12 px-4 bg-gray-100 border border-gray-300 rounded-md text-gray-800 outline-none focus:border-[#2d5f6e] focus:ring-2 focus:ring-[#2d5f6e]/30"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full h-12 px-4 bg-gray-100 border border-gray-300 rounded-md text-gray-800 outline-none focus:border-[#2d5f6e] focus:ring-2 focus:ring-[#2d5f6e]/30"
                required
              />
              <Link
                to="/ForgotPassword"
                className="inline-block mt-2 text-sm text-[#2d5f6e] hover:underline"
              >
                Reset password
              </Link>
            </div>

            <button
              ref={submitBtnRef}
              type="submit"
              onMouseEnter={() => handleBtnHover(submitBtnRef, true)}
              onMouseLeave={() => handleBtnHover(submitBtnRef, false)}
              className="w-full h-12 rounded-md bg-[#2d5f6e] text-white font-semibold hover:bg-[#244d5a] transition-colors"
            >
              Sign in
            </button>
          </form>

          {/* divider */}
          <div className="flex items-center gap-4 my-6">
            <span className="text-sm text-gray-500">Or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="space-y-3">
            <button
              ref={googleBtnRef}
              type="button"
              onMouseEnter={() => handleBtnHover(googleBtnRef, true)}
              onMouseLeave={() => handleBtnHover(googleBtnRef, false)}
              onClick={() => {
                window.location.href = `${BASE_URL}/api/teacher-auth/google`;
              }}
              className="w-full h-12 px-5 rounded-md bg-gray-100 border border-gray-300 flex items-center gap-4 text-gray-900 font-medium hover:bg-gray-200 transition-colors"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-6 h-6"
                alt=""
              />
              <span>Continue with Google</span>
            </button>

            <button
              ref={createBtnRef}
              type="button"
              onMouseEnter={() => handleBtnHover(createBtnRef, true)}
              onMouseLeave={() => handleBtnHover(createBtnRef, false)}
              onClick={() => navigate("/Newteacheraccount")}
              className="w-full h-12 px-5 rounded-md bg-gray-100 border border-gray-300 flex items-center gap-4 text-gray-900 font-medium hover:bg-gray-200 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-900"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.33 0-8 1.67-8 5v1h16v-1c0-3.33-4.67-5-8-5z" />
              </svg>
              <span>Create an account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;