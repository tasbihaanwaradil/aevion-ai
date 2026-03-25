"use client";

import React, { useState } from "react";

interface FormData {
  purpose: string;
  recipient: string;
  tone: string;
}

const AcademicEmailGenerator: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    purpose: "",
    recipient: "",
    tone: "Formal",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    // Backend API call will go here later
    console.log("Sending to backend:", formData);

    // Example for later:
    /*
    await fetch("/api/generate-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    */
  };

  return (
    <div className="min-h-screen bg-[#0A1238] px-6 pt-28 pb-16">
      
      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white">
          Academic Email Generator
        </h1>
        <p className="text-gray-400 mt-2">
          Generate professional academic emails for professors, students, or colleagues
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">

        {/* Input Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-2xl p-10"
        >
          {/* Purpose */}
          <label className="block font-semibold mb-2 text-gray-800">
            Email Purpose
          </label>
          <textarea
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            placeholder="E.g. Request a meeting regarding research project"
            className="w-full h-28 px-5 py-4 bg-gray-100 rounded-xl text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e]"
            required
          />

          {/* Recipient */}
          <label className="block font-semibold mt-6 mb-2 text-gray-800">
            Recipient
          </label>
          <input
            type="text"
            name="recipient"
            value={formData.recipient}
            onChange={handleChange}
            placeholder="E.g. Dr. Smith"
            className="w-full h-14 px-5 bg-gray-100 rounded-xl text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e]"
            required
          />

          {/* Tone */}
          <label className="block font-semibold mt-6 mb-2 text-gray-800">
            Tone
          </label>
          <select
            name="tone"
            value={formData.tone}
            onChange={handleChange}
            className="w-full h-14 px-5 bg-gray-100 rounded-xl text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5f6e]"
          >
            <option value="Formal">Formal</option>
            <option value="Respectful">Respectful</option>
            <option value="Semi-Formal">Semi-Formal</option>
          </select>

          {/* Button */}
          <button
            type="submit"
            className="mt-10 w-full h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold text-lg hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)]"
          >
            Generate Email
          </button>
        </form>

        {/* Preview Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-10">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">
            Email Preview
          </h2>

          <p className="text-gray-500 text-sm mb-6">
            See how you email generates
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 min-h-[300px] bg-gray-50 flex items-center justify-center">
            <p className="text-gray-400 text-center">
              Waiting for response...
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AcademicEmailGenerator;