"use client";

import AnimatedContent from "../components/animated-content";
import SectionTitle from "../components/section-title";
import { Faqs } from "../data/Faqs";
import { ChevronDownIcon, HelpCircleIcon } from "lucide-react";

export default function Faqsection() {
  return (
    <section className="bg-gradient-to-br from-[#0c4a6e] to-[#0A1238]">

      {/* Section Header */}
      <div className="px-4 md:px-16 lg:px-24 xl:px-32">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
          <SectionTitle
            icon={HelpCircleIcon}
            title="Got questions?"
            subtitle="Everything you need to know about Aevion.AI, its AI agents, and how educators can get started easily."
          />
        </div>
      </div>

      {/* FAQ Grid */}
      <div className="px-4 md:px-16 lg:px-24 xl:px-32 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-7xl mx-auto">

          {/* FAQ Accordions */}
          <AnimatedContent distance={10} delay={0} className="space-y-6">

            {Faqs.map((faq, index) => (
              <details
                key={index}
                className="group bg-[#0A1238]/90 border border-white/20 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 open:border-white/30 open:bg-[#007a8c]/80"
                open={index === 0}
              >
                <summary className="flex items-center justify-between p-7 select-none cursor-pointer list-none">
                  <h3 className="font-urbanist font-bold text-lg text-white group-open:text-white/90 transition-colors">
                    {faq.question}
                  </h3>

                  <ChevronDownIcon
                    size={22}
                    className="group-open:rotate-180 text-white transition-transform duration-300"
                  />
                </summary>

                <div className="px-7 pb-7">
                  <p className="text-white/80 text-base leading-relaxed max-w-md">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}

          </AnimatedContent>

          {/* Support / CTA Panel */}
          <div className="relative">
            <AnimatedContent distance={20} delay={0.1} className="md:sticky md:top-32">

              <div className="flex flex-col items-start gap-6 p-10 bg-[#007a8c]/90 w-full rounded-3xl shadow-2xl shadow-black/20 border border-white/10">

                <div className="bg-white/20 p-3 rounded-xl">
                  <HelpCircleIcon className="text-white" size={28} />
                </div>

                <h3 className="text-2xl md:text-4xl font-urbanist font-extrabold text-white leading-tight">
                  Still have questions? <br /> Our team can help.
                </h3>

                <p className="text-white/90 font-medium text-lg">
                  Can't find what you're looking for? Reach out to our academic support specialists.
                </p>

                <a
                  href="Contact Us"
                  className="bg-white text-[#007a8c] hover:bg-cyan-50 font-bold px-10 py-4 rounded-full transition-all duration-300 shadow-lg text-lg"
                >
                  Contact Support
                </a>

              </div>

            </AnimatedContent>
          </div>

        </div>
      </div>
    </section>
  );
}