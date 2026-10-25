/**
 * Year overview — port of planner-mock YearOverviewScreen.
 * Columns = Settings term dates; cards = units assigned to each term.
 */
import { ArrowLeft, Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useData, type Unit } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContextNew';
import {
  loadPlannerCurriculum,
  loadPlannerTerms,
} from '../../utils/planner/plannerCurriculumStore';
import type { PlannerTermDates } from '../../types/plannerCurriculum';
import { Button } from './ui';
import { formatUkDateRangeShort } from '../../utils/planner/ukDate';
import { cn } from '@/lib/utils';

function formatRange(start: string, end: string) {
  return formatUkDateRangeShort(start, end);
}

export function YearOverviewScreen({
  onBack,
  onOpenLesson,
  onEditTermDates,
}: {
  onBack: () => void;
  onOpenLesson: (lessonNumber: string) => void;
  onEditTermDates: () => void;
}) {
  const { units, allLessonsData, currentAcademicYear, currentSheetInfo } = useData();
  const { getCategoryColor } = useSettings();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onUpdate = () => setTick((n) => n + 1);
    window.addEventListener('ccd:planner-curriculum-updated', onUpdate);
    return () => window.removeEventListener('ccd:planner-curriculum-updated', onUpdate);
  }, []);

  const terms = useMemo(
    () => loadPlannerTerms(currentAcademicYear),
    [currentAcademicYear, tick],
  );

  const curriculum = useMemo(() => loadPlannerCurriculum(), [tick]);

  const columns = useMemo(() => {
    return terms.map((term) => ({
      term,
      units: (units || []).filter((u) => u.term === term.id),
    }));
  }, [terms, units]);

  const classLabel = currentSheetInfo?.display || currentSheetInfo?.sheet || 'Class';

  return (
    <div
      className="planner-shell-surface flex min-h-[calc(100vh-7.5rem)] flex-col rounded-[1.75rem]"
      data-testid="planner-year-overview"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to planner
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
              Year overview
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {classLabel}
              {currentAcademicYear ? (
                <span className="ml-2 text-base font-semibold text-slate-400">
                  {currentAcademicYear}
                </span>
              ) : null}
            </h1>
          </div>
        </div>
        <Button variant="soft" size="sm" onClick={onEditTermDates}>
          Edit term dates in Settings
        </Button>
      </header>

      <div className="soft-scroll min-h-0 flex-1 overflow-x-auto overflow-y-auto px-5 pb-8 sm:px-6">
        {columns.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-16 text-center">
            <p className="text-sm font-semibold text-indigo-700">No terms configured</p>
            <p className="mt-1 text-xs text-slate-500">
              Add term dates under Settings → Curriculum.
            </p>
            <Button variant="primary" size="sm" className="mt-4" onClick={onEditTermDates}>
              Open Settings
            </Button>
          </div>
        ) : (
          <div
            className="flex w-max min-w-full gap-4 pr-4"
            role="list"
            aria-label="Half-terms"
          >
            {columns.map(({ term, units: termUnits }) => (
              <TermColumn
                key={term.id}
                term={term}
                units={termUnits}
                allLessonsData={allLessonsData}
                curriculum={curriculum}
                getCategoryColor={getCategoryColor}
                onOpenLesson={onOpenLesson}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TermColumn({
  term,
  units,
  allLessonsData,
  curriculum,
  getCategoryColor,
  onOpenLesson,
}: {
  term: PlannerTermDates;
  units: Unit[];
  allLessonsData: Record<string, { title?: string; customObjectives?: string[]; grouped?: Record<string, unknown[]> }> | null | undefined;
  curriculum: ReturnType<typeof loadPlannerCurriculum>;
  getCategoryColor?: (category: string) => string;
  onOpenLesson: (lessonNumber: string) => void;
}) {
  return (
    <section
      role="listitem"
      className="flex w-[min(85vw,260px)] shrink-0 flex-col self-stretch rounded-[1.5rem] card-surface"
      aria-label={`${term.name}, ${formatRange(term.start, term.end)}`}
    >
      <div className="border-b border-indigo-50 px-4 py-3">
        <h2 className="text-sm font-extrabold text-indigo-700" title={term.name}>
          <span className="line-clamp-2 leading-snug">{term.name}</span>
        </h2>
        <p className="text-xs text-[#5F5B7A]">{formatRange(term.start, term.end)}</p>
      </div>
      <div className="flex min-h-[12rem] flex-1 flex-col space-y-2.5 p-3">
        {units.map((unit) => {
          const color = unit.color || getCategoryColor?.('') || '#4338E8';
          const lessonLabels = unit.lessonNumbers.map((num) => {
            const data = allLessonsData?.[num];
            return { num, title: data?.title || num };
          });
          const covered = new Set(
            unit.lessonNumbers.flatMap(
              (num) => allLessonsData?.[num]?.customObjectives || [],
            ),
          );
          const statements = curriculum.statements;

          return (
            <article
              key={unit.id}
              className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
            >
              <div className="mb-2 flex items-start gap-2">
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1" title={unit.name}>
                  <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-800">
                    {unit.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {unit.lessonNumbers.length} lesson
                    {unit.lessonNumbers.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <div className="mb-2 space-y-1">
                {lessonLabels.map((l) => (
                  <button
                    key={l.num}
                    type="button"
                    onClick={() => onOpenLesson(l.num)}
                    title={l.title}
                    className="block min-h-[44px] w-full rounded-xl bg-slate-50 px-2.5 py-1.5 text-left text-[11px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    <span className="line-clamp-2 leading-snug">{l.title}</span>
                  </button>
                ))}
                {lessonLabels.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-indigo-100 px-2 py-3 text-center text-[11px] text-slate-400">
                    No lessons yet
                  </p>
                ) : null}
              </div>
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Curriculum coverage
                </p>
                <div className="flex flex-wrap gap-1">
                  {statements.length === 0 ? (
                    <span className="text-[11px] text-slate-400">None linked</span>
                  ) : (
                    statements.slice(0, 12).map((s, i) => {
                      const hit = covered.has(s.id);
                      return (
                        <span
                          key={s.id}
                          title={s.text}
                          className={cn(
                            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold',
                            hit
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-400',
                          )}
                        >
                          {hit ? <Check className="h-2.5 w-2.5" aria-hidden /> : null}S
                          {i + 1}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </article>
          );
        })}
        {units.length === 0 ? (
          <div className="flex min-h-[10rem] flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-3 py-8 text-center">
            <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-indigo-400 shadow-sm">
              +
            </span>
            <p className="text-[13px] font-semibold text-indigo-600">
              No units in {term.name}
            </p>
            <p className="mt-1 text-[11px] text-[#5F5B7A]">
              Assign a unit to this term from My units
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
