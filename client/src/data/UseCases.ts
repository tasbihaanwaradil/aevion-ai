export type UseCaseIcon =
  | "linkedin"
  | "email"
  | "quiz"
  | "slides"
  | "pdf"
  | "reminders";

export type UseCase = {
  icon: UseCaseIcon;
  title: string;
  subtitle: string;
  description: string;
  points: string[];
};

export const UseCases: UseCase[] = [
  {
    icon: "linkedin",
    title: "LinkedIn Post Studio",
    subtitle: "Turn academic milestones into polished posts",
    description:
      "Draft professional LinkedIn posts about your achievements, research, and academic events in minutes.",
    points: [
      "Achievements, publications, and awards",
      "Research highlights and conference talks",
      "Event announcements and recaps",
    ],
  },
  {
    icon: "email",
    title: "Academic Email Assistant",
    subtitle: "Formal emails, drafted for you",
    description:
      "Write clear, formal emails for class announcements, deadlines, feedback, and administrative communication.",
    points: [
      "Class announcements and deadline notices",
      "Feedback and follow-ups for students",
      "Administrative and departmental messages",
    ],
  },
  {
    icon: "quiz",
    title: "Quiz Studio",
    subtitle: "Quizzes from any lesson material",
    description:
      "Generate quizzes from lecture slides, PDFs, or a topic, with the difficulty level you choose.",
    points: [
      "Start from slides, PDFs, or a typed topic",
      "Adjustable difficulty levels",
      "Quick checks and practice for your class",
    ],
  },
  {
    icon: "slides",
    title: "Lesson Slide Studio",
    subtitle: "Structured lecture slides, ready to teach",
    description:
      "Build a structured slide deck from a topic, a lesson outline, or material you upload.",
    points: [
      "Start from a topic or an outline",
      "Use your own uploaded material",
      "Clear structure for every lesson",
    ],
  },
  {
    icon: "pdf",
    title: "PDF Lesson Studio",
    subtitle: "From dense PDFs to concise slides",
    description:
      "Turn lecture notes, research papers, and other PDFs into concise, presentation-ready slides.",
    points: [
      "Lecture notes and handouts",
      "Research papers and articles",
      "Short slides that keep the key ideas",
    ],
  },
  {
    icon: "reminders",
    title: "Smart Teaching Reminders",
    subtitle: "Deadlines and events, never missed",
    description:
      "Keep track of class schedules, assignment deadlines, and academic events with automated reminders.",
    points: [
      "Class schedules and assignment deadlines",
      "Academic events and meetings",
      "Automatic email reminders as dates approach",
    ],
  },
];