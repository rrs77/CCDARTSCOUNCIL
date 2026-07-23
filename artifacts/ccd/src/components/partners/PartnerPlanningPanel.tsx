import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Activity } from '../../contexts/DataContext';
import { getActivityStarKey } from '../../utils/activityStars';
import {
  CCD_PARTNER_PLANNING_UPDATED_EVENT,
  groupPartnerPlanningByOrg,
  readPartnerPlanningPacks,
  type PartnerPlanningOrgGroup,
  type PartnerPlanningPack,
} from '../../utils/partnerPlanning';

export type PartnerPlanningActivityRenderArgs = {
  activity: Activity;
  pack: PartnerPlanningPack;
  index: number;
};

interface PartnerPlanningPanelProps {
  activities: Activity[];
  /** Optional: filter which activity IDs are resolvable (e.g. year-group visible). Default: all. */
  activityFilter?: (activity: Activity) => boolean;
  /** Render each activity under a project. Optional when mode is `lessons`. */
  renderActivity?: (args: PartnerPlanningActivityRenderArgs) => React.ReactNode;
  /** Optional lesson-plan links under a project (Lesson Builder / Library). */
  renderLessons?: (pack: PartnerPlanningPack) => React.ReactNode;
  className?: string;
  /** Compact styling for Lesson Builder sidebar */
  compact?: boolean;
  /**
   * `activities` (default): Activity Library — badge counts activities.
   * `lessons`: Lesson Library — badge counts lesson keys; skips empty-activity notice.
   */
  mode?: 'activities' | 'lessons';
}

function resolveActivitiesForPack(
  pack: PartnerPlanningPack,
  activities: Activity[],
  activityFilter?: (activity: Activity) => boolean,
): Activity[] {
  const byKey = new Map<string, Activity>();
  for (const a of activities || []) {
    if (!a) continue;
    if (activityFilter && !activityFilter(a)) continue;
    byKey.set(getActivityStarKey(a), a);
    if (a._id) byKey.set(String(a._id), a);
    if (a.id) byKey.set(String(a.id), a);
  }
  const resolved: Activity[] = [];
  const seen = new Set<string>();
  for (const id of pack.activityIds || []) {
    const a = byKey.get(String(id));
    if (!a) continue;
    const k = getActivityStarKey(a);
    if (seen.has(k)) continue;
    seen.add(k);
    resolved.push(a);
  }
  return resolved;
}

