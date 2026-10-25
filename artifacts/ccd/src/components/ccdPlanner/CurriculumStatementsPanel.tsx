import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  PLANNER_KEY_STAGE_OPTIONS,
  type CurriculumFramework,
  type CurriculumStatement,
  type CurriculumStrand,
  type PlannerCurriculumState,
  type PlannerKeyStageId,
} from '../../types/plannerCurriculum';
import {
  loadPlannerCurriculum,
  savePlannerCurriculum,
  uid,
} from '../../utils/planner/plannerCurriculumStore';
import { Button } from './ui';
import { cn } from '@/lib/utils';

type InlineForm =
  | { kind: 'framework'; id?: string; name: string }
  | {
      kind: 'strand';
      id?: string;
      name: string;
      frameworkId: string;
      subjectId: string;
      keyStage: PlannerKeyStageId;
    }
  | { kind: 'statement'; id?: string; text: string; strandId: string };

/**
 * Full-height curriculum column for the inline lesson plan.
 * CRUD on frameworks / strands / statements writes the same Settings store;
 * checkboxes still pick which statements apply to this lesson.
 */
export function CurriculumStatementsPanel({
  selectedIds,
  onSelectedIdsChange,
  className,
}: {
  selectedIds: Set<string>;
  onSelectedIdsChange: (next: Set<string>) => void;
  className?: string;
}) {
  const [state, setState] = useState<PlannerCurriculumState>(() => loadPlannerCurriculum());
  const [form, setForm] = useState<InlineForm | null>(null);

  const reload = useCallback(() => setState(loadPlannerCurriculum()), []);

  useEffect(() => {
    reload();
    const onUpdate = () => reload();
    window.addEventListener('ccd:planner-curriculum-updated', onUpdate);
    return () => window.removeEventListener('ccd:planner-curriculum-updated', onUpdate);
  }, [reload]);

  const persist = useCallback((next: PlannerCurriculumState, message = 'Curriculum saved') => {
    setState(next);
    savePlannerCurriculum(next);
    toast.success(message);
  }, []);

  const frameworks = state.frameworks;
  const strands = state.strands;
  const statements = state.statements;

  const linked = useMemo(
    () => statements.filter((st) => selectedIds.has(st.id)),
    [statements, selectedIds],
  );

  const defaultFrameworkId = frameworks[0]?.id || '';
  const defaultStrandId = strands[0]?.id || '';

  const saveForm = () => {
    if (!form) return;
    const next = { ...state };
    if (form.kind === 'framework') {
      const name = form.name.trim() || 'New framework';
      if (form.id) {
        next.frameworks = next.frameworks.map((f) =>
          f.id === form.id ? { ...f, name } : f,
        );
      } else {
        next.frameworks = [...next.frameworks, { id: uid('fw'), name }];
      }
    } else if (form.kind === 'strand') {
      const fwId = form.frameworkId || next.frameworks[0]?.id;
      if (!fwId) {
        toast.error('Add a framework first');
        return;
      }
      const strand: CurriculumStrand = {
        id: form.id || uid('strand'),
        name: form.name.trim() || 'New strand',
        frameworkId: fwId,
        subjectId: form.subjectId.trim() || 'General',
        keyStage: form.keyStage,
      };
      if (form.id) {
        next.strands = next.strands.map((s) => (s.id === form.id ? strand : s));
      } else {
        next.strands = [...next.strands, strand];
      }
    } else {
      const strandId = form.strandId || next.strands[0]?.id;
      if (!strandId) {
        toast.error('Add a strand first');
        return;
      }
      const statement: CurriculumStatement = {
        id: form.id || uid('stmt'),
        text: form.text.trim() || 'New statement',
        strandId,
      };
      if (form.id) {
        next.statements = next.statements.map((s) => (s.id === form.id ? statement : s));
      } else {
        next.statements = [...next.statements, statement];
      }
    }
    persist(next);
    setForm(null);
  };

  const removeFramework = (fw: CurriculumFramework) => {
    if (!window.confirm(`Remove framework “${fw.name}” and its strands/statements?`)) return;
    const strandIds = new Set(state.strands.filter((s) => s.frameworkId === fw.id).map((s) => s.id));
    const next: PlannerCurriculumState = {
      ...state,
      frameworks: state.frameworks.filter((f) => f.id !== fw.id),
      strands: state.strands.filter((s) => s.frameworkId !== fw.id),
      statements: state.statements.filter((st) => !strandIds.has(st.strandId)),
    };
    const pruned = new Set([...selectedIds].filter((id) => !strandIds.has(
      state.statements.find((st) => st.id === id)?.strandId || '',
    ) && next.statements.some((st) => st.id === id)));
    onSelectedIdsChange(pruned);
    persist(next, 'Framework removed');
  };

  const removeStrand = (strand: CurriculumStrand) => {
    if (!window.confirm(`Remove strand “${strand.name}” and its statements?`)) return;
    const next: PlannerCurriculumState = {
      ...state,
      strands: state.strands.filter((s) => s.id !== strand.id),
      statements: state.statements.filter((st) => st.strandId !== strand.id),
    };
    const removedStmtIds = new Set(
      state.statements.filter((st) => st.strandId === strand.id).map((st) => st.id),
    );
    onSelectedIdsChange(new Set([...selectedIds].filter((id) => !removedStmtIds.has(id))));
    persist(next, 'Strand removed');
  };

  const removeStatement = (st: CurriculumStatement) => {
    if (!window.confirm('Remove this statement?')) return;
    const next: PlannerCurriculumState = {
      ...state,
      statements: state.statements.filter((s) => s.id !== st.id),
    };
    if (selectedIds.has(st.id)) {
      const sel = new Set(selectedIds);
      sel.delete(st.id);
      onSelectedIdsChange(sel);
    }
    persist(next, 'Statement removed');
  };

  const toggleStatement = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.delete(id);
    else next.add(id);
    onSelectedIdsChange(next);
  };

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[1.25rem] border border-indigo-100 bg-white',
        className,
      )}
      data-testid="curriculum-statements-panel"
    >
      <div className="shrink-0 border-b border-indigo-50 px-4 py-3">
        <h4 className="text-sm font-extrabold text-slate-800">Curriculum statements</h4>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Edit here or in Settings · tick to apply to this lesson
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={() => setForm({ kind: 'framework', name: '' })}
          >
            <Plus className="h-3.5 w-3.5" />
            Framework
          </Button>
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={() =>
              setForm({
                kind: 'strand',
                name: '',
                frameworkId: defaultFrameworkId,
                subjectId: 'General',
                keyStage: 'ks2',
              })
            }
            disabled={frameworks.length === 0}
          >
            <Plus className="h-3.5 w-3.5" />
            Strand
          </Button>
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={() =>
              setForm({ kind: 'statement', text: '', strandId: defaultStrandId })
            }
            disabled={strands.length === 0}
          >
            <Plus className="h-3.5 w-3.5" />
            Statement / objective
          </Button>
        </div>
      </div>

      {form ? (
        <div className="shrink-0 space-y-2 border-b border-violet-100 bg-violet-50/60 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-wide text-violet-800">
            {form.id ? 'Edit' : 'Add'} {form.kind}
          </p>
          {form.kind === 'framework' ? (
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Framework name"
              className="h-10 w-full rounded-xl border border-violet-200 bg-white px-3 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            />
          ) : null}
          {form.kind === 'strand' ? (
            <div className="space-y-2">
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Strand name"
                className="h-10 w-full rounded-xl border border-violet-200 bg-white px-3 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              />
              <select
                value={form.frameworkId}
                onChange={(e) => setForm({ ...form, frameworkId: e.target.value })}
                className="h-10 w-full rounded-xl border border-violet-200 bg-white px-3 text-sm font-semibold"
              >
                {frameworks.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                  placeholder="Subject"
                  className="h-10 min-w-0 flex-1 rounded-xl border border-violet-200 bg-white px-3 text-sm font-semibold"
                />
                <select
                  value={form.keyStage}
                  onChange={(e) =>
                    setForm({ ...form, keyStage: e.target.value as PlannerKeyStageId })
                  }
                  className="h-10 rounded-xl border border-violet-200 bg-white px-2 text-sm font-semibold"
                >
                  {PLANNER_KEY_STAGE_OPTIONS.map((ks) => (
                    <option key={ks.id} value={ks.id}>
                      {ks.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
          {form.kind === 'statement' ? (
            <div className="space-y-2">
              <select
                value={form.strandId}
                onChange={(e) => setForm({ ...form, strandId: e.target.value })}
                className="h-10 w-full rounded-xl border border-violet-200 bg-white px-3 text-sm font-semibold"
              >
                {strands.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <textarea
                autoFocus
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                rows={3}
                placeholder="Statement / objective text"
                className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              />
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" variant="primary" size="sm" onClick={saveForm}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setForm(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="soft-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {statements.length === 0 && frameworks.length === 0 ? (
          <div className="flex min-h-[12rem] flex-col justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 px-4 py-6 text-sm text-amber-950">
            <p className="text-base font-extrabold">Nothing set up yet.</p>
            <p className="mt-2 leading-snug">
              Add frameworks, strands and statements (objectives) right here — they sync with{' '}
              <a href="/settings/curriculum" className="font-bold underline">
                Settings → Curriculum
              </a>
              .
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setForm({ kind: 'framework', name: '' })}
              >
                <Plus className="h-3.5 w-3.5" />
                Add framework
              </Button>
              <a
                href="/settings/curriculum"
                className="inline-flex h-9 items-center rounded-full border border-amber-300 bg-white px-3 text-[12px] font-bold text-amber-950 hover:bg-amber-50"
              >
                Open Settings
              </a>
            </div>
          </div>
        ) : (
          <>
            {frameworks.map((fw) => {
              const fwStrands = strands.filter((s) => s.frameworkId === fw.id);
              return (
                <div key={fw.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/30">
                  <div className="flex items-center gap-1 border-b border-indigo-100/80 px-2.5 py-1.5">
                    <p className="min-w-0 flex-1 truncate text-[12px] font-extrabold text-indigo-800">
                      {fw.name}
                    </p>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-lg text-indigo-600 hover:bg-white"
                      aria-label={`Rename ${fw.name}`}
                      onClick={() => setForm({ kind: 'framework', id: fw.id, name: fw.name })}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-lg text-rose-600 hover:bg-white"
                      aria-label={`Delete ${fw.name}`}
                      onClick={() => removeFramework(fw)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {fwStrands.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-500">No strands yet.</p>
                  ) : (
                    fwStrands.map((strand) => {
                      const strandStmts = statements.filter((st) => st.strandId === strand.id);
                      return (
                        <div key={strand.id} className="border-t border-indigo-50 px-2 py-2">
                          <div className="mb-1 flex items-center gap-1 px-1">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] font-extrabold uppercase tracking-wide text-indigo-500">
                                {strand.name}
                              </p>
                              <p className="truncate text-[10px] font-semibold text-slate-400">
                                {strand.subjectId} · {strand.keyStage.toUpperCase()}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="grid h-9 w-9 place-items-center rounded-lg text-indigo-600 hover:bg-white"
                              aria-label={`Edit ${strand.name}`}
                              onClick={() =>
                                setForm({
                                  kind: 'strand',
                                  id: strand.id,
                                  name: strand.name,
                                  frameworkId: strand.frameworkId,
                                  subjectId: strand.subjectId,
                                  keyStage: strand.keyStage,
                                })
                              }
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="grid h-9 w-9 place-items-center rounded-lg text-rose-600 hover:bg-white"
                              aria-label={`Delete ${strand.name}`}
                              onClick={() => removeStrand(strand)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <ul className="space-y-1">
                            {strandStmts.map((st) => {
                              const checked = selectedIds.has(st.id);
                              return (
                                <li
                                  key={st.id}
                                  className="flex min-h-[44px] items-start gap-1 rounded-xl bg-white px-1.5 py-1"
                                >
                                  <label className="flex min-w-0 flex-1 cursor-pointer gap-2 px-1 py-1.5 text-xs text-slate-700">
                                    <input
                                      type="checkbox"
                                      className="mt-0.5"
                                      checked={checked}
                                      onChange={() => toggleStatement(st.id, checked)}
                                    />
                                    <span className="min-w-0">{st.text}</span>
                                  </label>
                                  <button
                                    type="button"
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-indigo-600"
                                    aria-label="Edit statement"
                                    onClick={() =>
                                      setForm({
                                        kind: 'statement',
                                        id: st.id,
                                        text: st.text,
                                        strandId: st.strandId,
                                      })
                                    }
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                    aria-label="Delete statement"
                                    onClick={() => removeStatement(st)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </li>
                              );
                            })}
                            {strandStmts.length === 0 ? (
                              <li className="px-2 py-1 text-[11px] text-slate-400">
                                No statements — add one above.
                              </li>
                            ) : null}
                          </ul>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}

            {linked.length > 0 ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-emerald-800">
                  Applied to this lesson
                </p>
                <ul className="space-y-1.5">
                  {linked.map((c) => {
                    const strand = strands.find((s) => s.id === c.strandId);
                    return (
                      <li key={c.id} className="flex gap-2 text-sm text-slate-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                          {strand ? (
                            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                              {strand.name}
                            </span>
                          ) : null}
                          {c.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : statements.length > 0 ? (
              <p className="text-sm text-slate-400">
                No statements linked yet — tick statements above.
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-indigo-50 px-4 py-2 text-[11px] font-semibold text-slate-400">
        <a href="/settings/curriculum" className="text-indigo-600 underline">
          Open full Curriculum in Settings
        </a>
      </div>
    </div>
  );
}
