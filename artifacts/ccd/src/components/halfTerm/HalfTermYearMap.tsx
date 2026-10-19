import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ChevronRight, Loader2 } from 'lucide-react';
import { halfTermsApi } from '../../config/api';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContextNew';
import { HALF_TERMS, TERM_COLORS } from './halfTermConstants';

export type YearGroupRef = { id: string; name: string };

type CellSummary = {
  lessonCount: number;
  stackCount: number;
  isComplete: boolean;
};

type RowData = {
  group: YearGroupRef;
  cells: Record<string, CellSummary>;
};

type SectionBlock = {
  id: string;
  label: string;
  rows: RowData[];
};

const STAGES_FILTER_KEY = 'ccd-half-term-map-stages';

function emptyCells(): Record<string, CellSummary> {
  return Object.fromEntries(
    HALF_TERMS.map((t) => [t.id, { lessonCount: 0, stackCount: 0, isComplete: false }]),
  );
}

function summariseTerms(
  terms: Array<{ id: string; lessons?: string[]; stacks?: string[]; isComplete?: boolean }>,
): Record<string, CellSummary> {
  const cells = emptyCells();
  for (const term of terms) {
    const id = term.id;
    if (!cells[id]) continue;
    cells[id] = {
      lessonCount: term.lessons?.length ?? 0,
      stackCount: term.stacks?.length ?? 0,
      isComplete: !!term.isComplete,
    };
  }
  return cells;
}