export function PartnerPlanningPanel({
  activities,
  activityFilter,
  renderActivity,
  renderLessons,
  className = '',
  compact = false,
  mode = 'activities',
}: PartnerPlanningPanelProps) {
  const [packs, setPacks] = useState<PartnerPlanningPack[]>(() => readPartnerPlanningPacks());
  const [rootOpen, setRootOpen] = useState(false);
  const [openOrgs, setOpenOrgs] = useState<Set<string>>(() => new Set());
  const [openProjects, setOpenProjects] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const sync = () => setPacks(readPartnerPlanningPacks());
    window.addEventListener(CCD_PARTNER_PLANNING_UPDATED_EVENT, sync);
    return () => window.removeEventListener(CCD_PARTNER_PLANNING_UPDATED_EVENT, sync);
  }, []);

  const orgGroups: PartnerPlanningOrgGroup[] = useMemo(
    () => groupPartnerPlanningByOrg(packs),
    [packs],
  );

  if (orgGroups.length === 0) return null;

  const projectKey = (orgId: string, projectId: string) => `${orgId}::${projectId}`;

  const toggleOrg = (orgId: string) => {
    setOpenOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) next.delete(orgId);
      else next.add(orgId);
      return next;
    });
  };

  const toggleProject = (orgId: string, projectId: string) => {
    const key = projectKey(orgId, projectId);
    setOpenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div
      className={`rounded-xl border border-teal-200 bg-gradient-to-b from-teal-50/80 to-white shadow-sm ${className}`}
      data-partner-planning
    >
      <button
        type="button"
        onClick={() => setRootOpen((v) => !v)}
        className={`flex w-full items-center gap-2 text-left font-semibold text-teal-900 hover:bg-teal-50/80 ${
          compact ? 'px-3 py-2.5 text-sm' : 'px-4 py-3 text-base'
        }`}
        aria-expanded={rootOpen}
      >
        {rootOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-teal-700" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-teal-700" aria-hidden />
        )}
        <span>Select partner planning</span>
        <span className="ml-auto text-xs font-medium text-teal-700/80">
          {orgGroups.length} org{orgGroups.length === 1 ? '' : 's'}
        </span>
      </button>

      {rootOpen && (
        <div className={`space-y-2 border-t border-teal-100 ${compact ? 'p-2' : 'p-3'}`}>
          {orgGroups.map((org) => {
            const orgOpen = openOrgs.has(org.orgId);
            return (
              <div
                key={org.orgId}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleOrg(org.orgId)}
                  className={`flex w-full items-center gap-3 text-left hover:bg-gray-50 ${
                    compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
                  }`}
                  aria-expanded={orgOpen}
                >
                  {orgOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                  )}
                  <span
                    className="flex h-9 w-14 shrink-0 items-center justify-center rounded-md px-1.5"
                    style={{ backgroundColor: org.logoBg || '#111827' }}
                  >
                    <img
                      src={org.logoSrc}
                      alt=""
                      className={`max-h-6 max-w-full object-contain ${
                        org.logoInvert ? 'brightness-0 invert' : ''
                      }`}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-sm sm:text-base'}`}>
                    {org.orgLabel}
                  </span>
                  <span className="ml-auto text-xs text-gray-500">
                    {org.projects.length} project{org.projects.length === 1 ? '' : 's'}
                  </span>
                </button>

                {orgOpen && (
                  <div className="space-y-1.5 border-t border-gray-100 bg-gray-50/60 px-2 py-2">
                    {org.projects.map((pack) => {
                      const pOpen = openProjects.has(projectKey(org.orgId, pack.projectId));
                      const packActs = resolveActivitiesForPack(pack, activities, activityFilter);
                      const lessonCount = (pack.lessonKeys || []).length;
                      const badge =
                        mode === 'lessons'
                          ? `${lessonCount} lesson${lessonCount === 1 ? '' : 's'}`
                          : `${packActs.length} activit${packActs.length === 1 ? 'y' : 'ies'}`;
                      return (
                        <div
                          key={pack.projectId}
                          className="overflow-hidden rounded-md border border-gray-200 bg-white"
                        >
                          <button
                            type="button"
                            onClick={() => toggleProject(org.orgId, pack.projectId)}
                            className={`flex w-full items-center gap-2 text-left hover:bg-gray-50 ${
                              compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2 text-sm'
                            }`}
                            aria-expanded={pOpen}
                          >
                            {pOpen ? (
                              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden />
                            )}
                            <span className="font-medium text-gray-800">{pack.projectTitle}</span>
                            <span className="ml-auto text-xs text-gray-500">{badge}</span>
                          </button>

                          {pOpen && (
                            <div className="border-t border-gray-100 bg-white">
                              {renderLessons?.(pack)}
                              {mode === 'lessons' && lessonCount === 0 ? (
                                <p className="px-3 py-2 text-xs text-gray-500">
                                  No lesson plans registered for this project yet.
                                </p>
                              ) : null}
                              {mode !== 'lessons' && packActs.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-gray-500">
                                  Activities are in your local library — open the matching year
                                  group or refresh if they do not appear here.
                                </p>
                              ) : null}
                              {packActs.length > 0 && renderActivity ? (
                                <div className={compact ? 'space-y-1 p-1.5' : 'space-y-2 p-2'}>
                                  {packActs.map((activity, index) =>
                                    renderActivity({ activity, pack, index }),
                                  )}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
