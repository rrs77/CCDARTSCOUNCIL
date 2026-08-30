/**
 * Shared Map ↔ canvas accent colours (CCD palette only).
 */
export const SECTION_ACCENT: Record<string, string> = {
  overview: "#B6FF7E",
  title: "#B6FF7E",
  "primary-eyfs-ks2": "#14b8a6",
  secondary: "#14b8a6",
  gcse: "#14b8a6",
  "a-level": "#14b8a6",
  "university-he": "#B6FF7E",
  "music-hubs-and-national-centre": "#5eead4",
  "a-solution": "#B6FF7E",
  sources: "#6b7d80",
};

export function sectionAccent(id: string | null | undefined): string {
  if (!id) return SECTION_ACCENT.overview!;
  return SECTION_ACCENT[id] ?? "#B6FF7E";
}
