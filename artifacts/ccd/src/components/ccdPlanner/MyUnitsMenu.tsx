import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useData, type Unit } from '../../contexts/DataContext';
import {
  loadPlannerTerms,
} from '../../utils/planner/plannerCurriculumStore';
import type { PlannerTermDates } from '../../types/plannerCurriculum';
import { chipStyle } from '../../utils/planner/contrastText';
import { formatUkDateRangeShort } from '../../utils/planner/ukDate';
import { PlannerPopover } from './PlannerPopover';
import { ModalConfirm, ModalPrompt } from './ModalShell';
import { cn } from '@/lib/utils';

function formatTermHint(term: PlannerTermDates): string {
  return formatUkDateRangeShort(term.start, term.end);
}

type UnitDialog =
  | { kind: 'create' }
  | { kind: 'rename'; unit: Unit }
  | { kind: 'delete'; unit: Unit }
  | null;

export function MyUnitsMenu({
  open,
  onOpenChange,
  activeLessonNumber,
  onSelectLesson,
  onYearOverview,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeLessonNumber?: string;
  onSelectLesson: (lessonNumber: string) => void;
  onYearOverview: () => void;
}) {
  const {
    units,
    updateUnit,
    deleteUnit: deleteUnitFromContext,
    allLessonsData,
    currentSheetInfo,
    currentAcademicYear,
  } = useData();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [liveMessage, setLiveMessage] = useState('');
  const [termsTick, setTermsTick] = useState(0);
  const [dialog, setDialog] = useState<UnitDialog>(null);

  const terms = useMemo(
    () => loadPlannerTerms(currentAcademicYear),
    [currentAcademicYear, termsTick, open],
  );

  useEffect(() => {
    const onUpdate = () => setTermsTick((n) => n + 1);
    window.addEventListener('ccd:planner-curriculum-updated', onUpdate);
    return () => window.removeEventListener('ccd:planner-curriculum-updated', onUpdate);
  }, []);

  const createUnit = (name: string) => {
    const trimmed = name.trim() || 'New unit';
    const unit: Unit = {
      id: `unit-${Date.now()}`,
      name: trimmed,
      description: '',
      lessonNumbers: [],
      color: '#4338E8',
      term: terms[0]?.id || '',
      classSheet: currentSheetInfo?.sheet,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    updateUnit(unit);
    setExpanded((p) => ({ ...p, [unit.id]: true }));
    setLiveMessage(`Created ${trimmed}`);
    toast.success(`Created “${trimmed}”`, { duration: 3000, position: 'top-center' });
  };

  const renameUnit = (unit: Unit, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === unit.name) return;
    updateUnit({ ...unit, name: trimmed, updatedAt: new Date() });
    setLiveMessage(`Renamed to ${trimmed}`);
    toast.success(`Renamed to “${trimmed}”`, { position: 'top-center' });
  };

  const removeUnit = (unit: Unit) => {
    deleteUnitFromContext(unit.id);
    setLiveMessage(`Deleted ${unit.name}`);
    toast.success(`Deleted “${unit.name}”`, { position: 'top-center' });
  };

  const addActiveLesson = (unit: Unit) => {
    if (!activeLessonNumber) {
      toast.error('Open a lesson on the canvas first');
      return;
    }
    if (unit.lessonNumbers.includes(activeLessonNumber)) {
      toast('Lesson already in this unit');
      return;
    }
    updateUnit({
      ...unit,
      lessonNumbers: [...unit.lessonNumbers, activeLessonNumber],
      updatedAt: new Date(),
    });
    setLiveMessage(`Added lesson to ${unit.name}`);
    toast.success('Lesson added to unit');
  };

  const setTerm = (unit: Unit, termId: string) => {
    updateUnit({ ...unit, term: termId, updatedAt: new Date() });
    const label = terms.find((t) => t.id === termId)?.name || termId;
    setLiveMessage(`${unit.name} assigned to ${label}`);
  };

  return (
    <>
    <PlannerPopover
      open={open}
      onOpenChange={onOpenChange}
      label="My units"
      panelClassName="w-[min(92vw,320px)] max-sm:w-full"
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
          My units
          <ChevronDown className={cn('h-3.5 w-3.5 text-slate-500 transition pointer-coarse:h-4 pointer-coarse:w-4', open && 'rotate-180')} />
        </button>
      }
    >
          <div className="flex items-center justify-between gap-2 border-b border-indigo-50 px-3 py-3">
            <p className="text-sm font-extrabold text-slate-800">My units</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onYearOverview}
                className="h-9 rounded-lg px-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                Year overview
              </button>
              <button
                type="button"
                aria-label="New unit"
                onClick={() => setDialog({ kind: 'create' })}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 py-2">
            {(units || []).length === 0 ? (
              <div className="px-2 py-8 text-center">
                <p className="text-sm text-slate-500">No units yet.</p>
                <p className="mt-2 text-[12px] text-[#5F5B7A]">
                  Use the + button above to create one.
                </p>
              </div>
            ) : (
              (units || []).map((unit) => {
                const isOpen = expanded[unit.id] ?? false;
                const term = terms.find((t) => t.id === unit.term);
                const style = chipStyle(unit.color || '#4338E8');
                return (
                  <div
                    key={unit.id}
                    className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-visible"
                  >
                    <div
                      className="h-1.5"
                      style={{ backgroundColor: unit.color || '#4338E8' }}
                      aria-hidden
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((p) => ({ ...p, [unit.id]: !isOpen }))
                      }
                      className="flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                      <span
                        className="min-w-0 flex-1 line-clamp-2 text-sm font-bold leading-snug text-slate-800"
                        title={unit.name}
                      >
                        {unit.name}
                      </span>
                      <span
                        className="inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                        style={style}
                      >
                        {unit.lessonNumbers.length} lessons
                      </span>
                    </button>
                    <div className="space-y-2 px-3 pb-2">
                      <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor={`term-${unit.id}`}>
                          Half-term for {unit.name}
                        </label>
                        <select
                          id={`term-${unit.id}`}
                          value={unit.term || ''}
                          onChange={(e) => setTerm(unit, e.target.value)}
                          className="h-9 min-w-0 flex-1 rounded-lg border border-indigo-50 bg-indigo-50/30 px-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                          <option value="">No term</option>
                          {terms.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                              {formatTermHint(t) ? ` (${formatTermHint(t)})` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => addActiveLesson(unit)}
                          className="h-11 shrink-0 rounded-lg bg-indigo-50 px-2 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                          Add current
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Rename ${unit.name}`}
                          title={`Rename ${unit.name}`}
                          onClick={() => setDialog({ kind: 'rename', unit })}
                          className="inline-flex h-11 min-w-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                          <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Rename
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${unit.name}`}
                          title={`Delete ${unit.name}`}
                          onClick={() => setDialog({ kind: 'delete', unit })}
                          className="inline-flex h-11 min-w-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2 text-[12px] font-bold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Delete
                        </button>
                      </div>
                    </div>
                    {isOpen ? (
                      <ul className="space-y-1 border-t border-slate-50 px-2 py-2">
                        {unit.lessonNumbers.length === 0 ? (
                          <li className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 px-3 py-4 text-center text-[11px] font-semibold text-indigo-400">
                            Use “Add current” to place the open lesson here
                            {term ? ` · ${term.name}` : ''}
                          </li>
                        ) : (
                          unit.lessonNumbers.map((num) => {
                            const data = allLessonsData?.[num];
                            const label = data?.title || num;
                            return (
                              <li key={num}>
                                <button
                                  type="button"
                                  onClick={() => onSelectLesson(num)}
                                  className="flex min-h-[44px] w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                                >
                                  <span className="line-clamp-2 leading-snug" title={label}>
                                    {label}
                                  </span>
                                </button>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
          <div className="sr-only" aria-live="polite">
            {liveMessage}
          </div>
    </PlannerPopover>

    <ModalPrompt
      open={dialog?.kind === 'create'}
      onClose={() => setDialog(null)}
      onSubmit={createUnit}
      title="New unit"
      label="Unit name"
      initialValue="New unit"
      placeholder="e.g. Rhythm and pulse"
      confirmLabel="Create"
    />
    <ModalPrompt
      open={dialog?.kind === 'rename'}
      onClose={() => setDialog(null)}
      onSubmit={(name) => {
        if (dialog?.kind === 'rename') renameUnit(dialog.unit, name);
      }}
      title="Rename unit"
      label="Unit name"
      initialValue={dialog?.kind === 'rename' ? dialog.unit.name : ''}
      confirmLabel="Rename"
    />
    <ModalConfirm
      open={dialog?.kind === 'delete'}
      onClose={() => setDialog(null)}
      onConfirm={() => {
        if (dialog?.kind === 'delete') removeUnit(dialog.unit);
      }}
      title="Delete unit?"
      message={
        dialog?.kind === 'delete'
          ? `Delete unit “${dialog.unit.name}”? Lessons stay in Your lessons.`
          : ''
      }
      confirmLabel="Delete"
      danger
    />
    </>
  );
}
