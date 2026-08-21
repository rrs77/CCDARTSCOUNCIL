/**
 * Per-section circular hero illustrations.
 * Classroom photo (`hero-arts.jpg`) is ONLY for the opening title / The situation.
 */

export const SITUATION_HERO = "hero-arts.jpg";

/** Public paths under BASE_URL — keyed by frame / section id */
export const SECTION_ILLUSTRATION: Record<string, string> = {
  "primary-eyfs-ks2": "illustrations/primary.png",
  "secondary-ks3-ks4": "illustrations/secondary.png",
  "ks5-a-level": "illustrations/a-level.png",
  "university-he": "illustrations/higher-education.png",
  "a-solution": "illustrations/a-solution.png",
  "music-hubs-and-national-centre": "illustrations/music-hubs.png",
};

export function assetUrl(file: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${file}`.replace(/\/{2,}/g, "/").replace(":/", "://");
}

/** Illustration for a section id, or undefined (Sources / unknown keep no photo). */
export function sectionIllustration(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  return SECTION_ILLUSTRATION[id];
}

/** Opening title / The situation only — never reuse elsewhere. */
export function isSituationPhotoSection(id: string | null | undefined): boolean {
  return id === "title" || id === "the-situation";
}
