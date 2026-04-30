import {
  LinkedinIcon,
  MailIcon,
  FileQuestionIcon,
  PresentationIcon,
  FileTextIcon,
  CalendarClockIcon,
  // LayersIcon,
} from "lucide-react";

import type { IFeature } from "../../types";

export const Features: IFeature[] = [
  {
    title: "LinkedIn Post Generator",
    description:
      "Generates professional LinkedIn posts for teachers related to achievements, research, or academic events.",
    icon: LinkedinIcon,
    cardBg: "bg-orange-100",
    iconBg: "bg-orange-500",
  },
  {
    title: "Academic Email Writer",
    description:
      "Drafts formal emails for class announcements, deadlines, feedback, and administrative communication.",
    icon: MailIcon,
    cardBg: "bg-green-100",
    iconBg: "bg-green-500",
  },
  {
    title: "Quiz Generator",
    description:
      "Automatically creates quizzes from lecture slides, PDFs, or topic inputs with adjustable difficulty levels.",
    icon: FileQuestionIcon,
    cardBg: "bg-indigo-100",
    iconBg: "bg-indigo-500",
  },
  {
    title: "Auto-Create Presentation Slides",
    description:
      "Generates structured lecture slides from a topic, lesson outline, or uploaded material.",
    icon: PresentationIcon,
    cardBg: "bg-pink-100",
    iconBg: "bg-pink-500",
  },
  {
    title: "PDF-to-Slide Generator",
    description:
      "Converts PDFs (lecture notes, research papers, etc.) into concise, presentation-ready slides.",
    icon: FileTextIcon,
    cardBg: "bg-lime-100",
    iconBg: "bg-lime-500",
  },
  {
    title: "Reminder",
    description:
      "Tracks class schedules, assignment deadlines, and academic events with automated reminders.",
    icon: CalendarClockIcon,
    cardBg: "bg-gray-100",
    iconBg: "bg-orange-500",
  },
  // {
  //   title: "Merge & Summarize Multiple Slides",
  //   description:
  //     "Combines multiple lecture slide decks into one structured slide deck and summarizes key points.",
  //   icon: LayersIcon,
  //   cardBg: "bg-purple-100",
  //   iconBg: "bg-purple-500",
  // },
];