function readLocalTerms(sheet: string, academicYear: string) {
  try {
    const raw = localStorage.getItem(`half-terms-${sheet}-${academicYear}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readSavedStageFilter(validIds: string[]): Set<string> | null {
  try {
    const raw = localStorage.getItem(STAGES_FILTER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return null;
    const next = new Set(parsed.filter((id) => validIds.includes(id)));
    return next.size > 0 ? next : null;
  } catch {
    return null;
  }
}

interface HalfTermYearMapProps {
  onOpenClass: (group: YearGroupRef) => void;
  onOpenTerm: (group: YearGroupRef, halfTermId: string) => void;
}

/**
 * School-wide half-term map: year groups × six half-terms, grouped by key stage.
 * Teachers pick which stages to show (EYFS only, KS1–2, etc.).
 */
export function HalfTermYearMap({ onOpenClass, onOpenTerm }: HalfTermYearMapProps) {
  const { user } = useAuth();
  const { currentAcademicYear, setCurrentAcademicYear, getAvailableYears, currentSheetInfo } = useData();
  const { customYearGroups, yearGroupSections } = useSettings();
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allowedIds = user?.profile?.allowed_year_groups ?? null;
  const yearGroups: YearGroupRef[] = useMemo(() => {
    const base =
      allowedIds != null && allowedIds.length > 0
        ? customYearGroups.filter((g) => allowedIds.includes(g.id) || allowedIds.includes(g.name ?? ''))
        : customYearGroups;
    return base.map((g) => ({ id: g.id, name: g.name }));
  }, [customYearGroups, allowedIds]);

  const sortedSections = useMemo(
    () => [...(yearGroupSections || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [yearGroupSections],
  );

  const stageOptions = useMemo(
    () =>
      sortedSections.map((s) => ({
        id: s.id,
        label: s.id === 'other' ? 'Unallocated' : s.label,
      })),
    [sortedSections],
  );

  const defaultVisibleStages = useMemo(() => {
    const allocated = sortedSections.filter((s) => s.id !== 'other' && (s.yearGroupIds?.length ?? 0) > 0);
    if (allocated.length > 0) return new Set(allocated.map((s) => s.id));
    const other = sortedSections.find((s) => s.id === 'other');
    return new Set(other ? [other.id] : sortedSections.map((s) => s.id));
  }, [sortedSections]);

  const [visibleStages, setVisibleStages] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const ids = stageOptions.map((s) => s.id);
    if (ids.length === 0) {
      setVisibleStages(new Set());
      return;
    }
    const saved = readSavedStageFilter(ids);
    setVisibleStages(saved ?? defaultVisibleStages);
  }, [stageOptions, defaultVisibleStages]);

  const toggleStage = (id: string) => {
    setVisibleStages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STAGES_FILTER_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const showAllStages = () => {
    const all = new Set(stageOptions.map((s) => s.id));
    setVisibleStages(all);
    try {
      localStorage.setItem(STAGES_FILTER_KEY, JSON.stringify([...all]));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const next: RowData[] = await Promise.all(
          yearGroups.map(async (group) => {
            const local = readLocalTerms(group.id, currentAcademicYear);
            if (local && local.length > 0) {
              return { group, cells: summariseTerms(local) };
            }
            try {
              const remote = await halfTermsApi.getBySheet(group.id, currentAcademicYear);
              if (remote && remote.length > 0) {
                return { group, cells: summariseTerms(remote) };
              }
            } catch {
              /* local empty is fine */
            }
            return { group, cells: emptyCells() };
          }),
        );
        if (!cancelled) setRows(next);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load half-term plans');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [yearGroups, currentAcademicYear]);

  const blocks: SectionBlock[] = useMemo(() => {
    const byId = new Map(rows.map((r) => [r.group.id, r]));
    const used = new Set<string>();
    const out: SectionBlock[] = [];

    for (const section of sortedSections) {
      if (visibleStages.size > 0 && !visibleStages.has(section.id)) continue;
      const sectionRows: RowData[] = [];
      for (const ygId of section.yearGroupIds || []) {
        const row = byId.get(ygId);
        if (!row) continue;
        sectionRows.push(row);
        used.add(ygId);
      }
      if (sectionRows.length === 0) continue;
      out.push({
        id: section.id,
        label: section.id === 'other' ? 'Unallocated' : section.label,
        rows: sectionRows,
      });
    }

    // Any classes missing from sections (legacy ids) land under Unallocated when that stage is visible
    const orphans = rows.filter((r) => !used.has(r.group.id));
    if (orphans.length > 0 && (visibleStages.size === 0 || visibleStages.has('other'))) {
      const existing = out.find((b) => b.id === 'other');
      if (existing) existing.rows.push(...orphans);
      else out.push({ id: 'other', label: 'Unallocated', rows: orphans });
    }

    return out;
  }, [rows, sortedSections, visibleStages]);

  const visibleRowCount = blocks.reduce((n, b) => n + b.rows.length, 0);
  const years = getAvailableYears();
  const yearIndex = years.indexOf(currentAcademicYear);

  const filledCells = blocks.reduce(
    (n, block) =>
      n +
      block.rows.reduce(
        (m, row) =>
          m +
          HALF_TERMS.filter((t) => {
            const c = row.cells[t.id];
            return !!c && (c.lessonCount > 0 || c.stackCount > 0 || c.isComplete);
          }).length,
        0,
      ),
    0,
  );
  const totalCells = Math.max(1, visibleRowCount * HALF_TERMS.length);
  const onlyUnallocated =
    blocks.length > 0 && blocks.every((b) => b.id === 'other');

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#77738F]"
            style={{ fontFamily: "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)" }}
          >
            Plan &amp; progress / Term view
          </p>
          <h1
            className="mt-1 text-[1.65rem] font-extrabold tracking-tight text-[#1F1B4D]"
            style={{ fontFamily: "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)" }}
          >
            Half-term map
          </h1>
          <p className="ccd-page-lede ccd-page-lede--single mt-1 text-[13px] leading-snug text-[#77738F]">
            One row per class, one column per half-term. Filter stages, then open a cell to add or review lessons for that term.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={yearIndex < 0 || yearIndex >= years.length - 1}
            onClick={() => {
              if (yearIndex < years.length - 1) setCurrentAcademicYear(years[yearIndex + 1]);
            }}
            className="grid h-9 w-9 place-items-center rounded-xl border border-[#E2E0EF] bg-white text-[#77738F] hover:border-[#bcb7f4] hover:text-[#1F1B4D] disabled:opacity-40"
            title="Previous academic year"
            aria-label="Previous academic year"
          >
            ‹
          </button>
          <span className="min-w-[7.5rem] text-center text-[13px] font-extrabold text-[#1F1B4D]">
            {currentAcademicYear.replace('-', '–')}
          </span>
          <button
            type="button"
            disabled={yearIndex <= 0}
            onClick={() => {
              if (yearIndex > 0) setCurrentAcademicYear(years[yearIndex - 1]);
            }}
            className="grid h-9 w-9 place-items-center rounded-xl border border-[#E2E0EF] bg-white text-[#77738F] hover:border-[#bcb7f4] hover:text-[#1F1B4D] disabled:opacity-40"
            title="Next academic year"
            aria-label="Next academic year"
          >
            ›
          </button>
          <span className="rounded-lg bg-[#E9E6FF] px-2.5 py-1.5 text-[11px] font-bold text-[#4338E8]">
            {filledCells}/{totalCells} planned
          </span>
        </div>
      </div>

      {stageOptions.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#77738F]">
            Show stages
          </span>
          {stageOptions.map((s) => {
            const on = visibleStages.has(s.id);
            const count =
              sortedSections.find((sec) => sec.id === s.id)?.yearGroupIds?.length ?? 0;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleStage(s.id)}
                className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-full px-3 text-[12px] font-bold transition ${
                  on
                    ? s.id === 'other'
                      ? 'bg-[#5C5878] text-white'
                      : 'bg-[#4338E8] text-white'
                    : 'bg-white text-[#5C5878] ring-1 ring-inset ring-[#E2E0EF] hover:ring-[#bcb7f4]'
                }`}
              >
                {s.label}
                <span className={`tabular-nums text-[10px] ${on ? 'opacity-80' : 'text-[#9B97B0]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={showAllStages}
            className="text-[11px] font-bold text-[#4338E8] hover:underline"
          >
            All
          </button>
        </div>
      )}

      {onlyUnallocated && (
        <div className="mb-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-[13px] leading-relaxed text-[#5C4A1F]">
          <p className="font-bold text-[#1F1B4D]">Classes are not in a key stage yet</p>
          <p className="mt-0.5 text-[#5C5878]">
            In Settings → My classes, drag each class into EYFS, KS1, KS2, and so on. An EYFS teacher can
            then show only EYFS here — not the whole school list.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#E2E0EF] bg-white py-16 text-[13px] text-[#77738F]">
          <Loader2 className="h-4 w-4 animate-spin text-[#4338E8]" />
          Loading plans…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-[13px] text-red-800">{error}</div>
      ) : yearGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E2E0EF] bg-white px-4 py-12 text-center">
          <p className="text-[14px] font-semibold text-[#1F1B4D]">No year groups yet</p>
          <p className="mt-1 text-[13px] text-[#77738F]">Add classes in Settings, then return here to plan each half-term.</p>
        </div>
      ) : visibleRowCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E2E0EF] bg-white px-4 py-12 text-center">
          <p className="text-[14px] font-semibold text-[#1F1B4D]">No classes in the selected stages</p>
          <p className="mt-1 text-[13px] text-[#77738F]">
            Turn on another stage above, or assign classes under Settings → My classes.
          </p>
          <button
            type="button"
            onClick={showAllStages}
            className="mt-3 text-[13px] font-bold text-[#4338E8] hover:underline"
          >
            Show all stages
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#E2E0EF] bg-white">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E2E0EF] bg-[#F4F3FA]">
                <th className="sticky left-0 z-[1] bg-[#F4F3FA] px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-[#77738F]">
                  Class
                </th>
                {HALF_TERMS.map((term) => (
                  <th key={term.id} className="px-1.5 py-2.5 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className="h-1 w-8 rounded-full"
                        style={{ background: TERM_COLORS[term.id] }}
                        aria-hidden
                      />
                      <span className="text-[11px] font-extrabold text-[#1F1B4D]">{term.short}</span>
                      <span className="text-[10px] font-medium text-[#77738F]">{term.months}</span>
                    </div>
                  </th>
                ))}
                <th className="w-10 px-2" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <React.Fragment key={block.id}>
                  <tr className="border-b border-[#E2E0EF] bg-[#FAFAFC]">
                    <td
                      colSpan={HALF_TERMS.length + 2}
                      className="px-3 py-2"
                    >
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-[12px] font-extrabold tracking-tight text-[#4338E8]">
                          {block.label}
                        </span>
                        <span className="text-[11px] font-medium text-[#77738F]">
                          {block.rows.length} class{block.rows.length === 1 ? '' : 'es'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {block.rows.map((row) => {
                    const isCurrent = row.group.id === currentSheetInfo.sheet;
                    return (
                      <tr
                        key={row.group.id}
                        className={`border-b border-[#E2E0EF]/80 last:border-0 ${isCurrent ? 'bg-[#F7F6FC]' : 'bg-white'}`}
                      >
                        <th className="sticky left-0 z-[1] bg-inherit px-3 py-2 text-left">
                          <button
                            type="button"
                            onClick={() => onOpenClass(row.group)}
                            className="group flex w-full min-w-[8rem] items-center gap-2 text-left"
                          >
                            <span className="min-w-0 truncate text-[13px] font-extrabold text-[#1F1B4D] group-hover:text-[#4338E8]">
                              {row.group.name}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#C4C0D8] group-hover:text-[#4338E8]" />
                          </button>
                        </th>
                        {HALF_TERMS.map((term) => {
                          const cell = row.cells[term.id] || {
                            lessonCount: 0,
                            stackCount: 0,
                            isComplete: false,
                          };
                          const total = cell.lessonCount + cell.stackCount;
                          const empty = total === 0 && !cell.isComplete;
                          return (
                            <td key={term.id} className="px-1.5 py-1.5">
                              <button
                                type="button"
                                onClick={() => onOpenTerm(row.group, term.id)}
                                title={`${row.group.name} · ${term.name}`}
                                className={`flex h-11 w-full flex-col items-center justify-center rounded-xl border text-[11px] font-bold transition-colors ${
                                  empty
                                    ? 'border-dashed border-[#E2E0EF] bg-[#FAFAFC] text-[#9CA3AF] hover:border-[#bcb7f4] hover:bg-[#E9E6FF] hover:text-[#4338E8]'
                                    : cell.isComplete
                                      ? 'border-[#D5F3EA] bg-[#D5F3EA]/60 text-[#0B6B5F] hover:brightness-95'
                                      : 'border-[#E9E6FF] bg-[#E9E6FF]/50 text-[#1F1B4D] hover:border-[#4338E8]/40 hover:bg-[#E9E6FF]'
                                }`}
                              >
                                {empty ? (
                                  <span>+</span>
                                ) : (
                                  <>
                                    <span className="inline-flex items-center gap-1">
                                      {cell.isComplete ? <CheckCircle className="h-3 w-3" aria-hidden /> : null}
                                      {cell.lessonCount || total}
                                    </span>
                                    {cell.stackCount > 0 ? (
                                      <span className="text-[9px] font-semibold opacity-70">{cell.stackCount} stack</span>
                                    ) : null}
                                  </>
                                )}
                              </button>
                            </td>
                          );
                        })}
                        <td className="px-2" />
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
