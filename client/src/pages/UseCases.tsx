"use client";

import { UseCases as UseCasesData } from "../data/UseCases";

export default function UseCases() {
  return (
    <section id="UseCases" className="min-h-screen bg-gradient-to-br from-[#0c4a6e] to-[#0A1238] px-4 md:px-16 lg:px-24 xl:px-32 py-16 pt-28">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white">
          Use Cases
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {UseCasesData.map((item, index) => (
          <div
            key={index}
            className="p-7 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm shadow-lg"
          >
            <h2 className="text-2xl font-bold text-[#00d4ff]">
              {item.title}
            </h2>

            <p className="text-lg font-semibold mt-2 text-white">
              {item.subtitle}
            </p>

            <p className="text-white/80 mt-3">
              {item.description}
            </p>

            <ul className="mt-4 list-disc pl-5 text-white/70 space-y-1">
              {item.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>

            
          </div>
        ))}
      </div>
    </section>
  );
}