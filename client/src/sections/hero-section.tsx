import AnimatedContent from "../components/animated-content";
import { SparkleIcon, StarIcon } from "lucide-react";
import CustomIcon from "../components/custom-icon";

export default function HeroSection() {
    return (
        <section className="bg-[url('/assets/hero-gradient-bg.png')] bg-cover bg-center bg-no-repeat px-4 md:px-16 lg:px-24 xl:px-32">
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-screen">
                <AnimatedContent distance={30} delay={0.1} className="relative">
                    <h1 className="text-center font-urbanist text-5xl/15 md:text-6xl/18 mt-4 font-bold max-w-2xl">
                        Empower Educators with AI: Automate, Create & Share Instantly

                    </h1>
                    <div className="absolute -top-5 right-13 hidden md:block">
                        <CustomIcon icon={SparkleIcon} dir="right" />
                    </div>
                </AnimatedContent>
                <AnimatedContent distance={30} delay={0.2}>
                    <p className="text-center text-base/7 text-zinc-500 max-w-lg mt-4">
                        Aevion.AI helps Teachers to generate quizzes, slides, academic emails, summarize & merge mutiple slides, and manage reminders — All in one intelligent platform.
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