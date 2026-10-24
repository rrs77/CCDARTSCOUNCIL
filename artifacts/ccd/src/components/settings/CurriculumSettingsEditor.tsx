import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSettings } from '../../contexts/SettingsContextNew';
import {
  PLANNER_KEY_STAGE_OPTIONS,
  type CurriculumFramework,
  type CurriculumStatement,
  type CurriculumStrand,
  type PlannerCurriculumState,
  type PlannerKeyStageId,
} from '../../types/plannerCurriculum';
import {
  defaultPlannerTerms,
  loadPlannerCurriculum,
  loadPlannerTerms,
  savePlannerCurriculum,
  uid,
} from '../../utils/planner/plannerCurriculumStore';
import { chipStyle, contrastTextOn } from '../../utils/planner/contrastText';
import {
  ModalConfirm,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalShell,
} from '../ccdPlanner/ModalShell';
import { Button, Field, TextField, TextInput } from '../ccdPlanner/ui';
import { useData } from '../../contexts/DataContext';

type Dialog =
  | { kind: 'framework'; id?: string; name: string }
  | {
      kind: 'strand';
      id?: string;
      name: string;
      frameworkId: string;
      subjectId: string;
      keyStage: PlannerKeyStageId;
    }
  | { kind: 'statement'; id?: string; text: string; strandId: string }
  | { kind: 'sectionType'; id?: string; label: string }
  | {
      kind: 'template';
      id?: string;
      name: string;
      keyStageId: PlannerKeyStageId;
      description: string;
    };

/**
 * Settings → Curriculum: user-defined frameworks, strands, statements,
 * custom section types, plan templates, and term dates. Nothing hard-coded
 * for lesson plans.
 */
