import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import type { Activity } from '../../contexts/DataContext';
import { getActivityStarKey } from '../../utils/activityStars';
import {
  CCD_PARTNER_PLANNING_UPDATED_EVENT,
  groupPartnerPlanningByOrg,
  partnerPlanningProjectKey,
  readPartnerPlanningPacks,
  resolvePartnerPlanningActivities,
  type PartnerPlanningOrgGroup,
  type PartnerPlanningPack,
} from '../../utils/partnerPlanning';

export type PartnerPlanningActivityRenderArgs = {
  activity: Activity;
  pack: PartnerPlanningPack;
  index: number;
  selected: boolean;
};

interface PartnerPlanningPanelProps {
  activities: Activity[];
  /** Soft filter for “matches current year group” messaging — does not hide pack activities. */
  activityFilter?: (activity: Activity) => boolean;
  renderActivity?: (args: PartnerPlanningActivityRenderArgs) => React.ReactNode;
  renderLessons?: (pack: PartnerPlanningPack) => React.ReactNode;
  className?: string;
  compact?: boolean;
  mode?: 'activities' | 'lessons';
  /** Enable project / activity selection (default true for activities mode). */
  selectable?: boolean;
  selectedActivityKeys?: string[];
  selectedProjectKeys?: string[];
  onActivitySelectionChange?: (
    activity: Activity,
    selected: boolean,
    pack: PartnerPlanningPack,
  ) => void;
  onProjectSelectionChange?: (
    pack: PartnerPlanningPack,
    activities: Activity[],
    selected: boolean,
  ) => void;
  /** Click an activity row (e.g. open details) without toggling selection. */
  onActivityOpen?: (activity: Activity, pack: PartnerPlanningPack) => void;
  /** Optional current class / sheet id for empty-state hints. */
  currentSheetId?: string;
}

const PAID_ORG_IDS = new Set(['weteachdrama', 'icompose']);

function formatSheetLabel(sheetId: string): string {
  const s = String(sheetId || '').trim();
  if (!s) return '';
  if (/^Year\d+$/i.test(s)) return s.replace(/^(Year)(\d+)$/i, 'Year $2');
  return s;
}

function SelectionCheck({
  checked,
  onChange,
  label,
  compact,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`flex shrink-0 items-center justify-center rounded border-2 transition-colors ${
        compact ? 'h-4 w-4' : 'h-4.5 w-4.5 h-[18px] w-[18px]'
      } ${
        checked
          ? 'border-[#002D24] bg-[#A3E635] text-[#002D24]'
          : 'border-[#002D24]/35 bg-white hover:border-[#002D24]/70'
      }`}
    >
      {checked ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : null}
    </button>
  );
}

/**
 * Partner planning accordion — only orgs the user has Added from hubs.
 * No Add to basket here (basket lives in paid hub details only).
 */
