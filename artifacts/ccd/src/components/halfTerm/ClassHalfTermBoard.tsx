import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Calendar, CheckCircle, Plus, Search } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContextNew';
import { useLessonStacks } from '../../hooks/useLessonStacks';
import { TermCopyModal } from '../TermCopyModal';
import {
  DEFAULT_YEAR_GROUP_SECTION_LABELS,
  resolveDisplaySectionIdForYearGroup,
} from '../../utils/yearGroupSectionOrder';
import { HALF_TERMS, TERM_COLORS, TERM_TINTS } from './halfTermConstants';
import type { YearGroupRef } from './HalfTermYearMap';

const UI_FONT = "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)";

interface ClassHalfTermBoardProps {
  group: YearGroupRef;
  onBack: () => void;
  onOpenTerm: (halfTermId: string) => void;
  refreshKey?: number;
}

function formatDuration(mins: number): string {
  if (!mins || mins <= 0) return '';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Full-page per-class half-term designer: large 3×2 cards with schemes and add targets.
 */
export function ClassHalfTermBoard({
  group,
  onBack,
  onOpenTerm,
  refreshKey = 0,
}: ClassHalfTermBoardProps) {
  const {
    halfTerms,
    currentAcademicYear,
    setCurrentAcademicYear,
    getAvailableYears,
    copyTermToYear,
  } = useData();
  const { customYearGroups, yearGroupSections } = useSettings();
  const { stacks } = useLessonStacks();
  const [searchQuery, setSearchQuery] = useState('');
  const [showTermCopyModal, setShowTermCopyModal] = useState(false);

  const stageLabel = useMemo(() => {
    const sections = [...(yearGroupSections || [])];
    const groups = customYearGroups.map((g) => ({ id: g.id, name: g.name }));
    const self = groups.find((g) => g.id === group.id) || { id: group.id, name: group.name };
    const sectionId = resolveDisplaySectionIdForYearGroup(sections, self, groups);
    if (sectionId === 'other') return null;
    return (
      DEFAULT_YEAR_GROUP_SECTION_LABELS.find((s) => s.id === sectionId)?.label ||
      sections.find((s) => s.id === sectionId)?.label ||
      sectionId.toUpperCase()
    );
  }, [customYearGroups, yearGroupSections, group.id, group.name]);

  const years = getAvailableYears();
  const yearIndex = years.indexOf(currentAcademicYear);

  const cards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return HALF_TERMS.map((term) => {
      const ht = halfTerms.find((t) => t.id === term.id);
      const stackIds = ht?.stacks || [];
      const schemes = stackIds
        .map((id) => stacks.find((s) => s.id === id))
        .filter(Boolean) as typeof stacks;
      const lessonCount = schemes.reduce((n, s) => n + (s.lessons?.length || 0), 0);
      const hay = `${term.name} ${term.months} ${schemes.map((s) => s.name).join(' ')}`.toLowerCase();
      const matches = !q || hay.includes(q);
      return {
        term,
        schemes,
        lessonCount,
        isComplete: !!ht?.isComplete,
        matches,
      };
    });
  }, [halfTerms, stacks, searchQuery, refreshKey]);

  const visible = cards.filter((c) => c.matches);

  return (
    <div
      className="flex min-h-[calc(100vh-7.5rem)] min-w-0 flex-col"
      style={{ fontFamily: UI_FONT }}
    >
      {/* Page header */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#4338E8] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All classes
          </button>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[1.85rem] font-extrabold tracking-tight text-[#1F1B4D] sm:text-[2.1rem]">
              {group.name}
            </h1>
            {stageLabel ? (
              <span className="rounded-lg bg-[#E9E6FF] px-2.5 py-1 text-[12px] font-extrabold uppercase tracking-wide text-[#4338E8]">
                {stageLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[14px] font-medium text-[#77738F]">
            Half-term designer · {currentAcademicYear.replace('-', '–')}
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
              placeholder="Search terms or schemes…"
              className="h-10 w-[13rem] rounded-xl border border-[#E2E0EF] bg-white py-2 pl-9 pr-3 text-[13px] font-medium text-[#1F1B4D] placeholder:text-[#9B97B0] focus:border-[#4338E8] focus:outline-none focus:ring-2 focus:ring-[#4338E8]/25 sm:w-[15rem]"
            />
          </div>
        </div>
      </div>

      {/* Cards grid — fill remaining viewport */}
      {visible.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[#E2E0EF] bg-white px-4 py-16 text-center">
          <div>
            <p className="text-[15px] font-extrabold text-[#1F1B4D]">No half-terms match</p>
            <p className="mt-1 text-[13px] text-[#77738F]">Try a different search.</p>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
          {visible.map(({ term, schemes, lessonCount, isComplete }) => {
            const color = TERM_COLORS[term.id];
            const tint = TERM_TINTS[term.id];
            const empty = schemes.length === 0;
            return (
              <button
                key={term.id}
                type="button"
                onClick={() => onOpenTerm(term.id)}
                className="group flex min-h-[13.5rem] flex-col overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white text-left shadow-[0_1px_3px_rgba(31,27,77,0.05)] transition hover:-translate-y-0.5 hover:border-[#bcb7f4] hover:shadow-[0_10px_28px_rgba(31,27,77,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9A3FF] xl:min-h-[15.5rem]"
                style={{ background: `linear-gradient(180deg, ${tint} 0%, #ffffff 42%)` }}
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
                    {isComplete ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#D5F3EA] px-2 py-1 text-[11px] font-extrabold text-[#0B6B5F]">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Done
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex min-h-0 flex-1 flex-col">
                    {empty ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D8D5E8] bg-white/70 px-3 py-6 text-center transition group-hover:border-[#bcb7f4] group-hover:bg-[#F7F6FC]">
                        <span
                          className="mb-2 grid h-11 w-11 place-items-center rounded-2xl text-white shadow-sm"
                          style={{ background: color }}
                        >
                          <Plus className="h-5 w-5" />
                        </span>
                        <span className="text-[15px] font-extrabold text-[#1F1B4D]">
                          Add scheme of work
                        </span>
                        <span className="mt-1 text-[12px] font-medium text-[#77738F]">
                          Assign a unit for this half-term
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-1 flex-col gap-2">
                        {schemes.map((stack) => (
                          <div
                            key={stack.id}
                            className="flex items-start gap-2.5 rounded-xl border border-[#E2E0EF] bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(31,27,77,0.04)]"
                          >
                            <span
                              className="mt-0.5 h-9 w-1.5 shrink-0 rounded-full"
                              style={{ background: stack.color || color }}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-extrabold text-[#1F1B4D]">
                                {stack.name}
                              </p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] font-semibold text-[#77738F]">
                                <span className="inline-flex items-center gap-1">
                                  <BookOpen className="h-3.5 w-3.5" />
                                  {stack.lessons.length} lesson
                                  {stack.lessons.length === 1 ? '' : 's'}
                                </span>
                                {stack.totalTime ? (
                                  <span>{formatDuration(stack.totalTime)}</span>
                                ) : null}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="mt-auto flex items-center justify-between pt-1 text-[12px] font-bold text-[#5C5878]">
                          <span>
                            {schemes.length} scheme{schemes.length === 1 ? '' : 's'}
                            {lessonCount > 0 ? ` · ${lessonCount} lessons` : ''}
                          </span>
                          <span className="text-[#4338E8] opacity-0 transition group-hover:opacity-100">
                            Review →
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
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
