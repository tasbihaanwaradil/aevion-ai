// import React, { useState } from "react";
// import { useLocation, useNavigate, useSearchParams, Link } from "react-router-dom";
// import { useTeacherAuth } from "../context/TeacherAuthContext";

// const VerifyEmail = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [searchParams] = useSearchParams();
//   const { teacher: user, verifyEmail, resendCode } = useTeacherAuth();

//   // Email comes from whatever just signed the user up — passed via
//   // route state (e.g. navigate("/VerifyEmail", { state: { email } })),
//   // falling back to a ?email= query param (so this page also works
//   // when visited directly by URL), then to the logged-in user if
//   // that's already set.
//   const email =
//     (location.state as { email?: string } | null)?.email ??
//     searchParams.get("email") ??
//     user?.email ??
//     "";

//   const [code, setCode] = useState("");
//   const [error, setError] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isResending, setIsResending] = useState(false);
//   const [resendMessage, setResendMessage] = useState("");

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setError("");
//     setResendMessage("");

//     if (!code.trim()) {
//       setError("Please enter the verification code.");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       await verifyEmail(email, code.trim());
//       navigate("/TeacherDashboard");
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleResend = async () => {
//     setError("");
//     setResendMessage("");
//     setIsResending(true);
//     try {
//       await resendCode(email);
//       setResendMessage("A new code has been sent.");
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Couldn't resend the code. Please try again.");
//     } finally {
//       setIsResending(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center bg-[#0A1238] px-4 pt-16 pb-12">
//       <div className="w-full max-w-md bg-white rounded-2xl px-10 py-12 shadow-2xl relative z-10 text-center">
//         <h1 className="text-3xl text-[#2d5f6e] font-bold mb-6">
//           Verify Email
//         </h1>

//         <p className="text-gray-600 text-sm leading-relaxed mb-1">
//           Verification is required to secure your account.
//         </p>
//         <p className="text-gray-600 text-sm leading-relaxed mb-6">
//           We've sent a one time verification code to:
//           <br />
//           <span className="font-bold text-gray-700">{email}</span>
//         </p>

//         <form onSubmit={handleSubmit}>
//           <label
//             htmlFor="verificationCode"
//             className="block text-sm font-medium text-gray-600 mb-2"
//           >
//             Enter Verification Code
//           </label>

//           <div className="bg-gray-100 rounded-xl">
//             <input
//               type="text"
//               id="verificationCode"
//               name="verificationCode"
//               value={code}
//               onChange={(e) => setCode(e.target.value)}
//               className="w-full h-14 px-5 bg-transparent text-gray-700 text-center  outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
//               required
//             />
//           </div>

//           {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
//           {resendMessage && (
//             <p className="text-green-600 text-sm mt-3">{resendMessage}</p>
//           )}

//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="mt-6 px-10 h-12 rounded-xl bg-[#2d5f6e] text-white font-bold hover:bg-[#244d5a] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)]"
//           >
//             {isSubmitting ? "Verifying..." : "Submit"}
//           </button>
//         </form>

//         <p className="text-gray-800 text-sm leading-relaxed mt-8">
//           If you don't see it, make sure you entered the correct email
//           address and check your spam folder.
//         </p>

//         <p className="text-gray-800 text-sm mt-4">
//           Verification codes expire after 15 minutes.
//         </p>

//         <p className="text-gray-800 text-sm mt-4">
//           Didn't receive it?{" "}
//           <button
//             type="button"
//             onClick={handleResend}
//             disabled={isResending}
//             className="text-[#2d5f6e] font-bold hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
//           >
//             {isResending ? "Sending..." : "Resend Code"}
//           </button>
//         </p>

//         <Link
//           to="/TeacherLogin"
//           className="inline-block mt-6 text-[#2d5f6e] font-bold hover:underline"
//         >
//           Back to Login
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default VerifyEmail;