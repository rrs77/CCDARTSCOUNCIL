import React, { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import type { Activity } from '../../contexts/DataContext';
import { getActivityStarKey } from '../../utils/activityStars';
import {
  CCD_RECENTLY_ADDED_UPDATED_EVENT,
  readRecentlyAdded,
  type RecentlyAddedEntry,
} from '../../utils/recentlyAddedActivities';
import { ActivityCard } from '../ActivityCard';

interface RecentlyAddedActivitiesPanelProps {
  activities: Activity[];
  activityFilter?: (activity: Activity) => boolean;
  onActivitySelect: (activity: Activity) => void;
  getCategoryColor: (category: string) => string;
  starredIds: Set<string>;
  onStarToggle: (activity: Activity) => void;
  className?: string;
}

function resolveEntry(
  entry: RecentlyAddedEntry,
  activities: Activity[],
  activityFilter?: (activity: Activity) => boolean,
): Activity | null {
  for (const a of activities || []) {
    if (!a) continue;
    if (activityFilter && !activityFilter(a)) continue;
    const key = getActivityStarKey(a);
    if (
      key === entry.activityId ||
      (a._id && String(a._id) === entry.activityId) ||
      (a.id && String(a.id) === entry.activityId)
    ) {
      return a;
    }
  }
  return null;
}

/**
 * Activity Library strip for WTD / iCompose hub picks — only populated after
 * Add to CCDesigner on those hubs. Starred items show a filled star.
 */
export function RecentlyAddedActivitiesPanel({
  activities,
  activityFilter,
  onActivitySelect,
  getCategoryColor,
  starredIds,
  onStarToggle,
  className = '',
}: RecentlyAddedActivitiesPanelProps) {
  const [entries, setEntries] = useState<RecentlyAddedEntry[]>(() => readRecentlyAdded());

  useEffect(() => {
    const sync = () => setEntries(readRecentlyAdded());
    window.addEventListener(CCD_RECENTLY_ADDED_UPDATED_EVENT, sync);
    return () => window.removeEventListener(CCD_RECENTLY_ADDED_UPDATED_EVENT, sync);
  }, []);

  const resolved = useMemo(() => {
    const out: Array<{ entry: RecentlyAddedEntry; activity: Activity }> = [];
    const seen = new Set<string>();
    for (const entry of entries) {
      const activity = resolveEntry(entry, activities, activityFilter);
      if (!activity) continue;
      const key = getActivityStarKey(activity);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ entry, activity });
    }
    return out;
  }, [entries, activities, activityFilter]);

  if (resolved.length === 0) return null;

  return (
    <section
      className={`rounded-xl border border-[#A3E635]/70 bg-gradient-to-b from-[#F7FEE7]/90 to-white shadow-sm ${className}`}
      data-recently-added
      aria-labelledby="recently-added-heading"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-[#A3E635]/40 px-4 py-3">
        <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden />
        <h3
          id="recently-added-heading"
          className="text-base font-semibold tracking-tight text-[#002D24]"
        >
          Recently added
        </h3>
        <span className="text-xs font-medium text-[#3F6212]">
          Partner picks · We Teach Drama &amp; iCompose
        </span>
        <span className="ml-auto text-xs text-[#002D24]/60">
          {resolved.length} activit{resolved.length === 1 ? 'y' : 'ies'}
        </span>
      </div>
      <ul className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {resolved.map(({ entry, activity }) => {
          const key = getActivityStarKey(activity);
          const isStarred = entry.starred || starredIds.has(key);
          return (
            <li key={key} className="relative">
              {isStarred && (
                <span
                  className="absolute right-2 top-2 z-10 inline-flex items-center gap-0.5 rounded bg-[#A3E635] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#002D24]"
                  title="Partner highlight"
                >
                  <Star className="h-3 w-3 fill-current" aria-hidden />
                  Star
                </span>
              )}
              <ActivityCard
                activity={activity}
                onActivityClick={() => onActivitySelect(activity)}
                categoryColor={getCategoryColor(activity.category)}
                viewMode="compact"
                isStarred={isStarred}
                onStarToggle={() => onStarToggle(activity)}
              />
              <p className="mt-1 px-1 text-[11px] font-medium text-[#3F6212]">
                {entry.partnerLabel}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
