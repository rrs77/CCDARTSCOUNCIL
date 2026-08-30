import React, { useEffect, useState } from 'react';
import { Bell, Star, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import {
  CCD_IMPORTANT_DATES_UPDATED_EVENT,
  getPartnerShortName,
  keyDateKindLabel,
  parseKeyDateToLocalDate,
  readImportantDates,
  removeImportantDate,
  type ImportantDate,
} from '../../utils/partnerKeyDates';

interface ImportantDatesPanelProps {
  className?: string;
  /** Jump calendar to this date when a row is clicked */
  onJumpToDate?: (date: Date) => void;
  /** Compact for embedding under calendar chrome */
  compact?: boolean;
}

/**
 * Lists Important dates (partner key dates the user ticked to attend).
 * Forest/lime chrome — distinct star treatment vs ordinary events.
 */
export function ImportantDatesPanel({
  className = '',
  onJumpToDate,
  compact = false,
}: ImportantDatesPanelProps) {
  const [dates, setDates] = useState<ImportantDate[]>(() => readImportantDates());
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const sync = () => setDates(readImportantDates());
    window.addEventListener(CCD_IMPORTANT_DATES_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CCD_IMPORTANT_DATES_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (dates.length === 0) return null;

  const withReminder = dates.filter((d) => d.attendReminder);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-[#E5EDE8] bg-white ${className}`}
      data-ccd-important-dates-panel="1"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#F7FAF8]"
        style={{ backgroundColor: 'var(--ccd-sage, #F3F6F3)' }}
        aria-expanded={open}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#002D24]/12"
          style={{ backgroundColor: 'rgba(182, 255, 126, 0.35)' }}
        >
          <Star className="h-3.5 w-3.5 text-teal-800" fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#002D24]">Important dates</p>
          <p className="text-[11px] text-gray-600">
            {withReminder.length} reminder{withReminder.length === 1 ? '' : 's'} · partner key
            dates
          </p>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-[#002D24]/60" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[#002D24]/60" />
        )}
      </button>

      {open && (
        <ul className={`divide-y divide-[#E5EDE8] ${compact ? 'max-h-40 overflow-y-auto' : 'max-h-56 overflow-y-auto'}`}>
          {dates.map((d) => {
            const dt = parseKeyDateToLocalDate(d.date);
            return (
              <li key={d.id} className="group flex items-start gap-2 px-3 py-2 hover:bg-[#F7FAF8]">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onJumpToDate?.(dt)}
                  data-ccd-important-date-row={d.id}
                >
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium text-[#002D24]">{d.title}</span>
                    {d.keyStage !== 'All' && (
                      <span className="rounded bg-[#002D24]/8 px-1.5 py-0.5 text-[10px] font-semibold text-[#002D24]">
                        {d.keyStage}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-600">
                    {format(dt, 'EEE d MMM yyyy')} · {getPartnerShortName(d.orgId)} ·{' '}
                    {keyDateKindLabel(d.kind)}
                  </span>
                  {d.attendReminder ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-teal-800">
                      <Bell className="h-3 w-3" />
                      Remind me to go
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  title="Remove important date"
                  onClick={() => {
                    removeImportantDate(d.id);
                    setDates(readImportantDates());
                  }}
                  className="rounded-md p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                  aria-label={`Remove ${d.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
