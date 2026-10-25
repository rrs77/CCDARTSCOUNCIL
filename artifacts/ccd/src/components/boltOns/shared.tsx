import React from 'react';
import toast from 'react-hot-toast';
import { Check, LayoutGrid, Music2, Sparkles } from 'lucide-react';
import type { BoltOnsPageId } from './types';

export const CONCEPT_TOAST =
  'Concept only — no live billing or checkout yet. Prices and Premium availability are not set.';

export function showConceptToast(actionLabel?: string): void {
  toast(actionLabel ? `${actionLabel} · ${CONCEPT_TOAST}` : CONCEPT_TOAST, {
    duration: 5200,
  });
}

export function ExampleTag({ children = 'Example' }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#FFF6DF] px-2.5 py-0.5 text-[13px] font-bold text-[#7A4F00]">
      {children}
    </span>
  );
}

export function PremTag({ children = 'Free + Premium' }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#E9E6FF] px-2.5 py-0.5 text-[13px] font-bold text-[#3730A3]">
      {children}
    </span>
  );
}

export function FreeTag() {
  return (
    <span className="inline-flex items-center rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[13px] font-bold text-[#166534]">
      Free
    </span>
  );
}

export function PremiumTag() {
  return (
    <span className="inline-flex items-center rounded-full bg-[#E9E6FF] px-2.5 py-0.5 text-[13px] font-bold text-[#3730A3]">
      Premium
    </span>
  );
}

export function PricePlaceholder() {
  return (
    <span className="inline-flex items-center rounded-full bg-[#FFF6DF] px-2.5 py-0.5 text-[13px] font-bold text-[#7A4F00]">
      Price: example — not set
    </span>
  );
}

export function YesMark() {
  return (
    <span
      className="inline-grid h-6 w-6 place-items-center rounded-full bg-[#DCFCE7] text-[#166534]"
      role="img"
      aria-label="Included"
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
    </span>
  );
}

const SWITCHER: {
  id: BoltOnsPageId;
  label: string;
}[] = [
  { id: 'bolt-ons', label: 'Explore' },
  { id: 'assessify', label: 'Assessify' },
  { id: 'perifeedback', label: 'PeriFeedback' },
];

/** Compact segmented control matching approved mockups (13px+). */
export function BoltOnsSwitcher({
  active,
  onNavigate,
}: {
  active: BoltOnsPageId;
  onNavigate: (page: BoltOnsPageId) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Bolt-ons sections"
      className="inline-flex w-full gap-1 rounded-xl border border-[#E2E0EF] bg-white p-1 shadow-[0_1px_2px_rgba(31,27,77,0.04)] sm:w-auto"
    >
      {SWITCHER.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onNavigate(tab.id)}
            className={`flex min-h-9 flex-1 items-center justify-center rounded-lg px-3.5 text-[13px] font-bold transition sm:flex-none ${
              selected ? 'bg-[#1F1B4D] text-white' : 'text-[#5F5B7A] hover:bg-[#F4F3FA]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function BoltOnsBreadcrumb({
  pageLabel,
  onCatalogue,
}: {
  pageLabel: string;
  onCatalogue?: () => void;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#5F5B7A]"
    >
      <span>Your tools</span>
      <span className="mx-1.5 text-[#C4C0D8]" aria-hidden>
        /
      </span>
      {onCatalogue ? (
        <button
          type="button"
          onClick={onCatalogue}
          className="text-[#4338E8] underline-offset-2 hover:underline"
        >
          Bolt-ons
        </button>
      ) : (
        <span className="text-[#4338E8]">Bolt-ons</span>
      )}
      {onCatalogue ? (
        <>
          <span className="mx-1.5 text-[#C4C0D8]" aria-hidden>
            /
          </span>
          <span className="text-[#1F1B4D] normal-case tracking-normal">{pageLabel}</span>
        </>
      ) : null}
    </nav>
  );
}

export function ConceptFooter() {
  return (
    <p className="mt-4 text-[13px] leading-relaxed text-[#5F5B7A]">
      Concept mockup. Prices, limits and Premium availability are not set — anything marked{' '}
      <ExampleTag /> is a placeholder, and preview data is illustrative.
    </p>
  );
}

export function TierCheck({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-[13px] font-medium text-[#1F1B4D]">
      <Check className="h-[18px] w-[18px] shrink-0 text-[#166534]" strokeWidth={2.5} aria-hidden />
      <span>{children}</span>
    </li>
  );
}

export function ProductIcon({
  variant,
}: {
  variant: 'assessify' | 'perifeedback' | 'explore';
}) {
  const Icon = variant === 'assessify' ? LayoutGrid : variant === 'perifeedback' ? Music2 : Sparkles;
  const bg = variant === 'assessify' ? '#4338E8' : variant === 'perifeedback' ? '#0F766E' : '#1F1B4D';
  return (
    <span
      className="inline-grid h-11 w-11 place-items-center rounded-xl text-white shadow-[0_6px_14px_rgba(31,27,77,0.18)]"
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      <Icon className="h-5 w-5" strokeWidth={2.25} />
    </span>
  );
}
