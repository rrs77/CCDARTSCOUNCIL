import React from 'react';
import toast from 'react-hot-toast';
import {
  BarChart3,
  LayoutGrid,
  Music2,
  Sparkles,
} from 'lucide-react';
import type { BoltOnsPageId, FeatureStatus } from './types';

export const CONCEPT_TOAST =
  'Concept only — no live billing or checkout yet. Connect this action to a real account and subscription flow when entitlements exist.';

export function showConceptToast(actionLabel?: string): void {
  toast(actionLabel ? `${actionLabel} · ${CONCEPT_TOAST}` : CONCEPT_TOAST, {
    duration: 5200,
  });
}

export function StatusPill({
  status,
  children,
}: {
  status: FeatureStatus;
  children: React.ReactNode;
}) {
  const styles: Record<FeatureStatus, string> = {
    available: 'bg-[#E9E6FF] text-[#4338E8]',
    proposed: 'bg-[#FFF6DF] text-[#8A5A00]',
    roadmap: 'bg-[#FFF6DF] text-[#8A5A00]',
    'core-upgrade': 'bg-[#D5F3EA] text-[#0F766E]',
    limit: 'bg-[#FFF1C2] text-[#92400E]',
  };
  const labels: Partial<Record<FeatureStatus, string>> = {
    proposed: 'Proposed',
    roadmap: 'Roadmap',
    'core-upgrade': 'Core upgrade',
    limit: 'Proposed limit',
  };
  const text = children ?? labels[status] ?? status;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${styles[status]}`}
    >
      {text}
    </span>
  );
}

export function FeatureRow({
  included,
  label,
  status,
}: {
  included: boolean;
  label: string;
  status?: FeatureStatus;
}) {
  return (
    <li className="flex items-start gap-2.5 text-[13px] leading-snug text-[#1F1B4D]">
      <span
        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
          included ? 'bg-[#E9E6FF] text-[#4338E8]' : 'bg-[#F3F2F8] text-[#9A96B0]'
        }`}
        aria-hidden
      >
        {included ? '✓' : '—'}
      </span>
      <span className="min-w-0 flex-1">
        <span className={included ? '' : 'text-[#77738F]'}>{label}</span>
        {status && status !== 'available' ? (
          <>
            {' '}
            <StatusPill status={status}>{null}</StatusPill>
          </>
        ) : null}
      </span>
    </li>
  );
}

const SWITCHER: {
  id: BoltOnsPageId;
  label: string;
  hint: string;
  Icon: typeof Sparkles;
  on: string;
  off: string;
  chipOn: string;
  chipOff: string;
}[] = [
  {
    id: 'bolt-ons',
    label: 'Explore bolt-ons',
    hint: 'Do more with your teaching',
    Icon: Sparkles,
    on: 'bg-[#1F1B4D] text-white shadow-[0_10px_24px_-14px_rgba(31,27,77,0.7)]',
    off: 'bg-white text-[#1F1B4D] ring-1 ring-[#E2E0EF] hover:bg-[#F4F3FA]',
    chipOn: 'bg-white/15',
    chipOff: 'bg-[#E9E6FF] text-[#4338E8]',
  },
  {
    id: 'assessify',
    label: 'Assessify',
    hint: 'Assessment & progress',
    Icon: LayoutGrid,
    on: 'bg-[#4338E8] text-white shadow-[0_10px_24px_-14px_rgba(67,56,232,0.55)]',
    off: 'bg-white text-[#1F1B4D] ring-1 ring-[#E2E0EF] hover:bg-[#F4F3FA]',
    chipOn: 'bg-white/20',
    chipOff: 'bg-[#E9E6FF] text-[#4338E8]',
  },
  {
    id: 'perifeedback',
    label: 'PeriFeedback',
    hint: 'Peripatetic teaching',
    Icon: Music2,
    on: 'bg-[#1F1B4D] text-white shadow-[0_10px_24px_-14px_rgba(31,27,77,0.7)]',
    off: 'bg-white text-[#1F1B4D] ring-1 ring-[#E2E0EF] hover:bg-[#F4F3FA]',
    chipOn: 'bg-white/20',
    chipOff: 'bg-[#D5F3EA] text-[#0F766E]',
  },
];

