import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContextNew';
import { useLessonStacks } from '../../hooks/useLessonStacks';
import { TermCopyModal } from '../TermCopyModal';
import {
  DEFAULT_YEAR_GROUP_SECTION_LABELS,
} from '../../utils/yearGroupSectionOrder';
import { HALF_TERMS, TERM_COLORS, TERM_TINTS } from './halfTermConstants';
import {
  CLASS_SUBJECT_FILTERS,
  classDisplayColor,
  getStageIdForClass,
  inferClassSubject,
  readClassHalfTerms,
  sortClassesForHalfTermBoard,
  type ClassRef,
  type ClassSubject,
} from './halfTermClassUtils';

const UI_FONT = "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)";

export type HalfTermBoardFilter =
  | { kind: 'all' }
  | { kind: 'stage'; stageId: string }
  | { kind: 'subject'; subject: ClassSubject }
  | { kind: 'class'; classId: string };

interface TeacherHalfTermBoardProps {
  /** Bump after assign/remove so cards re-read localStorage. */
  refreshKey?: number;
  /** Deep-link / header one-class focus. */
  focusClassId?: string | null;
  onFocusClassChange?: (classId: string | null) => void;
  onAddScheme: (halfTermId: string, preselectedClassIds?: string[]) => void;
  onManageClassTerm: (classId: string, className: string, halfTermId: string) => void;
  onOpenMap?: () => void;
}

