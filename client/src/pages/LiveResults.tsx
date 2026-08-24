"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { WifiIcon } from "lucide-react";
import TeacherNavbar from "../components/TeacherNavabar";

const LiveResults = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen overflow-hidden bg-[#0A1238]">
      <TeacherNavbar />

      {/* Body */}
      <div className="pt-20 h-screen">
        <div className="h-[calc(100vh-5rem)] px-4 md:px-16 lg:px-24 xl:px-32 py-8 flex items-center justify-center">
          <div className="w-full max-w-7xl h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
            <div className="flex flex-col items-center text-center max-w-md px-6">
              <div
                className="w-40 h-40 bg-gray-100 flex items-center justify-center mb-8"
                style={{
                  clipPath:
                    "polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)",
                }}
              >
                <WifiIcon
                  className="w-16 h-16 text-gray-300"
                  strokeWidth={1.5}
                />
              </div>

              <h1 className="text-2xl font-semibold text-gray-800 mb-3">
                Live Results
              </h1>
              <p className="text-gray-500 mb-8">
                You'll see live results for your room's current activity
                here. Launch a new activity to get started!
              </p>

              <button
                type="button"
                onClick={() => navigate("/TeacherDashboard")}
                className="h-10 px-5 rounded-lg bg-sky-50 text-[#007a8c] text-sm font-semibold hover:bg-sky-100 transition"
              >
                Launch Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveResults;