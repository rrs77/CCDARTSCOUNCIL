import React, { useEffect, useRef } from 'react';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';
import { MapPin, MessageSquareText, Plus } from 'lucide-react';
import type { DayEntry, PlannerClass } from './plannerModel';
import { readableInk, tint, ymd } from './plannerModel';
import { PLANNER_LESSON_DND, type PlannerLessonDragItem } from './plannerDnd';

interface Props {
  entry: DayEntry;
  cls?: PlannerClass;
  title: string;
  unitLabel?: string;
  hasReflection?: boolean;
  selected?: boolean;
  size?: 'compact' | 'roomy';
  /** When false (single-class focus), hide the class chip — colour bar is enough. */
  showClass?: boolean;
  onOpen: (entry: DayEntry) => void;
  /**
   * When set, this card is a drop target for reordering within / onto a day.
   * `place` is relative to this card.
   */
  onDropRelative?: (item: PlannerLessonDragItem, place: 'before' | 'after') => void;
  /** Drop a scheduled lesson onto this empty timetable outline to fill it. */
  onDropOntoOutline?: (item: PlannerLessonDragItem) => void;
  /** Optional keyboard shortcut handler (e.g. Alt+←/→ to move days). */
  onKeyMove?: (e: React.KeyboardEvent) => void;
}

