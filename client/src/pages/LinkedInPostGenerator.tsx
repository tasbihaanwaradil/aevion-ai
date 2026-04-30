"use client";

import React, { useState } from "react";
import SideNavbar from "../components/SideNavbar";

interface FormData {
  topic: string;
  audience: string;
  tone: string;
}

const LinkedInPostGenerator: React.FC = () => {
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("tools");

  const [formData, setFormData] = useState<FormData>({
    topic: "",
    audience: "Professionals",
    tone: "Professional",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-[#0A1238]">

      {/*Sidebar*/}
      <SideNavbar
  isOpen={isOpen}
  setIsOpen={setIsOpen}
  activeSection={activeSection}
  setActiveSection={setActiveSection}
  title="AI Tools" // ✅ HERE
/>

      {/*MainContent*/}
      <div
        className={`px-6 pt-28 pb-16 transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >
        
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white">
            LinkedIn Post Generator
          </h1>
          <p className="text-gray-400 mt-2">
            Create engaging LinkedIn posts tailored to your audience and tone
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 text-gray-800">
          
          {/* Input Card */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-2xl p-10"
          >
            <label className="block font-semibold mb-2 text-gray-800">
              Topic
            </label>
            <textarea
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="E.g., The importance of continuous learning in tech..."
              className="w-full h-28 px-5 py-4 bg-gray-100 rounded-xl outline-none"
              required
            />

            <label className="block font-semibold mt-6 mb-2 text-gray-800">
              Target Audience
            </label>
            <select
              name="audience"
              value={formData.audience}
              onChange={handleChange}
              className="w-full h-14 px-5 bg-gray-100 rounded-xl"
            >
              <option value="Professionals">Professionals</option>
              <option value="Entrepreneurs">Entrepreneurs</option>
              <option value="Students">Students</option>
              <option value="Developers">Developers</option>
            </select>

            <label className="block font-semibold mt-6 mb-2 text-gray-800">
              Tone
            </label>
            <select
              name="tone"
              value={formData.tone}
              onChange={handleChange}
              className="w-full h-14 px-5 bg-gray-100 rounded-xl"
            >
              <option value="Professional">Professional</option>
              <option value="Casual">Casual</option>
              <option value="Inspirational">Inspirational</option>
              <option value="Informative">Informative</option>
            </select>

            <button
              type="submit"
              className="mt-10 w-full h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold text-lg"
            >
              Generate Post
            </button>
          </form>

          {/* Preview Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-10">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              LinkedIn Preview
            </h2>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 min-h-[300px] bg-gray-50 flex items-center justify-center">
              <p className="text-gray-400 text-center">
                Generated content will appear here
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LinkedInPostGenerator;