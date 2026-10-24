import {
  ChevronDown,
  ChevronRight,
  Clock,
  GripVertical,
  Plus,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContextNew';
import type { Activity } from '../../contexts/DataContext';
import {
  LIBRARY_KEY_STAGES,
  type LibraryKeyStageId,
  buildLibraryHierarchyTree,
  isLibraryKeyStageId,
  keyStageLabel,
  subjectColor,
  type LibrarySubject,
} from '../../utils/libraryHierarchy';
import { chipStyle } from '../../utils/planner/contrastText';
import { cn } from '@/lib/utils';

function DraggableLibraryRow({
  activity,
  color,
  onOpen,
  onAdd,
}: {
  activity: Activity;
  color: string;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'activity',
      item: { activity },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [activity],
  );

  return (
    <li
      ref={(node) => {
        preview(node);
      }}
      className={cn(
        'flex items-stretch gap-1 rounded-xl border border-slate-100 bg-white',
        isDragging && 'opacity-50',
      )}
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <button
        type="button"
        ref={(node) => {
          drag(node);
        }}
        aria-label={`Drag ${activity.activity}`}
        className="inline-flex h-11 w-8 shrink-0 cursor-grab items-center justify-center text-slate-300 hover:text-slate-500 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 px-1 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
      >
        <span className="line-clamp-2 text-sm font-semibold text-slate-800">
          {activity.activity}
        </span>
        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="h-3 w-3" />
          {activity.time || 0}m
        </span>
      </button>
      <button
        type="button"
        aria-label={`Add ${activity.activity} to lesson`}
        onClick={onAdd}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-indigo-600 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <Plus className="h-4 w-4" />
      </button>
    </li>
  );
}

export function LibraryMenu({
  keyStage,
  onKeyStageChange,
  onOpenActivity,
  onAddToLesson,
  open,
  onOpenChange,
}: {
  keyStage: LibraryKeyStageId;
  onKeyStageChange: (ks: LibraryKeyStageId) => void;
  onOpenActivity: (activity: Activity) => void;
  onAddToLesson: (activity: Activity) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { allActivities } = useData();
  const { categories, categoryFolders, getCategoryColor } = useSettings();
  const [query, setQuery] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
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

  const hierarchy = useMemo(() => {
    const visibleCats = (categories || []).filter((c) => !c.hidden);
    const byCat = new Map<string, Activity[]>();
    for (const a of allActivities || []) {
      const name = a.category || 'Uncategorised';
      if (!byCat.has(name)) byCat.set(name, []);
      byCat.get(name)!.push(a);
    }
    const groups = visibleCats.map((c) => ({
      name: c.name,
      activities: byCat.get(c.name) || [],
    }));
    // Include activity categories not in settings list
    for (const [name, acts] of byCat) {
      if (!groups.some((g) => g.name === name)) {
        groups.push({ name, activities: acts });
      }
    }
    const metaByName = new Map(
      visibleCats.map((c) => [
        c.name,
        { name: c.name, group: c.group, groups: c.groups },
      ]),
    );
    return buildLibraryHierarchyTree(groups, metaByName, keyStage);
  }, [allActivities, categories, keyStage]);

  const subjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ksNode = hierarchy.find((n) => n.keyStageId === keyStage) || hierarchy[0];
    if (!ksNode) return [];

    return ksNode.subjects.map((s) => {
      const folder = (categoryFolders || []).find(
        (f) => f.name.toLowerCase() === String(s.subject).toLowerCase(),
      );
      const color =
        folder?.color ||
        (typeof s.subject === 'string' ? subjectColor(s.subject as LibrarySubject) : undefined) ||
        getCategoryColor?.(String(s.subject)) ||
        '#6366F1';

      let activities = s.categories.flatMap((c) => c.activities as Activity[]);
      if (q) {
        activities = activities.filter((a) =>
          (a.activity || '').toLowerCase().includes(q),
        );
      }
      // Dedupe by id/title
      const seen = new Set<string>();
      activities = activities.filter((a) => {
        const key = String(a.id || a._id || a.activity);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return {
        id: String(s.subject),
        name: String(s.subject),
        color,
        activities,
      };
    });
  }, [hierarchy, keyStage, query, categoryFolders, getCategoryColor]);

  const add = (activity: Activity) => {
    onAddToLesson(activity);
    setLiveMessage(`Added ${activity.activity || 'activity'} to lesson`);
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
        Library
        <ChevronDown className={cn('h-4 w-4 text-slate-500 transition', open && 'rotate-180')} />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Activity library"
          className="absolute left-0 top-[calc(100%+8px)] z-50 flex max-h-[min(70vh,560px)] w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-xl shadow-indigo-900/15"
        >
          <div className="border-b border-indigo-50 px-3 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-extrabold text-slate-800">Activity library</p>
              <label className="sr-only" htmlFor="planner-ks">
                Key stage
              </label>
              <select
                id="planner-ks"
                value={keyStage}
                onChange={(e) => {
                  const v = e.target.value;
                  if (isLibraryKeyStageId(v)) onKeyStageChange(v);
                }}
                className="h-9 rounded-lg border border-indigo-100 bg-indigo-50/40 px-2 text-xs font-semibold text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {LIBRARY_KEY_STAGES.map((ks) => (
                  <option key={ks.id} value={ks.id}>
                    {ks.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search activities"
                className="h-11 w-full rounded-xl border border-indigo-50 bg-indigo-50/40 pl-9 pr-3 text-sm outline-none focus:border-indigo-200 focus:bg-white focus-visible:ring-2 focus-visible:ring-indigo-400"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              {keyStageLabel(keyStage)} · colours from Settings
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2">
            {subjects.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-slate-400">
                No subjects for this key stage. Add folders in Settings.
              </p>
            ) : (
              subjects.map((subject) => {
                const isOpen = expandedSubjects[subject.id] ?? false;
                const style = chipStyle(subject.color);
                return (
                  <div key={subject.id} className="rounded-xl">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSubjects((prev) => ({
                          ...prev,
                          [subject.id]: !isOpen,
                        }))
                      }
                      className="flex h-11 w-full items-center gap-2 rounded-xl px-2 text-left hover:bg-indigo-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <span
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                        style={style}
                      >
                        {subject.name}
                      </span>
                      <span className="ml-auto text-xs font-semibold text-slate-400">
                        {subject.activities.length}
                      </span>
                    </button>
                    {isOpen ? (
                      <ul className="space-y-1 pb-2 pl-2">
                        {subject.activities.length === 0 ? (
                          <li className="px-2 py-2 text-xs text-slate-400">No activities</li>
                        ) : (
                          subject.activities.map((activity, idx) => (
                            <DraggableLibraryRow
                              key={`${activity.id || activity._id || activity.activity}-${idx}`}
                              activity={activity}
                              color={subject.color}
                              onOpen={() => onOpenActivity(activity)}
                              onAdd={() => add(activity)}
                            />
                          ))
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
