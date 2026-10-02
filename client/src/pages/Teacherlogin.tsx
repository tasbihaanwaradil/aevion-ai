import React, { useEffect, useRef, useState } from "react";
import { useTeacherAuth } from "../context/TeacherAuthContext";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import gsap from "gsap";
import { BASE_URL } from "../configs/Config";

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const FEATURES = [
  {
    title: "Quiz Studio",
    desc: "Turn uploaded documents into quizzes.",
    tint: "bg-[#7be0c3]/20 text-[#7be0c3]",
    icon: (
      <Icon>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </Icon>
    ),
  },
  {
    title: "Live Quiz Room",
    desc: "Host live quizzes with real-time results.",
    tint: "bg-[#ff8a7a]/20 text-[#ff8a7a]",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="2" />
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
      </Icon>
    ),
  },
  {
    title: "Student Insights",
    desc: "Assess and track student performance.",
    tint: "bg-[#8fb2ff]/20 text-[#8fb2ff]",
    icon: (
      <Icon>
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
      </Icon>
    ),
  },
  {
    title: "Academic Email Assistant",
    desc: "Create and schedule academic emails.",
    tint: "bg-[#ffd166]/20 text-[#ffd166]",
    icon: (
      <Icon>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 5L2 7" />
      </Icon>
    ),
  },
  {
    title: "LinkedIn Post Studio",
    desc: "Craft professional posts tailored to your audience and tone.",
    tint: "bg-[#c4a8ff]/20 text-[#c4a8ff]",
    icon: (
      <Icon>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </Icon>
    ),
  },
  {
    title: "Smart Teaching Reminders",
    desc: "Stay on top of teaching tasks and deadlines with timely reminders.",
    tint: "bg-[#ffb3d9]/20 text-[#ffb3d9]",
    icon: (
      <Icon>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </Icon>
    ),
  },
  {
    title: "Lesson Slide Studio",
    desc: "Create complete teaching presentations with engaging visuals.",
    tint: "bg-[#7be0c3]/20 text-[#7be0c3]",
    icon: (
      <Icon>
        <path d="M2 3h20" />
        <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
        <path d="m7 21 5-5 5 5" />
      </Icon>
    ),
  },
  {
    title: "PDF Lesson Studio",
    desc: "Transform PDF documents into engaging teaching slides.",
    tint: "bg-[#ff8a7a]/20 text-[#ff8a7a]",
    icon: (
      <Icon>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </Icon>
    ),
  },
];

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

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLUListElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const status = searchParams.get("authStatus");

    if (status === "notfound") {
      toast.error(
        "No account found for that Google email. Please create one first.",
      );
      navigate("/Newteacheraccount");
    } else if (status === "error") {
      toast.error(
        "Something went wrong signing in with Google. Please try again.",
      );
    }
  }, [searchParams, navigate]);

  // Redirect only after a login attempt made on THIS page just succeeded —
  // visiting /Teacherlogin directly always shows the form, even if a
  // previous session is still technically valid, so the teacher can
  // choose which account to sign in with.
  useEffect(() => {
    if (teacher && attemptingLogin) {
      navigate("/Dashboard");
    }
  }, [teacher, attemptingLogin, navigate]);

  // Entrance animation — the form rises in, then the feature tiles
  // cascade into place on the left.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (formPanelRef.current) {
        tl.fromTo(
          formPanelRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.6 },
        );
      }

      if (featuresRef.current) {
        tl.fromTo(
          featuresRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.07 },
          "-=0.4",
        );
      }
    });

    return () => ctx.revert();
  }, []);

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
    <div className="min-h-screen flex bg-white">
      {/* ───────────── LEFT: brand + product preview ───────────── */}
      <div
        ref={leftPanelRef}
        className="hidden lg:flex w-[48%] flex-col justify-center px-10 xl:px-14 py-10 bg-gradient-to-br from-[#0A1238] via-[#2a2f9e] to-[#7b3fe4] relative overflow-hidden"
      >
        {/* colour glows + dotted texture */}
        <div className="absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full bg-[#2dd4bf] opacity-25 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] rounded-full bg-[#ff6bb5] opacity-30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative z-10 w-full max-w-xl mx-auto">
          {/* wordmark */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 border border-white/25 backdrop-blur">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-white"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z" />
              </svg>
            </span>
            <span className="text-xl font-bold text-white tracking-tight">
              Aevion.AI
            </span>
          </div>

          <h2 className="mt-8 text-[2.75rem] xl:text-5xl font-extrabold text-white leading-[1.08] tracking-tight">
            Teach smarter. Let AI handle the rest.
          </h2>
          <p className="mt-4 text-base text-indigo-100/85 max-w-md">
            Specialized AI agents that simplify content creation, quiz
            generation, and student assessment.
          </p>

          {/* feature icon tiles */}
          <ul ref={featuresRef} className="mt-9 grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <li
                key={f.title}
                className="rounded-2xl bg-white/10 border border-white/15 p-4 backdrop-blur-sm hover:bg-white/15 transition-colors"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${f.tint}`}
                >
                  {f.icon}
                </span>
                <p className="mt-3 text-sm font-semibold text-white">
                  {f.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-indigo-100/75">
                  {f.desc}
                </p>
              </li>
            ))}
          </ul>
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
              <input
                id="password"
                type="password"
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