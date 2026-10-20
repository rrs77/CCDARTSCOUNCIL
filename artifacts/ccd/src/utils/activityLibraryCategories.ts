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

import { activityTagsMatchYearGroupKeys } from './yearGroupMatchKeys';

function activityHasSpecificYearGroupTags(activityYearGroups: unknown): boolean {
  const tags = Array.isArray(activityYearGroups) ? activityYearGroups : [];
  return tags.some((tag) => {
    const t = String(tag || '').trim();
    if (!t) return false;
    return t.toLowerCase() !== 'all';
  });
}

/**
 * Year-group visibility when a class is selected in the header.
 *
 * Rules (AND):
 * 1. Respect Settings class-folder visibility — the activity's category must be
 *    assigned to this year group (or `availableCategoriesForYearGroup === null`
 *    for a deliberate "All classes" view).
 * 2. If the activity has specific year-group tags, those tags must include this
 *    class (id / name / safe aliases). Tagged Year-10 activities never appear
 *    for Year 1 Drama.
 * 3. Untagged / legacy "All" activities follow Settings category assignment only.
 *
 * When no year-group keys are resolved (no class selected), return false so we
 * never default to showing every activity.
 */
export function activityVisibleForYearGroup(options: {
  activityCategory: string;
  availableCategoriesForYearGroup: string[] | null;
  activityYearGroups: unknown;
  yearGroupKeys: string[];
  /** Kept for call-site compatibility; no longer used to bypass tag checks. */
  settingsCategoryNames?: string[];
  normalizeKey?: (value: string) => string;
}): boolean {
  const keys = options.yearGroupKeys || [];

  // Deliberate "All classes" view: null available list + no keys → show all.
  // A selected class always produces keys; empty keys means "not ready / none".
  if (keys.length === 0) {
    return options.availableCategoriesForYearGroup === null;
  }

  const categoryOk = activityCategoryAllowedForYearGroup(
    options.activityCategory,
    options.availableCategoriesForYearGroup,
  );

  if (!categoryOk) return false;

  if (activityHasSpecificYearGroupTags(options.activityYearGroups)) {
    return activityTagsMatchYearGroupKeys(options.activityYearGroups, keys);
  }

  // Untagged legacy activities: Settings folder assignment is enough.
  return true;
}
