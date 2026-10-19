import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContextNew';
import { useLessonStacks } from '../../hooks/useLessonStacks';
import { HALF_TERMS, TERM_COLORS } from './halfTermConstants';
import {
  classDisplayColor,
  getStageIdForClass,
  readClassHalfTerms,
  sortClassesForHalfTermBoard,
  writeClassHalfTermStacks,
  type ClassRef,
} from './halfTermClassUtils';

const UI_FONT = "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)";

export type AssignSchemeMultiTarget = {
  halfTermId: string;
  /** Classes pre-checked when opening from a class row. */
  preselectedClassIds?: string[];
};

interface AssignSchemeMultiPanelProps {
  target: AssignSchemeMultiTarget;
  onClose: () => void;
  onChanged?: () => void;
}

function formatDuration(mins: number): string {
  if (!mins || mins <= 0) return '—';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Assign one scheme of work to one or more classes for a half-term in a single action.
 */
export function AssignSchemeMultiPanel({
  target,
  onClose,
  onChanged,
}: AssignSchemeMultiPanelProps) {
  const { user } = useAuth();
  const {
    updateHalfTerm,
    allLessonsData,
    currentSheetInfo,
    currentAcademicYear,
    halfTerms,
  } = useData();
  const { customYearGroups, yearGroupSections } = useSettings();
  const { stacks, loading: stacksLoading } = useLessonStacks();
  const [query, setQuery] = useState('');
  const [classQuery, setClassQuery] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(
    () => new Set(target.preselectedClassIds || []),
  );
  const [selectedStackId, setSelectedStackId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneCount, setDoneCount] = useState(0);

  const termMeta = HALF_TERMS.find((t) => t.id === target.halfTermId);
  const termColor = TERM_COLORS[target.halfTermId] || '#4338E8';
  const termName = termMeta?.name || target.halfTermId;
  const termMonths = termMeta?.months || '';

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

  const sortedClasses = useMemo(
    () =>
      sortClassesForHalfTermBoard(allClasses, (cls) =>
        getStageIdForClass(cls, yearGroupSections || [], allClasses),
      ),
    [allClasses, yearGroupSections],
  );

  const filteredClasses = useMemo(() => {
    const q = classQuery.trim().toLowerCase();
    if (!q) return sortedClasses;
    return sortedClasses.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
    );
  }, [sortedClasses, classQuery]);

  const availableSchemes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stacks.filter((s) => {
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      );
    });
  }, [stacks, query]);

  const selectedStack = selectedStackId
    ? stacks.find((s) => s.id === selectedStackId) || null
    : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Keep preselection in sync if target changes
  useEffect(() => {
    if (target.preselectedClassIds?.length) {
      setSelectedClassIds(new Set(target.preselectedClassIds));
    }
  }, [target.halfTermId, target.preselectedClassIds?.join(',')]);

  const toggleClass = (id: string) => {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      for (const c of filteredClasses) next.add(c.id);
      return next;
    });
  };

  const clearClasses = () => setSelectedClassIds(new Set());

  const alreadyHasScheme = (classId: string, stackId: string) => {
    const terms = readClassHalfTerms(classId, currentAcademicYear);
    const ht = terms.find((t) => t.id === target.halfTermId);
    return !!ht?.stacks?.includes(stackId);
  };

  const assign = async () => {
    if (!selectedStack || selectedClassIds.size === 0) {
      setError('Choose at least one class and one scheme of work.');
      return;
    }
    setBusy(true);
    setError(null);
    setDoneCount(0);
    try {
      const stackId = selectedStack.id;
      let n = 0;
      for (const classId of selectedClassIds) {
        const terms = readClassHalfTerms(classId, currentAcademicYear);
        const ht = terms.find((t) => t.id === target.halfTermId);
        const existing = ht?.stacks || [];
        if (existing.includes(stackId)) {
          n += 1;
          setDoneCount(n);
          continue;
        }
        const nextIds = [...existing, stackId];
        writeClassHalfTermStacks(
          classId,
          currentAcademicYear,
          target.halfTermId,
          nextIds,
          stacks,
        );
        // Keep DataContext in sync when writing the currently open sheet
        if (classId === currentSheetInfo.sheet) {
          const stackLessons = nextIds
            .flatMap((id) => stacks.find((s) => s.id === id)?.lessons || [])
            .filter((id, i, arr) => arr.indexOf(id) === i)
            .filter((id) => !!allLessonsData[id]);
          const live = halfTerms.find((t) => t.id === target.halfTermId);
          await updateHalfTerm(
            target.halfTermId,
            stackLessons,
            live?.isComplete || false,
            nextIds,
          );
        }
        n += 1;
        setDoneCount(n);
      }
      onChanged?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not assign scheme');
    } finally {
      setBusy(false);
    }
  };

  const goCreateScheme = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('ccd:open-tab', { detail: { tab: 'lesson-library' } }));
  };

  const panel = (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
      style={{ fontFamily: UI_FONT }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-multi-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(21,18,51,0.45)] backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />

      <div className="relative z-[1] flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_24px_64px_rgba(31,27,77,0.28)] sm:rounded-3xl">
        <div className="shrink-0 border-b border-[#E2E0EF] px-5 pb-4 pt-5 sm:px-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#77738F]">
                Add scheme of work
              </p>
              <h2
                id="assign-multi-title"
                className="mt-1 text-[1.35rem] font-extrabold tracking-tight text-[#1F1B4D]"
              >
                <span style={{ color: termColor }}>{termName}</span>
                {termMonths ? (
                  <span className="ml-2 text-[14px] font-semibold text-[#77738F]">
                    {termMonths}
                  </span>
                ) : null}
              </h2>
              <p className="mt-1 text-[13px] leading-snug text-[#5C5878]">
                Choose class(es) and one scheme — assign to several classes in one go.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#E2E0EF] text-[#77738F] transition hover:border-[#bcb7f4] hover:bg-[#F4F3FA] hover:text-[#1F1B4D]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-1.5 w-full rounded-full" style={{ background: termColor }} aria-hidden />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {error ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {error}
            </div>
          ) : null}

          {/* Classes */}
          <section className="mb-6">
            <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#77738F]">
                Classes
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllVisible}
                  className="text-[12px] font-bold text-[#4338E8] hover:underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearClasses}
                  className="text-[12px] font-bold text-[#77738F] hover:underline"
                >
                  Clear
                </button>
                <span className="text-[12px] font-bold tabular-nums text-[#4338E8]">
                  {selectedClassIds.size} selected
                </span>
              </div>
            </div>
            <div className="relative mb-2.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9B97B0]" />
              <input
                type="search"
                value={classQuery}
                onChange={(e) => setClassQuery(e.target.value)}
                placeholder="Filter classes…"
                className="h-9 w-full rounded-xl border border-[#E2E0EF] bg-[#F4F3FA] py-2 pl-9 pr-3 text-[13px] font-medium text-[#1F1B4D] placeholder:text-[#9B97B0] focus:border-[#4338E8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4338E8]/25"
              />
            </div>
            <ul className="grid max-h-44 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
              {filteredClasses.map((cls) => {
                const on = selectedClassIds.has(cls.id);
                const has =
                  selectedStackId != null && alreadyHasScheme(cls.id, selectedStackId);
                const chip = classDisplayColor(cls);
                return (
                  <li key={cls.id}>
                    <button
                      type="button"
                      onClick={() => toggleClass(cls.id)}
                      className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${
                        on
                          ? 'border-[#4338E8] bg-[#EEEDFC]'
                          : 'border-[#E2E0EF] bg-white hover:border-[#bcb7f4]'
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                          on
                            ? 'border-[#4338E8] bg-[#4338E8] text-white'
                            : 'border-[#D8D5E8] bg-white text-transparent'
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: chip }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#1F1B4D]">
                        {cls.name}
                      </span>
                      {has ? (
                        <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wide text-[#0B6B5F]">
                          Has it
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Schemes */}
          <section>
            <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#77738F]">
                Scheme of work
              </h3>
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9B97B0]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search schemes…"
                  className="h-9 w-full rounded-xl border border-[#E2E0EF] bg-[#F4F3FA] py-2 pl-9 pr-3 text-[13px] font-medium text-[#1F1B4D] placeholder:text-[#9B97B0] focus:border-[#4338E8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4338E8]/25"
                />
              </div>
            </div>

            {stacksLoading ? (
              <p className="py-8 text-center text-[13px] text-[#77738F]">Loading schemes…</p>
            ) : stacks.length === 0 ? (
              <div className="rounded-2xl border border-[#E2E0EF] bg-[#F4F3FA]/80 px-4 py-8 text-center">
                <Layers className="mx-auto h-9 w-9 text-[#4338E8]" />
                <p className="mt-2 text-[15px] font-extrabold text-[#1F1B4D]">
                  No schemes of work yet
                </p>
                <p className="mx-auto mt-1 max-w-sm text-[13px] leading-snug text-[#77738F]">
                  Create a scheme in Lessons, then return here to assign it.
                </p>
                <button
                  type="button"
                  onClick={goCreateScheme}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#4338E8] px-4 text-[13px] font-bold text-white transition hover:bg-[#3529d1]"
                >
                  <Plus className="h-4 w-4" />
                  Create a scheme of work
                </button>
              </div>
            ) : availableSchemes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E2E0EF] px-4 py-6 text-center text-[13px] text-[#77738F]">
                No schemes match your search.
              </div>
            ) : (
              <ul className="space-y-2">
                {availableSchemes.map((stack) => {
                  const open = previewId === stack.id;
                  const picked = selectedStackId === stack.id;
                  return (
                    <li
                      key={stack.id}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(31,27,77,0.03)] ${
                        picked ? 'border-[#4338E8] ring-2 ring-[#4338E8]/20' : 'border-[#E2E0EF]'
                      }`}
                    >
                      <div className="flex items-start gap-3 p-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedStackId(stack.id)}
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                            picked
                              ? 'border-[#4338E8] bg-[#4338E8] text-white'
                              : 'border-[#D8D5E8] bg-white'
                          }`}
                          aria-label={`Select ${stack.name}`}
                          aria-pressed={picked}
                        >
                          {picked ? <Check className="h-3 w-3" /> : null}
                        </button>
                        <span
                          className="mt-0.5 h-10 w-1.5 shrink-0 rounded-full"
                          style={{ background: stack.color || '#4338E8' }}
                          aria-hidden
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedStackId(stack.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="text-[14px] font-extrabold text-[#1F1B4D]">{stack.name}</p>
                          {stack.description ? (
                            <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#77738F]">
                              {stack.description}
                            </p>
                          ) : null}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] font-semibold text-[#5C5878]">
                            <span className="inline-flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5" />
                              {stack.lessons.length} lesson
                              {stack.lessons.length === 1 ? '' : 's'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDuration(stack.totalTime)}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewId(open ? null : stack.id)}
                          className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl border border-[#E2E0EF] px-2.5 text-[11px] font-bold text-[#5C5878] hover:bg-[#F4F3FA]"
                          aria-expanded={open}
                        >
                          Lessons
                          {open ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      {open ? (
                        <div className="border-t border-[#E2E0EF] bg-[#F4F3FA]/70 px-3.5 py-2.5">
                          <ol className="space-y-1">
                            {stack.lessons.map((lessonId, i) => {
                              const lesson = allLessonsData[lessonId];
                              return (
                                <li
                                  key={`${stack.id}-${lessonId}`}
                                  className="flex items-baseline gap-2 text-[12px] text-[#5C5878]"
                                >
                                  <span className="w-5 shrink-0 text-right font-bold tabular-nums text-[#9B97B0]">
                                    {i + 1}.
                                  </span>
                                  <span className="min-w-0 font-semibold text-[#1F1B4D]">
                                    {lesson?.title || `Lesson ${lessonId}`}
                                  </span>
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#E2E0EF] bg-[#FAFAFC] px-5 py-3.5 sm:px-6">
          <p className="text-[12px] font-medium text-[#77738F]">
            {busy
              ? `Assigning… ${doneCount}/${selectedClassIds.size}`
              : selectedStack
                ? `${selectedStack.name} → ${selectedClassIds.size} class${
                    selectedClassIds.size === 1 ? '' : 'es'
                  }`
                : 'Pick classes and a scheme'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-xl border border-[#E2E0EF] px-4 text-[13px] font-bold text-[#5C5878] hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !selectedStack || selectedClassIds.size === 0}
              onClick={() => void assign()}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#4338E8] px-4 text-[13px] font-bold text-white transition hover:bg-[#3529d1] disabled:opacity-45"
            >
              <Check className="h-4 w-4" />
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
