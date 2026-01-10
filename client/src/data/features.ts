import { BotIcon, WorkflowIcon, PlugIcon, ShieldCheckIcon, BarChartIcon, CpuIcon } from "lucide-react";
import type { IFeature } from "../../types";

export const features: IFeature[] = [
    {
        title: "AI Agent Builder",
        description:
            "Design intelligent agents with modular logic, memory and tools - no complex setup required.",
        icon: BotIcon,
        cardBg: "bg-orange-100",
        iconBg: "bg-orange-500"
    },
    {
        title: "Workflow Orchestration",
        description:
            "Chain actions, triggers and decisions to automate multi-step workflows reliably.",
        icon: WorkflowIcon,
        cardBg: "bg-green-100",
        iconBg: "bg-green-500"
    },
    {
        title: "Plug & Play Integrations",
        description:
            "Connect APIs, databases and third-party tools seamlessly with built-in connectors.",
        icon: PlugIcon,
        cardBg: "bg-indigo-100",
        iconBg: "bg-indigo-500"
    },
    {
        title: "Production-Ready Security",
        description:
            "Built-in safeguards, rate limits and isolation to run agents safely at scale and protect your data.",
        icon: ShieldCheckIcon,

        cardBg: "bg-pink-100",
        iconBg: "bg-pink-500"
    },
    {
        title: "Real-Time Monitoring",
        description:
            "Track executions, logs and performance metrics in real time and get insights into your agent's behavior.",
        icon: BarChartIcon,
        cardBg: "bg-lime-100",
        iconBg: "bg-lime-500"
    },
    {
        title: "Scalable Infrastructure",
        description:
            "Run agents efficiently across workloads with automatic scaling and optimization.",
        icon: CpuIcon,
        cardBg: "bg-gray-50",
        iconBg: "bg-orange-500",
    },
]