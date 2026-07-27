import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTeacherAuth } from "../context/TeacherAuthContext";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useTeacherAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const message = await forgotPassword(email.trim());
      setSuccessMessage(message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#0A1238] px-4 pt-16 pb-12">
      <div className="w-full max-w-md bg-white rounded-2xl px-10 py-12 shadow-2xl relative z-10 text-center">
        <h1 className="text-3xl text-[#2d5f6e] font-bold mb-2">
          Forgot Password
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Enter your email and we'll send you a password reset link.
        </p>

        {successMessage ? (
          <div>
            <p className="text-green-600 text-sm mb-6">{successMessage}</p>
            <p className="text-gray-500 text-sm mb-6">
              Didn't get it?{" "}
              <button
                type="button"
                onClick={() => setSuccessMessage("")}
                className="text-[#2d5f6e] font-bold hover:underline"
              >
                Try again
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-600 mb-2 text-left"
            >
              Email
            </label>

            <div className="bg-gray-100 rounded-xl">
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-5 bg-transparent text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-8 w-full h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold hover:bg-[#244d5a] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)]"
            >
              {isSubmitting ? "Sending..." : "Submit"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => navigate("/Teacherlogin")}
          className="inline-block mt-6 text-[#2d5f6e] font-medium hover:underline"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;