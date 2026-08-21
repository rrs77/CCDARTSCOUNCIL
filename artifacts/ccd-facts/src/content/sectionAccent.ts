/**
 * Shared Map ↔ canvas accent colours (CCD palette only).
 */
export const SECTION_ACCENT: Record<string, string> = {
  overview: "#B6FF7E",
  title: "#B6FF7E",
  "primary-eyfs-ks2": "#14b8a6",
  "secondary-ks3-ks4": "#14b8a6",
  "ks5-a-level": "#14b8a6",
  "university-he": "#B6FF7E",
  "a-solution": "#B6FF7E",
  sources: "#6b7d80",
};

export function sectionAccent(id: string | null | undefined): string {
  if (!id) return SECTION_ACCENT.overview!;
  return SECTION_ACCENT[id] ?? "#B6FF7E";
}
