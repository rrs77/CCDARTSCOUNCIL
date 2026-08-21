/** Short stack labels — readable on large deck cards. */
export const STACK_LABELS: Record<string, string> = {
  "the-situation": "Situation",
  primary: "Primary",
  "secondary-and-access": "Access",
  "a-level": "A-level",
  "higher-education": "Education",
  "music-hubs-and-national-centre": "National Centre",
  "a-solution": "Solution",
  sources: "Sources",
};

export function stackLabel(id: string, fallback: string): string {
  return STACK_LABELS[id] ?? fallback;
}

/** Story order for the deck (excludes title). */
export const STACK_ORDER = [
  "the-situation",
  "primary",
  "secondary-and-access",
  "a-level",
  "higher-education",
  "music-hubs-and-national-centre",
  "a-solution",
  "sources",
] as const;
