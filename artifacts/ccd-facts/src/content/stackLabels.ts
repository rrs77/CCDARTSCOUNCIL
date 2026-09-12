/** Short titles for pathway zones and Map — keep in sync with CONTENT.md `##` headings. */

export const STAGE_ORDER = [
  "eyfs",
  "primary-ks1-ks2",
  "secondary",
  "gcse",
  "a-level",
  "university-he",
] as const

export type StageId = (typeof STAGE_ORDER)[number]

/**
 * Side-arrow path between main framed sections (not optional top tabs).
 * Situation → Primary → Secondary → GCSE → A-level → HE → Hubs → Solution → Sources
 */
export const SECTION_PATH = [
  "eyfs",
  "enrichment-framework",
  "primary-ks1-ks2",
  "secondary",
  "gcse",
  "a-level",
  "cold-spots-place-and-income",
  "university-he",
  "music-hubs-and-national-centre",
  "national-plans-and-free-resources",
  "a-solution",
] as const

export const STAGE_LABELS: Record<StageId, string> = {
  eyfs: "EYFS",
  "primary-ks1-ks2": "Primary / KS1–KS2",
  secondary: "Secondary",
  gcse: "GCSE",
  "a-level": "A-level",
  "university-he": "University / HE",
}

/** One-line summary under the zone title on the pathway. */
export const STAGE_COMMENTS: Record<StageId, string> = {
  eyfs:
    "Child-shaped Expressive Arts and Design — the entitlement gap can start before KS1.",
  "primary-ks1-ks2":
    "Music and arts hours falling; specialist teaching scarce in many schools.",
  secondary:
    "Arts teaching hours and teacher headcount down; access still tracks disadvantage.",
  gcse:
    "Arts GCSE entries down sharply; many schools offer no GCSE arts subjects.",
  "a-level":
    "A-level arts entries and university applications for creative subjects declining.",
  "university-he":
    "Creative arts undergraduate numbers down; pathways into the sector under pressure.",
}

export function isStageId(id: string): id is StageId {
  return (STAGE_ORDER as readonly string[]).includes(id)
}

export function stageLabel(id: string, fallback: string): string {
  return isStageId(id) ? STAGE_LABELS[id] : fallback
}

export function stageComment(id: string, fallback: string): string {
  return isStageId(id) ? STAGE_COMMENTS[id] : fallback
}