export function PartnerPlanningPanel({
  activities,
  activityFilter,
  renderActivity,
  renderLessons,
  className = '',
  compact = false,
  mode = 'activities',
  selectable,
  selectedActivityKeys,
  selectedProjectKeys,
  onActivitySelectionChange,
  onProjectSelectionChange,
  onActivityOpen,
  currentSheetId,
}: PartnerPlanningPanelProps) {
  const [packs, setPacks] = useState<PartnerPlanningPack[]>(() => readPartnerPlanningPacks());
  const [rootOpen, setRootOpen] = useState(false);
  const [openOrgs, setOpenOrgs] = useState<Set<string>>(() => new Set());
  const [openProjects, setOpenProjects] = useState<Set<string>>(() => new Set());

  const selectionEnabled =
    selectable ?? (mode === 'activities' && Boolean(onActivitySelectionChange || onProjectSelectionChange));

  const selectedActSet = useMemo(
    () => new Set((selectedActivityKeys || []).map(String)),
    [selectedActivityKeys],
  );
  const selectedProjSet = useMemo(
    () => new Set((selectedProjectKeys || []).map(String)),
    [selectedProjectKeys],
  );

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

  const toggleOrg = (orgId: string) => {
    setOpenOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) next.delete(orgId);
      else next.add(orgId);
      return next;
    });
  };

  const toggleProjectOpen = (orgId: string, projectId: string) => {
    const key = partnerPlanningProjectKey(orgId, projectId);
    setOpenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div
      className={`overflow-hidden rounded-xl border border-[#002D24]/15 bg-white shadow-sm ${className}`}
      data-partner-planning
    >
      <button
        type="button"
        onClick={() => setRootOpen((v) => !v)}
        className={`flex w-full items-center gap-2 bg-[#002D24] text-left font-semibold text-white hover:bg-[#003d32] ${
          compact ? 'px-3 py-2.5 text-sm' : 'px-4 py-3 text-base'
        }`}
        aria-expanded={rootOpen}
      >
        {rootOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#A3E635]" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-[#A3E635]" aria-hidden />
        )}
        <span>Select partner planning</span>
        <span className="ml-auto text-xs font-medium text-white/75">
          {orgGroups.length} org{orgGroups.length === 1 ? '' : 's'}
        </span>
      </button>

      {rootOpen && (
        <div className={`space-y-2 bg-[var(--ccd-sage-mist,#E8F0EA)]/40 ${compact ? 'p-2' : 'p-3'}`}>
          {orgGroups.map((org) => {
            const orgOpen = openOrgs.has(org.orgId);
            const isPaidOrg = PAID_ORG_IDS.has(org.orgId);
            const logoBg = org.logoBg || '#111827';
            const onLightPlate = logoBg.toLowerCase() === '#ffffff' || logoBg.toLowerCase() === '#fff';
            return (
              <div
                key={org.orgId}
                className={`overflow-hidden rounded-lg border bg-white ${
                  isPaidOrg ? 'border-[#A3E635]/70' : 'border-[#002D24]/12'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleOrg(org.orgId)}
                  className={`flex w-full items-center gap-3 text-left hover:bg-[#E8F0EA]/60 ${
                    compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
                  }`}
                  aria-expanded={orgOpen}
                >
                  {orgOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#002D24]/60" aria-hidden />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#002D24]/60" aria-hidden />
                  )}
                  <span
                    className={`flex h-10 w-16 shrink-0 items-center justify-center rounded-md px-1.5 ${
                      onLightPlate ? 'border border-[#002D24]/10' : ''
                    }`}
                    style={{ backgroundColor: logoBg }}
                  >
                    <img
                      src={org.logoSrc}
                      alt=""
                      className={`max-h-7 max-w-full object-contain ${
                        org.logoInvert ? 'brightness-0 invert' : ''
                      }`}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span
                    className={`font-semibold text-[#002D24] ${compact ? 'text-sm' : 'text-sm sm:text-base'}`}
                  >
                    {org.orgLabel}
                  </span>
                  <span className="ml-auto text-xs text-[#002D24]/55">
                    {org.projects.length} project{org.projects.length === 1 ? '' : 's'}
                  </span>
                </button>

                {orgOpen && (
                  <div className="space-y-1.5 border-t border-[#002D24]/08 bg-[#F7FAF8] px-2 py-2">
                    {org.projects.map((pack) => {
                      const pKey = partnerPlanningProjectKey(org.orgId, pack.projectId);
                      const pOpen = openProjects.has(pKey);
                      // Resolve against live + local library; do not year-filter away pack contents.
                      const packActs = resolvePartnerPlanningActivities(pack, activities);
                      const visibleActs = activityFilter
                        ? packActs.filter(activityFilter)
                        : packActs;
                      const yearMismatch =
                        packActs.length > 0 && visibleActs.length === 0 && Boolean(activityFilter);
                      const sheetMismatch =
                        Boolean(pack.sheetId) &&
                        Boolean(currentSheetId) &&
                        String(pack.sheetId) !== String(currentSheetId);
                      const lessonCount = (pack.lessonKeys || []).length;
                      const badge =
                        mode === 'lessons'
                          ? `${lessonCount} lesson${lessonCount === 1 ? '' : 's'}`
                          : `${packActs.length} activit${packActs.length === 1 ? 'y' : 'ies'}`;
                      const projectSelected =
                        selectedProjSet.has(pKey) ||
                        (packActs.length > 0 &&
                          packActs.every((a) => selectedActSet.has(getActivityStarKey(a))));
                      const canSelectProject =
                        selectionEnabled &&
                        mode !== 'lessons' &&
                        Boolean(onProjectSelectionChange) &&
                        (packActs.length > 0 || (pack.activityIds || []).length > 0);

                      return (
                        <div
                          key={pack.projectId}
                          className={`overflow-hidden rounded-md border bg-white ${
                            projectSelected
                              ? 'border-[#A3E635] ring-1 ring-[#A3E635]/50'
                              : 'border-[#002D24]/10'
                          }`}
                        >
                          <div
                            className={`flex w-full items-center gap-2 text-left ${
                              compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2 text-sm'
                            }`}
                          >
                            {canSelectProject ? (
                              <SelectionCheck
                                checked={projectSelected}
                                compact={compact}
                                label={
                                  projectSelected
                                    ? `Deselect ${pack.projectTitle}`
                                    : `Select ${pack.projectTitle}`
                                }
                                onChange={(next) =>
                                  onProjectSelectionChange?.(pack, packActs as Activity[], next)
                                }
                              />
                            ) : null}
                            <button
                              type="button"
                              onClick={() => toggleProjectOpen(org.orgId, pack.projectId)}
                              className="flex min-w-0 flex-1 items-center gap-2 hover:opacity-90"
                              aria-expanded={pOpen}
                            >
                              {pOpen ? (
                                <ChevronDown
                                  className="h-3.5 w-3.5 shrink-0 text-[#002D24]/50"
                                  aria-hidden
                                />
                              ) : (
                                <ChevronRight
                                  className="h-3.5 w-3.5 shrink-0 text-[#002D24]/50"
                                  aria-hidden
                                />
                              )}
                              {pack.thumbSrc ? (
                                <img
                                  src={pack.thumbSrc}
                                  alt=""
                                  className="h-8 w-12 shrink-0 rounded object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : null}
                              <span className="truncate font-medium text-[#002D24]">
                                {pack.projectTitle}
                              </span>
                              <span className="ml-auto shrink-0 text-xs text-[#002D24]/55">
                                {badge}
                              </span>
                            </button>
                          </div>

                          {pOpen && (
                            <div className="border-t border-[#002D24]/08 bg-white">
                              {renderLessons?.(pack)}
                              {mode === 'lessons' && lessonCount === 0 ? (
                                <p className="px-3 py-2 text-xs text-[#002D24]/55">
                                  No lesson plans registered for this project yet.
                                </p>
                              ) : null}
                              {mode !== 'lessons' && packActs.length === 0 ? (
                                <div className="space-y-2 px-3 py-2">
                                  <p className="text-xs text-[#002D24]/55">
                                    {(pack.activityIds || []).length > 0
                                      ? sheetMismatch || yearMismatch
                                        ? `Activities are in your local library for ${
                                            formatSheetLabel(pack.sheetId || '') || 'another year group'
                                          } — switch class or refresh if they do not appear.`
                                        : 'Activities are in your local library — open the matching year group or refresh if they do not appear here.'
                                      : 'No activities registered for this project yet.'}
                                  </p>
                                  {canSelectProject ? (
                                    <p className="text-[11px] text-[#002D24]/45">
                                      You can still select this project pack above.
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                              {mode !== 'lessons' && packActs.length > 0 && yearMismatch ? (
                                <p className="border-b border-[#002D24]/06 px-3 py-1.5 text-[11px] text-[#002D24]/55">
                                  Packed for{' '}
                                  {formatSheetLabel(pack.sheetId || '') || 'another year group'} —
                                  still selectable here.
                                </p>
                              ) : null}
                              {mode !== 'lessons' && packActs.length > 0 ? (
                                <div className={compact ? 'space-y-1 p-1.5' : 'space-y-2 p-2'}>
                                  {packActs.map((activity, index) => {
                                    const actKey = getActivityStarKey(activity);
                                    const selected = selectedActSet.has(actKey);
                                    if (renderActivity) {
                                      return (
                                        <React.Fragment key={actKey}>
                                          {renderActivity({
                                            activity: activity as Activity,
                                            pack,
                                            index,
                                            selected,
                                          })}
                                        </React.Fragment>
                                      );
                                    }
                                    return (
                                      <div
                                        key={actKey}
                                        className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${
                                          selected
                                            ? 'border-[#A3E635] bg-[#F7FEE7]'
                                            : 'border-[#002D24]/08 bg-white'
                                        }`}
                                      >
                                        {selectionEnabled && onActivitySelectionChange ? (
                                          <SelectionCheck
                                            checked={selected}
                                            compact
                                            label={
                                              selected
                                                ? `Deselect ${activity.activity}`
                                                : `Select ${activity.activity}`
                                            }
                                            onChange={(next) =>
                                              onActivitySelectionChange(
                                                activity as Activity,
                                                next,
                                                pack,
                                              )
                                            }
                                          />
                                        ) : null}
                                        <button
                                          type="button"
                                          className="min-w-0 flex-1 truncate text-left font-medium text-[#002D24] hover:underline"
                                          onClick={() => {
                                            if (onActivityOpen) {
                                              onActivityOpen(activity as Activity, pack);
                                            } else if (onActivitySelectionChange) {
                                              onActivitySelectionChange(
                                                activity as Activity,
                                                !selected,
                                                pack,
                                              );
                                            }
                                          }}
                                        >
                                          {activity.activity}
                                        </button>
                                        <span className="shrink-0 text-[11px] text-[#002D24]/45">
                                          {activity.category}
                                        </span>
                                      </div>
                                    );
                                  })}
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
