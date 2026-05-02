/**
 * Vocal warm-up packs often use sub-headings in Excel (e.g. "Physical Starters")
 * while the app library category is "Vocal Warmups" / "Vocal Warm-Ups".
 * Map subcategories to the parent so year-group assignment and filters match.
 */

const VOCAL_WARMUP_SUBCATEGORIES_LOWER = new Set([
  'physical starters',
  'breathing exercises',
  'facial warm-ups / diction',
  'facial warm ups / diction',
  'pitch exercises',
]);

/** Canonical category string stored on activities when normalizing imports */
export const VOCAL_WARMUP_CANONICAL_CATEGORY = 'Vocal Warmups';

export function normalizeCategoryKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isVocalWarmupLibraryName(name: string): boolean {
  const n = normalizeCategoryKey(name);
  return (
    n === 'vocal warmups' ||
    n === 'vocal warm-ups' ||
    n === 'vocal warmup' ||
    n === 'vocal warm-up'
  );
}

export function isVocalWarmupSubcategory(name: string): boolean {
  return VOCAL_WARMUP_SUBCATEGORIES_LOWER.has(normalizeCategoryKey(name));
}

export function yearGroupListIncludesVocalWarmup(available: string[] | null | undefined): boolean {
  if (!available || !available.length) return false;
  return available.some((c) => isVocalWarmupLibraryName(c));
}

/**
 * Activity is visible for this year group if its category is assigned, or it is a
 * vocal warm-up subcategory and Vocal Warmups (any spelling) is assigned.
 */
export function activityCategoryAllowedForYearGroup(
  activityCategory: string,
  availableCategoriesForYearGroup: string[] | null
): boolean {
  if (availableCategoriesForYearGroup === null) return true;
  const ac = (activityCategory || '').trim();
  if (!ac) return false;
  if (availableCategoriesForYearGroup.includes(ac)) return true;
  if (
    yearGroupListIncludesVocalWarmup(availableCategoriesForYearGroup) &&
    isVocalWarmupSubcategory(ac)
  ) {
    return true;
  }
  return false;
}

/**
 * Dropdown / filter: "all", exact category, or parent Vocal + subcategory rows.
 */
export function activityMatchesSelectedLibraryCategory(
  activityCategory: string,
  selectedCategory: string
): boolean {
  if (selectedCategory === 'all') return true;
  const ac = (activityCategory || '').trim();
  if (ac === selectedCategory) return true;
  if (
    isVocalWarmupLibraryName(selectedCategory) &&
    isVocalWarmupSubcategory(ac)
  ) {
    return true;
  }
  return false;
}
