import {
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Printer,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import type { Activity, LessonData } from '../../contexts/DataContext';
import {
  BUILTIN_SECTION_TYPES,
  type LessonAiFleshOutState,
  type LessonSection,
  type LessonSectionKind,
} from '../../types/lessonSections';
import { ensureLessonSections } from '../../utils/planner/legacyLessonToSections';
import { loadPlannerCurriculum } from '../../utils/planner/plannerCurriculumStore';
import { buildLessonPdfHtml } from '../../utils/lessonPdfHtml';
import { AttachInteractiveLesson } from '../../features/interactive-lesson-viewer';
import {
  Button,
  CloseX,
  Pill,
  Segmented,
  TextInput,
} from './ui';
import { RichHtml } from './RichHtml';
import { cn } from '@/lib/utils';

type ViewTab = 'plan' | 'preview' | 'print';

function uid(prefix = 'sec') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Inline lesson plan — fills the full-width lesson canvas (not ModalShell).
 * Plan / Preview / Print + sequence + curriculum; Flesh out is an overlay drawer
 * so it does not squeeze the curriculum / objectives column.
 */
export function LessonPlanPanel({
  open,
  onClose,
  lessonNumber,
  lessonData,
  onSave,
  yearGroup,
}: {
  open: boolean;
  onClose: () => void;
  lessonNumber?: string;
  lessonData?: LessonData | null;
  onSave: (data: LessonData) => void | Promise<void>;
  yearGroup?: string;
}) {
  const titleId = useId();
  const [tab, setTab] = useState<ViewTab>('plan');
  const [fleshOpen, setFleshOpen] = useState(false);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [draft, setDraft] = useState<LessonData | null>(null);
  const [liveMessage, setLiveMessage] = useState('');
  const curriculum = useMemo(() => loadPlannerCurriculum(), [open]);

  useEffect(() => {
    if (!open) return;
    const base: LessonData = lessonData
      ? { ...lessonData }
      : {
          grouped: {},
          categoryOrder: [],
          totalTime: 0,
          title: 'New lesson',
          learningOutcome: '',
          successCriteria: '',
        };
    setDraft(ensureLessonSections(base));
    setTab('plan');
    setFleshOpen(false);
  }, [open, lessonData]);

  const sections = draft?.sections || [];
  const selectedIds = new Set(draft?.customObjectives || []);

  const customTypes = curriculum.sectionTypes.filter((t) => t.enabled !== false);

  const updateSections = (next: LessonSection[], announce?: string) => {
    if (!draft) return;
    const activities = next.filter((s) => s.kind === 'activity' && s.activity).map((s) => s.activity!);
    const grouped: Record<string, Activity[]> = {};
    const categoryOrder: string[] = [];
    for (const a of activities) {
      const cat = a.category || 'Activities';
      if (!grouped[cat]) {
        grouped[cat] = [];
        categoryOrder.push(cat);
      }
      grouped[cat].push(a);
    }
    const totalTime = activities.reduce((sum, a) => sum + (a.time || 0), 0);
    setDraft({
      ...draft,
      sections: next,
      orderedActivities: activities,
      grouped,
      categoryOrder,
      totalTime,
    });
    if (announce) setLiveMessage(announce);
  };

  const insertSection = (index: number, kind: LessonSectionKind, title: string, customTypeId?: string) => {
    const section: LessonSection = {
      id: uid(kind),
      kind,
      title,
      bodyHtml: '',
      customTypeId,
      lastWrittenBy: 'teacher',
    };
    const next = [...sections];
    next.splice(index, 0, section);
    updateSections(next, `Inserted ${title}`);
    setInsertAt(null);
  };

  const moveSection = (from: number, to: number) => {
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    updateSections(next, `Moved ${item.title}`);
  };

  const removeSection = (id: string) => {
    const target = sections.find((s) => s.id === id);
    updateSections(
      sections.filter((s) => s.id !== id),
      target ? `Removed ${target.title}` : 'Section removed',
    );
  };

  const applyFleshOut = (instruction: string, scope: 'whole_plan' | { sectionId: string }) => {
    if (!draft) return;
    const before = {
      sections: structuredClone(sections),
      learningOutcome: draft.learningOutcome,
      successCriteria: draft.successCriteria,
    };
    let nextSections = sections.map((s) => ({ ...s }));
    let learningOutcome = draft.learningOutcome || '';
    let successCriteria = draft.successCriteria || '';

    const fill = (html: string | undefined, addition: string): string => {
      const t = (html || '').trim();
      return t ? t : addition;
    };

    // Demo / offline stub — deterministic, no API keys
    if (scope === 'whole_plan') {
      learningOutcome = fill(
        learningOutcome,
        `Learners will explore the lesson focus through practical activities. (${instruction})`,
      );
      successCriteria = fill(
        successCriteria,
        '• I can take part\n• I can explain one idea\n• I can reflect with a partner',
      );
      nextSections = nextSections.map((s) => {
        if (s.kind === 'activity') return s;
        if ((s.bodyHtml || '').trim()) return s;
        return {
          ...s,
          bodyHtml: `Teacher note for “${s.title}”: ${instruction}`,
          lastWrittenBy: 'ai' as const,
        };
      });
    } else {
      nextSections = nextSections.map((s) => {
        if (s.id !== scope.sectionId) return s;
        return {
          ...s,
          bodyHtml: `${s.bodyHtml || ''}\n\nAI: ${instruction}`.trim(),
          lastWrittenBy: 'ai' as const,
        };
      });
    }

    const after = {
      sections: structuredClone(nextSections),
      learningOutcome,
      successCriteria,
    };
    const prevAi: LessonAiFleshOutState = draft.aiFleshOut || { history: [], historyIndex: -1 };
    const turn = {
      id: uid('ai'),
      createdAt: new Date().toISOString(),
      scope,
      instruction,
      snapshotBefore: before,
      snapshotAfter: after,
      teacherDirtySectionIds: [],
      applyMode: 'fill_empty_only' as const,
    };
    const history = [...prevAi.history.slice(0, prevAi.historyIndex + 1), turn].slice(-20);
    setDraft({
      ...draft,
      sections: nextSections,
      learningOutcome,
      successCriteria,
      aiFleshOut: { history, historyIndex: history.length - 1 },
    });
    setLiveMessage('Flesh out applied — all fields remain editable');
  };

  const undoAi = () => {
    if (!draft?.aiFleshOut) return;
    const { history, historyIndex } = draft.aiFleshOut;
    if (historyIndex < 0) return;
    const turn = history[historyIndex];
    setDraft({
      ...draft,
      sections: turn.snapshotBefore.sections,
      learningOutcome: turn.snapshotBefore.learningOutcome,
      successCriteria: turn.snapshotBefore.successCriteria,
      aiFleshOut: { history, historyIndex: historyIndex - 1 },
    });
    setLiveMessage('Undid last AI apply');
  };

  const redoAi = () => {
    if (!draft?.aiFleshOut) return;
    const { history, historyIndex } = draft.aiFleshOut;
    if (historyIndex >= history.length - 1) return;
    const turn = history[historyIndex + 1];
    setDraft({
      ...draft,
      sections: turn.snapshotAfter.sections,
      learningOutcome: turn.snapshotAfter.learningOutcome,
      successCriteria: turn.snapshotAfter.successCriteria,
      aiFleshOut: { history, historyIndex: historyIndex + 1 },
    });
    setLiveMessage('Redid AI apply');
  };

  const printHtml = useMemo(() => {
    if (!draft || tab === 'plan') return '';
    try {
      return buildLessonPdfHtml({
        lessonData: {
          title: draft.title || 'Lesson',
          learningOutcome: draft.learningOutcome,
          successCriteria: draft.successCriteria,
          introduction: draft.introduction,
          mainActivity: draft.mainActivity,
          plenary: draft.plenary,
          vocabulary: draft.vocabulary,
          differentiation: draft.differentiation,
          assessment: draft.assessment,
          resources: draft.resources,
          orderedActivities: draft.orderedActivities,
          grouped: draft.grouped,
          sections: draft.sections,
          totalTime: draft.totalTime,
        },
        sheetDisplay: yearGroup || '',
        lessonNumber,
      });
    } catch {
      return '<p>Preview unavailable</p>';
    }
  }, [draft, tab, yearGroup, lessonNumber]);

  if (!open || !draft) return null;

  const linkedStatements = curriculum.statements.filter((st) => selectedIds.has(st.id));

  return (
    <section
      className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[1.5rem] bg-white"
      aria-labelledby={titleId}
      data-ccd-lesson-plan-panel
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-indigo-50 px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2
            id={titleId}
            className="line-clamp-2 text-lg font-extrabold text-indigo-700"
            title={draft.title || 'Lesson plan'}
          >
            Lesson plan — {draft.title || 'Untitled'}
          </h2>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {yearGroup ? (
              <Pill className="bg-indigo-50 text-indigo-700">{yearGroup}</Pill>
            ) : null}
            {lessonNumber ? (
              <Pill className="bg-slate-100 text-slate-600">{lessonNumber}</Pill>
            ) : (
              <Pill className="bg-violet-50 text-violet-700">New lesson</Pill>
            )}
            <Pill className="bg-slate-100 text-slate-600">{draft.totalTime || 0} min</Pill>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<ViewTab>
            value={tab}
            onChange={(v) => setTab(v)}
            options={[
              { id: 'plan', label: 'Plan' },
              { id: 'preview', label: 'Preview' },
              { id: 'print', label: 'Print' },
            ]}
          />
          <Button
            variant={fleshOpen ? 'primary' : 'soft'}
            size="sm"
            onClick={() => {
              setFleshOpen((v) => !v);
              setInsertAt(null);
            }}
            className={cn(fleshOpen && 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/20')}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Flesh out with AI
          </Button>
          <CloseX onClick={onClose} />
        </div>
      </div>

      {/* Body — Flesh out overlays; does not pad/squeeze curriculum column */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="soft-scroll min-h-0 flex-1 overflow-y-auto">
          {tab === 'plan' ? (
            <div className="grid min-h-0 gap-4 p-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <h3 className="mb-2 text-sm font-extrabold text-slate-800">Lesson sequence</h3>
                <label className="mb-3 block space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Title
                  </span>
                  <input
                    value={draft.title || ''}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className="h-11 w-full rounded-2xl border border-indigo-100 px-3 text-sm font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  />
                </label>
                <InsertButton
                  open={insertAt === 0}
                  onToggle={() => setInsertAt(insertAt === 0 ? null : 0)}
                  onPick={(kind, title, customTypeId) =>
                    insertSection(0, kind, title, customTypeId)
                  }
                  customTypes={customTypes}
                />
                {sections.map((section, index) => (
                  <div key={section.id}>
                    <div
                      className={cn(
                        'rounded-2xl border border-slate-100 bg-white shadow-sm',
                        section.kind !== 'activity' &&
                          'border-dashed border-indigo-200 bg-indigo-50/20',
                      )}
                    >
                      <div className="flex items-center gap-2 px-3 py-2">
                        <span
                          className="h-8 w-1.5 rounded-full"
                          style={{
                            backgroundColor:
                              section.kind === 'activity' ? '#4338CA' : '#818CF8',
                          }}
                          aria-hidden
                        />
                        <span className="text-slate-300" aria-hidden>
                          <GripVertical className="h-4 w-4" />
                        </span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700">
                          {index + 1}
                        </span>
                        <input
                          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                          value={section.title}
                          onChange={(e) => {
                            const next = sections.map((s) =>
                              s.id === section.id ? { ...s, title: e.target.value } : s,
                            );
                            updateSections(next);
                          }}
                          aria-label={`Rename section: ${section.title}`}
                        />
                        {(section.durationMins || section.activity?.time) ? (
                          <span className="text-[11px] font-semibold text-slate-400">
                            {section.durationMins || section.activity?.time}m
                          </span>
                        ) : null}
                        <button
                          type="button"
                          aria-label="Move section up"
                          onClick={() => moveSection(index, index - 1)}
                          className="inline-flex h-11 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Move section down"
                          onClick={() => moveSection(index, index + 1)}
                          className="inline-flex h-11 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${section.title}`}
                          onClick={() => removeSection(section.id)}
                          className="rounded-full p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="px-3 pb-3">
                        {section.kind === 'activity' ? (
                          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                            <RichHtml
                              className="prose-sm text-xs text-slate-600"
                              html={
                                section.bodyHtml || section.activity?.description || ''
                              }
                              empty="Activity block — edit details from the stepped activity card."
                            />
                          </div>
                        ) : (
                          <TextInput
                            rows={3}
                            value={section.bodyHtml || ''}
                            onChange={(e) => {
                              const next = sections.map((s) =>
                                s.id === section.id
                                  ? {
                                      ...s,
                                      bodyHtml: e.target.value,
                                      lastWrittenBy: 'teacher' as const,
                                    }
                                  : s,
                              );
                              updateSections(next);
                            }}
                            className="bg-white"
                          />
                        )}
                      </div>
                    </div>
                    <InsertButton
                      open={insertAt === index + 1}
                      onToggle={() =>
                        setInsertAt(insertAt === index + 1 ? null : index + 1)
                      }
                      onPick={(kind, title, customTypeId) =>
                        insertSection(index + 1, kind, title, customTypeId)
                      }
                      customTypes={customTypes}
                    />
                  </div>
                ))}

                <div
                  data-planner-extension="attach-interactive-lesson"
                  className="mt-4 rounded-2xl border border-indigo-50 bg-indigo-50/20 p-3"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Lesson Viewer
                  </p>
                  {lessonNumber && yearGroup ? (
                    <AttachInteractiveLesson
                      sheet={yearGroup}
                      lessonNumber={lessonNumber}
                      existingId={draft.interactiveLessonId || null}
                      compact={false}
                      onAttached={(id) =>
                        setDraft({
                          ...draft,
                          interactiveLessonId: id || undefined,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm text-slate-500">
                      Save this lesson once to attach an interactive Lesson Viewer (Slides)
                      document.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="mb-2">
                    <h4 className="text-sm font-extrabold text-slate-800">
                      Curriculum statements
                    </h4>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      From your curriculum in Settings
                    </p>
                  </div>
                  {curriculum.statements.length === 0 ? (
                    <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      Nothing set up yet.{' '}
                      <a href="/settings/curriculum" className="font-bold underline">
                        Add frameworks, strands and statements
                      </a>
                    </p>
                  ) : (
                    <div className="mb-3 max-h-48 space-y-1.5 overflow-y-auto rounded-2xl border border-indigo-100 bg-indigo-50/40 p-2">
                      {curriculum.statements.map((st) => {
                        const strand = curriculum.strands.find((s) => s.id === st.strandId);
                        const checked = selectedIds.has(st.id);
                        return (
                          <label
                            key={st.id}
                            className="flex min-h-[44px] cursor-pointer gap-2 rounded-xl bg-white px-2.5 py-2 text-xs text-slate-700"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={checked}
                              onChange={() => {
                                const next = new Set(selectedIds);
                                if (checked) next.delete(st.id);
                                else next.add(st.id);
                                setDraft({
                                  ...draft,
                                  customObjectives: [...next],
                                  curriculumType: 'CUSTOM',
                                });
                              }}
                            />
                            <span className="min-w-0">
                              {strand ? (
                                <span className="mb-0.5 block font-bold text-indigo-500">
                                  {strand.name}
                                </span>
                              ) : null}
                              {st.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <ul className="space-y-2">
                    {linkedStatements.map((c) => {
                      const strand = curriculum.strands.find((s) => s.id === c.strandId);
                      return (
                        <li key={c.id} className="flex gap-2 text-sm text-slate-700">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                          <span>
                            {strand ? (
                              <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-indigo-500">
                                {strand.name}
                              </span>
                            ) : null}
                            {c.text}
                          </span>
                        </li>
                      );
                    })}
                    {linkedStatements.length === 0 && curriculum.statements.length > 0 ? (
                      <li className="text-sm text-slate-400">
                        No statements linked yet — tick statements above.
                      </li>
                    ) : null}
                  </ul>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                  <h4 className="mb-2 text-sm font-extrabold text-slate-800">
                    Learning objective
                  </h4>
                  <TextInput
                    rows={3}
                    aria-label="Learning objective"
                    value={draft.learningOutcome || ''}
                    onChange={(e) =>
                      setDraft({ ...draft, learningOutcome: e.target.value })
                    }
                  />
                </div>
                <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                  <h4 className="mb-2 text-sm font-extrabold text-slate-800">
                    Success criteria
                  </h4>
                  <TextInput
                    rows={4}
                    aria-label="Success criteria"
                    value={draft.successCriteria || ''}
                    onChange={(e) =>
                      setDraft({ ...draft, successCriteria: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'preview' ? (
            <div className="soft-scroll flex-1 overflow-y-auto p-6">
              <article className="mx-auto max-w-2xl space-y-4">
                <header>
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
                    Preview
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900">
                    {draft.title || 'Lesson'}
                  </h3>
                  {draft.learningOutcome ? (
                    <p className="mt-3 rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-900">
                      {draft.learningOutcome}
                    </p>
                  ) : null}
                </header>
                <ol className="space-y-3">
                  {sections.map((b, i) => (
                    <li
                      key={b.id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                    >
                      <p className="text-xs font-bold text-indigo-500">
                        {i + 1}. {b.title}
                        {b.durationMins || b.activity?.time
                          ? ` · ${b.durationMins || b.activity?.time}m`
                          : ''}
                      </p>
                      <RichHtml
                        className="mt-1"
                        html={b.bodyHtml || b.activity?.description || ''}
                        empty=""
                      />
                    </li>
                  ))}
                </ol>
              </article>
            </div>
          ) : null}

          {tab === 'print' ? (
            <iframe
              title="Print view"
              className="h-full min-h-[480px] w-full border-0 bg-slate-100/80"
              srcDoc={printHtml}
            />
          ) : null}
        </div>

        {/* Overlay drawer — does not shrink sequence / curriculum columns */}
        {fleshOpen ? (
          <aside
            className="absolute inset-y-0 right-0 z-10 flex w-[min(100%,280px)] flex-col border-l border-violet-100 bg-violet-50/95 shadow-xl shadow-violet-900/10 backdrop-blur-sm"
            aria-label="Flesh out with AI"
          >
            <div className="border-b border-violet-100 px-4 py-3">
              <p className="text-sm font-extrabold text-violet-900">Flesh out with AI</p>
              <p className="text-[11px] text-violet-700">Results stay editable.</p>
            </div>
            <FleshOutPanel
              onApply={applyFleshOut}
              onUndo={undoAi}
              onRedo={redoAi}
              canUndo={(draft.aiFleshOut?.historyIndex ?? -1) >= 0}
              canRedo={
                (draft.aiFleshOut?.historyIndex ?? -1) <
                (draft.aiFleshOut?.history.length ?? 0) - 1
              }
              sections={sections}
            />
          </aside>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-indigo-50 px-5 py-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setTab('preview')}>
            Preview
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setTab('print');
              window.setTimeout(() => window.print(), 200);
            }}
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </Button>
          <Button variant="primary" size="sm" onClick={() => void onSave(draft)}>
            Save lesson
          </Button>
        </div>
      </div>
      <div className="sr-only" aria-live="polite">
        {liveMessage}
      </div>
    </section>
  );
}

/** @deprecated Use LessonPlanPanel — lesson plan is inline, not a modal. */
export const LessonPlanModal = LessonPlanPanel;

function InsertButton({
  open,
  onToggle,
  onPick,
  customTypes,
}: {
  open: boolean;
  onToggle: () => void;
  onPick: (kind: LessonSectionKind, title: string, customTypeId?: string) => void;
  customTypes: Array<{ id: string; label: string }>;
}) {
  return (
    <div className="relative flex items-center justify-center py-1">
      <div className="absolute inset-x-8 top-1/2 h-px bg-indigo-100" />
      <button
        type="button"
        aria-label="Insert section"
        aria-expanded={open}
        onClick={onToggle}
        className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <Plus className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute top-9 z-30 min-w-[220px] overflow-hidden rounded-2xl border border-indigo-100 bg-white p-1.5 shadow-xl">
          {BUILTIN_SECTION_TYPES.filter((t) => t.enabled).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t.kind, t.label)}
              className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              {t.label}
            </button>
          ))}
          {customTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick('custom', t.label, t.id)}
              className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FleshOutPanel({
  onApply,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  sections,
}: {
  onApply: (instruction: string, scope: 'whole_plan' | { sectionId: string }) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  sections: LessonSection[];
}) {
  const [instruction, setInstruction] = useState('Make it more practical');
  const [scopeId, setScopeId] = useState<string>('whole_plan');

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
      <label className="block space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
          Instruction
        </span>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-violet-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
          Scope
        </span>
        <select
          value={scopeId}
          onChange={(e) => setScopeId(e.target.value)}
          className="h-11 w-full rounded-xl border border-violet-200 bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <option value="whole_plan">Whole plan</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() =>
          onApply(
            instruction.trim() || 'Flesh out this plan',
            scopeId === 'whole_plan' ? 'whole_plan' : { sectionId: scopeId },
          )
        }
        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        <Sparkles className="h-4 w-4" />
        Apply
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-violet-200 text-sm font-semibold text-violet-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          Undo AI
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-violet-200 text-sm font-semibold text-violet-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          Redo AI
        </button>
      </div>
      <p className="text-[11px] leading-relaxed text-violet-700">
        Empty fields are filled by default. Teacher edits are not overwritten unless you re-apply to that section.
      </p>
    </div>
  );
}
