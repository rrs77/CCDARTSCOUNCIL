import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Star, X, Bell, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import {
  getKeyDateSuggestionsForOrg,
  getPartnerDisplayName,
  getPartnerShortName,
  keyDateKindLabel,
  parseKeyDateToLocalDate,
  type PartnerKeyDateSuggestion,
} from '../../utils/partnerKeyDates';

interface PartnerKeyDatesModalProps {
  isOpen: boolean;
  orgId: string | null;
  onClose: () => void;
  /** Called with the suggestions the user ticked to attend / add. */
  onConfirm: (selected: PartnerKeyDateSuggestion[]) => void;
}

/**
 * Suggest partner key dates (KS1/KS2 across months). User ticks dates to attend
 * (demo reminder) then confirms — parent adds to calendar + Important dates.
 */
export function PartnerKeyDatesModal({
  isOpen,
  orgId,
  onClose,
  onConfirm,
}: PartnerKeyDatesModalProps) {
  const suggestions = useMemo(
    () => (orgId ? getKeyDateSuggestionsForOrg(orgId) : []),
    [orgId],
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!isOpen || !orgId) return;
    // Pre-tick KS1 + KS2 examples so the demo path is one confirm away
    const pre = new Set(
      suggestions
        .filter((s) => s.keyStage === 'KS1' || s.keyStage === 'KS2')
        .map((s) => s.id),
    );
    if (pre.size === 0) {
      suggestions.forEach((s) => pre.add(s.id));
    }
    setSelectedIds(pre);
  }, [isOpen, orgId, suggestions]);

  const byMonth = useMemo(() => {
    const map = new Map<string, PartnerKeyDateSuggestion[]>();
    for (const s of suggestions) {
      const dt = parseKeyDateToLocalDate(s.date);
      const key = format(dt, 'MMMM yyyy');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()];
  }, [suggestions]);

  if (!isOpen || !orgId) return null;

  const shortName = getPartnerShortName(orgId);
  const displayName = getPartnerDisplayName(orgId);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selected = suggestions.filter((s) => selectedIds.has(s.id));

  const handleConfirm = () => {
    if (selected.length === 0) return;
    onConfirm(selected);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-key-dates-title"
      data-ccd-key-dates-modal="1"
    >
      {/* Full-viewport dim — portaled so header dims (not trapped by calendar transform/overflow) */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-card border border-[#E5EDE8] bg-white shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-3 border-b border-[#E5EDE8] px-4 py-3 sm:px-5"
          style={{ backgroundColor: 'var(--ccd-sage, #F3F6F3)' }}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#002D24]/70">
              Populate with key dates from
            </p>
            <h3
              id="partner-key-dates-title"
              className="mt-0.5 truncate text-lg font-semibold text-[#002D24]"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {shortName}
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              Tick dates to attend — we&apos;ll add them as Important dates and set a demo
              reminder. Partner names for demonstration only.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-[#002D24]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5">
          {suggestions.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-600">
              No demo key dates for {displayName} yet.
            </p>
          ) : (
            <div className="space-y-4">
              {byMonth.map(([monthLabel, items]) => (
                <div key={monthLabel}>
                  <div className="mb-2 flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-[#002D24]/60" />
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-[#002D24]/80">
                      {monthLabel}
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {items.map((item) => {
                      const checked = selectedIds.has(item.id);
                      const dt = parseKeyDateToLocalDate(item.date);
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => toggle(item.id)}
                            data-ccd-key-date-row={item.id}
                            className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                              checked
                                ? 'border-[#002D24]/40 bg-[rgba(182,255,126,0.22)]'
                                : 'border-[#E5EDE8] bg-white hover:border-[#002D24]/25 hover:bg-[#F7FAF8]'
                            }`}
                          >
                            <span
                              role="checkbox"
                              aria-checked={checked}
                              className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 ${
                                checked
                                  ? 'border-[#002D24] bg-[#A3E635] text-[#002D24]'
                                  : 'border-[#002D24]/35 bg-white'
                              }`}
                            >
                              {checked ? (
                                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                              ) : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-1.5">
                                <span className="text-sm font-medium text-[#002D24]">
                                  {item.title}
                                </span>
                                {item.keyStage !== 'All' && (
                                  <span className="rounded bg-[#002D24]/8 px-1.5 py-0.5 text-[10px] font-semibold text-[#002D24]">
                                    {item.keyStage}
                                  </span>
                                )}
                                <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-800">
                                  {keyDateKindLabel(item.kind)}
                                </span>
                              </span>
                              <span className="mt-0.5 block text-xs text-gray-600">
                                {format(dt, 'EEE d MMM yyyy')}
                                {item.venue ? ` · ${item.venue}` : ''}
                              </span>
                              {item.description ? (
                                <span className="mt-1 block text-[11px] leading-snug text-gray-500">
                                  {item.description}
                                </span>
                              ) : null}
                              {checked ? (
                                <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#002D24]">
                                  <Bell className="h-3 w-3" />
                                  Remind me to go
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-[#E5EDE8] bg-[#F7FAF8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-gray-600">
            <Star className="mr-1 inline h-3 w-3 text-teal-700" aria-hidden />
            {selected.length} selected · demo reminders only (no email)
          </p>
          <div className="flex gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-[#002D24]/30"
            >
              Cancel
            </button>
            <button
              type="button"
              data-ccd-key-dates-confirm="1"
              disabled={selected.length === 0}
              onClick={handleConfirm}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: '#B6FF7E', color: '#002D24' }}
            >
              <Bell className="h-4 w-4" />
              Add &amp; remind
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface ImportantDatesConfirmPopupProps {
  isOpen: boolean;
  dates: PartnerKeyDateSuggestion[];
  orgId: string | null;
  onClose: () => void;
}

/** Post-confirm popup listing which key dates were suggested / selected. */
export function ImportantDatesConfirmPopup({
  isOpen,
  dates,
  orgId,
  onClose,
}: ImportantDatesConfirmPopupProps) {
  if (!isOpen) return null;
  const shortName = orgId ? getPartnerShortName(orgId) : 'Partner';

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="important-dates-confirm-title"
      data-ccd-important-dates-confirm="1"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-card border border-[#E5EDE8] bg-white shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="border-b border-[#E5EDE8] px-5 py-4"
          style={{ backgroundColor: 'var(--ccd-sage, #F3F6F3)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#002D24]/12"
              style={{ backgroundColor: 'rgba(182, 255, 126, 0.4)' }}
            >
              <Star className="h-4 w-4 text-teal-800" fill="currentColor" />
            </div>
            <div>
              <h3
                id="important-dates-confirm-title"
                className="text-base font-semibold text-[#002D24]"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                Important dates added
              </h3>
              <p className="text-xs text-gray-600">
                From {shortName} · reminder set (demo)
              </p>
            </div>
          </div>
        </div>
        <ul className="max-h-64 space-y-2 overflow-y-auto px-5 py-4">
          {dates.map((d) => {
            const dt = parseKeyDateToLocalDate(d.date);
            return (
              <li
                key={d.id}
                className="flex items-start gap-2 rounded-lg border border-[#E5EDE8] bg-[#F7FAF8] px-3 py-2"
              >
                <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#002D24]">{d.title}</p>
                  <p className="text-xs text-gray-600">
                    {format(dt, 'EEE d MMM yyyy')}
                    {d.keyStage !== 'All' ? ` · ${d.keyStage}` : ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-[#E5EDE8] px-5 py-3">
          <button
            type="button"
            data-ccd-important-dates-confirm-done="1"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 text-sm font-semibold"
            style={{ backgroundColor: '#B6FF7E', color: '#002D24' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