export function PlannerLessonCard({
  entry,
  cls,
  title,
  unitLabel,
  hasReflection,
  selected,
  size = 'compact',
  showClass = true,
  onOpen,
  onDropRelative,
  onDropOntoOutline,
  onKeyMove,
}: Props) {
  const color = cls?.color || entry.slot?.color || '#475569';
  const ink = readableInk(color);
  const plan = entry.plan;
  const status = plan?.status;
  const roomy = size === 'roomy';
  const isOutline = !plan && !!entry.slot;
  const statusDot =
    status === 'completed' ? 'bg-[#1E6B3E]' : status === 'draft' ? 'bg-[#D97706]' : null;

  const ref = useRef<HTMLButtonElement>(null);
  const suppressClick = useRef(false);

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: PLANNER_LESSON_DND,
      item: (): PlannerLessonDragItem => ({
        type: PLANNER_LESSON_DND,
        planId: plan!.id,
        classId: entry.classId,
        title: title || plan!.title || 'Lesson',
        fromYmd: ymd(new Date(plan!.date)),
        time: entry.time || plan?.time,
      }),
      canDrag: () => !!plan,
      end: (_item, monitor) => {
        if (monitor.didDrop()) suppressClick.current = true;
      },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [plan, entry.classId, entry.time, title],
  );

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: PLANNER_LESSON_DND,
      canDrop: (item: PlannerLessonDragItem) => {
        if (plan) return item.planId !== plan.id && !!onDropRelative;
        return isOutline && !!onDropOntoOutline && item.planId !== undefined;
      },
      hover: (item: PlannerLessonDragItem, monitor) => {
        if (!plan || !ref.current || !monitor.isOver({ shallow: true })) return;
        const rect = ref.current.getBoundingClientRect();
        const client = monitor.getClientOffset();
        if (!client) return;
        const mid = rect.top + rect.height / 2;
        (item as PlannerLessonDragItem & { _place?: 'before' | 'after' })._place =
          client.y < mid ? 'before' : 'after';
      },
      drop: (item: PlannerLessonDragItem) => {
        if (!plan && isOutline && onDropOntoOutline) {
          onDropOntoOutline(item);
          return { handled: true, filledOutline: true };
        }
        if (!onDropRelative || !plan) return;
        const place =
          (item as PlannerLessonDragItem & { _place?: 'before' | 'after' })._place || 'before';
        onDropRelative(item, place);
        return { handled: true };
      },
      collect: (m) => ({ isOver: m.isOver({ shallow: true }), canDrop: m.canDrop() }),
    }),
    [plan, isOutline, onDropRelative, onDropOntoOutline],
  );

  const setRef = (node: HTMLButtonElement | null) => {
    ref.current = node;
    drag(node);
    if (onDropRelative || onDropOntoOutline) drop(node);
  };

  const timeLabel = entry.endTime ? `${entry.time}–${entry.endTime}` : entry.time;

  return (
    <button
      type="button"
      ref={setRef}
      onClick={() => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        onOpen(entry);
      }}
      onKeyDown={onKeyMove}
      title={
        plan
          ? [
              title,
              unitLabel,
              entry.location,
              status === 'completed' ? 'Taught' : status === 'draft' ? 'Draft' : null,
              'Drag to another day · Alt+←/→ to move',
            ]
              .filter(Boolean)
              .join(' · ')
          : [
              cls?.name || entry.classId,
              timeLabel,
              entry.location,
              'Add a lesson to this timetable slot',
            ]
              .filter(Boolean)
              .join(' · ')
      }
      aria-grabbed={plan ? isDragging : undefined}
      className={`ss-lesson-card group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4338E8] ${
        plan ? 'is-draggable' : 'is-outline border-dashed'
      } ${selected ? 'is-selected' : ''} ${roomy ? 'min-h-[120px]' : ''} ${
        isDragging ? 'is-dragging' : ''
      } ${isOver && canDrop ? 'is-drop-target' : ''}`}
    >
      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r" style={{ background: color }} aria-hidden />
      {plan ? (
        <>
          <span className="flex w-full items-center gap-1.5 min-w-0 pl-1">
            {entry.time && <span className={`ss-timepill ${status === 'draft' ? 'sun' : ''}`}>{entry.time}</span>}
            {showClass && (
              <span
                className="text-[11px] font-bold rounded-md px-1.5 py-px truncate min-w-0"
                style={{ color: ink, background: tint(color, 0.13) }}
              >
                {cls?.name || entry.classId}
              </span>
            )}
            {statusDot && (
              <span
                className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${statusDot}`}
                title={status === 'completed' ? 'Taught' : 'Draft'}
                aria-label={status === 'completed' ? 'Taught' : 'Draft'}
              />
            )}
            {hasReflection && !statusDot && (
              <MessageSquareText className="ml-auto h-3.5 w-3.5 shrink-0 text-[#77738F]" aria-label="Has reflection" />
            )}
          </span>
          <strong className={`pl-1 ${roomy ? 'text-[15px]' : ''}`}>
            {title || 'Lesson'}
          </strong>
          <span className="ss-desc pl-1">
            {unitLabel || (showClass ? null : cls?.name) || '\u00a0'}
          </span>
          {roomy && (hasReflection || entry.location) && (
            <span className="mt-1 flex items-center gap-2.5 pl-1 text-xs text-[#77738F]">
              {entry.location && (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{entry.location}</span>
                </span>
              )}
              {hasReflection && (
                <span className="inline-flex items-center gap-1">
                  <MessageSquareText className="h-3.5 w-3.5" aria-hidden />
                  Reflection
                </span>
              )}
            </span>
          )}
        </>
      ) : (
        <>
          <span className="flex w-full items-center gap-1.5 min-w-0 pl-1">
            {timeLabel && (
              <span className="ss-timepill indigo shrink-0">{timeLabel}</span>
            )}
            {showClass && (
              <span
                className="text-[11px] font-bold rounded-md px-1.5 py-px truncate min-w-0"
                style={{ color: ink, background: tint(color, 0.13) }}
              >
                {cls?.name || entry.classId}
              </span>
            )}
          </span>
          {entry.location ? (
            <span className="pl-1 flex items-center gap-1 text-[11px] text-[#A8A4BC] min-w-0">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{entry.location}</span>
            </span>
          ) : (
            <span className="pl-1 text-[11px] text-[#B0ACC4]">Empty slot</span>
          )}
          <span className="mt-0.5 flex items-center gap-1 pl-1 text-[12.5px] font-semibold text-[#9B97B0] group-hover:text-[#4338E8]">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add lesson
          </span>
        </>
      )}
    </button>
  );
}
