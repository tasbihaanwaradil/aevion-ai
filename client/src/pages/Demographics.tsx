import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const TOTAL_STEPS = 3;
const CURRENT_STEP = 2;

const ORGANIZATION_TYPES = [
  "Primary/Secondary School",
  "University",
  "Corporate",
  "Other",
];

const Demographics = () => {
  const navigate = useNavigate();
  const [organizationType, setOrganizationType] = useState("");
  const [error, setError] = useState("");

  const handleJoin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!organizationType) {
      setError("Please select your organization type.");
      return;
    }

    // Step 3 isn't specified yet — for now this just moves the flow
    // forward. Swap this for navigate("/register/step-3") once that
    // step exists.
    navigate("/register/confirmation");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#0A1238] px-4 pt-16 pb-12">
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
                  num === CURRENT_STEP
                    ? "bg-[#2d5f6e] border-[#2d5f6e] text-white"
                    : num < CURRENT_STEP
                    ? "bg-[#2d5f6e]/20 border-[#2d5f6e] text-[#2d5f6e]"
                    : "bg-transparent border-gray-400 text-gray-400"
                }`}
              >
                {num < CURRENT_STEP ? "✓" : num}
              </div>
              {idx < TOTAL_STEPS - 1 && (
                <div
                  className={`flex-1 h-px mx-2 ${
                    num < CURRENT_STEP ? "bg-[#2d5f6e]" : "bg-gray-500/40"
                  }`}
                />
              )}
            </React.Fragment>
          )
        )}
      </div>

      <form
        onSubmit={handleJoin}
        className="w-full max-w-md bg-white rounded-2xl px-10 py-14 shadow-2xl relative z-10"
      >
        <h1 className="text-3xl text-[#2d5f6e] font-bold text-center mb-8">
          Demographics
        </h1>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <label
          htmlFor="organizationType"
          className="block text-sm font-medium text-gray-600 mb-2"
        >
          Organization Type
        </label>
        <div className="bg-gray-100 rounded-xl">
          <select
            id="organizationType"
            name="organizationType"
            value={organizationType}
            onChange={(e) => setOrganizationType(e.target.value)}
            className="w-full h-14 px-5 bg-transparent text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl appearance-none"
            required
          >
            <option value="" disabled>
              Select Your Organization Type
            </option>
            {ORGANIZATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 mt-12">
          <button
            type="button"
            onClick={() => navigate("/Newteacheraccount")}
            className="flex-1 h-14 rounded-2xl border border-[#2d5f6e] text-[#2d5f6e] font-bold hover:bg-gray-50 transition"
          >
            Previous
          </button>
          <button
            type="submit"
             onClick={() => navigate("/AboutYou")}
            className="flex-1 h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)]"
          >
            Join
          </button>
        </div>
      </form>
    </div>
  );
};

export default Demographics;