import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
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
import { useLessonStacks, type StackedLesson } from '../../hooks/useLessonStacks';
import { keyStageAccent } from '../settings/keyStageAccents';
import {
  DEFAULT_YEAR_GROUP_SECTION_LABELS,
} from '../../utils/yearGroupSectionOrder';
import {
  detectClassSubject,
  groupClassesBySubject,
  sortClassesNatural,
  subjectDef,
  type ClassLike,
} from '../../utils/classOrganization';
import { HALF_TERMS, TERM_COLORS } from './halfTermConstants';
import {
  classDisplayColor,
  getStageIdForClass,
  inferClassSubject,
  readClassHalfTerms,
  writeClassHalfTermStacks,
  type ClassRef,
  CLASS_SUBJECT_FILTERS,
  type ClassSubject,
} from './halfTermClassUtils';

const UI_FONT = "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)";

const STAGE_ORDER = ['eyfs', 'ks1', 'ks2', 'ks3', 'ks4', 'ks5', 'other'] as const;

const SHORT_NAME_EXPAND: Record<string, string> = {
  lkg: 'Lower Kindergarten',
  ukg: 'Upper Kindergarten',
  rec: 'Reception',
  reception: 'Reception',
};

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

/** Readable title + context line for ambiguous short names (LKG vs Lower Kindergarten). */
function classLabelParts(cls: ClassLike): { title: string; context: string | null } {
  const name = (cls.name || '').trim();
  const id = (cls.id || '').trim();
  const subject = subjectDef(detectClassSubject(cls));
  const key = name.toLowerCase().replace(/\s+/g, '');
  const expanded =
    SHORT_NAME_EXPAND[name.toLowerCase()] ||
    SHORT_NAME_EXPAND[key] ||
    SHORT_NAME_EXPAND[id.toLowerCase().replace(/\s+/g, '')];

  if (expanded && expanded.toLowerCase() !== name.toLowerCase()) {
    const bits = [name !== expanded ? name : null, subject.id !== 'other' ? subject.label : null]
      .filter(Boolean)
      .join(' · ');
    return { title: expanded, context: bits || (id !== name ? id : null) };
  }

  const nameHasSubject =
    subject.id !== 'other' && new RegExp(`\\b${subject.label}\\b`, 'i').test(name);
  const contextBits: string[] = [];
  if (!nameHasSubject && subject.id !== 'other') contextBits.push(subject.label);
  if (id && id !== name && !name.toLowerCase().includes(id.toLowerCase())) {
    contextBits.push(id);
  }
  return { title: name || id, context: contextBits.length ? contextBits.join(' · ') : null };
}

/**
 * Min column width so the longest class title fits on one line when possible.
 * auto-fill then drops to 3 (or 2) columns when 4 won't fit.
 */
function classGridMinColRem(classes: ClassLike[]): number {
  let maxLen = 10;
  for (const cls of classes) {
    const { title } = classLabelParts(cls);
    maxLen = Math.max(maxLen, title.length);
  }
  // Extrabold ~15px ≈ 0.58rem/char; chrome = checkbox + dot + gaps + padding
  const textRem = maxLen * 0.58;
  const chromeRem = 3.6;
  return Math.min(16, Math.max(9.5, Math.ceil((textRem + chromeRem) * 4) / 4));
}

function inferSchemeSubject(stack: StackedLesson): ClassSubject | 'Other' {
  return inferClassSubject(`${stack.name} ${stack.description || ''}`);
}

