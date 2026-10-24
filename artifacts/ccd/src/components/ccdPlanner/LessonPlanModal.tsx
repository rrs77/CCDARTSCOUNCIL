import {
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
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
import { ModalBody, ModalFooter, ModalHeader, ModalShell } from './ModalShell';
import { cn } from '@/lib/utils';

type ViewTab = 'plan' | 'preview' | 'print';

function uid(prefix = 'sec') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function LessonPlanModal({
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

  if (!draft) {
    return <ModalShell open={false} onClose={onClose} labelledBy={titleId}><span /></ModalShell>;
  }

  return (
    <ModalShell open={open} onClose={onClose} labelledBy={titleId}>
      <ModalHeader
        title={draft.title || 'Lesson plan'}
        subtitle={lessonNumber ? `Editing ${lessonNumber}` : 'New lesson'}
        onClose={onClose}
        titleId={titleId}
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {([
            ['plan', 'Plan', FileText],
            ['preview', 'Preview', Eye],
            ['print', 'Print', Printer],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                tab === id ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFleshOpen((v) => !v)}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
              fleshOpen ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700',
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Flesh out with AI
          </button>
        </div>
      </ModalHeader>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <ModalBody className={cn(fleshOpen && 'md:pr-[min(48%,280px)]')}>
          {tab === 'plan' ? (
            <div className="space-y-4">
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Lesson title
                </span>
                <input
                  value={draft.title || ''}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="h-11 w-full rounded-2xl border border-indigo-100 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Learning objective
                </span>
                <textarea
                  value={draft.learningOutcome || ''}
                  onChange={(e) => setDraft({ ...draft, learningOutcome: e.target.value })}
                  rows={2}
                  className="w-full rounded-2xl border border-indigo-100 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Success criteria
                </span>
                <textarea
                  value={draft.successCriteria || ''}
                  onChange={(e) => setDraft({ ...draft, successCriteria: e.target.value })}
                  rows={3}
                  className="w-full rounded-2xl border border-indigo-100 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                />
              </label>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sequence
                </p>
                <InsertButton
                  open={insertAt === 0}
                  onToggle={() => setInsertAt(insertAt === 0 ? null : 0)}
                  onPick={(kind, title, customTypeId) => insertSection(0, kind, title, customTypeId)}
                  customTypes={customTypes}
                />
                {sections.map((section, index) => (
                  <div key={section.id} className="mb-1">
                    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 text-slate-300" aria-hidden>
                          <GripVertical className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1 space-y-2">
                          <input
                            value={section.title}
                            onChange={(e) => {
                              const next = sections.map((s) =>
                                s.id === section.id ? { ...s, title: e.target.value } : s,
                              );
                              updateSections(next);
                            }}
                            className="h-9 w-full rounded-lg border border-transparent px-2 text-sm font-bold text-slate-900 hover:border-indigo-100 focus-visible:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            aria-label="Section title"
                          />
                          {section.kind === 'activity' ? (
                            <p className="text-xs text-slate-500">
                              Activity · {section.durationMins || section.activity?.time || 0}m
                            </p>
                          ) : (
                            <textarea
                              value={section.bodyHtml || ''}
                              onChange={(e) => {
                                const next = sections.map((s) =>
                                  s.id === section.id
                                    ? { ...s, bodyHtml: e.target.value, lastWrittenBy: 'teacher' as const }
                                    : s,
                                );
                                updateSections(next);
                              }}
                              rows={3}
                              className="w-full rounded-xl border border-indigo-50 bg-indigo-50/20 px-2.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            />
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            aria-label="Move section up"
                            onClick={() => moveSection(index, index - 1)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Move section down"
                            onClick={() => moveSection(index, index + 1)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${section.title}`}
                            onClick={() => removeSection(section.id)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <InsertButton
                      open={insertAt === index + 1}
                      onToggle={() => setInsertAt(insertAt === index + 1 ? null : index + 1)}
                      onPick={(kind, title, customTypeId) =>
                        insertSection(index + 1, kind, title, customTypeId)
                      }
                      customTypes={customTypes}
                    />
                  </div>
                ))}
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Curriculum statements
                </p>
                <p className="mb-2 text-xs text-slate-400">
                  From your curriculum in Settings.
                </p>
                {curriculum.statements.length === 0 ? (
                  <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Nothing set up yet.{' '}
                    <a href="/settings/curriculum" className="font-bold underline">
                      Add frameworks, strands and statements
                    </a>
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {curriculum.statements.map((st) => {
                      const checked = selectedIds.has(st.id);
                      return (
                        <li key={st.id}>
                          <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl px-2 py-1.5 hover:bg-indigo-50/50">
                            <input
                              type="checkbox"
                              className="mt-1"
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
                            <span className="text-sm text-slate-700">{st.text}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Extension point: attach Interactive Lesson Viewer (Slides) document */}
              <div
                data-planner-extension="attach-interactive-lesson"
                className="rounded-2xl border border-indigo-50 bg-indigo-50/20 p-3"
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
                    Save this lesson once to attach an interactive Lesson Viewer (Slides) document.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <iframe
              title={tab === 'preview' ? 'A4 preview' : 'Print view'}
              className="h-full min-h-[480px] w-full rounded-2xl border border-slate-100 bg-white"
              srcDoc={printHtml}
            />
          )}
        </ModalBody>

        {/* Inline Flesh out drawer — not a stacked modal */}
        {fleshOpen ? (
          <aside
            className="absolute inset-y-0 right-0 z-10 flex w-[min(100%,280px)] flex-col border-l border-violet-100 bg-violet-50/90 backdrop-blur-sm"
            aria-label="Flesh out with AI"
          >
            <div className="border-b border-violet-100 px-4 py-3">
              <p className="text-sm font-extrabold text-violet-900">Flesh out with AI</p>
              <p className="text-[11px] text-violet-700">
                Results stay editable. Demo stub when offline.
              </p>
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

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center rounded-full border-2 border-indigo-200 px-4 text-sm font-semibold text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void onSave(draft)}
          className="inline-flex h-11 items-center rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Save lesson
        </button>
      </ModalFooter>
      <div className="sr-only" aria-live="polite">
        {liveMessage}
      </div>
    </ModalShell>
  );
}

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
    <div className="relative py-1">
      <button
        type="button"
        aria-label="Insert section"
        onClick={onToggle}
        className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <Plus className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute left-1/2 z-20 mt-1 w-56 -translate-x-1/2 rounded-2xl border border-indigo-100 bg-white p-1.5 shadow-xl">
          {BUILTIN_SECTION_TYPES.filter((t) => t.enabled).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t.kind, t.label)}
              className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-slate-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              {t.label}
            </button>
          ))}
          {customTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick('custom', t.label, t.id)}
              className="flex h-10 w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-slate-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
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
