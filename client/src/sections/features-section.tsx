"use client";

import { ArrowUpRightIcon, SparkleIcon } from "lucide-react";
import { features } from "../data/features";
import AnimatedContent from "../components/animated-content";
import SectionTitle from "../components/section-title";

export default function FeaturesSection() {
  return (
    <section id="features" className="px-4 md:px-16 lg:px-24 xl:px-32">
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
              distance={20} 
              delay={0.1} 
              className="p-8 bg-[#007a8c] w-full rounded-2xl mt-12 shadow-xl shadow-cyan-950/20 border border-white/10"
            >
              <p className="text-lg text-white font-medium leading-relaxed">
                Trusted by educators, institutions, and academic teams building intelligent teaching and learning solutions with AI agents.
              </p>

              <a
                href="#"
                className="bg-white text-[#007a8c] hover:bg-cyan-50 px-6 py-2.5 rounded-full mt-8 flex items-center gap-2 transition-all duration-300 font-bold w-max shadow-sm"
              >
                Explore use cases
                <ArrowUpRightIcon size={20} />
              </a>
            </AnimatedContent>
          </div>
        </div>

        {/* Right Features Cards */}
        <div className="p-4 pt-16 md:p-16 space-y-6">
          {features.map((feature, index) => (
            <AnimatedContent
              key={index}
              distance={60}
              delay={0.1 + index * 0.1}
              threshold={0.3}
              className={`${feature.cardBg} flex flex-col items-start p-6 rounded-xl w-full md:sticky md:top-26 shadow-sm`}
            >
              <div className={`${feature.iconBg} p-2 text-white rounded-md inline-flex items-center justify-center`}>
                <feature.icon size={20} />
              </div>
              
              <p className="text-lg font-bold text-zinc-900 mt-4">
                {feature.title}
              </p>
              
              <p className="text-sm text-zinc-700 mt-2 leading-relaxed">
                {feature.description}
              </p>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}
