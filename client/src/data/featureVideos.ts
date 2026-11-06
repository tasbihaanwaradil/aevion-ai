// data/featureVideos.ts
// Put the clips from /feature-videos in: public/videos/features/

export type FeatureVideoClip = {
  label: string; // shown on the small switch button when a feature has 2+ clips
  src: string;
  poster: string;
};

const base = "/videos/features";

const clip = (file: string, label: string): FeatureVideoClip => ({
  label,
  src: `${base}/${file}.mp4`,
  poster: `${base}/${file}.jpg`,
});

// keyword (matched against the feature title, lowercase) -> clips
const VIDEO_MAP: { keyword: string; clips: FeatureVideoClip[] }[] = [
  {
    keyword: "linkedin",
    clips: [clip("linkedin-post-studio", "LinkedIn post")],
  },
  {
    keyword: "email",
    clips: [
      clip("academic-email-single", "Single email"),
      clip("academic-email-broadcast", "Broadcast"),
    ],
  },
  {
    keyword: "quiz",
    clips: [
      clip("quiz-studio-topic", "From a topic"),
      clip("quiz-studio-document", "From a document"),
      clip("quiz-studio-live-room", "Live room"),
    ],
  },
  {
    keyword: "pdf",
    clips: [clip("pdf-lesson-studio", "PDF to slides")],
  },
  {
    keyword: "slide",
    clips: [clip("lesson-slide-studio", "Topic to slides")],
  },
  {
    keyword: "remind",
    clips: [
      clip("reminder-create", "Create"),
      clip("reminder-manage", "Manage"),
    ],
  },
];

export function getFeatureVideos(title: string): FeatureVideoClip[] {
  const t = title.toLowerCase();
  // "pdf" is checked before "slide" on purpose: "PDF Lesson Studio" must not
  // fall through to the slide clip. Order in VIDEO_MAP above is the priority.
  const match = VIDEO_MAP.find((m) => t.includes(m.keyword));
  return match ? match.clips : [];
}