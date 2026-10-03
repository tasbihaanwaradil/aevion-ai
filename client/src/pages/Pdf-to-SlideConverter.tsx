"use client";

import React, { useState } from "react";
import SideNavbar from "../components/SideNavbar";

const PdfToSlidesConverter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("tools");

  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Selected file:", file);
  };

  return (
    <div className="min-h-screen bg-[#0A1238]">

      {/*Sidebar*/}
      <SideNavbar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        title="AI Tools"
      />

      {/*MainContent*/}
      <div
        className={`transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="px-6 pt-28 pb-16">

          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white">
              PDF to Slides Converter
            </h1>
            <p className="text-gray-400 mt-2">
              Upload a PDF and automatically generate structured presentation slides
            </p>
          </div>

          {/* Upload Card */}
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-xl p-10"
            >

              {/* Upload Box */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:border-gray-400 transition">

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 text-gray-400 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"
                  />
                </svg>

                <p className="text-gray-600">
                  Click to upload or drag and drop
                </p>

                <span className="text-sm text-gray-400 mt-1">
                  PDF files only
                </span>

                {file && (
                  <p className="text-sm text-blue-600 mt-3">
                    Selected: {file.name}
                  </p>
                )}
              </label>

              {/* Button */}
              <button
                type="submit"
                className="mt-10 w-full h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold text-lg hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)]"
              >
                Generate Slides
              </button>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PdfToSlidesConverter;