import type { CustomObjectiveAreaWithObjectives, CustomObjectiveYearGroupWithAreas } from '../types/customObjectives';
import { normalizeYearGroupToken } from './yearGroupSectionOrder';

/** Internal year group that holds objectives removed from folders. */
export const UNASSIGNED_POOL_YEAR_GROUP_NAME = '__Unassigned Objectives Pool__';
export const UNASSIGNED_POOL_AREA_NAME = 'Unassigned';

export function isSystemUnassignedPool(group: { name: string }): boolean {
  return group.name === UNASSIGNED_POOL_YEAR_GROUP_NAME;
}

/** A folder is a year group with one or more linked activity year groups. */
export function isFolderYearGroup(group: { linked_year_groups?: string[] }): boolean {
  return (group.linked_year_groups?.length ?? 0) > 0;
}

export function sortBySortOrder<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

/** Group areas under linked subfolder names for folder-style navigation. */
export function groupAreasByLinkedSubfolders(
  yearGroup: CustomObjectiveYearGroupWithAreas
): { subfolder: string; areas: CustomObjectiveAreaWithObjectives[] }[] {
  const linked = yearGroup.linked_year_groups || [];
  const areas = yearGroup.areas || [];

  if (linked.length === 0) {
    return [{ subfolder: 'Objectives', areas }];
  }

  const buckets = new Map<string, CustomObjectiveAreaWithObjectives[]>();
  linked.forEach((name) => buckets.set(name, []));
  const other: CustomObjectiveAreaWithObjectives[] = [];

  for (const area of areas) {
    const match = linked.find(
      (name) =>
        normalizeYearGroupToken(area.section || '') === normalizeYearGroupToken(name) ||
        normalizeYearGroupToken(area.name || '') === normalizeYearGroupToken(name)
    );
    if (match) {
      buckets.get(match)!.push(area);
    } else {
      other.push(area);
    }
  }

  const result = linked.map((name) => ({
    subfolder: name,
    areas: buckets.get(name) || [],
  }));
  if (other.length > 0) {
    result.push({ subfolder: 'Other', areas: other });
  }
  return result;
}