function formatDuration(mins: number): string {
  if (!mins || mins <= 0) return '';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Teacher-level half-term year page: all classes’ schemes on one board,
 * grouped by class inside each Autumn 1…Summer 2 card.
 */
export function TeacherHalfTermBoard({
  refreshKey = 0,
  focusClassId = null,
  onFocusClassChange,
  onAddScheme,
  onManageClassTerm,
  onOpenMap,
}: TeacherHalfTermBoardProps) {
  const { user } = useAuth();
  const {
    currentAcademicYear,
    setCurrentAcademicYear,
    getAvailableYears,
    copyTermToYear,
  } = useData();
  const { customYearGroups, yearGroupSections } = useSettings();
  const { stacks } = useLessonStacks();
  const [searchQuery, setSearchQuery] = useState('');
  const [showTermCopyModal, setShowTermCopyModal] = useState(false);
  const [filter, setFilter] = useState<HalfTermBoardFilter>({ kind: 'all' });
  /** Per half-term: expand the collapsed “N classes with nothing planned” row. */
  const [expandedEmptyTerms, setExpandedEmptyTerms] = useState<Set<string>>(() => new Set());

  // Deep-link / external one-class focus wins when set
  useEffect(() => {
    if (focusClassId) {
      setFilter({ kind: 'class', classId: focusClassId });
    }
  }, [focusClassId]);

  const allowedIds = user?.profile?.allowed_year_groups ?? null;
  const allClasses: ClassRef[] = useMemo(() => {
    const base =
      allowedIds != null && allowedIds.length > 0
        ? customYearGroups.filter(
            (g) => allowedIds.includes(g.id) || allowedIds.includes(g.name ?? ''),
          )
        : customYearGroups;
    return base.map((g) => ({ id: g.id, name: g.name, color: g.color }));
  }, [customYearGroups, allowedIds]);

  const stageIdFor = (cls: ClassRef) =>
    getStageIdForClass(cls, yearGroupSections || [], allClasses);

  const sortedClasses = useMemo(
    () => sortClassesForHalfTermBoard(allClasses, stageIdFor),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stageIdFor closes over sections
    [allClasses, yearGroupSections],
  );

  const visibleClasses = useMemo(() => {
    if (filter.kind === 'class') {
      return sortedClasses.filter((c) => c.id === filter.classId);
    }
    if (filter.kind === 'stage') {
      return sortedClasses.filter((c) => stageIdFor(c) === filter.stageId);
    }
    if (filter.kind === 'subject') {
      return sortedClasses.filter((c) => inferClassSubject(c.name, c.id) === filter.subject);
    }
    return sortedClasses;
  }, [sortedClasses, filter, yearGroupSections]);

  const years = getAvailableYears();
  const yearIndex = years.indexOf(currentAcademicYear);

  const stageChips = useMemo(() => {
    const present = new Set(sortedClasses.map((c) => stageIdFor(c)));
    return DEFAULT_YEAR_GROUP_SECTION_LABELS.filter(
      (s) => s.id !== 'other' && present.has(s.id),
    );
  }, [sortedClasses, yearGroupSections]);

  const subjectChips = useMemo(() => {
    const present = new Set(sortedClasses.map((c) => inferClassSubject(c.name, c.id)));
    return CLASS_SUBJECT_FILTERS.filter((s) => present.has(s));
  }, [sortedClasses]);

  const cards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return HALF_TERMS.map((term) => {
      const classRows = visibleClasses.map((cls) => {
        const terms = readClassHalfTerms(cls.id, currentAcademicYear);
        const ht = terms.find((t) => t.id === term.id);
        const stackIds = ht?.stacks || [];
        const schemes = stackIds.map((id) => {
          const found = stacks.find((s) => s.id === id);
          if (found) return found;
          // Keep a visible tile when catalog hasn't loaded this stack yet
          return {
            id,
            name: 'Scheme of work',
            color: undefined as string | undefined,
            lessons: [] as string[],
            totalTime: 0,
            totalActivities: 0,
            created_at: '',
          };
        });
        const looseLessons = ht?.lessons?.length ?? 0;
        const lessonCount =
          schemes.reduce((n, s) => n + (s.lessons?.length || 0), 0) || looseLessons;
        return {
          cls,
          schemes,
          lessonCount,
          isComplete: !!ht?.isComplete,
          // Count schemes OR individual half-term lessons as planned
          empty: stackIds.length === 0 && looseLessons === 0,
        };
      });

      const unallocatedCount = classRows.filter((r) => r.empty).length;
      const hayParts = [
        term.name,
        term.months,
        ...classRows.flatMap((r) => [
          r.cls.name,
          ...r.schemes.map((s) => s.name),
        ]),
      ];
      const matches = !q || hayParts.join(' ').toLowerCase().includes(q);

      return {
        term,
        classRows,
        unallocatedCount,
        assignedClassCount: classRows.filter((r) => !r.empty).length,
        matches,
      };
    });
  }, [visibleClasses, stacks, searchQuery, currentAcademicYear, refreshKey]);

  const visible = cards.filter((c) => c.matches);

  const setChipFilter = (next: HalfTermBoardFilter) => {
    setFilter(next);
    if (next.kind === 'class') onFocusClassChange?.(next.classId);
    else onFocusClassChange?.(null);
  };

  const toggleEmptyExpanded = (termId: string) => {
    setExpandedEmptyTerms((prev) => {
      const next = new Set(prev);
      if (next.has(termId)) next.delete(termId);
      else next.add(termId);
      return next;
    });
  };

  const focusClassName =
    filter.kind === 'class'
      ? allClasses.find((c) => c.id === filter.classId)?.name || filter.classId
      : null;

  return (
    <div
      className="flex min-h-[calc(100vh-7.5rem)] min-w-0 flex-col"
      style={{ fontFamily: UI_FONT }}
    >
      {/* Page header */}
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.85rem] font-extrabold tracking-tight text-[#1F1B4D] sm:text-[2.1rem]">
            Half-terms
            {focusClassName ? (
              <span className="block text-[1.05rem] font-bold text-[#4338E8] sm:inline sm:ml-2 sm:text-[1.25rem]">
                · {focusClassName}
              </span>
            ) : null}
          </h1>
          <p className="mt-1 text-[14px] font-medium text-[#77738F]">
            {focusClassName
              ? `${focusClassName} · ${currentAcademicYear.replace('-', '–')}`
              : `All your classes · ${currentAcademicYear.replace('-', '–')}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex items-center gap-0.5 rounded-xl border border-[#E2E0EF] bg-white p-0.5"
            role="group"
            aria-label="Academic year"
          >
            <button
              type="button"
              disabled={yearIndex < 0 || yearIndex >= years.length - 1}
              onClick={() => {
                if (yearIndex < years.length - 1) setCurrentAcademicYear(years[yearIndex + 1]);
              }}
              className="grid h-9 w-9 place-items-center rounded-[10px] text-[#77738F] hover:bg-[#F4F3FA] hover:text-[#1F1B4D] disabled:opacity-35"
              aria-label="Previous academic year"
            >
              ‹
            </button>
            <span className="min-w-[7.5rem] px-1 text-center text-[13px] font-extrabold tabular-nums text-[#1F1B4D]">
              {currentAcademicYear.replace('-', '–')}
            </span>
            <button
              type="button"
              disabled={yearIndex <= 0}
              onClick={() => {
                if (yearIndex > 0) setCurrentAcademicYear(years[yearIndex - 1]);
              }}
              className="grid h-9 w-9 place-items-center rounded-[10px] text-[#77738F] hover:bg-[#F4F3FA] hover:text-[#1F1B4D] disabled:opacity-35"
              aria-label="Next academic year"
            >
              ›
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowTermCopyModal(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#FFC93C] px-3.5 text-[13px] font-extrabold text-[#1F1B4D] hover:brightness-95"
          >
            <Calendar className="h-4 w-4" />
            Copy term
          </button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9B97B0]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search terms, classes, schemes…"
              className="h-10 w-[13rem] rounded-xl border border-[#E2E0EF] bg-white py-2 pl-9 pr-3 text-[13px] font-medium text-[#1F1B4D] placeholder:text-[#9B97B0] focus:border-[#4338E8] focus:outline-none focus:ring-2 focus:ring-[#4338E8]/25 sm:w-[16rem]"
            />
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        <Chip
          active={filter.kind === 'all'}
          onClick={() => setChipFilter({ kind: 'all' })}
          label="All"
        />
        {stageChips.map((s) => (
          <Chip
            key={s.id}
            active={filter.kind === 'stage' && filter.stageId === s.id}
            onClick={() => setChipFilter({ kind: 'stage', stageId: s.id })}
            label={s.label}
          />
        ))}
        <span className="mx-1 hidden h-4 w-px bg-[#E2E0EF] sm:inline-block" aria-hidden />
        {subjectChips.map((s) => (
          <Chip
            key={s}
            active={filter.kind === 'subject' && filter.subject === s}
            onClick={() => setChipFilter({ kind: 'subject', subject: s })}
            label={s}
          />
        ))}
        {filter.kind === 'class' && focusClassName ? (
          <>
            <span className="mx-1 hidden h-4 w-px bg-[#E2E0EF] sm:inline-block" aria-hidden />
            <Chip
              active
              onClick={() => setChipFilter({ kind: 'all' })}
              label={focusClassName}
              dismissible
            />
          </>
        ) : null}
        {onOpenMap ? (
          <button
            type="button"
            onClick={onOpenMap}
            className="ml-auto text-[12px] font-bold text-[#77738F] underline-offset-2 hover:text-[#4338E8] hover:underline"
          >
            Class map
          </button>
        ) : null}
      </div>

      {visibleClasses.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[#E2E0EF] bg-white px-4 py-16 text-center">
          <div>
            <p className="text-[15px] font-extrabold text-[#1F1B4D]">No classes match</p>
            <p className="mt-1 text-[13px] text-[#77738F]">
              Try All, or pick another stage or subject.
            </p>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[#E2E0EF] bg-white px-4 py-16 text-center">
          <div>
            <p className="text-[15px] font-extrabold text-[#1F1B4D]">No half-terms match</p>
            <p className="mt-1 text-[13px] text-[#77738F]">Try a different search.</p>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
          {visible.map(({ term, classRows, unallocatedCount, assignedClassCount }) => {
            const color = TERM_COLORS[term.id];
            const tint = TERM_TINTS[term.id];
            return (
              <section
                key={term.id}
                className="flex min-h-[16rem] flex-col overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white shadow-[0_1px_3px_rgba(31,27,77,0.05)] xl:min-h-[18rem]"
                style={{ background: `linear-gradient(180deg, ${tint} 0%, #ffffff 28%)` }}
              >
                <div className="h-2 w-full shrink-0" style={{ background: color }} aria-hidden />
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2
                        className="text-[1.35rem] font-extrabold tracking-tight sm:text-[1.5rem]"
                        style={{ color }}
                      >
                        {term.name}
                      </h2>
                      <p className="mt-0.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#77738F]">
                        {term.months}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {unallocatedCount > 0 ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-lg bg-[#FFF4E5] px-2 py-1 text-[11px] font-extrabold text-[#9A5B00]"
                          title={`${unallocatedCount} class${unallocatedCount === 1 ? '' : 'es'} with no scheme`}
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                          {unallocatedCount} unallocated
                        </span>
                      ) : classRows.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#D5F3EA] px-2 py-1 text-[11px] font-extrabold text-[#0B6B5F]">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Covered
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          onAddScheme(
                            term.id,
                            filter.kind === 'class' ? [filter.classId] : undefined,
                          )
                        }
                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-extrabold text-white transition hover:brightness-95"
                        style={{ background: color }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add scheme
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                    {classRows.length === 0 ? (
                      <p className="py-6 text-center text-[13px] text-[#77738F]">
                        No classes in this filter.
                      </p>
                    ) : (
                      (() => {
                        // Single-class focus: always show that row (even if empty).
                        const showAllRows = filter.kind === 'class';
                        const planned = classRows.filter((r) => !r.empty);
                        const emptyRows = classRows.filter((r) => r.empty);
                        const emptyExpanded = expandedEmptyTerms.has(term.id);

                        const renderClassRow = ({
                          cls,
                          schemes,
                          lessonCount,
                          empty,
                          isComplete,
                        }: (typeof classRows)[number]) => {
                          const chipColor = classDisplayColor(cls);
                          return (
                            <div
                              key={cls.id}
                              className="rounded-xl border border-[#E2E0EF]/90 bg-white/90 px-2.5 py-2"
                            >
                              <div className="mb-1.5 flex items-center gap-2">
                                <span
                                  className="inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-extrabold text-white"
                                  style={{ background: chipColor }}
                                  title={cls.name}
                                >
                                  <span
                                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/80"
                                    aria-hidden
                                  />
                                  <span className="truncate">{cls.name}</span>
                                </span>
                                {isComplete ? (
                                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#0B6B5F]" />
                                ) : null}
                                <span className="ml-auto text-[11px] font-bold tabular-nums text-[#9B97B0]">
                                  {empty
                                    ? '—'
                                    : `${schemes.length} scheme${schemes.length === 1 ? '' : 's'}${
                                        lessonCount ? ` · ${lessonCount}` : ''
                                      }`}
                                </span>
                              </div>

                              {empty ? (
                                <button
                                  type="button"
                                  onClick={() => onAddScheme(term.id, [cls.id])}
                                  className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-dashed border-[#D8D5E8] bg-[#FAFAFC] text-[12px] font-bold text-[#5C5878] transition hover:border-[#bcb7f4] hover:bg-[#F7F6FC] hover:text-[#4338E8]"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Add
                                </button>
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  {schemes.map((stack) => (
                                    <button
                                      key={stack.id}
                                      type="button"
                                      onClick={() =>
                                        onManageClassTerm(cls.id, cls.name, term.id)
                                      }
                                      className="flex w-full items-start gap-2 rounded-lg border border-[#E2E0EF] bg-white px-2.5 py-2 text-left transition hover:border-[#bcb7f4]"
                                    >
                                      <span
                                        className="mt-0.5 h-7 w-1 shrink-0 rounded-full"
                                        style={{ background: stack.color || color }}
                                        aria-hidden
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-extrabold text-[#1F1B4D]">
                                          {stack.name}
                                        </p>
                                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] font-semibold text-[#77738F]">
                                          <span className="inline-flex items-center gap-1">
                                            <BookOpen className="h-3 w-3" />
                                            {stack.lessons.length} lesson
                                            {stack.lessons.length === 1 ? '' : 's'}
                                          </span>
                                          {stack.totalTime ? (
                                            <span>{formatDuration(stack.totalTime)}</span>
                                          ) : null}
                                        </p>
                                      </div>
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => onAddScheme(term.id, [cls.id])}
                                    className="inline-flex h-7 items-center justify-center gap-1 rounded-lg text-[11px] font-bold text-[#4338E8] hover:bg-[#F4F3FA]"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Add another
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        };

                        if (showAllRows) {
                          return <>{classRows.map(renderClassRow)}</>;
                        }

                        return (
                          <>
                            {planned.map(renderClassRow)}
                            {emptyRows.length > 0 ? (
                              <div className="rounded-xl border border-dashed border-[#D8D5E8] bg-[#FAFAFC] px-2.5 py-2">
                                <button
                                  type="button"
                                  onClick={() => toggleEmptyExpanded(term.id)}
                                  className="flex w-full items-center gap-2 text-left"
                                  aria-expanded={emptyExpanded}
                                >
                                  {emptyExpanded ? (
                                    <ChevronDown className="h-4 w-4 shrink-0 text-[#77738F]" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 shrink-0 text-[#77738F]" />
                                  )}
                                  <span className="min-w-0 flex-1 text-[12px] font-extrabold text-[#5C5878]">
                                    {emptyRows.length} class
                                    {emptyRows.length === 1 ? '' : 'es'} with nothing planned
                                  </span>
                                  {!emptyExpanded ? (
                                    <span className="text-[11px] font-bold text-[#4338E8]">
                                      Expand to add
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-bold text-[#77738F]">
                                      Collapse
                                    </span>
                                  )}
                                </button>
                                {emptyExpanded ? (
                                  <div className="mt-2 flex flex-col gap-2">
                                    {emptyRows.map(renderClassRow)}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onAddScheme(term.id)}
                                    className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-dashed border-[#D8D5E8] bg-white text-[12px] font-bold text-[#5C5878] transition hover:border-[#bcb7f4] hover:text-[#4338E8]"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add scheme to a class
                                  </button>
                                )}
                              </div>
                            ) : null}
                          </>
                        );
                      })()
                    )}
                  </div>

                  <div className="mt-3 border-t border-[#E2E0EF]/80 pt-2 text-[11px] font-bold text-[#5C5878]">
                    {assignedClassCount}/{classRows.length} class
                    {classRows.length === 1 ? '' : 'es'} planned
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <TermCopyModal
        isOpen={showTermCopyModal}
        onClose={() => setShowTermCopyModal(false)}
        onCopy={async (sourceYear, sourceTerm, targetYear, targetTerm) => {
          await copyTermToYear(sourceYear, sourceTerm, targetYear, targetTerm);
        }}
        availableYears={years}
        currentYear={currentAcademicYear}
      />
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  dismissible,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dismissible?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-extrabold transition ${
        active
          ? 'bg-[#4338E8] text-white shadow-sm'
          : 'border border-[#E2E0EF] bg-white text-[#5C5878] hover:border-[#bcb7f4] hover:text-[#1F1B4D]'
      }`}
    >
      {label}
      {dismissible && active ? <span className="opacity-80">×</span> : null}
    </button>
  );
}
