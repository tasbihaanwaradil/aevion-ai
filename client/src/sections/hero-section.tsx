import AnimatedContent from "../components/animated-content";
import { SparkleIcon, StarIcon } from "lucide-react";
import CustomIcon from "../components/custom-icon";

export default function HeroSection() {
    return (
        <section className="bg-[url('/assets/hero-gradient-bg.png')] bg-cover bg-center bg-no-repeat px-4 md:px-16 lg:px-24 xl:px-32">
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-screen">
                <AnimatedContent reverse distance={30} className="flex items-center gap-2 bg-white/50 backdrop-blur p-1 rounded-full">
                    <div className="flex items-center -space-x-3">
                        <img className="size-7 rounded-full border-2 border-white"
                            src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=50"
                            alt="userImage1" />
                        <img className="size-7 rounded-full border-2 border-white"
                            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=50"
                            alt="userImage2" />
                    </div>
                    <span>60K+</span>
                    <div className="h-5 w-px mx-1 bg-white rounded-full" />
                    <span>Happy users worldwide</span>
                    <div className="h-5 w-px mx-1 bg-white rounded-full" />
                    <div className="flex items-center gap-1 pr-3">
                        <StarIcon className="size-4.5 fill-orange-500 stroke-orange-500" />
                        <span>4.9</span>
                    </div>
                </AnimatedContent>
                <AnimatedContent distance={30} delay={0.1} className="relative">
                    <h1 className="text-center font-urbanist text-5xl/15 md:text-6xl/18 mt-4 font-bold max-w-2xl">
                        Build, Launch & Scale with AI agents.
                    </h1>
                    <div className="absolute -top-5 right-13 hidden md:block">
                        <CustomIcon icon={SparkleIcon} dir="right" />
                    </div>
                </AnimatedContent>
                <AnimatedContent distance={30} delay={0.2}>
                    <p className="text-center text-base/7 text-zinc-500 max-w-lg mt-4">
                        Design, automate and deploy intelligent AI agents to power your products, workflows and business growth.
                    </p>
                </AnimatedContent>
                <AnimatedContent className="flex flex-col md:flex-row items-center gap-4 mt-6 w-full md:w-auto">
                    <a href="/" className="py-3 md:py-2.5 w-full md:w-auto px-8 border border-orange-200 bg-linear-to-tl from-orange-600 to-orange-500 text-white text-center rounded-full">
                        Get Started
                    </a>
                    <a href="/" className="relative py-3 md:py-2.5 w-full md:w-auto px-8 bg-white/50 text-gray-600 font-medium text-center border border-white rounded-full">
                        Watch Demo
                        <AnimatedContent direction="horizontal" className="absolute size-8 pointer-events-none right-0 top-full -translate-y-1/2">
                            <img
                                src="/assets/mouse-arrow.svg"
                                alt="mouse-arrow"
                                width={24}
                                height={24}
                            />
                        </AnimatedContent>
                    </a>
                </AnimatedContent>
            </div>
        </section>
    );
}