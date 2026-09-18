// A plain object type instead of importing CSSProperties from "react" —
// sidesteps needing this .ts (non-.tsx) file's module resolution to
// pick up React's type declarations, which every other file in this
// project pulls in as a .tsx file instead.
type ClampStyle = {
  display?: string;
  WebkitLineClamp?: number;
  WebkitBoxOrient?: "vertical" | "horizontal";
  overflow?: string;
};

// Inline clamp style instead of a Tailwind line-clamp utility, so this
// doesn't depend on whether the line-clamp plugin/core-feature is
// enabled in this project's Tailwind config.
export const clampStyle = (expanded: boolean): ClampStyle =>
  expanded
    ? {}
    : {
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      };

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return { date, time };
}