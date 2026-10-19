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
  Trash2,
  X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useData } from '../../contexts/DataContext';
import { useLessonStacks, type StackedLesson } from '../../hooks/useLessonStacks';
import { HALF_TERMS, TERM_COLORS } from './halfTermConstants';

const UI_FONT = "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)";

export type AssignSchemeTarget = {
  classId: string;
  className: string;
  halfTermId: string;
};

interface AssignSchemePanelProps {
  target: AssignSchemeTarget;
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

function lessonsForStacks(stacks: StackedLesson[], stackIds: string[]): string[] {
  const out: string[] = [];
  for (const id of stackIds) {
    const stack = stacks.find((s) => s.id === id);
    if (stack?.lessons?.length) out.push(...stack.lessons);
  }
  return [...new Set(out)];
}

/**
 * Assign whole schemes of work (lesson stacks/units) to a class × half-term.
 * Single-lesson assignment is intentionally not offered here.
 */
export function AssignSchemePanel({ target, onClose, onChanged }: AssignSchemePanelProps) {
  const {
    halfTerms,
    updateHalfTerm,
    allLessonsData,
    currentSheetInfo,
    setCurrentSheetInfo,
    currentAcademicYear,
  } = useData();
  const { stacks, loading: stacksLoading } = useLessonStacks();
  const [query, setQuery] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localStackIds, setLocalStackIds] = useState<string[] | null>(null);

  const termMeta = HALF_TERMS.find((t) => t.id === target.halfTermId);
  const termColor = TERM_COLORS[target.halfTermId] || '#4338E8';
  const termName = termMeta?.name || target.halfTermId;
  const termMonths = termMeta?.months || '';
  const sheetReady = currentSheetInfo.sheet === target.classId;

  // Ensure DataContext writes land on the target class sheet
  useEffect(() => {
    if (sheetReady) return;
    setCurrentSheetInfo({
      sheet: target.classId,
      display: target.className,
      eyfs: `${target.classId} Statements`,
    });
  }, [target.classId, target.className, sheetReady, setCurrentSheetInfo]);

