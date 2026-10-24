import {
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
import {
  checkFleshOutAvailable,
  formatDifferentiationHtml,
  formatTeacherQuestionsHtml,
  requestFleshOut,
  type FleshOutOptions,
} from '../../utils/planner/fleshOutApi';
import { keyStageFromYearGroupTag } from '../../utils/libraryHierarchy';
import { AttachInteractiveLesson } from '../../features/interactive-lesson-viewer';
import { LessonAttachmentsPanel } from './LessonAttachmentsPanel';
import {
  Button,
  CloseX,
  Pill,
  Segmented,
  TextInput,
} from './ui';
import { RichHtml } from './RichHtml';
import { CurriculumStatementsPanel } from './CurriculumStatementsPanel';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type ViewTab = 'plan' | 'preview' | 'print';

/** Single default title across header, preview, print, and new drafts. */
export const DEFAULT_LESSON_TITLE = 'New lesson';

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
          title: DEFAULT_LESSON_TITLE,
          learningOutcome: '',
          successCriteria: '',
        };
    setDraft(ensureLessonSections(base));
    setTab('plan');
    setFleshOpen(false);
  }, [open, lessonData]);

  const displayTitle = (draft?.title || '').trim() || DEFAULT_LESSON_TITLE;

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

  const [aiPickedNote, setAiPickedNote] = useState(false);

  const applyFleshOut = async (
    instruction: string,
    scope: 'whole_plan' | { sectionId: string },
    options: FleshOutOptions,
  ) => {
    if (!draft) return;
    const before = {
      sections: structuredClone(sections),
      learningOutcome: draft.learningOutcome,
      successCriteria: draft.successCriteria,
    };

    const curr = loadPlannerCurriculum();
    const ks = (
      keyStageFromYearGroupTag(yearGroup || '') ||
      (curr.strands[0]?.keyStage as string | undefined) ||
      'ks2'
    ).toLowerCase();

    // Only offer Settings statements for this lesson's key stage (and subject when known).
    const allStatements = curr.statements.map((st) => {
      const strand = curr.strands.find((s) => s.id === st.strandId);
      return {
        id: st.id,
        text: st.text,
        strand: strand?.name,
        keyStage: (strand?.keyStage || '').toLowerCase(),
        subject: strand?.subjectId || '',
      };
    });
    const byKeyStage = allStatements.filter((s) => !s.keyStage || s.keyStage === ks);
    const subjectHint =
      byKeyStage.find((s) => s.subject)?.subject ||
      curr.strands.find((s) => s.keyStage === ks)?.subjectId ||
      '';
    const curriculumStatements =
      subjectHint && byKeyStage.some((s) => s.subject === subjectHint)
        ? byKeyStage.filter((s) => !s.subject || s.subject === subjectHint)
        : byKeyStage;

    if (options.autoPickCurriculum && curriculumStatements.length === 0) {
      const msg =
        'No curriculum statements in Settings for this lesson’s key stage. Add frameworks, strands and statements in Settings → Curriculum, then try again.';
      toast.error(msg);
      setLiveMessage(msg);
      throw new Error(msg);
    }

    const activities = sections
      .filter((s) => s.kind === 'activity' && s.activity)
      .map((s) => s.activity!);

    const res = await requestFleshOut({
      instruction,
      lesson: {
        title: draft.title,
        keyStage: ks,
        yearGroup: yearGroup || '',
        subject: subjectHint,
        learningOutcome: draft.learningOutcome,
        successCriteria: draft.successCriteria,
        activities,
        sections,
      },
      curriculumStatements,
      options: {
        ...options,
        wholeLesson: scope === 'whole_plan' ? options.wholeLesson : false,
        sectionId: scope === 'whole_plan' ? undefined : scope.sectionId,
      },
    });

    if (!res.ok) {
      toast.error(res.message);
      setLiveMessage(res.message);
      throw new Error(res.message);
    }

    if (res.offlineDemo) {
      toast('Offline demo applied — start the API server with OPENAI_API_KEY for live AI.', {
        icon: 'ℹ️',
      });
    }

    // Defence in depth: never apply IDs that were not in the Settings list we sent.
    const allowedIds = new Set(curriculumStatements.map((s) => s.id));
    const result = {
      ...res.result,
      selectedStatementIds: (res.result.selectedStatementIds || []).filter((id) =>
        allowedIds.has(id),
      ),
    };
    const pickedByAi = res.pickedByAi && result.selectedStatementIds.length > 0;
    let nextSections = sections.map((s) => ({ ...s }));
    let learningOutcome = draft.learningOutcome || '';
    let successCriteria = draft.successCriteria || '';

    const fillOrReplace = (current: string | undefined, next: string, force: boolean) => {
      if (!next) return current || '';
      if (force || !(current || '').trim()) return next;
      return current || '';
    };

    if (options.includeOutcomes && result.learningOutcome) {
      learningOutcome = fillOrReplace(learningOutcome, result.learningOutcome, false);
    }
    if (options.includeSuccessCriteria && result.successCriteria) {
      successCriteria = fillOrReplace(successCriteria, result.successCriteria, false);
    }

    if (options.includeTeacherQuestions) {
      const html = formatTeacherQuestionsHtml(result.teacherQuestions);
      if (html) {
        const existing = nextSections.find(
          (s) => /question/i.test(s.title) || s.kind === 'afl',
        );
        if (existing) {
          nextSections = nextSections.map((s) =>
            s.id === existing.id
              ? {
                  ...s,
                  bodyHtml: fillOrReplace(s.bodyHtml, html, false),
                  lastWrittenBy: 'ai' as const,
                }
              : s,
          );
        } else {
          nextSections = [
            ...nextSections,
            {
              id: uid('sec'),
              kind: 'afl' as const,
              title: 'Teacher questions',
              bodyHtml: html,
              lastWrittenBy: 'ai' as const,
              createdAt: new Date().toISOString(),
            },
          ];
        }
      }
    }

    if (options.includeDifferentiation) {
      const html = formatDifferentiationHtml(result.differentiation);
      if (html) {
        const existing = nextSections.find((s) => s.kind === 'differentiation');
        if (existing) {
          nextSections = nextSections.map((s) =>
            s.id === existing.id
              ? {
                  ...s,
                  bodyHtml: fillOrReplace(s.bodyHtml, html, false),
                  lastWrittenBy: 'ai' as const,
                }
              : s,
          );
        } else {
          nextSections = [
            ...nextSections,
            {
              id: uid('sec'),
              kind: 'differentiation' as const,
              title: 'Differentiation',
              bodyHtml: html,
              lastWrittenBy: 'ai' as const,
              createdAt: new Date().toISOString(),
            },
          ];
        }
      }
    }

    if (options.wholeLesson && result.wholeLessonSections.length) {
      const byId = new Map(result.wholeLessonSections.map((s) => [s.sectionId, s]));
      nextSections = nextSections.map((s) => {
        const hit = byId.get(s.id);
        if (!hit) return s;
        return {
          ...s,
          title: hit.title || s.title,
          durationMins: hit.durationMins ?? s.durationMins,
          bodyHtml: hit.bodyHtml,
          lastWrittenBy: 'ai' as const,
        };
      });
    } else if (scope !== 'whole_plan' && result.sectionBodies.length) {
      const body = result.sectionBodies[0];
      nextSections = nextSections.map((s) =>
        s.id === body.sectionId
          ? { ...s, bodyHtml: body.bodyHtml, lastWrittenBy: 'ai' as const }
          : s,
      );
    }

    let customObjectives = draft.customObjectives || [];
    if (options.autoPickCurriculum && result.selectedStatementIds.length) {
      customObjectives = [...new Set([...customObjectives, ...result.selectedStatementIds])];
      setAiPickedNote(true);
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
      customObjectives,
      curriculumType: options.autoPickCurriculum ? 'CUSTOM' : draft.curriculumType,
      aiFleshOut: { history, historyIndex: history.length - 1 },
    });
    setLiveMessage(
      pickedByAi
        ? 'Flesh out applied — curriculum statements picked by AI (edit as needed)'
        : 'Flesh out applied — all fields remain editable',
    );
    toast.success('Flesh out applied');
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

  if (!open || !draft) return null;

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
            title={displayTitle}
          >
            Lesson plan — {displayTitle}
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

      {/* Body — Flesh out overlays; curriculum column fills height (not a small card) */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {tab === 'plan' ? (
            <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 sm:p-5 lg:grid-cols-[1.1fr_1fr] lg:items-stretch">
              <div className="soft-scroll min-h-0 overflow-y-auto pr-1">
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

                {lessonNumber && yearGroup ? (
                  <LessonAttachmentsPanel sheet={yearGroup} lessonNumber={lessonNumber} />
                ) : (
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Attachments
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Save this lesson once to upload photos, video, Word or audio.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
                {aiPickedNote ? (
                  <p className="shrink-0 rounded-xl bg-violet-50 px-3 py-2 text-[12px] font-semibold text-violet-800">
                    Picked by AI, edit as needed
                  </p>
                ) : null}
                <CurriculumStatementsPanel
                  className="min-h-0 w-full flex-1"
                  selectedIds={selectedIds}
                  onSelectedIdsChange={(next) => {
                    setAiPickedNote(false);
                    setDraft({
                      ...draft,
                      customObjectives: [...next],
                      curriculumType: 'CUSTOM',
                    });
                  }}
                />
                <div className="soft-scroll max-h-[28%] shrink-0 space-y-2 overflow-y-auto">
                  <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                    <h4 className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                      Learning objective
                    </h4>
                    <TextInput
                      rows={2}
                      aria-label="Learning objective"
                      value={draft.learningOutcome || ''}
                      onChange={(e) =>
                        setDraft({ ...draft, learningOutcome: e.target.value })
                      }
                    />
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                    <h4 className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                      Success criteria
                    </h4>
                    <TextInput
                      rows={2}
                      aria-label="Success criteria"
                      value={draft.successCriteria || ''}
                      onChange={(e) =>
                        setDraft({ ...draft, successCriteria: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'preview' || tab === 'print' ? (
            <div className="soft-scroll min-h-0 flex-1 overflow-y-auto p-6">
              <article
                className="mx-auto max-w-2xl space-y-4"
                data-lesson-plan-print={tab === 'print' ? 'true' : undefined}
              >
                <header>
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
                    {tab === 'print' ? 'Print' : 'Preview'}
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900">
                    {displayTitle}
                  </h3>
                  {draft.learningOutcome ? (
                    <div className="mt-3 rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-900">
                      <RichHtml
                        className="text-sm font-medium text-indigo-900"
                        html={draft.learningOutcome}
                        empty=""
                      />
                    </div>
                  ) : null}
                  {draft.successCriteria ? (
                    <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#5F5B7A]">
                        Success criteria
                      </p>
                      <RichHtml html={draft.successCriteria} empty="" />
                    </div>
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
        </div>

        {/* Overlay drawer — does not shrink sequence / curriculum columns */}
        {fleshOpen ? (
          <aside
            className="absolute inset-y-0 right-0 z-10 flex w-[min(100%,320px)] flex-col border-l border-violet-100 bg-violet-50/95 shadow-xl shadow-violet-900/10 backdrop-blur-sm"
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
              curriculumStatementCount={curriculum.statements.length}
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
  curriculumStatementCount,
}: {
  onApply: (
    instruction: string,
    scope: 'whole_plan' | { sectionId: string },
    options: FleshOutOptions,
  ) => void | Promise<void>;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  sections: LessonSection[];
  curriculumStatementCount: number;
}) {
  const [instruction, setInstruction] = useState('Make it practical and specific to this lesson');
  const [scopeId, setScopeId] = useState<string>('whole_plan');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [offlineDemo, setOfflineDemo] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const [opts, setOpts] = useState<FleshOutOptions>({
    includeOutcomes: true,
    includeSuccessCriteria: true,
    includeTeacherQuestions: true,
    includeDifferentiation: true,
    autoPickCurriculum: false,
    wholeLesson: false,
  });

  useEffect(() => {
    let cancelled = false;
    void checkFleshOutAvailable().then((r) => {
      if (cancelled) return;
      setAvailable(r.available);
      setOfflineDemo(!!r.offlineDemo && !r.live);
      setAvailabilityMessage(r.message || null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (key: keyof FleshOutOptions) => {
    setOpts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const emptyCurriculumBlocked =
    opts.autoPickCurriculum && curriculumStatementCount === 0;

  const run = async () => {
    setError(null);
    if (emptyCurriculumBlocked) {
      setError(
        'No curriculum statements in Settings yet. Add them under Settings → Curriculum, then turn Auto-pick back on.',
      );
      return;
    }
    setBusy(true);
    try {
      await onApply(
        instruction.trim() || 'Flesh out this plan',
        scopeId === 'whole_plan' ? 'whole_plan' : { sectionId: scopeId },
        {
          ...opts,
          wholeLesson: scopeId === 'whole_plan' ? opts.wholeLesson : false,
        },
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Flesh out failed';
      setError(msg);
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const checks: { key: keyof FleshOutOptions; label: string; hint?: string }[] = [
    { key: 'includeOutcomes', label: 'Lesson outcomes' },
    { key: 'includeSuccessCriteria', label: 'Success criteria' },
    { key: 'includeTeacherQuestions', label: 'Teacher questions' },
    { key: 'includeDifferentiation', label: 'Differentiation' },
    {
      key: 'autoPickCurriculum',
      label: 'Auto-pick curriculum statements',
      hint: 'Match this plan to your Settings → Curriculum list (IDs only)',
    },
    {
      key: 'wholeLesson',
      label: 'Flesh out whole lesson (sequenced plan)',
      hint: 'Timings, teacher/pupil actions, transitions, resources, questions — still editable; re-run any section from Scope',
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
      {available === false ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-900"
        >
          {availabilityMessage ||
            'OPENAI_API_KEY is not configured on the server. Flesh out is unavailable.'}
        </div>
      ) : null}
      {available && offlineDemo ? (
        <div
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-950"
        >
          {availabilityMessage ||
            'AI needs the API server running or VITE_API_PROXY_TARGET set. Offline demo mode is active.'}
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-900"
        >
          {error}{' '}
          {/Settings|curriculum/i.test(error) ? (
            <a href="/settings/curriculum" className="underline">
              Open Settings → Curriculum
            </a>
          ) : null}
        </div>
      ) : null}
      {emptyCurriculumBlocked ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-950">
          Auto-pick needs statements in{' '}
          <a href="/settings/curriculum" className="underline">
            Settings → Curriculum
          </a>
          . Add a framework, strand and statement for this key stage first.
        </div>
      ) : null}
      <label className="block space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
          Instruction
        </span>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-violet-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        />
      </label>
      <fieldset className="space-y-1.5">
        <legend className="text-[11px] font-bold uppercase tracking-wide text-violet-700">
          Generate
        </legend>
        {checks.map(({ key, label, hint }) => (
          <label
            key={key}
            className={cn(
              'flex min-h-[40px] cursor-pointer items-start gap-2 rounded-xl bg-white/80 px-2.5 py-2 text-[12px] font-semibold text-violet-950',
              key === 'autoPickCurriculum' && 'ring-1 ring-violet-200',
              key === 'wholeLesson' && scopeId !== 'whole_plan' && 'opacity-40',
            )}
          >
            <input
              type="checkbox"
              className="mt-0.5"
              checked={!!opts[key]}
              disabled={key === 'wholeLesson' && scopeId !== 'whole_plan'}
              onChange={() => toggle(key)}
              data-testid={key === 'autoPickCurriculum' ? 'flesh-out-auto-pick' : undefined}
            />
            <span>
              {label}
              {hint ? (
                <span className="mt-0.5 block text-[10px] font-medium text-violet-600">{hint}</span>
              ) : null}
            </span>
          </label>
        ))}
      </fieldset>
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
              Re-run: {s.title}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={busy || available === false || emptyCurriculumBlocked}
        onClick={() => void run().catch((e) => setError(e?.message || 'Flesh out failed'))}
        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        <Sparkles className="h-4 w-4" />
        {busy ? 'Generating…' : 'Apply'}
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canUndo || busy}
          onClick={onUndo}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-violet-200 text-sm font-semibold text-violet-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          Undo AI
        </button>
        <button
          type="button"
          disabled={!canRedo || busy}
          onClick={onRedo}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-violet-200 text-sm font-semibold text-violet-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          Redo AI
        </button>
      </div>
      <p className="text-[11px] leading-relaxed text-violet-700">
        {offlineDemo
          ? 'Offline demo fills empty fields locally (no OpenAI key in the browser). Start the API server with OPENAI_API_KEY for live AI.'
          : 'Uses the server OPENAI_API_KEY only (never in the browser). Only ticked sections are generated. Empty teacher fields are filled first; re-run a single section from Scope anytime.'}
      </p>
    </div>
  );
}
