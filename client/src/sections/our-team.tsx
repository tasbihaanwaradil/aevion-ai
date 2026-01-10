import AnimatedContent from "../components/animated-content";
import SectionTitle from "../components/section-title";
import { team } from "../data/team";
import { HandshakeIcon } from "lucide-react";

export default function OurTeamSection() {
    return (
        <section className="border-b border-gray-200 px-4 md:px-16 lg:px-24 xl:px-32">
            <div className="pt-20 pb-32 flex flex-col items-center max-w-7xl mx-auto justify-center border-x border-gray-200">
                <SectionTitle
                    icon={HandshakeIcon}
                    title="Meet Our Team"
                    subtitle="A passionate team of builders, designers and engineers shaping the future of AI-powered products."
                />
                <div className="flex flex-wrap items-center justify-center gap-10 md:gap-6 mt-24">
                    {team.map((member, index) => (
                        <AnimatedContent delay={index * 0.10} key={index} className="flex flex-col">
                            <img src={member.image} alt={member.name} className="w-52 h-64 object-cover rounded-lg" />
                            <h3 className="text-lg font-medium mt-2">{member.name}</h3>
                            <p className="text-zinc-500">{member.role}</p>
                        </AnimatedContent>
                    ))}
                </div>
            </div>
        </section>
    )
}