export function CurriculumSettingsEditor() {
  const { categoryFolders, categories, getCategoryColor } = useSettings();
  const { currentAcademicYear } = useData();
  const [state, setState] = useState<PlannerCurriculumState>(() => {
    const loaded = loadPlannerCurriculum();
    const terms =
      loaded.terms.length > 0
        ? loaded.terms
        : loadPlannerTerms(currentAcademicYear);
    return { ...loaded, terms };
  });
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'framework' | 'strand' | 'statement' | 'sectionType' | 'template';
    id: string;
    label: string;
  } | null>(null);
  const [filterFramework, setFilterFramework] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterKeyStage, setFilterKeyStage] = useState<PlannerKeyStageId | 'all'>('all');

  useEffect(() => {
    const onUpdate = () => {
      const loaded = loadPlannerCurriculum();
      const terms =
        loaded.terms.length > 0
          ? loaded.terms
          : loadPlannerTerms(currentAcademicYear);
      setState({ ...loaded, terms });
    };
    window.addEventListener('ccd:planner-curriculum-updated', onUpdate);
    return () => window.removeEventListener('ccd:planner-curriculum-updated', onUpdate);
  }, [currentAcademicYear]);

  const persist = useCallback((next: PlannerCurriculumState) => {
    setState(next);
    savePlannerCurriculum(next);
    toast.success('Curriculum saved');
  }, []);

  const updateTerm = (
    id: string,
    patch: Partial<{ name: string; start: string; end: string }>,
  ) => {
    const terms = (state.terms.length > 0
      ? state.terms
      : defaultPlannerTerms(currentAcademicYear)
    ).map((t) => (t.id === id ? { ...t, ...patch } : t));
    persist({ ...state, terms });
  };

  const resetTermDefaults = () => {
    persist({ ...state, terms: defaultPlannerTerms(currentAcademicYear) });
  };

  const subjects = useMemo(() => {
    const fromFolders = (categoryFolders || []).map((f) => ({
      id: f.id || f.name,
      name: f.name,
      color: f.color || getCategoryColor?.(f.name) || '#6366F1',
    }));
    if (fromFolders.length > 0) return fromFolders;
    const groups = new Set(
      (categories || [])
        .filter((c) => !c.hidden)
        .flatMap((c) => [c.group, ...(c.groups || [])].filter(Boolean) as string[]),
    );
    return [...groups].map((name) => ({
      id: name,
      name,
      color: getCategoryColor?.(name) || '#6366F1',
    }));
  }, [categoryFolders, categories, getCategoryColor]);

  const filteredStrands = state.strands.filter((s) => {
    if (filterFramework !== 'all' && s.frameworkId !== filterFramework) return false;
    if (filterSubject !== 'all' && s.subjectId !== filterSubject) return false;
    if (filterKeyStage !== 'all' && s.keyStage !== filterKeyStage) return false;
    return true;
  });

  const saveDialog = () => {
    if (!dialog) return;
    const next = { ...state };
    if (dialog.kind === 'framework') {
      if (dialog.id) {
        next.frameworks = next.frameworks.map((f) =>
          f.id === dialog.id ? { ...f, name: dialog.name.trim() || 'Untitled' } : f,
        );
      } else {
        next.frameworks = [
          ...next.frameworks,
          { id: uid('fw'), name: dialog.name.trim() || 'New framework' },
        ];
      }
    } else if (dialog.kind === 'strand') {
      const strand: CurriculumStrand = {
        id: dialog.id || uid('strand'),
        name: dialog.name.trim() || 'New strand',
        frameworkId: dialog.frameworkId,
        subjectId: dialog.subjectId,
        keyStage: dialog.keyStage,
      };
      if (dialog.id) {
        next.strands = next.strands.map((s) => (s.id === dialog.id ? strand : s));
      } else {
        next.strands = [...next.strands, strand];
      }
    } else if (dialog.kind === 'statement') {
      const statement: CurriculumStatement = {
        id: dialog.id || uid('stmt'),
        text: dialog.text.trim() || 'New statement',
        strandId: dialog.strandId,
      };
      if (dialog.id) {
        next.statements = next.statements.map((s) => (s.id === dialog.id ? statement : s));
      } else {
        next.statements = [...next.statements, statement];
      }
    } else if (dialog.kind === 'sectionType') {
      if (dialog.id) {
        next.sectionTypes = next.sectionTypes.map((t) =>
          t.id === dialog.id ? { ...t, label: dialog.label.trim() || t.label } : t,
        );
      } else {
        next.sectionTypes = [
          ...next.sectionTypes,
          { id: uid('stype'), label: dialog.label.trim() || 'Custom section', enabled: true },
        ];
      }
    } else if (dialog.kind === 'template') {
      const tpl = {
        id: dialog.id || uid('tpl'),
        name: dialog.name.trim() || 'Template',
        keyStageId: dialog.keyStageId,
        description: dialog.description,
        defaultSectionBlueprints: dialog.id
          ? next.planTemplates.find((t) => t.id === dialog.id)?.defaultSectionBlueprints || []
          : [
              { kind: 'free_text', title: 'Introduction' },
              { kind: 'vocabulary', title: 'Vocabulary' },
              { kind: 'afl', title: 'Assessment for learning' },
            ],
      };
      if (dialog.id) {
        next.planTemplates = next.planTemplates.map((t) => (t.id === dialog.id ? { ...t, ...tpl } : t));
      } else {
        next.planTemplates = [...next.planTemplates, tpl];
      }
    }
    persist(next);
    setDialog(null);
  };

  const runDelete = () => {
    if (!deleteConfirm) return;
    const next = { ...state };
    const { type, id } = deleteConfirm;
    if (type === 'framework') {
      const strandIds = new Set(next.strands.filter((s) => s.frameworkId === id).map((s) => s.id));
      next.frameworks = next.frameworks.filter((f) => f.id !== id);
      next.strands = next.strands.filter((s) => s.frameworkId !== id);
      next.statements = next.statements.filter((st) => !strandIds.has(st.strandId));
    } else if (type === 'strand') {
      next.strands = next.strands.filter((s) => s.id !== id);
      next.statements = next.statements.filter((st) => st.strandId !== id);
    } else if (type === 'statement') {
      next.statements = next.statements.filter((st) => st.id !== id);
    } else if (type === 'sectionType') {
      next.sectionTypes = next.sectionTypes.filter((t) => t.id !== id);
    } else if (type === 'template') {
      next.planTemplates = next.planTemplates.filter((t) => t.id !== id);
    }
    persist(next);
    setDeleteConfirm(null);
  };

  const dialogTitle =
    dialog?.kind === 'framework'
      ? dialog.id
        ? 'Rename framework'
        : 'Add framework'
      : dialog?.kind === 'strand'
        ? dialog.id
          ? 'Edit strand'
          : 'Add strand'
        : dialog?.kind === 'statement'
          ? dialog.id
            ? 'Edit statement'
            : 'Add statement'
          : dialog?.kind === 'sectionType'
            ? dialog.id
              ? 'Rename section type'
              : 'Add section type'
            : dialog?.kind === 'template'
              ? dialog.id
                ? 'Edit plan template'
                : 'Add plan template'
              : '';

  return (
    <div className="space-y-6" data-testid="curriculum-settings-editor">
      <p className="text-sm text-[#5C5878]">
        Frameworks, strands and statements you add here are the only curriculum checklist
        shown in lesson plans. Colours apply to chips, stripes and borders — text keeps
        readable contrast.
      </p>

      <section className="overflow-visible rounded-2xl border border-[#E2E0EF] bg-white p-4 shadow-sm">
        <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-[#1F1B4D]">Term / half-term dates</h3>
            <p className="mt-1 text-[13px] text-[#5F5B7A]">
              Year overview columns and My units use these dates
              {currentAcademicYear ? ` · ${currentAcademicYear}` : ''} · UK dd/mm/yyyy.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={resetTermDefaults}>
            Reset to defaults
          </Button>
        </div>
        <ul className="mt-3 space-y-2 overflow-visible">
          {(state.terms.length > 0
            ? state.terms
            : defaultPlannerTerms(currentAcademicYear)
          ).map((t) => (
            <li
              key={t.id}
              className="grid grid-cols-1 gap-2 rounded-2xl bg-slate-50 p-2 sm:grid-cols-[1.2fr_1fr_1fr]"
            >
              <Field label="Name">
                <TextField
                  value={t.name}
                  onChange={(e) => updateTerm(t.id, { name: e.target.value })}
                  aria-label={`Name for term ${t.id}`}
                />
              </Field>
              <Field label="Start">
                <TextField
                  type="date"
                  value={t.start}
                  onChange={(e) => updateTerm(t.id, { start: e.target.value })}
                  aria-label={`Start date for ${t.name}`}
                />
              </Field>
              <Field label="End">
                <TextField
                  type="date"
                  value={t.end}
                  onChange={(e) => updateTerm(t.id, { end: e.target.value })}
                  aria-label={`End date for ${t.name}`}
                />
              </Field>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[#E2E0EF] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-[#1F1B4D]">Frameworks</h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setDialog({ kind: 'framework', name: '' })}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        {state.frameworks.length === 0 ? (
          <p className="text-sm text-slate-400">No frameworks yet.</p>
        ) : (
          <ul className="space-y-2">
            {state.frameworks.map((fw: CurriculumFramework) => (
              <li
                key={fw.id}
                className="flex min-h-[44px] items-center justify-between gap-2 rounded-xl border border-slate-100 px-3"
              >
                <button
                  type="button"
                  className="text-left text-sm font-semibold text-slate-800 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  onClick={() => setDialog({ kind: 'framework', id: fw.id, name: fw.name })}
                >
                  {fw.name}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${fw.name}`}
                  onClick={() =>
                    setDeleteConfirm({ type: 'framework', id: fw.id, label: fw.name })
                  }
                  className="inline-flex h-11 w-11 items-center justify-center text-rose-500 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[#E2E0EF] bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-[#1F1B4D]">Strands & statements</h3>
          <Button
            variant="primary"
            size="sm"
            disabled={state.frameworks.length === 0 || subjects.length === 0}
            onClick={() =>
              setDialog({
                kind: 'strand',
                name: '',
                frameworkId: state.frameworks[0]?.id || '',
                subjectId: subjects[0]?.id || '',
                keyStage: 'ks2',
              })
            }
          >
            <Plus className="h-4 w-4" />
            Add strand
          </Button>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          <select
            value={filterFramework}
            onChange={(e) => setFilterFramework(e.target.value)}
            className="h-11 rounded-xl border border-indigo-100 px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <option value="all">All frameworks</option>
            {state.frameworks.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="h-11 rounded-xl border border-indigo-100 px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <option value="all">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={filterKeyStage}
            onChange={(e) =>
              setFilterKeyStage(e.target.value as PlannerKeyStageId | 'all')
            }
            className="h-11 rounded-xl border border-indigo-100 px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <option value="all">All key stages</option>
            {PLANNER_KEY_STAGE_OPTIONS.map((ks) => (
              <option key={ks.id} value={ks.id}>
                {ks.label}
              </option>
            ))}
          </select>
        </div>
        {filteredStrands.length === 0 ? (
          <p className="text-sm text-slate-400">
            {state.frameworks.length === 0
              ? 'Add a framework first, then strands by subject and key stage.'
              : 'No strands match these filters.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredStrands.map((strand) => {
              const subject = subjects.find((s) => s.id === strand.subjectId);
              const fw = state.frameworks.find((f) => f.id === strand.frameworkId);
              const statements = state.statements.filter((st) => st.strandId === strand.id);
              const color = subject?.color || '#6366F1';
              return (
                <li key={strand.id} className="overflow-hidden rounded-2xl border border-slate-100">
                  <div className="h-1.5" style={{ backgroundColor: color }} aria-hidden />
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDialog({
                          kind: 'strand',
                          id: strand.id,
                          name: strand.name,
                          frameworkId: strand.frameworkId,
                          subjectId: strand.subjectId,
                          keyStage: strand.keyStage,
                        })
                      }
                      className="text-sm font-extrabold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      {strand.name}
                    </button>
                    <span
                      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                      style={chipStyle(color)}
                    >
                      {subject?.name || strand.subjectId}
                    </span>
                    <span className="text-[10px] font-semibold uppercase text-slate-400">
                      {strand.keyStage} · {fw?.name}
                    </span>
                    <button
                      type="button"
                      aria-label={`Delete strand ${strand.name}`}
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'strand',
                          id: strand.id,
                          label: strand.name,
                        })
                      }
                      className="ml-auto inline-flex h-11 w-11 items-center justify-center text-rose-500 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <ul className="space-y-1 border-t border-slate-50 px-2 py-2">
                    {statements.map((st) => (
                      <li key={st.id} className="flex items-start gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50">
                        <button
                          type="button"
                          onClick={() =>
                            setDialog({
                              kind: 'statement',
                              id: st.id,
                              text: st.text,
                              strandId: st.strandId,
                            })
                          }
                          className="min-w-0 flex-1 text-left text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                          {st.text}
                        </button>
                        <button
                          type="button"
                          aria-label="Delete statement"
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'statement',
                              id: st.id,
                              label: st.text.slice(0, 40),
                            })
                          }
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        type="button"
                        onClick={() =>
                          setDialog({ kind: 'statement', text: '', strandId: strand.id })
                        }
                        className="inline-flex h-11 items-center gap-1 px-2 text-xs font-bold text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add statement
                      </button>
                    </li>
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[#E2E0EF] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[#1F1B4D]">Custom section types</h3>
          <button
            type="button"
            onClick={() => setDialog({ kind: 'sectionType', label: '' })}
            className="inline-flex h-11 items-center gap-1 rounded-full bg-indigo-50 px-3 text-xs font-bold text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        <p className="mb-2 text-xs text-slate-500">
          Built-ins (free text, differentiation, vocabulary, AfL, homework) are always available — no health &amp; safety.
        </p>
        <ul className="space-y-1">
          {state.sectionTypes.map((t) => (
            <li key={t.id} className="flex min-h-[44px] items-center justify-between rounded-xl px-2 hover:bg-slate-50">
              <span className="text-sm font-semibold text-slate-800">{t.label}</span>
              <button
                type="button"
                aria-label={`Delete ${t.label}`}
                onClick={() =>
                  setDeleteConfirm({ type: 'sectionType', id: t.id, label: t.label })
                }
                className="inline-flex h-11 w-11 items-center justify-center text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[#E2E0EF] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[#1F1B4D]">Plan templates</h3>
          <button
            type="button"
            onClick={() =>
              setDialog({
                kind: 'template',
                name: '',
                keyStageId: 'ks2',
                description: '',
              })
            }
            className="inline-flex h-11 items-center gap-1 rounded-full bg-indigo-50 px-3 text-xs font-bold text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        <ul className="space-y-2">
          {state.planTemplates.map((t) => (
            <li
              key={t.id}
              className="flex min-h-[44px] items-center justify-between gap-2 rounded-xl border border-slate-100 px-3"
            >
              <div>
                <p className="text-sm font-bold text-slate-800">{t.name}</p>
                <p className="text-[11px] text-slate-400">
                  {String(t.keyStageId).toUpperCase()} · {t.defaultSectionBlueprints.length} sections
                </p>
              </div>
              <button
                type="button"
                aria-label={`Delete template ${t.name}`}
                onClick={() =>
                  setDeleteConfirm({ type: 'template', id: t.id, label: t.name })
                }
                className="inline-flex h-11 w-11 items-center justify-center text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[#E2E0EF] bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-extrabold text-[#1F1B4D]">Colour contrast check</h3>
        <div className="flex flex-wrap gap-2">
          {subjects.slice(0, 8).map((s) => (
            <span
              key={s.id}
              className="inline-flex h-11 items-center rounded-full border px-3 text-xs font-bold"
              style={{
                ...chipStyle(s.color),
                // Demonstrate readable text on a solid chip stripe
                boxShadow: `inset 0 -3px 0 ${s.color}`,
              }}
              title={`Text on solid ${s.color}: ${contrastTextOn(s.color)}`}
            >
              {s.name}
            </span>
          ))}
        </div>
      </section>

      <ModalShell
        open={!!dialog}
        onClose={() => setDialog(null)}
        labelledBy="curriculum-dialog-title"
      >
        <ModalHeader
          title={dialogTitle}
          onClose={() => setDialog(null)}
          titleId="curriculum-dialog-title"
        />
        <ModalBody>
          {dialog?.kind === 'framework' || dialog?.kind === 'sectionType' ? (
            <Field label="Name">
              <TextField
                value={dialog.kind === 'framework' ? dialog.name : dialog.label}
                onChange={(e) =>
                  setDialog(
                    dialog.kind === 'framework'
                      ? { ...dialog, name: e.target.value }
                      : { ...dialog, label: e.target.value },
                  )
                }
              />
            </Field>
          ) : null}
          {dialog?.kind === 'strand' ? (
            <div className="space-y-3">
              <Field label="Name">
                <TextField
                  value={dialog.name}
                  onChange={(e) => setDialog({ ...dialog, name: e.target.value })}
                />
              </Field>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Framework</span>
                <select
                  value={dialog.frameworkId}
                  onChange={(e) => setDialog({ ...dialog, frameworkId: e.target.value })}
                  className="h-11 w-full rounded-2xl border border-indigo-100 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  {state.frameworks.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Subject</span>
                <select
                  value={dialog.subjectId}
                  onChange={(e) => setDialog({ ...dialog, subjectId: e.target.value })}
                  className="h-11 w-full rounded-2xl border border-indigo-100 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Key stage</span>
                <select
                  value={dialog.keyStage}
                  onChange={(e) =>
                    setDialog({
                      ...dialog,
                      keyStage: e.target.value as PlannerKeyStageId,
                    })
                  }
                  className="h-11 w-full rounded-2xl border border-indigo-100 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  {PLANNER_KEY_STAGE_OPTIONS.map((ks) => (
                    <option key={ks.id} value={ks.id}>
                      {ks.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          {dialog?.kind === 'statement' ? (
            <Field label="Statement">
              <TextInput
                value={dialog.text}
                onChange={(e) => setDialog({ ...dialog, text: e.target.value })}
                rows={5}
              />
            </Field>
          ) : null}
          {dialog?.kind === 'template' ? (
            <div className="space-y-3">
              <Field label="Name">
                <TextField
                  value={dialog.name}
                  onChange={(e) => setDialog({ ...dialog, name: e.target.value })}
                />
              </Field>
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase text-slate-500">Key stage</span>
                <select
                  value={dialog.keyStageId}
                  onChange={(e) =>
                    setDialog({
                      ...dialog,
                      keyStageId: e.target.value as PlannerKeyStageId,
                    })
                  }
                  className="h-11 w-full rounded-2xl border border-indigo-100 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  {PLANNER_KEY_STAGE_OPTIONS.map((ks) => (
                    <option key={ks.id} value={ks.id}>
                      {ks.label}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Description">
                <TextField
                  value={dialog.description}
                  onChange={(e) => setDialog({ ...dialog, description: e.target.value })}
                />
              </Field>
            </div>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setDialog(null)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={saveDialog}>
            Save
          </Button>
        </ModalFooter>
      </ModalShell>

      <ModalConfirm
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={runDelete}
        title="Delete?"
        message={`Delete “${deleteConfirm?.label || ''}”? This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
