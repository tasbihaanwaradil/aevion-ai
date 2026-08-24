import React, { useEffect, useState } from "react";
import { useTeacherAuth } from "../context/TeacherAuthContext";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

const TeacherLogin = () => {
  const { teacher, login } = useTeacherAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login(formData);
  };

  // Google redirects back here with a status flag instead of a session
  // when the teacher isn't eligible to log in yet.
  useEffect(() => {
    const status = searchParams.get("authStatus");
    const email = searchParams.get("email");

    if (status === "unverified") {
      toast.error("Please verify your email before signing in.");
      navigate("/VerifyEmail", { state: { email } });
    } else if (status === "notfound") {
      toast.error("No account found for that Google email. Please create one first.");
      navigate("/Newteacheraccount");
    } else if (status === "error") {
      toast.error("Something went wrong signing in with Google. Please try again.");
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (teacher) {
      navigate("/TeacherDashboard");
    }
  }, [teacher, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#0A1238] px-4 pt-16 pb-12">
      {/* Tagline */}
      <p className="text-gray-300 text-sm text-center max-w-md mb-8">
        Make learning measurable with interactive assessments, instant grading, and live progress visualization.
      </p>

      {/* Login card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl px-10 py-12 shadow-2xl relative z-10"
      >
        <h1 className="text-3xl text-[#2d5f6e] font-bold text-center mb-6">
          Teacher Login
        </h1>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Email
            </label>
            <div className="bg-gray-100 rounded-xl">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-14 px-5 bg-transparent text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Password
            </label>
            <div className="bg-gray-100 rounded-xl">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full h-14 px-5 bg-transparent text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
                required
              />
            </div>
          </div>
        </div>

        <Link
          to="/ForgotPassword"
          className="inline-block mt-3 text-sm text-[#2d5f6e] hover:underline"
        >
          Reset password
        </Link>

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-8 w-full h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold text-lg hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)]"
        >
          Sign In
        </button>

        <p className="text-center text-sm text-gray-400 my-4">Or</p>

        {/* Google Button */}
        <button
          type="button"
          onClick={() => {
            window.location.href = "http://localhost:3000/api/teacher-auth/google";
          }}
          className="w-full h-14 rounded-2xl border border-gray-200 flex items-center justify-center gap-3 hover:bg-gray-100 transition text-gray-700 font-medium"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-5 h-5"
            alt="Google"
          />
          <span>Sign in with Google</span>
        </button>
      </form>

      {/* Create account card */}
      <div className="w-full max-w-md bg-white rounded-2xl px-10 py-8 shadow-2xl relative z-10 mt-6">
        <h2 className="text-2xl text-[#2d5f6e] font-bold text-center mb-4">New here?</h2>
        <button
          type="button"
          onClick={() => navigate("/Newteacheraccount")}
          className="w-full h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)]"
        >
          Create Account
        </button>
      </div>
    </div>
  );
};

export default TeacherLogin;