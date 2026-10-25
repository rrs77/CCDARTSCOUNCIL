import { Check, EyeOff, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  PLANNER_KEY_STAGE_OPTIONS,
  type CurriculumFramework,
  type CurriculumStrand,
  type MergedCurriculumStatement,
  type PersonalCurriculumData,
  type PlannerKeyStageId,
} from '../../types/plannerCurriculum';
import {
  personalAddStatement,
  personalHideStatement,
  personalOverrideStatement,
  personalResetToSchool,
} from '../../utils/planner/mergePlannerCurriculum';
import {
  loadMergedPlannerCurriculum,
  loadMergedPlannerCurriculumAsync,
  loadPersonalPlannerCurriculum,
  savePersonalPlannerCurriculum,
  uid,
  type MergedPlannerCurriculum,
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
 * Shows school statements + the teacher's personal layer (adds / overrides / hides).
 * Edits save only to the personal copy — never the school set.
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
  const [merged, setMerged] = useState<MergedPlannerCurriculum>(() =>
    loadMergedPlannerCurriculum(),
  );
  const [personal, setPersonal] = useState<PersonalCurriculumData>(() =>
    loadPersonalPlannerCurriculum(),
  );
  const [form, setForm] = useState<InlineForm | null>(null);

  const reload = useCallback(() => {
    setMerged(loadMergedPlannerCurriculum());
    setPersonal(loadPersonalPlannerCurriculum());
  }, []);

  useEffect(() => {
    reload();
    void loadMergedPlannerCurriculumAsync().then((remote) => {
      setMerged(remote);
      setPersonal(loadPersonalPlannerCurriculum());
    });
    const onUpdate = () => reload();
    window.addEventListener('ccd:planner-curriculum-updated', onUpdate);
    return () => window.removeEventListener('ccd:planner-curriculum-updated', onUpdate);
  }, [reload]);

  const persistPersonal = useCallback(
    (next: PersonalCurriculumData, message = 'Saved to your copy') => {
      setPersonal(next);
      savePersonalPlannerCurriculum(next);
      setMerged(loadMergedPlannerCurriculum());
      toast.success(message);
    },
    [],
  );

  const frameworks = merged.frameworks;
  const strands = merged.strands;
  const statements = merged.statements;

  const linked = useMemo(
    () => statements.filter((st) => selectedIds.has(st.id)),
    [statements, selectedIds],
  );

  const defaultFrameworkId = frameworks[0]?.id || '';
  const defaultStrandId = strands[0]?.id || '';

  const removePersonalFramework = (fw: CurriculumFramework) => {
    if (!personal.frameworks.some((f) => f.id === fw.id)) {
      toast.error('School frameworks stay in Settings — hide statements instead.');
      return;
    }
    if (!window.confirm(`Remove your framework “${fw.name}” and its strands/statements?`)) return;
    const strandIds = new Set(
      personal.strands.filter((s) => s.frameworkId === fw.id).map((s) => s.id),
    );
    const removedStmtIds = new Set(
      personal.statements.filter((st) => strandIds.has(st.strandId)).map((st) => st.id),
    );
    const next: PersonalCurriculumData = {
      ...personal,
      frameworks: personal.frameworks.filter((f) => f.id !== fw.id),
      strands: personal.strands.filter((s) => s.frameworkId !== fw.id),
      statements: personal.statements.filter((st) => !strandIds.has(st.strandId)),
    };
    onSelectedIdsChange(new Set([...selectedIds].filter((id) => !removedStmtIds.has(id))));
    persistPersonal(next, 'Framework removed from your copy');
  };

  const removePersonalStrand = (strand: CurriculumStrand) => {
    if (!personal.strands.some((s) => s.id === strand.id)) {
      toast.error('School strands stay in Settings — hide statements instead.');
      return;
    }
    if (!window.confirm(`Remove your strand “${strand.name}” and its statements?`)) return;
    const next: PersonalCurriculumData = {
      ...personal,
      strands: personal.strands.filter((s) => s.id !== strand.id),
      statements: personal.statements.filter((st) => st.strandId !== strand.id),
    };
    const removedStmtIds = new Set(
      personal.statements.filter((st) => st.strandId === strand.id).map((st) => st.id),
    );
    onSelectedIdsChange(new Set([...selectedIds].filter((id) => !removedStmtIds.has(id))));
    persistPersonal(next, 'Strand removed from your copy');
  };

  const removeOrHideStatement = (st: MergedCurriculumStatement) => {
    if (st.source === 'school' && !st.overridden) {
      if (!window.confirm('Hide this school statement for yourself? (It stays in the school set.)'))
        return;
      const next = personalHideStatement(personal, st.id);
      if (selectedIds.has(st.id)) {
        const sel = new Set(selectedIds);
        sel.delete(st.id);
        onSelectedIdsChange(sel);
      }
      persistPersonal(next, 'Hidden in your copy');
      return;
    }
    if (st.overridden) {
      if (!window.confirm('Hide this school statement for yourself?')) return;
      const next = personalHideStatement(personal, st.id);
      if (selectedIds.has(st.id)) {
        const sel = new Set(selectedIds);
        sel.delete(st.id);
        onSelectedIdsChange(sel);
      }
      persistPersonal(next, 'Hidden in your copy');
      return;
    }
    // Personal add — delete
    if (!window.confirm('Remove this statement from your copy?')) return;
    const next: PersonalCurriculumData = {
      ...personal,
      statements: personal.statements.filter((s) => s.id !== st.id),
    };
    if (selectedIds.has(st.id)) {
      const sel = new Set(selectedIds);
      sel.delete(st.id);
      onSelectedIdsChange(sel);
    }
    persistPersonal(next, 'Statement removed');
  };

  const resetToSchool = (st: MergedCurriculumStatement) => {
    const next = personalResetToSchool(personal, st.id);
    persistPersonal(next, 'Reset to school wording');
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
        <p className="text-[13px] font-semibold text-slate-500">
          School set plus your private copy — edits stay yours only
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
        <StatementForm
          form={form}
          setForm={setForm}
          frameworks={frameworks}
          strands={strands}
          onSave={(nextPersonal) => {
            persistPersonal(nextPersonal);
            setForm(null);
          }}
          personal={personal}
          statements={statements}
        />
      ) : null}

      <div className="soft-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {statements.length === 0 && frameworks.length === 0 ? (
          <div className="flex min-h-[12rem] flex-col justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 px-4 py-6 text-sm text-amber-950">
            <p className="text-base font-extrabold">Nothing set up yet.</p>
            <p className="mt-2 leading-snug">
              Add your own statements here, or ask an admin to publish the school set in{' '}
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
            </div>
          </div>
        ) : (
          <>
            {frameworks.map((fw) => {
              const fwStrands = strands.filter((s) => s.frameworkId === fw.id);
              const isPersonalFw = personal.frameworks.some((f) => f.id === fw.id);
              return (
                <div key={fw.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/30">
                  <div className="flex items-center gap-1 border-b border-indigo-100/80 px-2.5 py-1.5">
                    <p className="min-w-0 flex-1 truncate text-[13px] font-extrabold text-indigo-800">
                      {fw.name}
                    </p>
                    <SourceBadge source={isPersonalFw ? 'mine' : 'school'} />
                    {isPersonalFw ? (
                      <>
                        <button
                          type="button"
                          className="grid h-9 w-9 place-items-center rounded-lg text-indigo-600 hover:bg-white"
                          aria-label={`Rename ${fw.name}`}
                          onClick={() =>
                            setForm({ kind: 'framework', id: fw.id, name: fw.name })
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="grid h-9 w-9 place-items-center rounded-lg text-rose-600 hover:bg-white"
                          aria-label={`Delete ${fw.name}`}
                          onClick={() => removePersonalFramework(fw)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : null}
                  </div>
                  {fwStrands.length === 0 ? (
                    <p className="px-3 py-2 text-[13px] text-slate-500">No strands yet.</p>
                  ) : (
                    fwStrands.map((strand) => {
                      const strandStmts = statements.filter((st) => st.strandId === strand.id);
                      const isPersonalStrand = personal.strands.some((s) => s.id === strand.id);
                      return (
                        <div key={strand.id} className="border-t border-indigo-50 px-2 py-2">
                          <div className="mb-1 flex items-center gap-1 px-1">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-extrabold uppercase tracking-wide text-indigo-500">
                                {strand.name}
                              </p>
                              <p className="truncate text-[13px] font-semibold text-slate-400">
                                {strand.subjectId} · {strand.keyStage.toUpperCase()}
                              </p>
                            </div>
                            <SourceBadge source={isPersonalStrand ? 'mine' : 'school'} />
                            {isPersonalStrand ? (
                              <>
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
                                  onClick={() => removePersonalStrand(strand)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : null}
                          </div>
                          <ul className="space-y-1">
                            {strandStmts.map((st) => {
                              const checked = selectedIds.has(st.id);
                              return (
                                <li
                                  key={st.id}
                                  className="flex min-h-[44px] items-start gap-1 rounded-xl bg-white px-1.5 py-1"
                                >
                                  <label className="flex min-w-0 flex-1 cursor-pointer gap-2 px-1 py-1.5 text-[13px] text-slate-700">
                                    <input
                                      type="checkbox"
                                      className="mt-0.5"
                                      checked={checked}
                                      onChange={() => toggleStatement(st.id, checked)}
                                    />
                                    <span className="min-w-0">
                                      <SourceBadge
                                        source={st.source}
                                        className="mb-1 inline-flex"
                                      />{' '}
                                      {st.text}
                                    </span>
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
                                  {st.overridden ? (
                                    <button
                                      type="button"
                                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"
                                      aria-label="Reset to school wording"
                                      title="Reset to school"
                                      onClick={() => resetToSchool(st)}
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" />
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                    aria-label={
                                      st.source === 'school' || st.overridden
                                        ? 'Hide statement'
                                        : 'Delete statement'
                                    }
                                    onClick={() => removeOrHideStatement(st)}
                                  >
                                    {st.source === 'school' || st.overridden ? (
                                      <EyeOff className="h-3.5 w-3.5" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </li>
                              );
                            })}
                            {strandStmts.length === 0 ? (
                              <li className="px-2 py-1 text-[13px] text-slate-400">
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
                <p className="mb-2 text-[13px] font-extrabold uppercase tracking-wide text-emerald-800">
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
                            <span className="mb-0.5 block text-[13px] font-bold uppercase tracking-wide text-emerald-700">
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

      <div className="shrink-0 border-t border-indigo-50 px-4 py-2 text-[13px] font-semibold text-slate-400">
        <a href="/settings/curriculum" className="text-indigo-600 underline">
          Open school Curriculum in Settings
        </a>
      </div>
    </div>
  );
}

function SourceBadge({
  source,
  className,
}: {
  source: 'school' | 'mine';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-md px-1.5 py-0.5 text-[13px] font-bold uppercase tracking-wide',
        source === 'school'
          ? 'bg-slate-100 text-slate-600'
          : 'bg-violet-100 text-violet-800',
        className,
      )}
    >
      {source === 'school' ? 'School' : 'Mine'}
    </span>
  );
}

function StatementForm({
  form,
  setForm,
  frameworks,
  strands,
  personal,
  statements,
  onSave,
}: {
  form: InlineForm;
  setForm: (f: InlineForm | null) => void;
  frameworks: CurriculumFramework[];
  strands: CurriculumStrand[];
  personal: PersonalCurriculumData;
  statements: MergedCurriculumStatement[];
  onSave: (next: PersonalCurriculumData) => void;
}) {
  const save = () => {
    if (form.kind === 'framework') {
      const name = form.name.trim() || 'New framework';
      if (form.id) {
        if (!personal.frameworks.some((f) => f.id === form.id)) {
          toast.error('School frameworks are managed in Settings.');
          return;
        }
        onSave({
          ...personal,
          frameworks: personal.frameworks.map((f) =>
            f.id === form.id ? { ...f, name } : f,
          ),
        });
        return;
      }
      onSave({
        ...personal,
        frameworks: [...personal.frameworks, { id: uid('fw'), name }],
      });
      return;
    }

    if (form.kind === 'strand') {
      const fwId = form.frameworkId || frameworks[0]?.id;
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
      if (form.id && !personal.strands.some((s) => s.id === form.id)) {
        toast.error('School strands are managed in Settings.');
        return;
      }
      onSave({
        ...personal,
        strands: form.id
          ? personal.strands.map((s) => (s.id === form.id ? strand : s))
          : [...personal.strands, strand],
      });
      return;
    }

    const strandId = form.strandId || strands[0]?.id;
    if (!strandId) {
      toast.error('Add a strand first');
      return;
    }
    const text = form.text.trim() || 'New statement';
    if (form.id) {
      const existing = statements.find((s) => s.id === form.id);
      if (existing && (existing.source === 'school' || existing.overridden)) {
        onSave(personalOverrideStatement(personal, form.id, text));
        return;
      }
      onSave({
        ...personal,
        statements: personal.statements.map((s) =>
          s.id === form.id ? { ...s, text, strandId } : s,
        ),
      });
      return;
    }
    onSave(
      personalAddStatement(personal, {
        id: uid('stmt'),
        text,
        strandId,
      }),
    );
  };

  return (
    <div className="shrink-0 space-y-2 border-b border-violet-100 bg-violet-50/60 px-4 py-3">
      <p className="text-[13px] font-extrabold uppercase tracking-wide text-violet-800">
        {form.id ? 'Edit' : 'Add'} {form.kind} · saved to your copy
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
        <Button type="button" variant="primary" size="sm" onClick={save}>
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setForm(null)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
