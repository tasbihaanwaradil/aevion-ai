import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const TOTAL_STEPS = 3;

// Letters and spaces only, 2–50 characters.
const NAME_REGEX = /^[A-Za-z\s]{2,50}$/;
// Standard, permissive email shape check.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// At least 8 characters, with at least one letter and one number.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

const NewTearcherAccount = () => {
  const [step] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    if (
      !NAME_REGEX.test(formData.firstName) ||
      !NAME_REGEX.test(formData.lastName)
    ) {
      setError("Names can only contain letters and spaces.");
      return;
    }

    if (!EMAIL_REGEX.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.email !== formData.confirmEmail) {
      setError("Email addresses do not match.");
      return;
    }

    if (!PASSWORD_REGEX.test(formData.password)) {
      setError(
        "Password must be at least 8 characters and include a letter and a number.",
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Profile data is carried forward via route state so the final step
    // (AboutYou) can call signUp with everything collected across all
    // three steps, instead of creating the account here on step 1.
    navigate("/Demographics", {
      state: {
        name: fullName,
        email: formData.email,
        password: formData.password,
      },
    });
  };

  useEffect(() => {
    if (user) {
      navigate("/Dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#0A1238] px-4 pt-16 pb-12">
      {/* Logo
      <Link to="/" className="mb-6">
        <img src="/assets/logo.svg" alt="logo" className="h-16.5 w-auto" />
      </Link> */}

      {/* Student login note */}
      <p className="text-gray-300 text-sm text-center mb-8">
        Students do not need an account. Join a teacher's room here:{" "}
        <a href="#" className="text-[#6fb3c9] hover:underline">
          Student Login
        </a>
      </p>

      {/* Eyebrow */}
      <p className="text-gray-300 text-xs font-bold tracking-widest uppercase mb-4">
        New Teacher Account
      </p>

      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8 w-full max-w-md">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(
          (num, idx) => (
            <React.Fragment key={num}>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  num === step
                    ? "bg-[#2d5f6e] border-[#2d5f6e] text-white"
                    : num < step
                      ? "bg-[#2d5f6e]/20 border-[#2d5f6e] text-[#2d5f6e]"
                      : "bg-transparent border-gray-400 text-gray-400"
                }`}
              >
                {num}
              </div>
              {idx < TOTAL_STEPS - 1 && (
                <div
                  className={`flex-1 h-px mx-2 ${
                    num < step ? "bg-[#2d5f6e]" : "bg-gray-500/40"
                  }`}
                />
              )}
            </React.Fragment>
          ),
        )}
      </div>

      <form
        onSubmit={handleNext}
        className="w-full max-w-md bg-white rounded-2xl px-10 py-14 shadow-2xl relative z-10"
      >
        <h1 className="text-3xl text-[#2d5f6e] font-bold text-center mb-2">
          Profile
        </h1>
        <p className="text-gray-600 text-sm text-center mb-8">
          Create your teacher account to get started
        </p>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-gray-100 rounded-xl">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              pattern="[A-Za-z\s]{2,50}"
              title="Letters and spaces only"
              className="w-full h-14 px-5 bg-transparent text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
              required
            />
          </div>

          <div className="bg-gray-100 rounded-xl">
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              pattern="[A-Za-z\s]{2,50}"
              title="Letters and spaces only"
              className="w-full h-14 px-5 bg-transparent text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
              required
            />
          </div>

          <div className="bg-gray-100 rounded-xl">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full h-14 px-5 bg-transparent text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
              required
            />
          </div>

          <div className="bg-gray-100 rounded-xl">
            <input
              type="email"
              name="confirmEmail"
              placeholder="Confirm Email"
              value={formData.confirmEmail}
              onChange={handleChange}
              className="w-full h-14 px-5 bg-transparent text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
              required
            />
          </div>

          <div className="bg-gray-100 rounded-xl">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              title="At least 8 characters, with a letter and a number"
              className="w-full h-14 px-5 bg-transparent text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
              required
            />
          </div>

          <div className="bg-gray-100 rounded-xl">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full h-14 px-5 bg-transparent text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
              required
            />
          </div>
        </div>

        <div className="flex gap-4 mt-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 h-14 rounded-2xl border border-[#2d5f6e] text-[#2d5f6e] font-bold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)]"
          >
            Next
          </button>
        </div>

        {/* Switch
        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account?
          <Link
            to="/login"
            className="ml-1 font-bold text-[#2d5f6e] hover:underline"
          >
            Click here
          </Link>
        </p> */}
      </form>
    </div>
  );
};

export default NewTearcherAccount;
