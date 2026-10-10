import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTeacherAuth } from "../context/TeacherAuthContext";
import { Link, useNavigate } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";

// Letters and spaces only, 2–50 characters.
const NAME_REGEX = /^[A-Za-z\s]{2,50}$/;
// Standard, permissive email shape check.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// At least 8 characters, with at least one letter and one number.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

const NewTearcherAccount = () => {
  const { user } = useAuth();
  const { teacher, signUp, login } = useTeacherAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

    if (!agreed) {
      setError("Please agree to the terms and privacy policy.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp({
        name: fullName,
        email: formData.email,
        password: formData.password,
      });

      // No email verification — sign the teacher in straight away.
      // The effect below redirects to /Dashboard once `teacher` is set.
      await login({ email: formData.email, password: formData.password });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong creating your account. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (user || teacher) {
      navigate("/Dashboard");
    }
  }, [user, teacher, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#0A1238] px-4 pt-16 pb-12">
      {/* Student login note */}
      <p className="text-gray-300 text-sm text-center mb-8">
        Students do not need an account. Join a teacher's room here:{" "}
        <a href="#" className="text-[#6fb3c9] hover:underline">
          Student Login
        </a>
      </p>

      {/* Eyebrow */}
      <p className="text-gray-300 text-xs font-bold tracking-widest uppercase mb-8">
        New Teacher Account
      </p>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl px-10 py-14 shadow-2xl relative z-10"
      >
        <h1 className="text-3xl text-[#2d5f6e] font-bold text-center mb-2">
          Profile
        </h1>
        <p className="text-gray-600 text-sm text-center mb-8">
          Create your account to get started
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
            <PasswordInput
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
            <PasswordInput
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full h-14 px-5 bg-transparent text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
              required
            />
          </div>
        </div>

        <label className="flex items-start gap-2 mt-8 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2d5f6e] focus:ring-[#2d5f6e]"
          />
          <span>
            I agree to the{" "}
            <Link
              to="/terms"
              className="text-[#2d5f6e] font-medium hover:underline"
            >
              terms
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="text-[#2d5f6e] font-medium hover:underline"
            >
              privacy policy
            </Link>
            .
          </span>
        </label>

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
            disabled={submitting}
            className="flex-1 h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating…" : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTearcherAccount;