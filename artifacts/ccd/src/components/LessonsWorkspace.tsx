import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  FolderOpen,
  Plus,
  Search,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LessonPlanBuilder } from './LessonPlanBuilder';
import { AssignToHalfTermModal } from './AssignToHalfTermModal';
import { useData } from '../contexts/DataContext';
import { useIsViewOnly } from '../hooks/useIsViewOnly';

const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep–Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov–Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan–Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar–Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr–May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun–Jul' },
];

const UI_FONT = "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)";
const DISPLAY_FONT =
  "var(--ss-font-display, 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif)";

interface LessonsWorkspaceProps {
  onAssignToUnit?: (lessonNumber: string, halfTermId: string) => void;
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
}

/**
 * Unified Lessons tab: saved-lesson rail + activity-block builder canvas.
 * Replaces the separate Lessons list and Lesson Builder tabs.
 */
export function LessonsWorkspace({
  onAssignToUnit,
  onUnsavedChangesChange,
}: LessonsWorkspaceProps) {
  const isViewOnly = useIsViewOnly();
  const {
    allLessonsData,
    lessonNumbers,
    currentSheetInfo,
    halfTerms,
    loading,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHalfTerm, setSelectedHalfTerm] = useState('all');
  const [editingLessonNumber, setEditingLessonNumber] = useState<string | undefined>();
  const [builderKey, setBuilderKey] = useState(0);
  const [assignLessonNumber, setAssignLessonNumber] = useState<string | null>(null);

  const getLessonHalfTerm = (lessonNumber: string): string | null => {
    for (const halfTerm of halfTerms || []) {
      if (Array.isArray(halfTerm?.lessons) && halfTerm.lessons.includes(lessonNumber)) {
        return halfTerm.id;
      }
    }
    return null;
  };

  const filteredLessons = useMemo(() => {
    if (!allLessonsData || typeof allLessonsData !== 'object') return [];

    const keys = new Set<string>();
    if (Array.isArray(lessonNumbers)) {
      lessonNumbers.forEach((n) => keys.add(n));
    }
    Object.keys(allLessonsData).forEach((n) => {
      if (allLessonsData[n]) keys.add(n);
    });

    const q = searchQuery.trim().toLowerCase();
    const list = Array.from(keys).filter((num) => {
      const data = allLessonsData[num];
      if (!data) return false;
      if (selectedHalfTerm !== 'all' && getLessonHalfTerm(num) !== selectedHalfTerm) {
        return false;
      }
      if (!q) return true;
      const title = (data.title || '').toLowerCase();
      if (num.toLowerCase().includes(q) || title.includes(q)) return true;
      return Object.values(data.grouped || {}).some((acts: unknown) =>
        Array.isArray(acts) &&
        acts.some(
          (a: { activity?: string }) =>
            (a.activity || '').toLowerCase().includes(q),
        ),
      );
    });

    list.sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const nb = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return na - nb;
    });
    return list;
  }, [allLessonsData, lessonNumbers, searchQuery, selectedHalfTerm, halfTerms]);

  const openLesson = (lessonNumber: string) => {
    setEditingLessonNumber(lessonNumber);
    setBuilderKey((k) => k + 1);
  };

  const createLesson = () => {
    if (isViewOnly) {
      toast.error('View-only mode: cannot create lessons.');
      return;
    }
    setEditingLessonNumber(undefined);
    setBuilderKey((k) => k + 1);
  };

  const handleAssign = (halfTermId: string) => {
    if (!assignLessonNumber) return;
    onAssignToUnit?.(assignLessonNumber, halfTermId);
    setAssignLessonNumber(null);
  };

  const classLabel = currentSheetInfo.display || currentSheetInfo.sheet;

  return (
    <div
      className="flex min-h-[calc(100vh-7.5rem)] flex-col gap-3"
      style={{ fontFamily: UI_FONT }}
    >
      <div className="shrink-0">
        <p className="ccd-studio-eyebrow mb-1">
          CONNECT &amp; CREATE / <span>LESSONS</span>
        </p>
        <p className="text-sm text-[#77738F]">
          Saved lessons for{' '}
          <strong className="text-[#1F1B4D]">{classLabel}</strong>
          {' · '}
          open one to edit, or create a new plan from activity blocks.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(15.5rem,18rem)_minmax(0,1fr)]">
        {/* Saved lessons rail */}
        <aside className="flex max-h-[min(70vh,42rem)] flex-col overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white shadow-[0_1px_3px_rgba(31,27,77,0.05)] xl:max-h-[calc(100vh-9.5rem)] xl:sticky xl:top-2">
          <div className="shrink-0 border-b border-[#E2E0EF] bg-gradient-to-r from-[#2DD4BF] to-[#4338E8] px-3 py-3 text-white">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <FolderOpen className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                <h2
                  className="truncate text-[15px] font-extrabold tracking-tight"
                  style={{ fontFamily: DISPLAY_FONT }}
                >
                  Your lessons
                </h2>
              </div>
              <button
                type="button"
                onClick={createLesson}
                disabled={isViewOnly}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-white/20 px-2.5 text-[12px] font-extrabold text-white hover:bg-white/30 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Create
              </button>
            </div>
            <div className="mt-2.5 flex flex-col gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/70" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lessons…"
                  className="h-8 w-full rounded-lg border border-white/25 bg-white/15 py-1 pl-8 pr-2 text-[12px] font-medium text-white placeholder:text-white/65 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/25"
                />
              </div>
              <select
                value={selectedHalfTerm}
                onChange={(e) => setSelectedHalfTerm(e.target.value)}
                className="h-8 w-full rounded-lg border border-white/25 bg-white/15 px-2 text-[12px] font-semibold text-white focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/25"
                aria-label="Filter by half-term"
              >
                <option value="all" className="text-[#1F1B4D]">
                  All half-terms
                </option>
                {HALF_TERMS.map((t) => (
                  <option key={t.id} value={t.id} className="text-[#1F1B4D]">
                    {t.name} ({t.months})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#4338E8] border-t-transparent" />
                <p className="text-[12px] font-medium text-[#77738F]">Loading lessons…</p>
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="flex flex-col items-center px-3 py-10 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-[#D8D5E8]" aria-hidden />
                <p className="text-[13px] font-extrabold text-[#1F1B4D]">
                  {searchQuery || selectedHalfTerm !== 'all'
                    ? 'No lessons match'
                    : `No lessons for ${classLabel}`}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#77738F]">
                  {searchQuery || selectedHalfTerm !== 'all'
                    ? 'Try another search or half-term filter.'
                    : 'Create a lesson, then drag activities into the canvas.'}
                </p>
                {!searchQuery && selectedHalfTerm === 'all' ? (
                  <button
                    type="button"
                    onClick={createLesson}
                    disabled={isViewOnly}
                    className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#4338E8] px-3.5 text-[12px] font-extrabold text-white hover:bg-[#3529d1] disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create lesson
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedHalfTerm('all');
                    }}
                    className="mt-4 text-[12px] font-bold text-[#4338E8] hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-1.5">
                {filteredLessons.map((num, index) => {
                  const data = allLessonsData[num];
                  if (!data) return null;
                  const activityCount = Object.values(data.grouped || {}).reduce(
                    (sum: number, acts: unknown) =>
                      sum + (Array.isArray(acts) ? acts.length : 0),
                    0,
                  );
                  const termId = getLessonHalfTerm(num);
                  const term = HALF_TERMS.find((t) => t.id === termId);
                  const active = editingLessonNumber === num;
                  return (
                    <li key={num}>
                      <div
                        className={`rounded-xl border px-2.5 py-2 transition ${
                          active
                            ? 'border-[#4338E8] bg-[#F4F3FA] shadow-sm'
                            : 'border-[#E2E0EF]/90 bg-white hover:border-[#bcb7f4]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => openLesson(num)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-[#E9E6FF] px-1 text-[10px] font-extrabold text-[#4338E8]">
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-extrabold text-[#1F1B4D]">
                                {data.title || `Lesson ${num}`}
                              </p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-[#77738F]">
                                <span className="inline-flex items-center gap-0.5">
                                  <Clock className="h-3 w-3" />
                                  {data.totalTime || 0}m
                                </span>
                                <span className="inline-flex items-center gap-0.5">
                                  <Tag className="h-3 w-3" />
                                  {activityCount}
                                </span>
                                {term ? (
                                  <span className="inline-flex items-center gap-0.5 text-[#4338E8]">
                                    <Calendar className="h-3 w-3" />
                                    {term.name}
                                  </span>
                                ) : null}
                              </p>
                            </div>
                          </div>
                        </button>
                        {onAssignToUnit && !isViewOnly ? (
                          <button
                            type="button"
                            onClick={() => setAssignLessonNumber(num)}
                            className="mt-1.5 inline-flex h-7 w-full items-center justify-center gap-1 rounded-lg text-[11px] font-bold text-[#5C5878] hover:bg-[#F4F3FA] hover:text-[#4338E8]"
                          >
                            <Calendar className="h-3 w-3" />
                            {term ? 'Reassign half-term' : 'Assign to half-term'}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Builder: activity blocks + lesson canvas */}
        <div className="min-w-0 rounded-2xl border border-[#E2E0EF] bg-[#F9FAFB] shadow-[0_1px_3px_rgba(31,27,77,0.04)] overflow-hidden">
          <LessonPlanBuilder
            key={`${builderKey}-${editingLessonNumber ?? 'new'}`}
            editingLessonNumber={editingLessonNumber}
            onEditComplete={() => {
              /* stay on lesson after save */
            }}
            onUnsavedChangesChange={onUnsavedChangesChange}
            embedded
          />
        </div>
      </div>

      {assignLessonNumber && (
        <AssignToHalfTermModal
          isOpen
          onClose={() => setAssignLessonNumber(null)}
          onAssign={handleAssign}
          lessonNumber={assignLessonNumber}
          halfTerms={(halfTerms || []) as any}
        />
      )}
    </div>
  );
}
