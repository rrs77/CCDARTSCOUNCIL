import {
  ChevronDown,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useData, type Unit } from '../../contexts/DataContext';
import { chipStyle } from '../../utils/planner/contrastText';
import { cn } from '@/lib/utils';

const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1' },
  { id: 'A2', name: 'Autumn 2' },
  { id: 'SP1', name: 'Spring 1' },
  { id: 'SP2', name: 'Spring 2' },
  { id: 'SM1', name: 'Summer 1' },
  { id: 'SM2', name: 'Summer 2' },
];

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
    allLessonsData,
    currentSheetInfo,
  } = useData();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [liveMessage, setLiveMessage] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onOpenChange]);

  const createUnit = () => {
    const unit: Unit = {
      id: `unit-${Date.now()}`,
      name: 'New unit',
      description: '',
      lessonNumbers: [],
      color: '#4338E8',
      term: 'A1',
      classSheet: currentSheetInfo?.sheet,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    updateUnit(unit);
    setLiveMessage('Created new unit');
    toast.success('Unit created');
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

  const setTerm = (unit: Unit, term: string) => {
    updateUnit({ ...unit, term, updatedAt: new Date() });
    setLiveMessage(`${unit.name} assigned to ${HALF_TERMS.find((t) => t.id === term)?.name || term}`);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => onOpenChange(!open)}
        className={cn(
          'inline-flex h-11 min-w-[44px] items-center gap-1.5 rounded-xl border border-[#E2E0EF] bg-white px-3 text-sm font-bold text-[#1F1B4D]',
          'hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
          open && 'border-indigo-300 bg-indigo-50/60',
        )}
      >
        My units
        <ChevronDown className={cn('h-4 w-4 text-slate-500 transition', open && 'rotate-180')} />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="My units"
          className="absolute right-0 top-[calc(100%+8px)] z-50 flex max-h-[min(70vh,560px)] w-[min(92vw,340px)] flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-xl shadow-indigo-900/15 sm:left-0 sm:right-auto"
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
                onClick={createUnit}
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
                <button
                  type="button"
                  onClick={createUnit}
                  className="mt-3 inline-flex h-11 items-center gap-1 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <Plus className="h-4 w-4" />
                  New unit
                </button>
              </div>
            ) : (
              (units || []).map((unit) => {
                const isOpen = expanded[unit.id] ?? false;
                const term = HALF_TERMS.find((t) => t.id === unit.term);
                const style = chipStyle(unit.color || '#4338E8');
                return (
                  <div
                    key={unit.id}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
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
                      className="flex h-11 w-full items-center gap-2 px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">
                        {unit.name}
                      </span>
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                        style={style}
                      >
                        {unit.lessonNumbers.length} lessons
                      </span>
                    </button>
                    <div className="flex items-center gap-2 px-3 pb-2">
                      <label className="sr-only" htmlFor={`term-${unit.id}`}>
                        Half-term for {unit.name}
                      </label>
                      <select
                        id={`term-${unit.id}`}
                        value={unit.term || ''}
                        onChange={(e) => setTerm(unit, e.target.value)}
                        className="h-9 flex-1 rounded-lg border border-indigo-50 bg-indigo-50/30 px-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        <option value="">No term</option>
                        {HALF_TERMS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => addActiveLesson(unit)}
                        className="h-9 shrink-0 rounded-lg bg-indigo-50 px-2 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      >
                        Add current
                      </button>
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
                            return (
                              <li key={num}>
                                <button
                                  type="button"
                                  onClick={() => onSelectLesson(num)}
                                  className="flex h-11 w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-slate-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                                >
                                  <span className="truncate">
                                    {data?.title || num}
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
        </div>
      ) : null}
    </div>
  );
}
