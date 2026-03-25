"use client";

import React, { useState } from "react";

const AutoCreatePresentationSlides: React.FC = () => {
  const [topic, setTopic] = useState<string>("");
  const [slides, setSlides] = useState<number>(5);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Frontend only
    console.log({
      topic,
      slides,
    });
  };

  return (
    <div className="min-h-screen bg-[#0A1238] px-6 pt-28 pb-16">
      
      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white">
          Auto-Create Presentation Slides
        </h1>
        <p className="text-gray-400 mt-2">
          Generates structured lecture slides from a topic or lesson outline
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 text-gray-800">
        
        {/* Input Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold mb-2">Slide Generator</h2>
          <p className="text-gray-500 text-sm mb-6">
            Transform topics into structured presentation slides
          </p>

          <label className="block font-semibold mb-2 text-gray-800">
            Topic or Content
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="E.g., Introduction to Machine Learning..."
            className="w-full h-28 p-4 border border-[#0A1238] rounded-xl text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2d5f6e]"
            required
          />

          <label className="block font-semibold mt-6 mb-2 text-gray-800">
            Number of Slides
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={slides}
            onChange={(e) => setSlides(Number(e.target.value))}
            className="w-full p-3 border border-[#0A1238] rounded-xl text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2d5f6e]"
          />

          <button
            type="submit"
            className="mt-8 w-full h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold text-lg hover:bg-[#244d5a] transition-all shadow-lg"
          >
            Generate Slides
          </button>
        </form>

        {/* Preview Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-2">Slides Preview</h2>
          <p className="text-gray-500 text-sm mb-6">
            Generated slides will appear here
          </p>

          <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 min-h-[250px] bg-gray-50 flex items-center justify-center">
            <p className="text-gray-400 text-center">
              Enter a topic and click "Generate Slides"
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AutoCreatePresentationSlides;