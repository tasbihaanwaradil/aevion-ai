import type { IPricingPlan } from "../../types";
import { RocketIcon, UserIcon, UsersIcon } from "lucide-react";

export const pricing: IPricingPlan[] = [
    {
        icon: RocketIcon,
        name: "Free",
        description: "Explore Buildify and create your first AI agents.",
        price: 0,
        linkText: "Start Free",
        linkUrl: "#",
        features: [
            "Up to 3 AI agents",
            "Basic workflow builder",
            "Community support",
            "Limited execution runs",
            "Starter integrations",
        ],
    },
    {
        icon: UserIcon,
        name: "Starter",
        description: "For individuals building and testing AI-powered ideas.",
        price: 19,
        linkText: "Get Started",
        linkUrl: "#",
        features: [
            "Up to 10 AI agents",
            "Advanced workflows",
            "API & webhook access",
            "Execution logs",
            "Email support",
        ],
    },
    {
        icon: UsersIcon,
        name: "Pro",
        type: "popular",
        description: "Best for startups and growing product teams.",
        price: 49,
        linkText: "Upgrade to Pro",
        linkUrl: "#",
        features: [
            "Unlimited AI agents",
            "Priority execution",
            "Real-time monitoring",
            "Team collaboration",
            "Priority support",
        ],
    },
    {
        icon: UserIcon,
        name: "Enterprise",
        type: "enterprise",
        description: "Custom solutions for large teams and enterprises.",
        price: 149,
        linkText: "Contact Sales",
        linkUrl: "#",
        features: [
            "Custom agent limits",
            "Dedicated infrastructure",
            "Advanced security controls",
            "SLA & compliance support",
            "Dedicated account manager",
        ],
    },
];