import React from 'react';
import {
  BookOpen,
  CalendarDays,
  Check,
  LayoutGrid,
  MapPin,
  Music2,
  Paperclip,
  Pencil,
  Sparkles,
  Target,
} from 'lucide-react';
import { ADDON_PLANS, EXPLORE_COMPARE } from './addonPlans';
import type { BoltOnsPageId } from './types';
import {
  ConceptFooter,
  ExampleTag,
  PremTag,
  ProductIcon,
  YesMark,
  showConceptToast,
} from './shared';

interface Props {
  onNavigate: (page: BoltOnsPageId) => void;
}

function LimitedBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[13px] font-bold text-[#7A4F00]">
      Limited
    </span>
  );
}

function CellValue({
  value,
}: {
  value: 'yes' | 'no' | 'limited' | string;
}) {
  if (value === 'yes') return <YesMark />;
  if (value === 'no') {
    return (
      <span className="font-bold text-[#8A86A3]" aria-label="Not included">
        —
      </span>
    );
  }
  if (value === 'limited') return <LimitedBadge />;
  return <b className="text-[13px] text-[#1F1B4D]">{value}</b>;
}

type CompareRow = (typeof EXPLORE_COMPARE.assessify)[number];

function PlanCompareCard({
  title,
  titleId,
  icon,
  rows,
}: {
  title: string;
  titleId: string;
  icon: React.ReactNode;
  rows: readonly CompareRow[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white shadow-[0_12px_32px_rgba(31,27,77,0.05)]">
      <div className="flex items-center gap-2 border-b border-[#EEEDF6] bg-[#FAFAFD] px-4 py-2.5 text-[13px] font-extrabold uppercase tracking-wide text-[#4338E8]">
        {icon}
        <span id={titleId}>{title}</span>
      </div>
      <table className="w-full border-collapse" aria-labelledby={titleId}>
        <thead>
          <tr>
            <th scope="col" className="px-4 py-2.5 text-left text-[14px] font-bold text-[#1F1B4D]">
              Feature
            </th>
            <th scope="col" className="px-3 py-2.5 text-center text-[14px] font-bold text-[#1F1B4D]">
              Free
            </th>
            <th
              scope="col"
              className="bg-[#F1EFFF] px-3 py-2.5 text-center text-[14px] font-bold text-[#1F1B4D] shadow-[inset_0_3px_0_#4338E8]"
            >
              Premium <ExampleTag>Price not set</ExampleTag>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-t border-[#F0EFF7]">
              <td className="px-4 py-2.5 text-[13px] text-[#1F1B4D]">{row.feature}</td>
              <td className="px-3 py-2.5 text-center">
                <CellValue value={row.free} />
              </td>
              <td className="bg-[#F7F6FF] px-3 py-2.5 text-center">
                <CellValue value={row.premium} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BoltOnsCatalogue({ onNavigate }: Props) {
  return (
    <div>
      {/* Hero — CCDesigner stays free */}
      <section
        className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1F1B4D] via-[#2E2878] to-[#4338E8] px-5 py-6 text-white shadow-[0_16px_40px_rgba(31,27,77,0.18)] sm:px-7 sm:py-6"
        aria-labelledby="boltons-hero-title"
      >
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[13px] font-bold">
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
          Always free
        </span>
        <h1 id="boltons-hero-title" className="text-[28px] font-extrabold leading-tight tracking-tight">
          CCDesigner is free.
        </h1>
        <p className="mt-1 max-w-xl text-[15px] leading-snug text-[#E4E2F7]">
          Plan every arts lesson at no cost. Add a bolt-on only when you want to track progress or keep parents in
          the loop.
        </p>
        <div
          className="mt-4 grid max-w-md grid-cols-2 gap-2"
          aria-label="Included free"
        >
          {[
            { icon: CalendarDays, label: 'Week planner' },
            { icon: Pencil, label: 'Lesson builder' },
            { icon: BookOpen, label: 'Activity library' },
            { icon: MapPin, label: 'Partner hubs' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[13px] font-semibold"
            >
              <item.icon className="h-4 w-4 shrink-0 text-[#C8F542]" aria-hidden />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <h2 className="text-[18px] font-extrabold tracking-tight text-[#1F1B4D]">Bolt-ons</h2>
        <p className="text-[13px] text-[#5F5B7A]">Optional tools that work alongside your planner.</p>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        {/* Assessify card */}
        <article className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white shadow-[0_12px_32px_rgba(31,27,77,0.06)] lg:grid lg:grid-cols-[5fr_6fr]">
          <div
            className="hidden border-b border-[#EEEDF6] bg-gradient-to-b from-[#EFEDFF] to-white p-4 sm:block lg:border-b-0 lg:border-r"
            aria-hidden
          >
            <div className="overflow-hidden rounded-xl border border-[#E2E0EF] bg-white">
              <div className="flex items-center gap-2 border-b border-[#EEEDF6] bg-[#FAFAFD] px-3.5 py-2.5 text-[13px] font-bold text-[#1F1B4D]">
                <span>Year 4 · Music</span>
                <span className="ml-auto">
                  <ExampleTag />
                </span>
              </div>
              <div className="grid gap-3 p-3.5">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Rhythm', pct: 81 },
                    { label: 'Creating', pct: 89 },
                  ].map((row) => (
                    <div key={row.label} className="rounded-xl border border-[#EEEDF6] p-2.5">
                      <span className="text-[13px] text-[#5F5B7A]">{row.label}</span>
                      <b className="mt-0.5 block text-[18px] font-extrabold tracking-tight text-[#1F1B4D]">
                        {row.pct}%
                      </b>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#EFEDFF]">
                        <div className="h-full rounded-full bg-[#4338E8]" style={{ width: `${row.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-[#EFEDFF] px-3 py-2.5 text-[13px] font-semibold text-[#3730A3]">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Next steps for 3 pupils
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <ProductIcon variant="assessify" />
              <div>
                <h3 className="text-[20px] font-extrabold text-[#1F1B4D]">{ADDON_PLANS.assessify.name}</h3>
                <p className="text-[13px] text-[#5F5B7A]">{ADDON_PLANS.assessify.tagline}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {[
                { icon: Check, title: 'Subject-specific rubrics', sub: 'Music, drama, dance and art criteria' },
                { icon: Paperclip, title: 'Evidence in one place', sub: 'Photos, audio and notes per pupil' },
                { icon: Sparkles, title: 'Next steps with AI', sub: 'Suggested per pupil in Premium' },
              ].map((b) => (
                <li key={b.title} className="flex items-center gap-3 text-[13px]">
                  <span className="inline-grid h-8 w-8 place-items-center rounded-[10px] bg-[#EFEDFF] text-[#4338E8]">
                    <b.icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <span>
                    <b className="font-extrabold text-[#1F1B4D]">{b.title}</b>
                    <span className="text-[#5F5B7A]"> · {b.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#EEEDF6] pt-3">
              <PremTag />
              <button
                type="button"
                onClick={() => onNavigate('assessify')}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#4338E8] px-4 text-[14px] font-bold text-white shadow-[0_6px_16px_rgba(67,56,232,0.3)] hover:bg-[#3529d1]"
              >
                Explore Assessify →
              </button>
            </div>
          </div>
        </article>

        {/* PeriFeedback card */}
        <article className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white shadow-[0_12px_32px_rgba(31,27,77,0.06)] lg:grid lg:grid-cols-[5fr_6fr]">
          <div
            className="hidden border-b border-[#EEEDF6] bg-gradient-to-b from-[#E6F6F3] to-white p-4 sm:block lg:border-b-0 lg:border-r"
            aria-hidden
          >
            <div className="overflow-hidden rounded-xl border border-[#E2E0EF] bg-white">
              <div className="flex items-center gap-2 border-b border-[#EEEDF6] bg-[#FAFAFD] px-3.5 py-2.5 text-[13px] font-bold text-[#1F1B4D]">
                <span>Lesson note · Piano</span>
                <span className="ml-auto">
                  <ExampleTag />
                </span>
              </div>
              <div className="grid gap-3 p-3.5">
                <div>
                  <p className="mb-1 text-[13px] font-semibold text-[#5F5B7A]">What went well</p>
                  <p className="rounded-[10px] border border-[#D9D4FF] bg-white px-3 py-2.5 text-[13px] leading-snug text-[#1F1B4D]">
                    Steadier pulse and a confident right hand.
                  </p>
                </div>
                <p className="flex items-center gap-2 text-[13px] font-bold text-[#166534]">
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                  Practice goal saved
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <ProductIcon variant="perifeedback" />
              <div>
                <h3 className="text-[20px] font-extrabold text-[#1F1B4D]">{ADDON_PLANS.perifeedback.name}</h3>
                <p className="text-[13px] text-[#5F5B7A]">{ADDON_PLANS.perifeedback.tagline}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {[
                { icon: Pencil, title: 'Lesson notes in a minute', sub: 'Quick to fill between lessons' },
                { icon: Target, title: 'Practice goals', sub: 'Set and track week to week' },
                { icon: Music2, title: 'Parent updates', sub: 'Friendly summaries in Premium' },
              ].map((b) => (
                <li key={b.title} className="flex items-center gap-3 text-[13px]">
                  <span className="inline-grid h-8 w-8 place-items-center rounded-[10px] bg-[#E6F6F3] text-[#0F766E]">
                    <b.icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <span>
                    <b className="font-extrabold text-[#1F1B4D]">{b.title}</b>
                    <span className="text-[#5F5B7A]"> · {b.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#EEEDF6] pt-3">
              <PremTag />
              <button
                type="button"
                onClick={() => onNavigate('perifeedback')}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0F766E] px-4 text-[14px] font-bold text-white shadow-[0_6px_16px_rgba(15,118,110,0.3)] hover:bg-[#0c5f59]"
              >
                Explore PeriFeedback →
              </button>
            </div>
          </div>
        </article>
      </div>

      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <h2 id="cmp" className="text-[18px] font-extrabold tracking-tight text-[#1F1B4D]">
          Free vs Premium
        </h2>
        <p className="text-[13px] text-[#5F5B7A]">CCDesigner itself stays free on every plan.</p>
      </div>

      {/* Two side-by-side plan cards; stack below 900px so neither table is clipped. */}
      <div
        className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2"
        role="region"
        aria-labelledby="cmp"
        data-plans-compare="two-column"
      >
        <PlanCompareCard
          title="Assessify"
          titleId="cmp-assessify"
          icon={<LayoutGrid className="h-4 w-4" aria-hidden />}
          rows={EXPLORE_COMPARE.assessify}
        />
        <PlanCompareCard
          title="PeriFeedback"
          titleId="cmp-perifeedback"
          icon={<Music2 className="h-4 w-4" aria-hidden />}
          rows={EXPLORE_COMPARE.perifeedback}
        />
      </div>

      <ConceptFooter />
      <button
        type="button"
        className="sr-only"
        onClick={() => showConceptToast('Compare plans')}
      >
        Compare plans
      </button>
    </div>
  );
}
