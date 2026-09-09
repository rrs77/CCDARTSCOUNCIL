/** Classroom photography is reserved for the opening situation only. */

export const SITUATION_HERO = "hero-arts.jpg";

/** Decorative section symbols were removed so evidence leads the design. */
export const SECTION_ILLUSTRATION: Record<string, string> = {};

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