export function BoltOnsSwitcher({
  active,
  onNavigate,
}: {
  active: BoltOnsPageId;
  onNavigate: (page: BoltOnsPageId) => void;
}) {
  return (
    <div role="tablist" aria-label="Bolt-ons sections" className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {SWITCHER.map((tab) => {
        const selected = active === tab.id;
        const Icon = tab.Icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onNavigate(tab.id)}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition sm:px-5 ${
              selected ? tab.on : tab.off
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                selected ? tab.chipOn : tab.chipOff
              }`}
              aria-hidden
            >
              <Icon className={`h-5 w-5 ${selected ? 'text-white' : ''}`} strokeWidth={2.25} />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-extrabold tracking-tight">{tab.label}</span>
              <span className={`mt-0.5 block text-[12px] font-medium ${selected ? 'text-white/80' : 'text-[#77738F]'}`}>
                {tab.hint}
              </span>
            </span>
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
    <nav aria-label="Breadcrumb" className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#77738F]">
      <span>Your tools</span>
      <span className="mx-1.5 text-[#C4C0D8]" aria-hidden>
        &gt;
      </span>
      {onCatalogue ? (
        <button
          type="button"
          onClick={onCatalogue}
          className="text-[#4338E8] underline-offset-2 hover:underline"
        >
          + Bolt-ons
        </button>
      ) : (
        <span className="text-[#1F1B4D]">{pageLabel}</span>
      )}
      {onCatalogue ? (
        <>
          <span className="mx-1.5 text-[#C4C0D8]" aria-hidden>
            &gt;
          </span>
          <span className="text-[#1F1B4D]">{pageLabel}</span>
        </>
      ) : null}
    </nav>
  );
}

export function SampleLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#77738F]">
      {children}
    </p>
  );
}

export function FooterNote() {
  return (
    <footer className="mt-10 flex flex-col gap-1 border-t border-[#E2E0EF] pt-5 text-[11px] text-[#77738F] sm:flex-row sm:items-start sm:justify-between">
      <p>© CCDesigner 2026 · Bolt-ons concept · Not a live subscription or payment page</p>
      <p className="sm:text-right">Premium availability, usage limits and prices require product approval.</p>
    </footer>
  );
}

export function AssessifyMiniDashboard() {
  return (
    <div className="rounded-2xl border border-[#D9D4FF] bg-white/90 p-4 shadow-[0_8px_24px_rgba(67,56,232,0.08)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <SampleLabel>Year 4 · Music</SampleLabel>
          <p className="mt-0.5 text-[12px] font-extrabold text-[#1F1B4D]">Progress snapshot</p>
        </div>
        <BarChart3 className="h-4 w-4 text-[#4338E8]" aria-hidden />
      </div>
      {[
        { label: 'Rhythm', pct: 81 },
        { label: 'Listening', pct: 70 },
        { label: 'Creating', pct: 89 },
      ].map((row) => (
        <div key={row.label} className="mb-2.5 last:mb-0">
          <div className="mb-1 flex justify-between text-[11px] font-bold text-[#1F1B4D]">
            <span>{row.label}</span>
            <span>{row.pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#EFEDFF]">
            <div className="h-full rounded-full bg-[#4338E8]" style={{ width: `${row.pct}%` }} />
          </div>
        </div>
      ))}
      <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#EFEDFF] px-2.5 py-1.5 text-[11px] font-semibold text-[#4338E8]">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        AI-assisted next-step suggestions
        <span className="ml-auto rounded bg-[#4338E8] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
          Pro
        </span>
      </p>
    </div>
  );
}

export function PeriFeedbackMiniNote() {
  return (
    <div className="rounded-2xl border border-[#BFE8E1] bg-white/90 p-4 shadow-[0_8px_24px_rgba(19,142,136,0.08)]">
      <div className="mb-2 flex items-center justify-between">
        <SampleLabel>Weekly lesson note</SampleLabel>
        <span className="rounded-full bg-[#D5F3EA] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#0F766E]">
          Piano
        </span>
      </div>
      <p className="text-[11px] font-bold text-[#77738F]">Monday · Week 5</p>
      <p className="mt-2 text-[12px] font-extrabold text-[#1F1B4D]">What went well</p>
      <p className="mt-0.5 text-[12px] leading-snug text-[#77738F]">
        Confident right-hand melody and a steadier pulse.
      </p>
      <p className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-[#0F766E]">
        <span aria-hidden>✓</span> Practice goal saved
      </p>
      <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#FFF6DF] px-2.5 py-1.5 text-[11px] font-semibold text-[#8A5A00]">
        <span aria-hidden>🔒</span> Parent update requires Premium
      </p>
    </div>
  );
}
