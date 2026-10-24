import React from 'react';
import toast from 'react-hot-toast';
import {
  Check,
  LayoutGrid,
  Minus,
  Music2,
  Sparkles,
} from 'lucide-react';
import type { AddonPlanDefinition, AddonPlanFeature } from './addonPlans';
import type { BoltOnsPageId, FeatureStatus } from './types';

export const CONCEPT_TOAST =
  'Concept only — no live billing or checkout yet. Connect this action to a real account and subscription flow when entitlements exist.';

export function showConceptToast(actionLabel?: string): void {
  toast(actionLabel ? `${actionLabel} · ${CONCEPT_TOAST}` : CONCEPT_TOAST, {
    duration: 5200,
  });
}

/** Placeholder contact / interest flow until billing exists. */
export function requestAddonPlan(actionLabel: string): void {
  showConceptToast(actionLabel);
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

function PlanFeatureLine({
  feature,
  accent,
}: {
  feature: AddonPlanFeature;
  accent: string;
}) {
  return (
    <li className="flex items-start gap-2 text-[12px] leading-snug text-[#1F1B4D]">
      <span
        className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
          feature.included ? '' : 'bg-[#F3F2F8] text-[#9A96B0]'
        }`}
        style={feature.included ? { backgroundColor: `${accent}22`, color: accent } : undefined}
        aria-hidden
      >
        {feature.included ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : <Minus className="h-2.5 w-2.5" />}
      </span>
      <span className={feature.included ? '' : 'text-[#77738F]'}>{feature.label}</span>
    </li>
  );
}

/** Icon illustration block — replaces fake pupil/progress mock data. */
export function AddonIllustration({
  plan,
}: {
  plan: AddonPlanDefinition;
}) {
  const Icon = plan.id === 'assessify' ? LayoutGrid : Music2;
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border bg-white/90 p-4"
      style={{ borderColor: plan.accent.border }}
      aria-hidden
    >
      <span
        className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_8px_20px_rgba(31,27,77,0.12)]"
        style={{ backgroundColor: plan.accent.primary }}
      >
        <Icon className="h-7 w-7" strokeWidth={2.25} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: plan.accent.primary }}>
          Optional bolt-on
        </p>
        <p className="mt-0.5 text-[14px] font-extrabold text-[#1F1B4D]">{plan.name}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-[#77738F]">{plan.tagline}</p>
      </div>
    </div>
  );
}

/** Free vs Full split with dual CTAs — sales surface, no sample pupil data. */
export function AddonTierSplit({
  plan,
  onFree,
  onFull,
}: {
  plan: AddonPlanDefinition;
  onFree: () => void;
  onFull: () => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col rounded-2xl border border-[#E2E0EF] bg-white p-4">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#77738F]">
          {plan.free.title}
        </p>
        <p className="mt-1 text-[13px] font-extrabold text-[#1F1B4D]">{plan.free.summary}</p>
        <ul className="mt-3 flex-1 space-y-2">
          {plan.free.features.map((f) => (
            <PlanFeatureLine key={f.id} feature={f} accent={plan.accent.primary} />
          ))}
        </ul>
        <button
          type="button"
          onClick={onFree}
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl px-3 text-[12px] font-extrabold transition hover:opacity-90"
          style={{ backgroundColor: plan.accent.ring, color: plan.accent.primary }}
        >
          {plan.free.cta}
        </button>
      </div>
      <div
        className="relative flex flex-col rounded-2xl border-2 bg-gradient-to-b to-white p-4 shadow-[0_10px_24px_rgba(31,27,77,0.06)]"
        style={{ borderColor: plan.accent.primary, backgroundImage: `linear-gradient(to bottom, ${plan.accent.soft}, white)` }}
      >
        <span
          className="absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white"
          style={{ backgroundColor: plan.accent.primary }}
        >
          Full toolkit
        </span>
        <p className="text-[12px] font-extrabold uppercase tracking-[0.1em]" style={{ color: plan.accent.primary }}>
          {plan.full.title}
        </p>
        <p className="mt-1 text-[13px] font-extrabold text-[#1F1B4D]">{plan.full.summary}</p>
        <ul className="mt-3 flex-1 space-y-2">
          {plan.full.features.map((f) => (
            <PlanFeatureLine key={f.id} feature={f} accent={plan.accent.primary} />
          ))}
        </ul>
        <button
          type="button"
          onClick={onFull}
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl px-3 text-[12px] font-extrabold text-white transition hover:opacity-95"
          style={{ backgroundColor: plan.accent.primary }}
        >
          {plan.full.cta} →
        </button>
      </div>
    </div>
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
      <span>Workspace</span>
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

export function FooterNote() {
  return (
    <footer className="mt-10 flex flex-col gap-1 border-t border-[#E2E0EF] pt-5 text-[11px] text-[#77738F] sm:flex-row sm:items-start sm:justify-between">
      <p>© CCDesigner 2026 · Bolt-ons concept · Not a live subscription or payment page</p>
      <p className="sm:text-right">Free vs Full limits are proposed defaults — adjust in addonPlans.ts before launch.</p>
    </footer>
  );
}
