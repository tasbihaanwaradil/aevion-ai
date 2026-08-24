import type { ISectionTitle } from "../../types";
import CustomIcon from "./custom-icon";
import AnimatedContent from "./animated-content";

export default function SectionTitle({ icon, title, subtitle, dir = "center" }: ISectionTitle) {
  return (
    <div className={`flex flex-col gap-6 ${dir === "center" ? "items-center" : "md:items-start items-center"}`}>
      
      {/* Icon + Title */}
      <AnimatedContent className="flex flex-col md:flex-row items-center gap-4">
        <CustomIcon icon={icon} />
        <h2 className="text-4xl md:text-5xl font-semibold font-urbanist text-white">
          {title}
        </h2>
      </AnimatedContent>

      {/* Subtitle */}
      <AnimatedContent>
        <p
          className={`text-zinc-400 text-base md:text-lg leading-relaxed ${
            dir === "center" ? "text-center max-w-lg" : "md:text-left text-center max-w-sm"
          }`}
        >
          {subtitle}
        </p>
      </AnimatedContent>
    </div>
  );
}
