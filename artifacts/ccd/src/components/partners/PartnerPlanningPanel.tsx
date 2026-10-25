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

const PAID_ORG_IDS = new Set([
  'weteachdrama',
  'icompose',
  'dramaresource',
  'ems',
  'triborough',
  'jazznorth',
]);

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
          ? 'border-[#4338E8] bg-[#FFC93C] text-[#1F1B4D]'
          : 'border-[#E2E0EF] bg-white hover:border-[#4338E8]/60'
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
      className={`overflow-hidden rounded-lg border border-[#E2E0EF] bg-white ${className}`}
      data-partner-planning
      style={{ borderLeft: '4px solid #1F1B4D' }}
    >
      {/* Same density as Activity Library category rows — not a nested “app” header */}
      <button
        type="button"
        onClick={() => setRootOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 bg-[#F4F3FA] px-3 py-2 text-left hover:bg-[#E9E6FF]/70"
        aria-expanded={rootOpen}
      >
        {rootOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#77738F]" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-[#77738F]" aria-hidden />
        )}
        <span className="rounded-full bg-[#1F1B4D] px-2 py-0.5 text-[13px] font-semibold text-white">
          Partner planning
        </span>
        <span className="text-xs text-[#77738F]">
          {orgGroups.length} org{orgGroups.length === 1 ? '' : 's'}
        </span>
        <span className="ml-auto text-[13px] font-medium text-[#4338E8]">
          {rootOpen ? 'Hide' : 'Show'}
        </span>
      </button>

      {rootOpen && (
        <div className="space-y-1.5 border-t border-[#E2E0EF] bg-white p-1.5">
          {orgGroups.map((org) => {
            const orgOpen = openOrgs.has(org.orgId);
            const isPaidOrg = PAID_ORG_IDS.has(org.orgId);
            const logoBg = org.logoBg || '#111827';
            const onLightPlate = logoBg.toLowerCase() === '#ffffff' || logoBg.toLowerCase() === '#fff';
            return (
              <div
                key={org.orgId}
                className={`overflow-hidden rounded-md border bg-white ${
                  isPaidOrg ? 'border-[#FFC93C]/80' : 'border-[#E2E0EF]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleOrg(org.orgId)}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-[#F4F3FA]"
                  aria-expanded={orgOpen}
                >
                  {orgOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#77738F]" aria-hidden />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#77738F]" aria-hidden />
                  )}
                  <span
                    className={`flex h-7 w-12 shrink-0 items-center justify-center rounded px-1 ${
                      onLightPlate ? 'border border-[#E2E0EF]' : ''
                    }`}
                    style={{ backgroundColor: logoBg }}
                  >
                    <img
                      src={org.logoSrc}
                      alt=""
                      className={`max-h-5 max-w-full object-contain ${
                        org.logoInvert ? 'brightness-0 invert' : ''
                      }`}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span className="truncate text-sm font-semibold text-[#1F1B4D]">
                    {org.orgLabel}
                  </span>
                  <span className="ml-auto shrink-0 text-[13px] text-[#77738F]">
                    {org.projects.length} project{org.projects.length === 1 ? '' : 's'}
                  </span>
                </button>

                {orgOpen && (
                  <div className="space-y-1 border-t border-[#E2E0EF] bg-[#F4F3FA]/50 px-1.5 py-1.5">
                    {org.projects.map((pack) => {
                      const pKey = partnerPlanningProjectKey(org.orgId, pack.projectId);
                      const pOpen = openProjects.has(pKey);
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
                          className={`overflow-hidden rounded border bg-white ${
                            projectSelected
                              ? 'border-[#FFC93C] ring-1 ring-[#FFC93C]/40'
                              : 'border-[#E2E0EF]'
                          }`}
                        >
                          <div className="flex w-full items-center gap-1.5 px-1.5 py-1 text-sm">
                            {canSelectProject ? (
                              <SelectionCheck
                                checked={projectSelected}
                                compact
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
                              className="flex min-w-0 flex-1 items-center gap-1.5 hover:opacity-90"
                              aria-expanded={pOpen}
                            >
                              {pOpen ? (
                                <ChevronDown
                                  className="h-3 w-3 shrink-0 text-[#77738F]"
                                  aria-hidden
                                />
                              ) : (
                                <ChevronRight
                                  className="h-3 w-3 shrink-0 text-[#77738F]"
                                  aria-hidden
                                />
                              )}
                              {pack.thumbSrc ? (
                                <img
                                  src={pack.thumbSrc}
                                  alt=""
                                  className="h-6 w-9 shrink-0 rounded object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : null}
                              <span className="truncate text-xs font-medium text-[#1F1B4D]">
                                {pack.projectTitle}
                              </span>
                              <span className="ml-auto shrink-0 text-[13px] text-[#77738F]">
                                {badge}
                              </span>
                            </button>
                          </div>

                          {pOpen && (
                            <div className="border-t border-[#E2E0EF] bg-white">
                              {renderLessons?.(pack)}
                              {mode === 'lessons' && lessonCount === 0 ? (
                                <p className="px-2 py-1.5 text-[13px] text-[#77738F]">
                                  No lesson plans registered for this project yet.
                                </p>
                              ) : null}
                              {mode !== 'lessons' && packActs.length === 0 ? (
                                <div className="space-y-1 px-2 py-1.5">
                                  <p className="text-[13px] text-[#77738F]">
                                    {(pack.activityIds || []).length > 0
                                      ? sheetMismatch || yearMismatch
                                        ? `Activities are in your local library for ${
                                            formatSheetLabel(pack.sheetId || '') || 'another year group'
                                          } — switch class or refresh if they do not appear.`
                                        : 'Activities are in your local library — open the matching year group or refresh if they do not appear here.'
                                      : 'No activities registered for this project yet.'}
                                  </p>
                                  {canSelectProject ? (
                                    <p className="text-[13px] text-[#77738F]/80">
                                      You can still select this project pack above.
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                              {mode !== 'lessons' && packActs.length > 0 && yearMismatch ? (
                                <p className="border-b border-[#E2E0EF] px-2 py-1 text-[13px] text-[#77738F]">
                                  Packed for{' '}
                                  {formatSheetLabel(pack.sheetId || '') || 'another year group'} —
                                  still selectable here.
                                </p>
                              ) : null}
                              {mode !== 'lessons' && packActs.length > 0 ? (
                                <div className="space-y-1 p-1">
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
                                        className={`flex items-center gap-1.5 rounded border px-1.5 py-1 text-xs ${
                                          selected
                                            ? 'border-[#FFC93C] bg-[#FFF8E6]'
                                            : 'border-[#E2E0EF] bg-white'
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
                                          className="min-w-0 flex-1 truncate text-left font-medium text-[#1F1B4D] hover:underline"
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
                                        <span className="shrink-0 text-[13px] text-[#77738F]">
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
