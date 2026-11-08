"use client";

import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const navigate = useNavigate();

  // 🔄 Auto redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1238] px-4">
      
      <div className="text-center">

        {/* 404 NUMBER */}
        <h1 className="text-[120px] font-bold text-white leading-none tracking-wide">
          404
        </h1>

        {/* TITLE */}
        <h2 className="text-2xl font-semibold text-white mt-2">
          Page Not Found
        </h2>

        {/* DESCRIPTION */}
        <p className="text-gray-400 mt-3 max-w-md mx-auto">
          Sorry, we can’t find the page you’re looking for.
          <br />
          You’ll be redirected to the homepage shortly.
        </p>

        {/* BUTTONS */}
        <div className="mt-8 flex gap-4 justify-center">

          {/* Back to Home */}
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-full bg-[#2d5f6e] text-white font-medium hover:bg-[#244e59] transition shadow-md"
          >
            Back to Home
          </button>

          {/* Go Back */}
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-full border border-gray-500 text-white font-medium hover:bg-gray-700 transition"
          >
            Go Back
          </button>

        </div>

      </div>
    </div>
  );
};

export default NotFound;