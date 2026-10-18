import React, { useEffect, useState } from 'react';
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

interface HalfTermYearMapProps {
  onOpenClass: (group: YearGroupRef) => void;
  onOpenTerm: (group: YearGroupRef, halfTermId: string) => void;
}

/**
 * School-wide half-term map: every year group × six half-terms.
 * Per-class editing still lives in UnitViewer; this is the overview.
 */
export function HalfTermYearMap({ onOpenClass, onOpenTerm }: HalfTermYearMapProps) {
  const { user } = useAuth();
  const { currentAcademicYear, setCurrentAcademicYear, getAvailableYears, currentSheetInfo } = useData();
  const { customYearGroups, yearGroupSections } = useSettings();
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allowedIds = user?.profile?.allowed_year_groups ?? null;
  const yearGroups: YearGroupRef[] = React.useMemo(() => {
    const base =
      allowedIds != null && allowedIds.length > 0
        ? customYearGroups.filter((g) => allowedIds.includes(g.id) || allowedIds.includes(g.name ?? ''))
        : customYearGroups;
    return base.map((g) => ({ id: g.id, name: g.name }));
  }, [customYearGroups, allowedIds]);

  const sectionLabel = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const section of yearGroupSections || []) {
      for (const ygId of section.yearGroupIds || []) {
        map.set(ygId, section.label);
      }
    }
    return map;
  }, [yearGroupSections]);

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

  const years = getAvailableYears();
  const yearIndex = years.indexOf(currentAcademicYear);

  const filledCells = rows.reduce(
    (n, row) =>
      n +
      HALF_TERMS.filter((t) => {
        const c = row.cells[t.id];
        return !!c && (c.lessonCount > 0 || c.stackCount > 0 || c.isComplete);
      }).length,
    0,
  );
  const totalCells = Math.max(1, rows.length * HALF_TERMS.length);

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#77738F]"
            style={{ fontFamily: "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)" }}
          >
            Plan &amp; progress / Half-terms
          </p>
          <h1
            className="mt-1 text-[1.65rem] font-extrabold tracking-tight text-[#1F1B4D]"
            style={{ fontFamily: "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)" }}
          >
            Half-term plans
          </h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[#77738F]">
            Every year group across the academic year. Open a cell to add or edit lessons for that class and
            half-term.
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

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#E2E0EF] bg-white py-16 text-[13px] text-[#77738F]">
          <Loader2 className="h-4 w-4 animate-spin text-[#4338E8]" />
          Loading plans for all year groups…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-[13px] text-red-800">{error}</div>
      ) : yearGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E2E0EF] bg-white px-4 py-12 text-center">
          <p className="text-[14px] font-semibold text-[#1F1B4D]">No year groups yet</p>
          <p className="mt-1 text-[13px] text-[#77738F]">Add classes in Settings, then return here to plan each half-term.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#E2E0EF] bg-white">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E2E0EF] bg-[#F4F3FA]">
                <th className="sticky left-0 z-[1] bg-[#F4F3FA] px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-[#77738F]">
                  Year group
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
              {rows.map((row) => {
                const isCurrent = row.group.id === currentSheetInfo.sheet;
                const section = sectionLabel.get(row.group.id);
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
                        <span className="min-w-0">
                          {section ? (
                            <span className="block text-[10px] font-bold uppercase tracking-wide text-[#77738F]">
                              {section}
                            </span>
                          ) : null}
                          <span className="block truncate text-[13px] font-extrabold text-[#1F1B4D] group-hover:text-[#4338E8]">
                            {row.group.name}
                          </span>
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
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
