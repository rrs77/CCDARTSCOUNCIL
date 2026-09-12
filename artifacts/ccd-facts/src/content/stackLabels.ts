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
    "Hours already unequal before secondary — generalists carry the arts in many schools.",
  secondary:
    "A narrowed curriculum: fewer arts hours and teachers; access still tracks disadvantage.",
  gcse:
    "Arts GCSE entries down sharply; many schools show no Music, Drama or Dance entries.",
  "a-level":
    "After GCSE the arts pathway thins again — and a smaller share of A-levels in the most deprived areas.",
  "university-he":
    "Courses closing or combining; take-up falling hardest where participation is already low.",
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
