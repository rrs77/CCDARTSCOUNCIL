/** Short titles for pathway zones and Map — keep in sync with CONTENT.md `##` headings. */

export const STAGE_ORDER = [
  "primary-eyfs-ks2",
  "secondary",
  "gcse",
  "a-level",
  "university-he",
  "a-solution",
] as const

export type StageId = (typeof STAGE_ORDER)[number]

/**
 * Side-arrow path between main framed sections (not optional top tabs).
 * Situation → Primary → Secondary → GCSE → A-level → HE → Hubs → Solution → Sources
 */
export const SECTION_PATH = [
  "title",
  "primary-eyfs-ks2",
  "secondary",
  "gcse",
  "a-level",
  "university-he",
  "music-hubs-and-national-centre",
  "a-solution",
  "sources",
] as const

export const STAGE_LABELS: Record<StageId, string> = {
  "primary-eyfs-ks2": "Primary / EYFS–KS2",
  secondary: "Secondary",
  gcse: "GCSE",
  "a-level": "A-level",
  "university-he": "University / HE",
  "a-solution": "A solution",
}

/** One-line summary under the zone title on the pathway. */
export const STAGE_COMMENTS: Record<StageId, string> = {
  "primary-eyfs-ks2":
    "Music and arts hours falling; specialist teaching scarce in many schools.",
  secondary:
    "Arts teaching hours and teacher headcount down; access still tracks disadvantage.",
  gcse:
    "Arts GCSE entries down sharply; many schools offer no GCSE arts subjects.",
  "a-level":
    "A-level arts entries and university applications for creative subjects declining.",
  "university-he":
    "Creative arts undergraduate numbers down; pathways into the sector under pressure.",
  "a-solution":
    "A free national platform to plan, share and connect creative teaching — EYFS to KS5.",
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
