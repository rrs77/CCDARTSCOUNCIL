/**
 * Key-stage pathway — canvas zones and Map labels.
 * Ids must match CONTENT.md ## slugs from parseContent.
 */

export const STAGE_LABELS: Record<string, string> = {
  "primary-eyfs-ks2": "Primary / EYFS–KS2",
  "secondary-ks3-ks4": "Secondary / KS3–KS4",
  "ks5-a-level": "KS5 / A-level",
  "university-he": "University / HE",
  ccdesigner: "CCDesigner",
  sources: "Sources",
  title: "Title",
};

/** Pathway order (excludes title & sources from the main stage strip). */
export const STAGE_ORDER = [
  "primary-eyfs-ks2",
  "secondary-ks3-ks4",
  "ks5-a-level",
  "university-he",
  "ccdesigner",
] as const;

export function stageLabel(id: string, fallback: string): string {
  return STAGE_LABELS[id] ?? fallback;
}

/** @deprecated use STAGE_* — kept for any residual imports */
export const STACK_LABELS = STAGE_LABELS;
export const STACK_ORDER = STAGE_ORDER;
export const stackLabel = stageLabel;
