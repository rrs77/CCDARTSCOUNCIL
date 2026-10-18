import React from 'react';
import { MapPin, MessageSquareText, Plus } from 'lucide-react';
import type { DayEntry, PlannerClass } from './plannerModel';
import { readableInk, tint } from './plannerModel';

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
}: Props) {
  const color = cls?.color || '#475569';
  const ink = readableInk(color);
  const plan = entry.plan;
  const status = plan?.status;
  const roomy = size === 'roomy';
  const statusDot =
    status === 'completed' ? 'bg-[#1E6B3E]' : status === 'draft' ? 'bg-[#D97706]' : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      title={plan ? [title, unitLabel, entry.location, status === 'completed' ? 'Taught' : status === 'draft' ? 'Draft' : null].filter(Boolean).join(' · ') : 'Choose a lesson'}
      className={`ss-lesson-card group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4338E8] ${
        plan ? '' : 'border-dashed'
      } ${selected ? 'is-selected' : ''} ${roomy ? 'min-h-[120px]' : ''}`}
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
            {cls?.name || entry.classId}
          </strong>
          <span className="ss-desc pl-1">{title}{unitLabel ? ` · ${unitLabel}` : ''}</span>
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
          <span className="flex items-center gap-1.5 min-w-0">
            {entry.time && (
              <span className="text-xs font-semibold tabular-nums text-[#77738F] shrink-0">{entry.time}</span>
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
          <span className="mt-0.5 flex items-center gap-1 text-[12.5px] font-medium text-[#4338E8]">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Choose a lesson
          </span>
        </>
      )}
    </button>
  );
}
