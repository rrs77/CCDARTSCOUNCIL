/**
 * Your lessons — toolbar menu (replaces the left sidebar rail).
 */
import {
  BookOpen,
  Calendar,
  ChevronDown,
  Clock,
  Pencil,
  Plus,
  Search,
  Tag,
} from 'lucide-react';
import type { LessonData } from '../../contexts/DataContext';
import type { PlannerTermDates } from '../../types/plannerCurriculum';
import { PlannerPopover } from './PlannerPopover';
import { cn } from '@/lib/utils';

const DISPLAY_FONT =
  "var(--ss-font-display, 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif)";

export function YourLessonsMenu({
  open,
  onOpenChange,
  loading,
  filteredLessons,
  allLessonsData,
  plannerTerms,
  getLessonHalfTerm,
  editingLessonNumber,
  searchQuery,
  onSearchQueryChange,
  selectedHalfTerm,
  onSelectedHalfTermChange,
  isViewOnly,
  classLabel,
  onCreate,
  onOpenCanvas,
  onOpenPlan,
  onAssign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  filteredLessons: string[];
  allLessonsData: Record<string, LessonData>;
  plannerTerms: PlannerTermDates[];
  getLessonHalfTerm: (lessonNumber: string) => string | null;
  editingLessonNumber?: string;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  selectedHalfTerm: string;
  onSelectedHalfTermChange: (id: string) => void;
  isViewOnly: boolean;
  classLabel: string;
  onCreate: () => void;
  onOpenCanvas: (num: string) => void;
  onOpenPlan: (num: string) => void;
  onAssign?: (num: string) => void;
}) {
  return (
    <PlannerPopover
      open={open}
      onOpenChange={onOpenChange}
      label="Your lessons"
      panelClassName="w-[min(100vw,320px)] max-sm:w-full"
      trigger={
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => onOpenChange(!open)}
          className={cn(
            'inline-flex h-8 items-center gap-1 rounded-lg border border-[#E2E0EF] bg-white px-2 text-xs font-bold text-[#1F1B4D]',
            'hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
            'pointer-coarse:h-11 pointer-coarse:min-h-[44px] pointer-coarse:min-w-[44px] pointer-coarse:gap-1.5 pointer-coarse:rounded-xl pointer-coarse:px-3 pointer-coarse:text-sm',
            open && 'border-indigo-300 bg-indigo-50/60',
          )}
        >
          Your lessons
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-slate-500 transition pointer-coarse:h-4 pointer-coarse:w-4',
              open && 'rotate-180',
            )}
          />
        </button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-[#E2E0EF] bg-gradient-to-r from-[#2DD4BF] to-[#4338E8] px-3 py-3 text-white">
          <div className="flex items-center justify-between gap-2">
            <h2
              className="truncate text-[15px] font-extrabold tracking-tight"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              Your lessons
            </h2>
            <button
              type="button"
              onClick={onCreate}
              disabled={isViewOnly}
              className="inline-flex h-11 shrink-0 items-center gap-1 rounded-lg bg-white/20 px-2.5 text-[12px] font-extrabold text-white hover:bg-white/30 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <Plus className="h-3.5 w-3.5" />
              Create
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/70" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Search lessons…"
                className="h-11 w-full rounded-lg border border-white/25 bg-white/15 py-1 pl-8 pr-2 text-base font-medium text-white placeholder:text-white/65 focus:border-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
              />
            </div>
            <select
              value={selectedHalfTerm}
              onChange={(e) => onSelectedHalfTermChange(e.target.value)}
              className="h-11 w-full rounded-lg border border-white/25 bg-white/15 px-2 text-[13px] font-semibold text-white focus:border-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
              aria-label="Filter by half-term"
            >
              <option value="all" className="text-[#1F1B4D]">
                All half-terms
              </option>
              {plannerTerms.map((t) => (
                <option key={t.id} value={t.id} className="text-[#1F1B4D]">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#4338E8] border-t-transparent" />
              <p className="text-[13px] font-medium text-[#5F5B7A]">Loading lessons…</p>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="flex flex-col items-center px-3 py-10 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-[#D8D5E8]" aria-hidden />
              <p className="text-[13px] font-extrabold text-[#1F1B4D]">
                {searchQuery || selectedHalfTerm !== 'all'
                  ? 'No lessons match'
                  : `No lessons for ${classLabel}`}
              </p>
              <button
                type="button"
                onClick={onCreate}
                disabled={isViewOnly}
                className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#4338E8] px-3.5 text-[12px] font-extrabold text-white hover:bg-[#3529d1] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <Plus className="h-3.5 w-3.5" />
                Create lesson
              </button>
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
                const term = plannerTerms.find((t) => t.id === termId);
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
                        onClick={() => {
                          onOpenCanvas(num);
                          onOpenChange(false);
                        }}
                        className="w-full min-h-[44px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-[#E9E6FF] px-1 text-[10px] font-extrabold text-[#4338E8]">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-extrabold text-[#1F1B4D]">
                              {data.title || `Lesson ${num}`}
                            </p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-[#5F5B7A]">
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
                      <div className="mt-1.5 flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onOpenPlan(num);
                            onOpenChange(false);
                          }}
                          disabled={isViewOnly}
                          className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-lg text-[11px] font-bold text-[#5C5878] hover:bg-[#F4F3FA] hover:text-[#4338E8] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit plan
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenCanvas(num);
                            onOpenChange(false);
                          }}
                          className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-lg text-[11px] font-bold text-[#5C5878] hover:bg-[#F4F3FA] hover:text-[#4338E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                          Canvas
                        </button>
                      </div>
                      {onAssign && !isViewOnly ? (
                        <button
                          type="button"
                          onClick={() => {
                            onAssign(num);
                            onOpenChange(false);
                          }}
                          className="mt-1 inline-flex h-11 w-full items-center justify-center gap-1 rounded-lg text-[11px] font-bold text-[#5C5878] hover:bg-[#F4F3FA] hover:text-[#4338E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
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
      </div>
    </PlannerPopover>
  );
}
