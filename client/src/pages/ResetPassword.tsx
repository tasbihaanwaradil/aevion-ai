import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTeacherAuth } from "../context/TeacherAuthContext";

// Same rule shown to the user on NewTearcherAccount — kept in sync so
// the message matches what the backend actually requires.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

const ResetPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useTeacherAuth();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const linkIsValid = Boolean(token && email);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!PASSWORD_REGEX.test(password)) {
      setError(
        "Password must be at least 8 characters and include a letter and a number."
      );
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email, token, password);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reset your password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#0A1238] px-4 pt-16 pb-12">
      <div className="w-full max-w-md bg-white rounded-2xl px-10 py-12 shadow-2xl relative z-10 text-center">
        <h1 className="text-3xl text-[#2d5f6e] font-bold mb-2">
          Reset Password
        </h1>

        {!linkIsValid ? (
          <>
            <p className="text-gray-500 text-sm mb-8">
              This password reset link is missing some information — it may
              have been copied incorrectly.
            </p>
            <Link
              to="/ForgotPassword"
              className="text-[#2d5f6e] font-bold hover:underline"
            >
              Request a new link
            </Link>
          </>
        ) : success ? (
          <>
            <p className="text-green-600 text-sm mb-8">
              Your password has been reset. You can now log in.
            </p>
            <button
              type="button"
              onClick={() => navigate("/Teacherlogin")}
              className="w-full h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)]"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-8">
              Choose a new password for{" "}
              <span className="font-semibold text-gray-700">{email}</span>.
            </p>

            <form onSubmit={handleSubmit}>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-600 mb-2 text-left"
              >
                New Password
              </label>
              <div className="bg-gray-100 rounded-xl">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 px-5 bg-transparent text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
                  required
                />
              </div>

              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-600 mb-2 mt-5 text-left"
              >
                Confirm New Password
              </label>
              <div className="bg-gray-100 rounded-xl">
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-14 px-5 bg-transparent text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
                  required
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm mt-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-8 w-full h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold hover:bg-[#244d5a] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)]"
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        <button
          type="button"
          onClick={() => navigate("/Teacherlogin")}
          className="inline-block mt-6 text-[#2d5f6e] font-medium hover:underline"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;