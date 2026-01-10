import AnimatedContent from "../components/animated-content";
import SectionTitle from "../components/section-title";
import { pricing } from "../data/pricing";
import NumberFlow from "@number-flow/react";
import { CheckIcon, CircleDollarSignIcon } from "lucide-react";
import { useState } from "react";

export default function PricingSection() {
    const [planType, setPlanType] = useState<'monthly' | 'yearly'>('monthly');
    return (
        <section id="pricing" className="border-b border-gray-200 px-4 md:px-16 lg:px-24 xl:px-32">
            <div className="p-4 pt-20 flex flex-col items-center max-w-7xl mx-auto justify-center border-x border-gray-200">
                <SectionTitle
                    icon={CircleDollarSignIcon}
                    title="Simple, transparent pricing"
                    subtitle="Choose a plan that fits your team - scale as you build, launch and grow with AI agents."
                />
                <AnimatedContent className="p-1 mt-10 border border-orange-200 bg-orange-50 rounded-full">
                    <button
                        className={`px-6 py-2 rounded-full cursor-pointer ${planType === 'monthly' ? 'bg-orange-500 text-white' : 'text-orange-500'}`}
                        onClick={() => setPlanType('monthly')}
                    >
                        Monthly
                    </button>
                    <button
                        className={`relative px-6 py-2 rounded-full cursor-pointer ${planType === 'yearly' ? 'bg-orange-500 text-white' : 'text-orange-500'}`}
                        onClick={() => setPlanType('yearly')}
                    >
                        Yearly
                        <span className="absolute -top-8 -right-8 rotate-15 bg-green-100 rounded-full px-2 py-1 text-xs text-green-500">
                            20% OFF
                        </span>
                    </button>
                </AnimatedContent>
                <div className="flex flex-wrap items-start justify-center gap-10 md:gap-4 px-4 mt-12">
                    {pricing.map((plan, index) => (
                        <AnimatedContent delay={index * 0.10} key={index} className={`p-5 pb-8 w-full sm:max-w-64 rounded-xl border border-gray-200 ${plan.type === 'enterprise' ? 'bg-orange-500 text-white' : plan.type === 'popular' ? 'bg-linear-to-br from-orange-50 to-orange-100' : 'bg-white'}`}>
                            <div className={`w-max border border-gray-200 p-2 aspect-square rounded-lg ${plan.type === 'enterprise' ? 'text-white' : 'text-orange-500 bg-white'}`}>
                                <plan.icon size={24} />
                            </div>
                            <h3 className="text-lg font-medium mt-6">{plan.name}</h3>
                            <p className={plan.type === 'enterprise' ? 'text-white' : 'text-zinc-500'}>
                                {plan.description}
                            </p>
                            <NumberFlow
                                value={planType === 'monthly' ? plan.price : Math.floor(plan.price - plan.price * 0.2)}
                                className="text-3xl font-semibold mt-4"
                                suffix="/mo"
                                prefix="$"
                            />
                            <a href={plan.linkUrl} className="block text-center py-2.5 rounded-full mt-6 text-zinc-600 bg-gray-50 border border-gray-200">
                                {plan.linkText}
                            </a>
                            <div className="space-y-2 mt-6">
                                {plan.features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <CheckIcon className={`size-4 ${plan.type === 'enterprise' ? 'text-white' : 'text-orange-500'}`} />
                                        <p className={plan.type === 'enterprise' ? 'text-white' : 'text-zinc-500'}>
                                            {feature}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </AnimatedContent>
                    ))}
                </div>
            </div>
        </section>
    )
}