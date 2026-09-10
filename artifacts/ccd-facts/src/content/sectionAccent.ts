/**
 * Shared Map ↔ canvas accent colours (CCD palette only).
 */
export const SECTION_ACCENT: Record<string, string> = {
  overview: "#B6FF7E",
  title: "#B6FF7E",
  eyfs: "#B6FF7E",
  "enrichment-framework": "#5EEAD4",
  "primary-ks1-ks2": "#14B8A6",
  secondary: "#14B8A6",
  gcse: "#5EEAD4",
  "a-level": "#14B8A6",
  "university-he": "#B6FF7E",
  "music-hubs-and-national-centre": "#5EEAD4",
  "a-solution": "#B6FF7E",
  sources: "#94A3B8",
};

export function sectionAccent(id: string | null | undefined): string {
  if (!id) return SECTION_ACCENT.overview!;
  return SECTION_ACCENT[id] ?? "#B6FF7E";
}
