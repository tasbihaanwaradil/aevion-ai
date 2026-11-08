// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate, Link } from "react-router-dom";
// import { useTeacherAuth } from "../context/TeacherAuthContext";

// const TOTAL_STEPS = 3;
// const CURRENT_STEP = 3;

// const ROLES = ["Teacher", "Administrator", "IT/Technology", "Other"];

// type IncomingState = {
//   name?: string;
//   email?: string;
//   password?: string;
//   organizationType?: string;
// };

// const AboutYou = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { teacher: user, signUp } = useTeacherAuth();
//   const [role, setRole] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [agreed, setAgreed] = useState(false);
//   const [error, setError] = useState("");

//   // Everything collected across steps 1 and 2.
//   const profile = (location.state as IncomingState | null) ?? {};

//   useEffect(() => {
//     if (user) {
//       navigate("/Dashboard");
//     }
//   }, [user, navigate]);

//   const handleFinish = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setError("");

//     if (!profile.name || !profile.email || !profile.password) {
//       setError(
//         "Your profile details are missing — please start over from the beginning."
//       );
//       return;
//     }
//     if (!role) {
//       setError("Please select your role.");
//       return;
//     }
//     if (!agreed) {
//       setError("Please agree to the terms and privacy policy.");
//       return;
//     }

//     // Backend currently only accepts name/email/password on signUp —
//     // organizationType, role, and phoneNumber aren't in that contract
//     // yet, so they're collected here but not sent until the API supports
//     // them. Extend signUp's payload (and the request body it maps to)
//     // once it does.
//     try {
//       await signUp({
//         name: profile.name,
//         email: profile.email,
//         password: profile.password,
//       });

//       // registerTeacher no longer starts a session — it emails a
//       // verification code instead — so don't wait on `user` to change.
//       // Go straight to the verification screen with the email.
//       navigate("/VerifyEmail", { state: { email: profile.email } });
//     } catch (err) {
//       setError(
//         err instanceof Error
//           ? err.message
//           : "Something went wrong creating your account. Please try again."
//       );
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center bg-[#0A1238] px-4 pt-16 pb-12">
//       {/* Eyebrow */}
//       <p className="text-gray-300 text-xs font-bold tracking-widest uppercase mb-4">
//         New Teacher Account
//       </p>

//       {/* Step indicator */}
//       <div className="flex items-center justify-center mb-8 w-full max-w-md">
//         {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(
//           (num, idx) => (
//             <React.Fragment key={num}>
//               <div
//                 className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
//                   num === CURRENT_STEP
//                     ? "bg-[#2d5f6e] border-[#2d5f6e] text-white"
//                     : num < CURRENT_STEP
//                     ? "bg-[#2d5f6e]/20 border-[#2d5f6e] text-[#2d5f6e]"
//                     : "bg-transparent border-gray-400 text-gray-400"
//                 }`}
//               >
//                 {num < CURRENT_STEP ? "✓" : num}
//               </div>
//               {idx < TOTAL_STEPS - 1 && (
//                 <div
//                   className={`flex-1 h-px mx-2 ${
//                     num < CURRENT_STEP ? "bg-[#2d5f6e]" : "bg-gray-500/40"
//                   }`}
//                 />
//               )}
//             </React.Fragment>
//           )
//         )}
//       </div>

//       <form
//         onSubmit={handleFinish}
//         className="w-full max-w-md bg-white rounded-2xl px-10 py-14 shadow-2xl relative z-10"
//       >
//         <h1 className="text-3xl text-[#2d5f6e] font-bold text-center mb-8">
//           About You
//         </h1>

//         {error && (
//           <p className="text-red-500 text-sm text-center mb-4">{error}</p>
//         )}

//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
//           <div>
//             <label
//               htmlFor="role"
//               className="block text-sm font-medium text-gray-600 mb-2"
//             >
//               Role
//             </label>
//             <div className="bg-gray-100 rounded-xl">
//               <select
//                 id="role"
//                 name="role"
//                 value={role}
//                 onChange={(e) => setRole(e.target.value)}
//                 className="w-full h-14 px-5 bg-transparent text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl appearance-none"
//                 required
//               >
//                 <option value="" disabled>
//                   Select Your Role
//                 </option>
//                 {ROLES.map((r) => (
//                   <option key={r} value={r}>
//                     {r}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div>
//             <label
//               htmlFor="phoneNumber"
//               className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-2"
//             >
//               Phone Number (optional)
//               <span
//                 title="We'll only use this to help recover your account."
//                 className="w-4 h-4 rounded-full border border-gray-400 text-gray-400 text-[10px] flex items-center justify-center cursor-help"
//               >
//                 i
//               </span>
//             </label>
//             <div className="bg-gray-100 rounded-xl">
//               <input
//                 type="tel"
//                 id="phoneNumber"
//                 name="phoneNumber"
//                 placeholder="Optional"
//                 value={phoneNumber}
//                 onChange={(e) => setPhoneNumber(e.target.value)}
//                 className="w-full h-14 px-5 bg-transparent text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
//               />
//             </div>
//           </div>
//         </div>

//         <label className="flex items-start gap-2 mt-8 text-sm text-gray-600 cursor-pointer">
//           <input
//             type="checkbox"
//             checked={agreed}
//             onChange={(e) => setAgreed(e.target.checked)}
//             className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2d5f6e] focus:ring-[#2d5f6e]"
//           />
//           <span>
//             I agree to the{" "}
//             <Link to="/terms" className="text-[#2d5f6e] font-medium hover:underline">
//               terms
//             </Link>{" "}
//             and{" "}
//             <Link to="/privacy" className="text-[#2d5f6e] font-medium hover:underline">
//               privacy policy
//             </Link>
//             .
//           </span>
//         </label>

//         <div className="flex gap-4 mt-10">
//           <button
//             type="button"
//             onClick={() =>
//               navigate("/Demographics", {
//                 state: {
//                   name: profile.name,
//                   email: profile.email,
//                   password: profile.password,
//                 },
//               })
//             }
//             className="flex-1 h-14 rounded-2xl border border-[#2d5f6e] text-[#2d5f6e] font-bold hover:bg-gray-50 transition"
//           >
//             Previous
//           </button>
//           <button
//             type="submit"
//             className="flex-1 h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)]"
//           >
//             Finish
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default AboutYou;