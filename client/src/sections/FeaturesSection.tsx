"use client";

import { ArrowUpRightIcon, SparkleIcon } from "lucide-react";
import { Features } from "../data/Features";
import AnimatedContent from "../components/animated-content";
import SectionTitle from "../components/section-title";


export default function FeaturesSection() {
  return (
    <section id="Features" className="px-4 md:px-16 lg:px-24 xl:px-32">

      <div className="grid grid-cols-1 md:grid-cols-2 max-w-7xl mx-auto">

        {/* Left Panel */}
        <div>
          <div className="p-4 pt-16 md:p-16 flex flex-col items-start md:sticky md:top-26">

            <SectionTitle
              dir="left"
              icon={SparkleIcon}
              title="Core features"
              subtitle="Everything you need to build, deploy, and scale Aevion.AI agents—designed for speed, reliability, and real-world academic use."
            />

            <AnimatedContent
              distance={12}
              delay={0}
              className="p-8 bg-[#007a8c] w-full rounded-2xl mt-12 shadow-xl shadow-cyan-950/20 border border-white/10"
            >
              <p className="text-lg text-white font-medium leading-relaxed">
                Trusted by educators, institutions, and academic teams building intelligent teaching and learning solutions with AI agents.
              </p>

              <a
                href="/UseCases"
                className="bg-white text-[#007a8c] hover:bg-cyan-50 px-6 py-2.5 rounded-full mt-8 flex items-center gap-2 transition-all duration-300 font-bold w-max shadow-sm"
              >
                Explore use cases
                <ArrowUpRightIcon size={20} />
              </a>

            </AnimatedContent>
          </div>
        </div>

        {/* Right Features Cards (FIXED: ONE ANIMATION WRAPPER ONLY) */}
        <div className="p-4 pt-16 md:p-16">

          {/* ONE WRAPPER = INSTANT SOC RATIVE FEEL */}
          <AnimatedContent distance={10} delay={0}>
            <div className="space-y-6">

              {Features.map((feature, index) => (
                <div
                  key={index}
                  className={`${feature.cardBg} flex flex-col items-start p-6 rounded-xl w-full md:sticky md:top-26 shadow-sm`}
                >

                  <div
                    className={`${feature.iconBg} p-2 text-white rounded-md inline-flex items-center justify-center`}
                  >
                    <feature.icon size={20} />
                  </div>

                  <p className="text-lg font-bold text-zinc-900 mt-4">
                    {feature.title}
                  </p>

                  <p className="text-sm text-zinc-700 mt-2 leading-relaxed">
                    {feature.description}
                  </p>

                </div>
              ))}

            </div>
          </AnimatedContent>

        </div>

      </div>
    </section>
  );
}