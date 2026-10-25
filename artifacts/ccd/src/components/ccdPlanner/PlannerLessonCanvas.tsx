/**
 * Full-width lesson canvas — visual port of planner-mock LessonCanvas,
 * wired to real LessonData / LessonSection and react-dnd (not @dnd-kit).
 * Library / My units stay as toolbar menus (locked layout).
 */
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  GripVertical,
  Lightbulb,
  Sparkles,
  X,
} from 'lucide-react';
import { contrastTextOn } from '../../utils/planner/contrastText';
import { DEFAULT_LESSON_TITLE } from './LessonPlanModal';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useDropFlash, useDropZoneStyle } from '../dnd';
import type { Activity, LessonData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContextNew';
import type { LessonSection } from '../../types/lessonSections';
import { ensureLessonSections } from '../../utils/planner/legacyLessonToSections';
import { lessonDurationMinutes } from '../../utils/lessonDuration';
import { cn } from '@/lib/utils';
import { Button, IconButton, Pill } from './ui';
import { RichHtml } from './RichHtml';

const TARGET_FALLBACK_MIN = 45;

function sectionDuration(section: LessonSection): number {
  if (typeof section.durationMins === 'number' && section.durationMins > 0) {
    return section.durationMins;
  }
  if (section.activity && typeof section.activity.time === 'number') {
    return section.activity.time;
  }
  return 0;
}

function sectionsToLessonPatch(
  base: LessonData,
  sections: LessonSection[],
): LessonData {
  const activities = sections
    .filter((s) => s.kind === 'activity' && s.activity)
    .map((s) => s.activity!);
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
  return {
    ...base,
    sections,
    orderedActivities: activities,
    grouped,
    categoryOrder,
    totalTime,
  };
}

function SortableSectionCard({
  section,
  index,
  total,
  color,
  onOpen,
  onRemove,
  onReorder,
  canEdit,
}: {
  section: LessonSection;
  index: number;
  total: number;
  color: string;
  onOpen: () => void;
  onRemove: () => void;
  onReorder: (from: number, to: number) => void;
  canEdit: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragStarted, setDragStarted] = useState(false);
  const mins = sectionDuration(section);
  const isFlexible = section.kind !== 'activity';

  const [{ handlerId }, drop] = useDrop({
    accept: 'planner-section',
    collect: (monitor) => ({ handlerId: monitor.getHandlerId() }),
    hover(item: { index: number }, monitor) {
      if (!ref.current || !canEdit) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const rect = ref.current.getBoundingClientRect();
      const middleY = (rect.bottom - rect.top) / 2;
      const client = monitor.getClientOffset();
      if (!client) return;
      const hoverClientY = client.y - rect.top;
      if (dragIndex < hoverIndex && hoverClientY < middleY) return;
      if (dragIndex > hoverIndex && hoverClientY > middleY) return;
      onReorder(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'planner-section',
    item: () => {
      setDragStarted(true);
      return { index, sectionId: section.id };
    },
    canDrag: canEdit,
    end: () => {
      window.setTimeout(() => setDragStarted(false), 80);
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  preview(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={cn(
        'overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition duration-200',
        isFlexible && 'ring-dashed ring-indigo-200',
        isDragging ? 'dnd-ghost z-50 opacity-95' : 'hover:-translate-y-0.5 hover:shadow-md',
      )}
    >
      <div
        className="flex items-center justify-between gap-2 px-3 py-2"
        style={{
          backgroundColor: isFlexible ? '#818CF8' : color,
          color: contrastTextOn(isFlexible ? '#818CF8' : color),
        }}
      >
        <div className="flex min-w-0 items-center gap-1">
          {canEdit ? (
            <button
              type="button"
              ref={(node) => {
                drag(node);
              }}
              data-drag-handle
              className="relative inline-flex h-11 w-11 cursor-grab touch-none items-center justify-center rounded-lg opacity-80 hover:bg-black/10 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (dragStarted) return;
              onOpen();
            }}
            className="line-clamp-2 min-w-0 text-left text-[13px] font-bold leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            title={section.title}
          >
            {section.title}
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          {canEdit ? (
            <>
              <button
                type="button"
                aria-label={`Move ${section.title} up`}
                disabled={index === 0}
                onClick={() => onReorder(index, index - 1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/10 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Move ${section.title} down`}
                disabled={index >= total - 1}
                onClick={() => onReorder(index, index + 1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/10 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </>
          ) : null}
          {isFlexible ? (
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold">
              Section
            </span>
          ) : null}
          {mins > 0 ? (
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold">
              {mins} min
            </span>
          ) : null}
          {canEdit ? (
            <IconButton
              onClick={onRemove}
              className="h-11 w-11 hover:bg-black/10"
              aria-label={`Remove ${section.title}`}
            >
              <X className="h-3.5 w-3.5" />
            </IconButton>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          if (dragStarted) return;
          onOpen();
        }}
        className="w-full px-3.5 py-2.5 text-left text-xs leading-relaxed text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <RichHtml
          className="line-clamp-3 prose-p:my-0.5 text-xs text-slate-500"
          html={section.bodyHtml || section.activity?.description || ''}
          empty="Tap to edit this block…"
        />
      </button>
    </div>
  );
}

export function PlannerLessonCanvas({
  lessonNumber,
  lessonData,
  keyStageLabel,
  classLabel,
  yearGroupLabel,
  canEdit,
  onSave,
  onOpenLessonPlan,
  onOpenActivity,
  onDuplicate,
}: {
  lessonNumber?: string;
  lessonData?: LessonData | null;
  keyStageLabel?: string;
  classLabel?: string;
  yearGroupLabel?: string;
  canEdit: boolean;
  onSave: (data: LessonData) => void | Promise<void>;
  onOpenLessonPlan: () => void;
  onOpenActivity: (activity: Activity) => void;
  onDuplicate?: () => void;
}) {
  const { getCategoryColor } = useSettings();
  const { flashClass, triggerFlash } = useDropFlash();
  const ensured = useMemo(
    () => (lessonData ? ensureLessonSections(lessonData) : null),
    [lessonData],
  );
  const sections = ensured?.sections || [];
  const displayTarget = lessonData
    ? lessonDurationMinutes(lessonData)
    : TARGET_FALLBACK_MIN;
  const used = sections.reduce((sum, s) => sum + sectionDuration(s), 0);
  const over = used > displayTarget;
  const pct = Math.min(100, Math.round((used / displayTarget) * 100));

  const persistSections = useCallback(
    async (next: LessonSection[], announce?: string) => {
      if (!ensured) return;
      const patch = sectionsToLessonPatch(ensured, next);
      await onSave(patch);
      if (announce && typeof document !== 'undefined') {
        // soft a11y ping via custom event consumed by workspace live region if needed
        window.dispatchEvent(
          new CustomEvent('ccd:planner-canvas-announce', { detail: { message: announce } }),
        );
      }
    },
    [ensured, onSave],
  );

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['activity'],
    drop: (item: { activity?: Activity }) => {
      if (!canEdit || !ensured) return;
      const resolved = item.activity;
      if (!resolved) return;
      triggerFlash();
      const next: LessonSection[] = [
        ...sections,
        {
          id: `activity-${Date.now()}`,
          kind: 'activity',
          title: resolved.activity || 'Activity',
          bodyHtml: resolved.description || resolved.activityText || '',
          activity: resolved,
          durationMins: resolved.time,
          lastWrittenBy: 'teacher',
        },
      ];
      void persistSections(next, `Added ${resolved.activity}`);
    },
    canDrop: () => canEdit && !!ensured,
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const zoneClass = useDropZoneStyle({ isOver, canDrop, variant: 'panel' });

  if (!ensured || !lessonNumber) {
    return (
      <section className="flex min-h-[28rem] flex-1 flex-col items-center justify-center overflow-hidden rounded-[1.75rem] card-surface-strong px-6 py-12 text-center">
        <p className="text-sm font-semibold text-indigo-700">Open a lesson on the canvas</p>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          Pick one from Your lessons, or create a new plan. Drag activities from Library once a
          lesson is open.
        </p>
        <Button variant="primary" size="sm" className="mt-4" onClick={onOpenLessonPlan}>
          <Sparkles className="h-3.5 w-3.5" />
          Open lesson plan
        </Button>
      </section>
    );
  }

  return (
    <section
      ref={(node) => {
        drop(node);
      }}
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] card-surface-strong transition',
        zoneClass,
        flashClass,
        isOver && canDrop && 'drop-active ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#f3f0fb]',
      )}
      data-testid="planner-lesson-canvas"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-indigo-50 px-5 py-4">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {keyStageLabel ? (
              <Pill className="bg-indigo-50 text-indigo-700">{keyStageLabel}</Pill>
            ) : null}
            {classLabel ? (
              <Pill className="bg-violet-50 text-violet-700">{classLabel}</Pill>
            ) : null}
            {yearGroupLabel ? (
              <Pill className="bg-slate-100 text-slate-600">{yearGroupLabel}</Pill>
            ) : null}
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            {(ensured.title || '').trim() || DEFAULT_LESSON_TITLE}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {onDuplicate ? (
            <IconButton title="Duplicate lesson" onClick={onDuplicate} aria-label="Duplicate lesson">
              <Copy className="h-4 w-4" />
            </IconButton>
          ) : null}
          <Button variant="soft" size="sm" onClick={onOpenLessonPlan}>
            <Sparkles className="h-3.5 w-3.5" />
            Open lesson plan
          </Button>
        </div>
      </div>

      <div className="border-b border-indigo-50 px-5 py-3">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
            <Clock className="h-4 w-4" />
            Lesson time
          </span>
          <span
            className={cn(
              'font-extrabold tabular-nums',
              over ? 'text-amber-600' : 'text-indigo-700',
            )}
          >
            {used} / {displayTarget} min
          </span>
        </div>
        <div
          className={cn(
            'flex h-3 overflow-hidden rounded-full bg-indigo-50 ring-1 transition',
            over ? 'ring-amber-300' : 'ring-indigo-100',
          )}
          role="meter"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={displayTarget}
          aria-label="Lesson duration used"
        >
          {sections.map((section) => {
            const mins = sectionDuration(section);
            if (!mins) return null;
            const color =
              section.kind === 'activity'
                ? getCategoryColor?.(section.activity?.category || '') || '#4338CA'
                : '#94A3B8';
            const width = `${(mins / Math.max(used, displayTarget)) * 100}%`;
            return (
              <div
                key={section.id}
                title={`${section.title} · ${mins}m`}
                className="h-full transition-all duration-200 motion-reduce:transition-none first:rounded-l-full last:rounded-r-full"
                style={{
                  width,
                  backgroundColor: over ? '#F59E0B' : color,
                  opacity: over ? 0.85 : 1,
                }}
              />
            );
          })}
        </div>
        {over ? (
          <p className="mt-1.5 text-xs font-medium text-amber-600">
            Over target by {used - displayTarget} minutes — trim or split activities.
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] text-slate-400">
            Segments tint by subject · {pct}% of target
          </p>
        )}
      </div>

      <div className="soft-scroll flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {sections.map((section, index) => {
          const color =
            section.kind === 'activity'
              ? getCategoryColor?.(section.activity?.category || '') || '#4338CA'
              : '#94A3B8';
          return (
            <SortableSectionCard
              key={section.id}
              section={section}
              index={index}
              total={sections.length}
              color={color}
              canEdit={canEdit}
              onOpen={() => {
                if (section.kind === 'activity' && section.activity) {
                  onOpenActivity(section.activity);
                } else {
                  onOpenLessonPlan();
                }
              }}
              onRemove={() => {
                void persistSections(
                  sections.filter((s) => s.id !== section.id),
                  `Removed ${section.title}`,
                );
              }}
              onReorder={(from, to) => {
                if (from === to || to < 0 || to >= sections.length) return;
                const next = [...sections];
                const [item] = next.splice(from, 1);
                next.splice(to, 0, item);
                void persistSections(
                  next,
                  `Moved ${item.title} ${to < from ? 'up' : 'down'}`,
                );
              }}
            />
          );
        })}

        {sections.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-10 text-center">
            <p className="text-sm font-semibold text-indigo-700">Drop activities here</p>
            <p className="mt-1 text-xs text-slate-500">
              Drag from Library or open an activity and choose Add to lesson.
            </p>
          </div>
        ) : null}
      </div>

      <div className="m-4 mt-0 flex items-start gap-2 rounded-2xl bg-amber-50/80 px-3.5 py-3 text-xs text-amber-900/80">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p>
          <span className="font-bold">Tip:</span> Drag activities from Library or reorder them to
          build your lesson. Mix subjects freely.
        </p>
      </div>
    </section>
  );
}
