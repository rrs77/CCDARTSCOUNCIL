/**
 * Shared Map ↔ canvas accent colours (CCD palette only).
 * Keep in sync with MapNav pips.
 */
export const SECTION_ACCENT: Record<string, string> = {
  overview: "#B6FF7E",
  title: "#B6FF7E",
  "the-situation": "#B6FF7E",
  primary: "#14b8a6",
  "secondary-and-access": "#14b8a6",
  "a-level": "#14b8a6",
  "higher-education": "#B6FF7E",
  "music-hubs-and-national-centre": "#B6FF7E",
  "a-solution": "#B6FF7E",
  sources: "#6b7d80",
};

export function sectionAccent(id: string | null | undefined): string {
  if (!id) return SECTION_ACCENT.overview!;
  return SECTION_ACCENT[id] ?? "#B6FF7E";
}