/**
 * Assign one scheme of work to one or more classes for a half-term.
 * Two-pane layout: classes (key-stage groups) | scheme cards.
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
  const [schemeSubject, setSchemeSubject] = useState<ClassSubject | 'All'>('All');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(
    () => new Set(target.preselectedClassIds || []),
  );
  const [selectedStackId, setSelectedStackId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneCount, setDoneCount] = useState(0);
  /** All stages start collapsed every time the modal opens. */
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(
    () => new Set(STAGE_ORDER),
  );

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

  const stageBlocks = useMemo(() => {
    const q = classQuery.trim().toLowerCase();
    const byStage = new Map<string, ClassRef[]>();
    for (const id of STAGE_ORDER) byStage.set(id, []);

    for (const cls of allClasses) {
      const stageId = getStageIdForClass(cls, yearGroupSections || [], allClasses);
      const bucket = byStage.get(stageId) || byStage.get('other')!;
      if (q) {
        const { title, context } = classLabelParts(cls);
        const hay = `${cls.name} ${cls.id} ${title} ${context || ''}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      bucket.push(cls);
    }

    return STAGE_ORDER.map((id) => {
      const classes = sortClassesNatural(byStage.get(id) || []);
      const label =
        DEFAULT_YEAR_GROUP_SECTION_LABELS.find((s) => s.id === id)?.label ||
        yearGroupSections?.find((s) => s.id === id)?.label ||
        id.toUpperCase();
      return {
        id,
        label: id === 'other' ? 'Other' : label,
        classes,
        subjectGroups: groupClassesBySubject(classes),
      };
    }).filter((b) => b.classes.length > 0);
  }, [allClasses, yearGroupSections, classQuery]);

  const availableSchemes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stacks.filter((s) => {
      if (schemeSubject !== 'All' && inferSchemeSubject(s) !== schemeSubject) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      );
    });
  }, [stacks, query, schemeSubject]);

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

  useEffect(() => {
    // Reset collapse + selection whenever this half-term assign modal opens/retargets
    setCollapsedStages(new Set(STAGE_ORDER));
    setPreviewId(null);
    setSelectedStackId(null);
    setQuery('');
    setClassQuery('');
    setSchemeSubject('All');
    if (target.preselectedClassIds?.length) {
      setSelectedClassIds(new Set(target.preselectedClassIds));
    } else {
      setSelectedClassIds(new Set());
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

  const selectGroup = (ids: string[]) => {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  };

  const clearGroup = (ids: string[]) => {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  };

  const clearClasses = () => setSelectedClassIds(new Set());

  const toggleStageCollapsed = (stageId: string) => {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  const alreadyHasScheme = (classId: string, stackId: string) => {
    const terms = readClassHalfTerms(classId, currentAcademicYear);
    const ht = terms.find((t) => t.id === target.halfTermId);
    return !!ht?.stacks?.includes(stackId);
  };

  const canAssign = !!selectedStack && selectedClassIds.size > 0 && !busy;
  const disabledReason = busy
    ? null
    : !selectedStack && selectedClassIds.size === 0
      ? 'Choose at least one class and a scheme'
      : !selectedStack
        ? 'Choose a scheme of work'
        : selectedClassIds.size === 0
          ? 'Choose at least one class'
          : null;

  const assign = async () => {
    if (!selectedStack || selectedClassIds.size === 0) {
      setError(disabledReason || 'Choose at least one class and one scheme of work.');
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

  const footerSummary = busy
    ? `Assigning… ${doneCount}/${selectedClassIds.size}`
    : selectedStack && selectedClassIds.size > 0
      ? `Assign ${selectedStack.name} to ${selectedClassIds.size} class${
          selectedClassIds.size === 1 ? '' : 'es'
        } in ${termName}`
      : disabledReason;

  const panel = (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-5 lg:p-8"
      style={{ fontFamily: UI_FONT }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-multi-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(21,18,51,0.48)] backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />

      <div className="relative z-[1] flex max-h-[min(94vh,920px)] w-full max-w-[68rem] flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_24px_64px_rgba(31,27,77,0.28)] sm:rounded-3xl">
        {/* Header */}
        <div className="shrink-0 border-b border-[#E2E0EF] px-5 pb-4 pt-5 sm:px-7">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#77738F]">
                Add scheme of work
              </p>
              <h2
                id="assign-multi-title"
                className="mt-1 text-[1.5rem] font-extrabold tracking-tight text-[#1F1B4D] sm:text-[1.65rem]"
              >
                <span style={{ color: termColor }}>{termName}</span>
                {termMonths ? (
                  <span className="ml-2 text-[15px] font-semibold text-[#77738F]">
                    {termMonths}
                  </span>
                ) : null}
              </h2>
              <p className="mt-1.5 text-[14px] leading-snug text-[#5C5878]">
                Choose classes, then a whole scheme — assign to several classes in one go.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#E2E0EF] text-[#77738F] transition hover:border-[#bcb7f4] hover:bg-[#F4F3FA] hover:text-[#1F1B4D]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full" style={{ background: termColor }} aria-hidden />

          {/* Step labels */}
          <div className="mt-3.5 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-extrabold ${
                selectedClassIds.size > 0
                  ? 'bg-[#E9E6FF] text-[#4338E8]'
                  : 'bg-[#F4F3FA] text-[#5C5878]'
              }`}
            >
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-extrabold ${
                  selectedClassIds.size > 0 ? 'bg-[#4338E8] text-white' : 'bg-white text-[#77738F]'
                }`}
              >
                1
              </span>
              Choose classes
              {selectedClassIds.size > 0 ? (
                <span className="tabular-nums opacity-80">· {selectedClassIds.size}</span>
              ) : null}
            </span>
            <span
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-extrabold ${
                selectedStack
                  ? 'bg-[#E9E6FF] text-[#4338E8]'
                  : 'bg-[#F4F3FA] text-[#5C5878]'
              }`}
            >
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-extrabold ${
                  selectedStack ? 'bg-[#4338E8] text-white' : 'bg-white text-[#77738F]'
                }`}
              >
                2
              </span>
              Choose scheme
            </span>
          </div>
        </div>

        {error ? (
          <div className="mx-5 mt-3 shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800 sm:mx-7">
            {error}
          </div>
        ) : null}

        {/* Two panes */}
        <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-[#E2E0EF] lg:grid-cols-[minmax(0,1.65fr)_minmax(260px,0.85fr)] lg:divide-x lg:divide-y-0">
          {/* LEFT: Classes */}
          <section className="flex min-h-0 flex-col bg-white">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#E2E0EF]/80 px-5 py-3 sm:px-6">
              <h3 className="text-[15px] font-extrabold text-[#1F1B4D]">Classes</h3>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    selectGroup(stageBlocks.flatMap((b) => b.classes.map((c) => c.id)))
                  }
                  className="text-[13px] font-bold text-[#4338E8] hover:underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearClasses}
                  className="text-[13px] font-bold text-[#77738F] hover:underline"
                >
                  Clear
                </button>
                <span className="rounded-lg bg-[#E9E6FF] px-2 py-0.5 text-[12px] font-extrabold tabular-nums text-[#4338E8]">
                  {selectedClassIds.size} selected
                </span>
              </div>
            </div>
            <div className="shrink-0 px-5 py-2.5 sm:px-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B97B0]" />
                <input
                  type="search"
                  value={classQuery}
                  onChange={(e) => setClassQuery(e.target.value)}
                  placeholder="Filter classes…"
                  className="h-10 w-full rounded-xl border border-[#E2E0EF] bg-[#F4F3FA] py-2 pl-10 pr-3 text-[14px] font-medium text-[#1F1B4D] placeholder:text-[#9B97B0] focus:border-[#4338E8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4338E8]/25"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">
              {stageBlocks.length === 0 ? (
                <p className="py-8 text-center text-[14px] text-[#77738F]">No classes match.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 content-start">
                  {stageBlocks.map((block) => {
                    const accent = keyStageAccent(block.id, block.label);
                    const open = !collapsedStages.has(block.id);
                    const ids = block.classes.map((c) => c.id);
                    const selectedInGroup = ids.filter((id) => selectedClassIds.has(id)).length;
                    const allSelected = selectedInGroup === ids.length && ids.length > 0;
                    const showSubjects = block.subjectGroups.length > 1;
                    return (
                      <div
                        key={block.id}
                        className={`ss-settings-stage-card min-w-0 ${open ? 'is-open col-span-2' : 'col-span-1'}`}
                        style={{ borderColor: open ? accent.bar : undefined }}
                      >
                        <div
                          className="ss-settings-stage-card-head"
                          style={{ background: accent.tint }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleStageCollapsed(block.id)}
                            className="flex min-w-0 flex-1 items-center gap-1.5 text-left sm:gap-2"
                            aria-expanded={open}
                          >
                            {open ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-[#77738F]" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-[#77738F]" />
                            )}
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ background: accent.bar }}
                              aria-hidden
                            />
                            <span
                              className="ss-settings-stage-label truncate"
                              style={{ color: accent.label }}
                            >
                              {block.label}
                            </span>
                            <span
                              className="ss-settings-stage-count"
                              style={{ background: accent.badge, color: accent.badgeText }}
                            >
                              {block.classes.length}
                            </span>
                            {selectedInGroup > 0 ? (
                              <span className="hidden rounded-full bg-[#4338E8] px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums text-white sm:inline">
                                {selectedInGroup} sel.
                              </span>
                            ) : null}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              allSelected ? clearGroup(ids) : selectGroup(ids)
                            }
                            className="shrink-0 rounded-lg px-1.5 py-1 text-[11px] font-extrabold text-[#4338E8] hover:bg-white/70 sm:px-2 sm:text-[12px]"
                          >
                            {allSelected ? 'Clear' : 'All'}
                            {selectedInGroup > 0 && !allSelected ? (
                              <span className="ml-0.5 tabular-nums opacity-70">
                                ({selectedInGroup})
                              </span>
                            ) : null}
                          </button>
                        </div>
                        {open ? (
                          <div className="ss-settings-stage-body space-y-2">
                            {(showSubjects
                              ? block.subjectGroups.map((g) => ({
                                  key: g.subject.id,
                                  subject: g.subject,
                                  classes: g.classes,
                                }))
                              : [
                                  {
                                    key: 'all',
                                    subject: null as
                                      | (typeof block.subjectGroups)[0]['subject']
                                      | null,
                                    classes: block.classes,
                                  },
                                ]
                            ).map((group) => (
                              <div
                                key={group.key}
                                className={showSubjects ? 'ss-settings-subject-group' : ''}
                              >
                                {showSubjects && group.subject ? (
                                  <div className="ss-settings-subject-head cursor-default">
                                    <span
                                      className="ss-settings-subject-dot"
                                      style={{ background: group.subject.color }}
                                    />
                                    <span>{group.subject.label}</span>
                                    <span className="ml-auto text-[11px] font-bold tabular-nums text-[#9B97B0]">
                                      {group.classes.length}
                                    </span>
                                  </div>
                                ) : null}
                                <ul
                                  className={`grid gap-1.5 ${
                                    showSubjects ? 'ss-settings-subject-body' : ''
                                  }`}
                                  style={{
                                    gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${classGridMinColRem(group.classes)}rem), 1fr))`,
                                  }}
                                >
                                  {group.classes.map((cls) => {
                                    const on = selectedClassIds.has(cls.id);
                                    const has =
                                      selectedStackId != null &&
                                      alreadyHasScheme(cls.id, selectedStackId);
                                    const chip = classDisplayColor(cls);
                                    const { title, context } = classLabelParts(cls);
                                    return (
                                      <li key={cls.id} className="min-w-0">
                                        <button
                                          type="button"
                                          onClick={() => toggleClass(cls.id)}
                                          className={`flex h-full w-full items-start gap-2 rounded-xl border px-2 py-2 text-left transition ${
                                            on
                                              ? 'border-[#4338E8] bg-[#EEEDFC]'
                                              : 'border-transparent bg-white hover:border-[#E2E0EF] hover:bg-[#FAFAFC]'
                                          }`}
                                        >
                                          <span
                                            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                                              on
                                                ? 'border-[#4338E8] bg-[#4338E8] text-white'
                                                : 'border-[#D8D5E8] bg-white text-transparent'
                                            }`}
                                          >
                                            <Check className="h-3 w-3" />
                                          </span>
                                          <span
                                            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{ background: chip }}
                                            aria-hidden
                                          />
                                          <span className="min-w-0 flex-1 overflow-hidden">
                                            <span className="ss-settings-class-name block break-words text-[13px] leading-snug sm:text-[15px]">
                                              {title}
                                            </span>
                                            {context ? (
                                              <span className="mt-0.5 block break-words text-[11px] font-semibold leading-snug text-[#9B97B0] sm:text-[12px]">
                                                {context}
                                              </span>
                                            ) : null}
                                            {has ? (
                                              <span className="mt-1 inline-block rounded-md bg-[#D5F3EA] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#0B6B5F]">
                                                Has it
                                              </span>
                                            ) : null}
                                          </span>
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: Schemes */}
          <section className="flex min-h-0 flex-col bg-[#FAFAFC]/50">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#E2E0EF]/80 px-5 py-3 sm:px-6">
              <h3 className="text-[15px] font-extrabold text-[#1F1B4D]">Scheme of work</h3>
              <div className="relative w-full sm:w-52">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B97B0]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search schemes…"
                  className="h-10 w-full rounded-xl border border-[#E2E0EF] bg-white py-2 pl-10 pr-3 text-[14px] font-medium text-[#1F1B4D] placeholder:text-[#9B97B0] focus:border-[#4338E8] focus:outline-none focus:ring-2 focus:ring-[#4338E8]/25"
                />
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5 px-5 py-2.5 sm:px-6">
              {(['All', ...CLASS_SUBJECT_FILTERS] as const).map((s) => {
                const active = schemeSubject === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSchemeSubject(s)}
                    className={`inline-flex h-8 items-center rounded-lg px-2.5 text-[12px] font-extrabold transition ${
                      active
                        ? 'bg-[#4338E8] text-white'
                        : 'border border-[#E2E0EF] bg-white text-[#5C5878] hover:border-[#bcb7f4]'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-5 pb-4 sm:px-6">
              {stacksLoading ? (
                <p className="py-10 text-center text-[14px] text-[#77738F]">Loading schemes…</p>
              ) : stacks.length === 0 ? (
                <div className="rounded-2xl border border-[#E2E0EF] bg-white px-4 py-10 text-center">
                  <Layers className="mx-auto h-10 w-10 text-[#4338E8]" />
                  <p className="mt-3 text-[16px] font-extrabold text-[#1F1B4D]">
                    No schemes of work yet
                  </p>
                  <p className="mx-auto mt-1.5 max-w-sm text-[14px] leading-snug text-[#77738F]">
                    Create a scheme (lesson stack / unit) in Lessons, then return here to assign it.
                  </p>
                  <button
                    type="button"
                    onClick={goCreateScheme}
                    className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-[#4338E8] px-4 text-[14px] font-bold text-white transition hover:bg-[#3529d1]"
                  >
                    <Plus className="h-4 w-4" />
                    Create a scheme
                  </button>
                </div>
              ) : availableSchemes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E2E0EF] bg-white px-4 py-8 text-center text-[14px] text-[#77738F]">
                  No schemes match your search.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableSchemes.map((stack) => {
                    const open = previewId === stack.id;
                    const picked = selectedStackId === stack.id;
                    const subject = inferSchemeSubject(stack);
                    const lessonPreview = stack.lessons.slice(0, 2);
                    return (
                      <div
                        key={stack.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={picked}
                        onClick={() => setSelectedStackId(stack.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedStackId(stack.id);
                          }
                        }}
                        className={`col-span-1 flex max-w-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-white text-left shadow-[0_1px_2px_rgba(31,27,77,0.04)] transition ${
                          open ? 'col-span-2' : ''
                        } ${
                          picked
                            ? 'border-[#4338E8] ring-2 ring-[#4338E8]/25'
                            : 'border-[#E2E0EF] hover:border-[#bcb7f4]'
                        }`}
                      >
                        <div className="flex min-h-0 flex-1 items-stretch gap-0">
                          <span
                            className="w-1 shrink-0 self-stretch"
                            style={{ background: stack.color || '#4338E8' }}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1 p-2.5 sm:p-3">
                            <div className="flex items-start gap-2">
                              <span
                                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                                  picked
                                    ? 'border-[#4338E8] bg-[#4338E8] text-white'
                                    : 'border-[#D8D5E8] bg-white'
                                }`}
                                aria-hidden
                              >
                                {picked ? <Check className="h-2.5 w-2.5" /> : null}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-[13px] font-extrabold leading-snug text-[#1F1B4D]">
                                  {stack.name}
                                </p>
                                {subject !== 'Other' ? (
                                  <span className="mt-1 inline-block rounded-md bg-[#F4F3FA] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#5C5878]">
                                    {subject}
                                  </span>
                                ) : null}
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-[#5C5878]">
                                  <span className="inline-flex items-center gap-0.5">
                                    <BookOpen className="h-3 w-3" />
                                    {stack.lessons.length}
                                  </span>
                                  <span className="inline-flex items-center gap-0.5">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(stack.totalTime)}
                                  </span>
                                </div>
                                {!open && lessonPreview.length > 0 ? (
                                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-[#9B97B0]">
                                    {lessonPreview
                                      .map((id) => allLessonsData[id]?.title || `Lesson ${id}`)
                                      .join(' · ')}
                                    {stack.lessons.length > lessonPreview.length
                                      ? ` · +${stack.lessons.length - lessonPreview.length}`
                                      : ''}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewId(open ? null : stack.id);
                              }}
                              className="mt-2 inline-flex h-7 w-full items-center justify-center gap-1 rounded-lg border border-[#E2E0EF] text-[11px] font-bold text-[#5C5878] hover:bg-[#F4F3FA]"
                              aria-expanded={open}
                            >
                              {open ? 'Hide lessons' : 'Lessons'}
                              {open ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </button>
                            {open ? (
                              <div className="mt-2 rounded-lg border border-[#E2E0EF] bg-[#F4F3FA]/80 px-2.5 py-2">
                                <ol className="space-y-0.5">
                                  {stack.lessons.map((lessonId, i) => {
                                    const lesson = allLessonsData[lessonId];
                                    return (
                                      <li
                                        key={`${stack.id}-${lessonId}`}
                                        className="flex items-baseline gap-1.5 text-[12px] text-[#5C5878]"
                                      >
                                        <span className="w-4 shrink-0 text-right font-bold tabular-nums text-[#9B97B0]">
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
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sticky footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#E2E0EF] bg-[#FAFAFC] px-5 py-3.5 sm:px-7">
          <p
            className={`min-w-0 flex-1 text-[13px] font-semibold leading-snug sm:text-[14px] ${
              canAssign ? 'text-[#1F1B4D]' : 'text-[#77738F]'
            }`}
          >
            {footerSummary}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center rounded-xl border border-[#E2E0EF] px-4 text-[14px] font-bold text-[#5C5878] hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canAssign}
              title={disabledReason || undefined}
              onClick={() => void assign()}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#4338E8] px-5 text-[14px] font-extrabold text-white transition hover:bg-[#3529d1] disabled:cursor-not-allowed disabled:bg-[#C4C0D8] disabled:opacity-90"
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
