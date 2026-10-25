import {
  ChevronDown,
  ChevronRight,
  Clock,
  GripVertical,
  Plus,
  Search,
  Share2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDrag } from 'react-dnd';
import { useAuth } from '../../hooks/useAuth';
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
import {
  listSharedWithMe,
  type PlanningShareGrant,
} from '../../utils/planner/planningShares';
import { chipStyle } from '../../utils/planner/contrastText';
import { PlannerPopover } from './PlannerPopover';
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
        'flex items-stretch gap-0.5 rounded-lg border border-slate-100 bg-white',
        isDragging && 'opacity-50',
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <button
        type="button"
        ref={(node) => {
          drag(node);
        }}
        aria-label={`Drag ${activity.activity}`}
        className="relative inline-flex h-10 w-7 shrink-0 cursor-grab items-center justify-center text-slate-300 hover:text-slate-500 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 pointer-coarse:h-11 pointer-coarse:w-11 before:absolute before:inset-y-0 before:-left-1 before:-right-1 before:content-['']"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 px-1 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
      >
        <span
          className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800"
          title={activity.activity || undefined}
        >
          {activity.activity}
        </span>
        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[#5F5B7A]">
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
  const { user } = useAuth();
  const { allActivities } = useData();
  const { categories, categoryFolders, getCategoryColor } = useSettings();
  const [query, setQuery] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [liveMessage, setLiveMessage] = useState('');
  const [sharedWithMe, setSharedWithMe] = useState<PlanningShareGrant[]>([]);
  const [sharedOpen, setSharedOpen] = useState(true);

  useEffect(() => {
    if (!open || !user?.id) return;
    let cancelled = false;
    const load = () => {
      void listSharedWithMe({
        id: user.id,
        organisationId: user.profile?.organisation_id || null,
      }).then((rows) => {
        if (!cancelled) setSharedWithMe(rows);
      });
    };
    load();
    window.addEventListener('ccd:planning-shares-updated', load);
    return () => {
      cancelled = true;
      window.removeEventListener('ccd:planning-shares-updated', load);
    };
  }, [open, user?.id, user?.profile]);

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
    <PlannerPopover
      open={open}
      onOpenChange={onOpenChange}
      label="Activity library"
      panelClassName="w-[min(92vw,280px)] max-sm:w-full"
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
          Library
          <ChevronDown className={cn('h-3.5 w-3.5 text-slate-500 transition pointer-coarse:h-4 pointer-coarse:w-4', open && 'rotate-180')} />
        </button>
      }
    >
          <div className="border-b border-indigo-50 px-2 py-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-extrabold text-slate-800">Activities</p>
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
            <div className="mb-2 rounded-xl border border-violet-100 bg-violet-50/50">
              <button
                type="button"
                onClick={() => setSharedOpen((v) => !v)}
                className="flex h-9 w-full items-center gap-1.5 px-2 text-left text-[12px] font-extrabold text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <Share2 className="h-3.5 w-3.5" />
                Shared with me
                <span className="ml-auto tabular-nums text-[11px] font-bold text-violet-700">
                  {sharedWithMe.length}
                </span>
              </button>
              {sharedOpen ? (
                <ul className="space-y-1 px-2 pb-2">
                  {sharedWithMe.length === 0 ? (
                    <li className="px-1 py-2 text-[11px] text-violet-700/80">
                      Nothing shared with you yet.
                    </li>
                  ) : (
                    sharedWithMe.map((g) => (
                      <li
                        key={g.id}
                        className="rounded-lg border border-violet-100 bg-white px-2 py-1.5"
                      >
                        <p className="truncate text-[12px] font-bold text-slate-800">
                          {g.title || 'Shared planning'}
                        </p>
                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600">
                          {(g.resourceType || 'lesson').replace('_', ' ')} · {g.permission} ·{' '}
                          {g.audienceLabel || g.audienceType}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </div>
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
                      className="flex h-9 w-full items-center gap-1.5 rounded-lg px-1.5 text-left hover:bg-indigo-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 pointer-coarse:h-11"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      )}
                      <span
                        className="inline-flex min-w-0 max-w-[70%] items-center truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          ...style,
                          color: '#0f172a',
                          backgroundColor: `${subject.color || '#4338E8'}1F`,
                        }}
                      >
                        {subject.name}
                      </span>
                      <span className="ml-auto shrink-0 text-[11px] font-semibold text-[#5F5B7A]">
                        {subject.activities.length}
                      </span>
                    </button>
                    {isOpen ? (
                      <ul className="space-y-1 pb-2 pl-1">
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
    </PlannerPopover>
  );
}