  // Seed assigned stacks from localStorage for this class (covers sheet-switch lag)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`half-terms-${target.classId}-${currentAcademicYear}`);
      if (!raw) {
        setLocalStackIds([]);
        return;
      }
      const parsed = JSON.parse(raw) as Array<{ id: string; stacks?: string[] }>;
      const term = Array.isArray(parsed) ? parsed.find((t) => t.id === target.halfTermId) : null;
      setLocalStackIds(term?.stacks || []);
    } catch {
      setLocalStackIds([]);
    }
  }, [target.classId, target.halfTermId, currentAcademicYear]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const halfTerm = sheetReady ? halfTerms.find((t) => t.id === target.halfTermId) : null;
  const assignedIds = halfTerm?.stacks ?? localStackIds ?? [];
  const assignedSchemes = useMemo(
    () => stacks.filter((s) => assignedIds.includes(s.id)),
    [stacks, assignedIds],
  );

  const availableSchemes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stacks
      .filter((s) => !assignedIds.includes(s.id))
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q)
        );
      });
  }, [stacks, assignedIds, query]);

  const persistStacks = async (nextStackIds: string[]) => {
    if (!sheetReady) {
      setError('Still switching class — try again in a moment.');
      return;
    }
    setError(null);
    // Prefer scheme references on the half-term; also merge known lesson IDs so
    // existing planners/views that read `lessons` stay in sync.
    const stackLessons = lessonsForStacks(stacks, nextStackIds).filter(
      (id) => !!allLessonsData[id],
    );
    await updateHalfTerm(
      target.halfTermId,
      [...new Set(stackLessons)],
      halfTerm?.isComplete || false,
      nextStackIds,
    );
    setLocalStackIds(nextStackIds);
    onChanged?.();
  };

  const addScheme = async (stack: StackedLesson) => {
    if (assignedIds.includes(stack.id)) return;
    setBusyId(stack.id);
    try {
      await persistStacks([...assignedIds, stack.id]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add scheme');
    } finally {
      setBusyId(null);
    }
  };

  const removeScheme = async (stackId: string) => {
    setBusyId(stackId);
    try {
      await persistStacks(assignedIds.filter((id) => id !== stackId));
      if (previewId === stackId) setPreviewId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove scheme');
    } finally {
      setBusyId(null);
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
      aria-labelledby="assign-scheme-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(21,18,51,0.45)] backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />

      <div className="relative z-[1] flex max-h-[min(92vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_24px_64px_rgba(31,27,77,0.28)] sm:rounded-3xl">
        {/* Header */}
        <div className="shrink-0 border-b border-[#E2E0EF] px-5 pb-4 pt-5 sm:px-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#77738F]">
                Assign scheme of work
              </p>
              <h2
                id="assign-scheme-title"
                className="mt-1 text-[1.35rem] font-extrabold tracking-tight text-[#1F1B4D]"
              >
                {target.className}
                <span className="mx-2 font-semibold text-[#C4C0D8]">·</span>
                <span style={{ color: termColor }}>{termName}</span>
              </h2>
              {termMonths ? (
                <p className="mt-0.5 text-[13px] font-medium text-[#77738F]">{termMonths}</p>
              ) : null}
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
          <div
            className="h-1.5 w-full rounded-full"
            style={{ background: termColor }}
            aria-hidden
          />
          <p className="mt-3 text-[13px] leading-snug text-[#5C5878]">
            Add a whole scheme of work (unit / lesson stack) to this half-term. Individual lessons
            are not assigned from here.
          </p>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {error ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {error}
            </div>
          ) : null}

          {/* Assigned */}
          <section className="mb-6">
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#77738F]">
                Assigned to this half-term
              </h3>
              <span className="text-[12px] font-bold tabular-nums text-[#4338E8]">
                {assignedSchemes.length} scheme{assignedSchemes.length === 1 ? '' : 's'}
              </span>
            </div>

            {assignedSchemes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E2E0EF] bg-[#F4F3FA]/60 px-4 py-6 text-center">
                <Layers className="mx-auto h-8 w-8 text-[#C4C0D8]" />
                <p className="mt-2 text-[14px] font-bold text-[#1F1B4D]">No schemes yet</p>
                <p className="mt-1 text-[13px] text-[#77738F]">
                  Pick a scheme below to plan this half-term for {target.className}.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {assignedSchemes.map((stack) => (
                  <li
                    key={stack.id}
                    className="flex items-start gap-3 rounded-2xl border border-[#E2E0EF] bg-white p-3.5 shadow-[0_1px_2px_rgba(31,27,77,0.04)]"
                  >
                    <span
                      className="mt-0.5 h-10 w-1.5 shrink-0 rounded-full"
                      style={{ background: stack.color || termColor }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-extrabold text-[#1F1B4D]">{stack.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] font-semibold text-[#77738F]">
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {stack.lessons.length} lesson{stack.lessons.length === 1 ? '' : 's'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(stack.totalTime)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={busyId === stack.id}
                      onClick={() => void removeScheme(stack.id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E2E0EF] px-3 text-[12px] font-bold text-[#5C5878] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Picker */}
          <section>
            <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
              <h3 className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#77738F]">
                Available schemes
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
                  Create a scheme (lesson stack / unit) in Lessons, then return here to assign it to
                  this half-term.
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
                {query
                  ? 'No schemes match your search.'
                  : 'All available schemes are already assigned to this half-term.'}
              </div>
            ) : (
              <ul className="space-y-2">
                {availableSchemes.map((stack) => {
                  const open = previewId === stack.id;
                  return (
                    <li
                      key={stack.id}
                      className="overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white shadow-[0_1px_2px_rgba(31,27,77,0.03)]"
                    >
                      <div className="flex items-start gap-3 p-3.5">
                        <span
                          className="mt-0.5 h-10 w-1.5 shrink-0 rounded-full"
                          style={{ background: stack.color || '#4338E8' }}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-extrabold text-[#1F1B4D]">{stack.name}</p>
                          {stack.description ? (
                            <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#77738F]">
                              {stack.description}
                            </p>
                          ) : null}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] font-semibold text-[#5C5878]">
                            <span>
                              {stack.lessons.length} lesson{stack.lessons.length === 1 ? '' : 's'}
                            </span>
                            <span>{formatDuration(stack.totalTime)}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => setPreviewId(open ? null : stack.id)}
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-[#E2E0EF] px-2.5 text-[11px] font-bold text-[#5C5878] hover:bg-[#F4F3FA]"
                            aria-expanded={open}
                          >
                            Lessons
                            {open ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === stack.id}
                            onClick={() => void addScheme(stack)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#4338E8] px-3 text-[12px] font-bold text-white transition hover:bg-[#3529d1] disabled:opacity-50"
                          >
                            {busyId === stack.id ? (
                              'Adding…'
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                Add
                              </>
                            )}
                          </button>
                        </div>
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

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#E2E0EF] bg-[#FAFAFC] px-5 py-3.5 sm:px-6">
          <p className="text-[12px] font-medium text-[#77738F]">
            {assignedSchemes.length === 0
              ? 'Nothing assigned yet'
              : `${assignedSchemes.length} scheme${assignedSchemes.length === 1 ? '' : 's'} · ${assignedSchemes.reduce((n, s) => n + s.lessons.length, 0)} lessons`}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#4338E8] px-4 text-[13px] font-bold text-white transition hover:bg-[#3529d1]"
          >
            <Check className="h-4 w-4" />
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
