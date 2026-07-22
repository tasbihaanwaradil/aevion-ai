import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Email comes from whatever just signed the user up — passed via
  // route state (e.g. navigate("/verify-email", { state: { email } }))
  // and falling back to the logged-in user if that's already set.
  const email = (location.state as { email?: string } | null)?.email ?? user?.email ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    // Wire this up to your verify-code endpoint once it exists.
    console.log("Verifying code:", code, "for", email);
  };

  const handleResend = () => {
    // Wire this up to your resend-code endpoint once it exists.
    console.log("Resending code to", email);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#0A1238] px-4 pt-16 pb-12">
      <div className="w-full max-w-md bg-white rounded-2xl px-10 py-12 shadow-2xl relative z-10 text-center">
        <h1 className="text-3xl text-[#2d5f6e] font-bold mb-6">
          Verify Email
        </h1>

        <p className="text-gray-600 text-sm leading-relaxed mb-1">
          Verification is required to secure your account.
        </p>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          We've sent a one time verification code to:
          <br />
          <span className="font-bold text-gray-700">{email}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="verificationCode"
            className="block text-sm font-medium text-gray-600 mb-2"
          >
            Enter Verification Code
          </label>

          <div className="bg-gray-100 rounded-xl">
            <input
              type="text"
              id="verificationCode"
              name="verificationCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-14 px-5 bg-transparent text-gray-700 text-center  outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

          <button
            type="submit"
            className="mt-6 px-10 h-12 rounded-xl bg-[#2d5f6e] text-white font-bold hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)]"
          >
            Submit
          </button>
        </form>

        <p className="text-gray-800 text-sm leading-relaxed mt-8">
          If you don't see it, make sure you entered the correct email
          address and check your spam folder.
        </p>

        <p className="text-gray-800 text-sm mt-4">
          Verification codes expire after 15 minutes.
        </p>

        <p className="text-gray-800 text-sm mt-4">
          Didn't receive it?{" "}
          <button
            type="button"
            onClick={handleResend}
            className="text-[#2d5f6e] font-bold hover:underline"
          >
            Resend Code
          </button>
        </p>

        <Link
          to="/TeacherLogin"
          className="inline-block mt-6 text-[#2d5f6e] font-bold hover:underline"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;