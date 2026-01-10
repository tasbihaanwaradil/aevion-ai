import type { ISectionTitle } from "../../types";
import CustomIcon from "./custom-icon";
import AnimatedContent from "./animated-content";

export default function SectionTitle({ icon, title, subtitle, dir = 'center' }: ISectionTitle) {
    return (
        <div className={`flex flex-col gap-6 ${dir === 'center' ? 'items-center' : 'md:items-start items-center'}`}>
            <AnimatedContent className="flex flex-col md:flex-row items-center gap-4">
                <CustomIcon icon={icon} />
                <h2 className="text-4xl font-semibold font-urbanist">{title}</h2>
            </AnimatedContent>
            <AnimatedContent>
                <p className={`text-zinc-500 text-base/7 ${dir === 'center' ? 'text-center max-w-lg' : 'md:text-left text-center max-w-sm'}`}>{subtitle}</p>
            </AnimatedContent>
        </div>
    )
}