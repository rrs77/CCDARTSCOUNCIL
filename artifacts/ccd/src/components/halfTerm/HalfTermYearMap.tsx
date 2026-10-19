import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { halfTermsApi } from '../../config/api';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContextNew';
import {
  HALF_TERMS,
  TERM_COLORS,
  TERM_TINTS,
  currentHalfTermIdForYear,
} from './halfTermConstants';

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
const UI_FONT = "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)";

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

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(67, 56, 232, ${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  const currentTermId = useMemo(
    () => currentHalfTermIdForYear(currentAcademicYear),
    [currentAcademicYear],
  );

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
  const onlyUnallocated = blocks.length > 0 && blocks.every((b) => b.id === 'other');
  const allStagesSelected =
    stageOptions.length > 0 && stageOptions.every((s) => visibleStages.has(s.id));

  return (
    <div className="min-w-0 w-full" style={{ fontFamily: UI_FONT }}>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#77738F]">
            Plan &amp; progress / Term view
          </p>
          <h1 className="mt-1 text-[1.65rem] font-extrabold tracking-tight text-[#1F1B4D] sm:text-[1.75rem]">
            Half-term map
          </h1>
          <p className="ccd-page-lede ccd-page-lede--single mt-1.5 text-[13px] leading-snug text-[#77738F]">
            One row per class, one column per half-term. Filter stages, then open a cell to add or
            review lessons.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="inline-flex items-center gap-0.5 rounded-xl border border-[#E2E0EF] bg-white p-0.5 shadow-[0_1px_2px_rgba(31,27,77,0.04)]"
            role="group"
            aria-label="Academic year"
          >
            <button
              type="button"
              disabled={yearIndex < 0 || yearIndex >= years.length - 1}
              onClick={() => {
                if (yearIndex < years.length - 1) setCurrentAcademicYear(years[yearIndex + 1]);
              }}
              className="grid h-9 w-9 place-items-center rounded-[10px] text-[#77738F] transition hover:bg-[#F4F3FA] hover:text-[#1F1B4D] disabled:opacity-35"
              title="Previous academic year"
              aria-label="Previous academic year"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[7.75rem] px-1 text-center text-[13px] font-extrabold tabular-nums text-[#1F1B4D]">
              {currentAcademicYear.replace('-', '–')}
            </span>
            <button
              type="button"
              disabled={yearIndex <= 0}
              onClick={() => {
                if (yearIndex > 0) setCurrentAcademicYear(years[yearIndex - 1]);
              }}
              className="grid h-9 w-9 place-items-center rounded-[10px] text-[#77738F] transition hover:bg-[#F4F3FA] hover:text-[#1F1B4D] disabled:opacity-35"
              title="Next academic year"
              aria-label="Next academic year"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="inline-flex items-center rounded-xl bg-[#E9E6FF] px-3 py-2 text-[12px] font-bold text-[#4338E8]">
            <span className="tabular-nums">{filledCells}</span>
            <span className="mx-0.5 opacity-60">/</span>
            <span className="tabular-nums">{totalCells}</span>
            <span className="ml-1.5 font-semibold opacity-90">planned</span>
          </span>
        </div>
      </div>

      {stageOptions.length > 0 && (
        <div className="mb-4 rounded-2xl border border-[#E2E0EF] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(31,27,77,0.03)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#77738F]">
              Show stages
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5" role="group" aria-label="Stage filter">
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
                    className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 text-[12px] font-bold transition ${
                      on
                        ? s.id === 'other'
                          ? 'bg-[#5C5878] text-white shadow-sm'
                          : 'bg-[#4338E8] text-white shadow-sm'
                        : 'bg-[#F4F3FA] text-[#5C5878] hover:bg-[#E9E6FF] hover:text-[#1F1B4D]'
                    }`}
                  >
                    {s.label}
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
                        on ? 'bg-white/20 text-white' : 'bg-white text-[#9B97B0]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={showAllStages}
                aria-pressed={allStagesSelected}
                className={`inline-flex min-h-[34px] items-center rounded-lg px-3 text-[12px] font-bold transition ${
                  allStagesSelected
                    ? 'bg-[#1F1B4D] text-white'
                    : 'text-[#4338E8] hover:bg-[#E9E6FF]'
                }`}
              >
                All
              </button>
            </div>
          </div>
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
        <div className="overflow-x-auto rounded-2xl border border-[#E2E0EF] bg-white shadow-[0_1px_3px_rgba(31,27,77,0.04)]">
          <table
            className="w-full border-collapse text-left"
            style={{ tableLayout: 'fixed', minWidth: 880 }}
          >
            <colgroup>
              {/* ~240px: full names like “Upper Kindergarten” at laptop widths; long names wrap to 2 lines */}
              <col style={{ width: '15rem' }} />
              {HALF_TERMS.map((term) => (
                <col key={term.id} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-[#E2E0EF]">
                <th className="sticky left-0 z-[2] border-r border-[#E2E0EF] bg-[#F4F3FA] px-3 py-3.5 align-bottom">
                  <span className="block text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#1F1B4D]">
                    Class
                  </span>
                </th>
                {HALF_TERMS.map((term) => {
                  const color = TERM_COLORS[term.id];
                  const isCurrent = currentTermId === term.id;
                  return (
                    <th
                      key={term.id}
                      className={`relative px-1 pb-3 pt-0 text-center align-bottom ${
                        isCurrent ? 'bg-[#E9E6FF]/70' : 'bg-[#F4F3FA]'
                      }`}
                    >
                      <div
                        className="mb-2.5 h-2.5 w-full rounded-b-md"
                        style={{
                          background: color,
                          boxShadow: isCurrent ? `0 0 0 2px ${hexToRgba(color, 0.28)}` : undefined,
                        }}
                        aria-hidden
                      />
                      <div className="flex flex-col items-center gap-0.5 px-0.5">
                        <span
                          className="text-[15px] font-extrabold leading-tight tracking-tight sm:text-[16px]"
                          style={{ color: isCurrent ? color : '#1F1B4D' }}
                        >
                          {term.name}
                        </span>
                        <span className="text-[12px] font-semibold leading-tight text-[#5C5878]">
                          {term.months}
                        </span>
                        {isCurrent ? (
                          <span
                            className="mt-1 inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white"
                            style={{ background: color }}
                          >
                            Now
                          </span>
                        ) : (
                          <span className="mt-1 h-[18px]" aria-hidden />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <React.Fragment key={block.id}>
                  <tr className="border-b border-[#E2E0EF]">
                    <td colSpan={HALF_TERMS.length + 1} className="bg-[#EEECF8] px-0 py-0">
                      <div className="flex items-center gap-3 px-4 py-2.5">
                        <span
                          className="h-5 w-1 shrink-0 rounded-full bg-[#4338E8]"
                          aria-hidden
                        />
                        <span className="text-[13px] font-extrabold tracking-tight text-[#1F1B4D]">
                          {block.label}
                        </span>
                        <span className="rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-bold text-[#77738F] ring-1 ring-inset ring-[#E2E0EF]">
                          {block.rows.length} class{block.rows.length === 1 ? '' : 'es'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {block.rows.map((row) => {
                    const isCurrentClass = row.group.id === currentSheetInfo.sheet;
                    return (
                      <tr
                        key={row.group.id}
                        className={`border-b border-[#E2E0EF]/70 last:border-0 ${
                          isCurrentClass ? 'bg-[#F7F6FC]' : 'bg-white'
                        }`}
                      >
                        <th
                          className={`sticky left-0 z-[1] border-r border-[#E2E0EF] px-2 py-1.5 text-left ${
                            isCurrentClass ? 'bg-[#F7F6FC]' : 'bg-white'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onOpenClass(row.group)}
                            title={row.group.name}
                            className="group flex w-full min-w-0 items-start gap-1.5 rounded-lg px-1 py-1.5 text-left transition hover:bg-[#E9E6FF]/60"
                          >
                            <span className="min-w-0 flex-1 break-words text-[13px] font-extrabold leading-snug text-[#1F1B4D] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden group-hover:text-[#4338E8]">
                              {row.group.name}
                            </span>
                            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C4C0D8] group-hover:text-[#4338E8]" />
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
                          const color = TERM_COLORS[term.id];
                          const tint = TERM_TINTS[term.id];
                          const isCurrentCol = currentTermId === term.id;
                          return (
                            <td
                              key={term.id}
                              className={`px-1.5 py-1.5 ${isCurrentCol ? 'bg-[#E9E6FF]/35' : ''}`}
                            >
                              <button
                                type="button"
                                onClick={() => onOpenTerm(row.group, term.id)}
                                title={`${row.group.name} · ${term.name}`}
                                aria-label={
                                  empty
                                    ? `Add lessons for ${row.group.name}, ${term.name}`
                                    : `${cell.lessonCount || total} lesson${(cell.lessonCount || total) === 1 ? '' : 's'} in ${row.group.name}, ${term.name}`
                                }
                                className={`group/cell relative flex h-12 w-full flex-col items-center justify-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9A3FF] ${
                                  empty
                                    ? 'bg-transparent hover:bg-[#F4F3FA]'
                                    : cell.isComplete
                                      ? 'hover:brightness-[0.98]'
                                      : 'hover:brightness-[0.98]'
                                }`}
                                style={
                                  empty
                                    ? undefined
                                    : {
                                        background: cell.isComplete
                                          ? 'rgba(213, 243, 234, 0.85)'
                                          : tint,
                                        boxShadow: `inset 0 0 0 1px ${hexToRgba(color, cell.isComplete ? 0.15 : 0.22)}`,
                                      }
                                }
                              >
                                {empty ? (
                                  <>
                                    <span
                                      className="pointer-events-none absolute inset-1 rounded-lg border border-transparent transition group-hover/cell:border-dashed group-hover/cell:border-[#D8D5E8] group-focus-visible/cell:border-dashed group-focus-visible/cell:border-[#bcb7f4]"
                                      aria-hidden
                                    />
                                    <Plus className="h-4 w-4 text-transparent transition group-hover/cell:text-[#9B97B0] group-focus-visible/cell:text-[#4338E8]" />
                                  </>
                                ) : (
                                  <span className="inline-flex max-w-full flex-col items-center gap-0.5 px-1">
                                    <span
                                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-extrabold tabular-nums text-white shadow-sm"
                                      style={{ background: cell.isComplete ? '#0B6B5F' : color }}
                                    >
                                      {cell.isComplete ? (
                                        <CheckCircle className="h-3 w-3" aria-hidden />
                                      ) : null}
                                      {cell.lessonCount || total}
                                      <span className="text-[10px] font-bold opacity-90">
                                        {(cell.lessonCount || total) === 1 ? 'lesson' : 'lessons'}
                                      </span>
                                    </span>
                                    {cell.stackCount > 0 ? (
                                      <span
                                        className="text-[10px] font-bold"
                                        style={{ color: cell.isComplete ? '#0B6B5F' : color }}
                                      >
                                        {cell.stackCount} stack{cell.stackCount === 1 ? '' : 's'}
                                      </span>
                                    ) : null}
                                  </span>
                                )}
                              </button>
                            </td>
                          );
                        })}
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
