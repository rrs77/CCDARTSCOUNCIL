import React from 'react';
import {
  BarChart3,
  CheckSquare,
  FileText,
  Paperclip,
  Sparkles,
  Users,
} from 'lucide-react';
import { ADDON_PLANS } from './addonPlans';
import {
  ConceptFooter,
  ExampleTag,
  FreeTag,
  PremTag,
  PremiumTag,
  PricePlaceholder,
  ProductIcon,
  TierCheck,
  showConceptToast,
} from './shared';

const FEATURES = [
  { icon: CheckSquare, title: 'Subject rubrics', body: 'Ready-made criteria for each creative subject.' },
  { icon: Paperclip, title: 'Evidence capture', body: 'Attach photos, audio and notes to each pupil.' },
  { icon: BarChart3, title: 'Class progression', body: 'See where every class is at a glance.' },
  { icon: Users, title: 'Pupil profiles', body: 'One record per pupil across the year.' },
  { icon: FileText, title: 'Class summaries', body: 'Export a summary for leaders or reports.' },
  { icon: Sparkles, title: 'AI next steps', body: 'Suggested next steps per pupil (Premium).' },
];

export function AssessifyPage() {
  const plan = ADDON_PLANS.assessify;

  return (
    <div>
      <section
        className="mb-5 grid items-center gap-5 overflow-hidden rounded-2xl border border-[#E2E0EF] bg-gradient-to-br from-[#EFEDFF] to-white p-4 shadow-[0_12px_32px_rgba(31,27,77,0.05)] sm:p-5 lg:grid-cols-[4fr_7fr] lg:gap-7 lg:p-6"
        aria-labelledby="assessify-hero-title"
      >
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <ProductIcon variant="assessify" />
            <PremTag />
          </div>
          <h1
            id="assessify-hero-title"
            className="text-[28px] font-extrabold leading-tight tracking-tight text-[#1F1B4D]"
          >
            {plan.benefitHeadline}
          </h1>
          <p className="mt-1 max-w-md text-[15px] leading-snug text-[#3F3B5C]">{plan.lede}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => showConceptToast('Start Assessify free')}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#4338E8] px-4 text-[14px] font-bold text-white shadow-[0_6px_16px_rgba(67,56,232,0.25)] hover:bg-[#3529d1]"
            >
              Start Assessify free →
            </button>
            <span className="text-[13px] text-[#5F5B7A]">No card needed to start</span>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white shadow-[0_24px_48px_rgba(31,27,77,0.12)]"
          aria-label="Assessify preview with example data"
        >
          <div className="flex items-center gap-1.5 border-b border-[#EEEDF6] bg-[#FAFAFD] px-3.5 py-2.5 text-[13px] font-bold text-[#1F1B4D]">
            <span className="h-2 w-2 rounded-full bg-[#E2E0EF]" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-[#E2E0EF]" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-[#E2E0EF]" aria-hidden />
            <span className="ml-2">Year 4 · Music · Autumn 2</span>
            <span className="ml-auto">
              <ExampleTag>Example data</ExampleTag>
            </span>
          </div>
          <div className="grid gap-3.5 p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Rhythm', pct: 81 },
                { label: 'Listening', pct: 70 },
                { label: 'Creating', pct: 89 },
              ].map((k) => (
                <div key={k.label} className="rounded-xl border border-[#EEEDF6] p-2.5">
                  <span className="text-[13px] text-[#5F5B7A]">{k.label}</span>
                  <b className="mt-0.5 block text-[18px] font-extrabold tracking-tight">{k.pct}%</b>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#EFEDFF]">
                    <div className="h-full rounded-full bg-[#4338E8]" style={{ width: `${k.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="text-left text-[#5F5B7A]">
                    <th className="px-3 py-2 font-bold">Pupil</th>
                    <th className="px-3 py-2 font-bold">Rhythm</th>
                    <th className="px-3 py-2 font-bold">Creating</th>
                    <th className="hidden px-3 py-2 font-bold sm:table-cell">Next step</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { p: 'Pupil A', r: 'Secure', c: 'Greater depth', n: 'Lead the ostinato', rc: 'l2', cc: 'l3' },
                    { p: 'Pupil B', r: 'Emerging', c: 'Secure', n: 'Keep a steady pulse', rc: 'l1', cc: 'l2' },
                    { p: 'Pupil C', r: 'Secure', c: 'Emerging', n: 'Try a 4-beat motif', rc: 'l2', cc: 'l1' },
                  ].map((row) => (
                    <tr key={row.p} className="border-t border-[#F0EFF7]">
                      <td className="px-3 py-2 font-bold">{row.p}</td>
                      <td className="px-3 py-2">
                        <Lvl tone={row.rc}>{row.r}</Lvl>
                      </td>
                      <td className="px-3 py-2">
                        <Lvl tone={row.cc}>{row.c}</Lvl>
                      </td>
                      <td className="hidden px-3 py-2 text-[#5F5B7A] sm:table-cell">{row.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#EFEDFF] px-3 py-2.5 text-[13px] font-semibold text-[#3730A3]">
              <Sparkles className="h-4 w-4" aria-hidden />
              AI-suggested next steps ready for 3 pupils
              <span className="ml-auto">
                <PremTag>Premium</PremTag>
              </span>
            </div>
          </div>
        </div>
      </section>

      <h2 className="mb-3 text-[18px] font-extrabold tracking-tight text-[#1F1B4D]">What you can do</h2>
      <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex items-center gap-3 rounded-xl border border-[#E2E0EF] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(31,27,77,0.04)]"
          >
            <span className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EFEDFF] text-[#4338E8]">
              <f.icon className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-[14px] font-extrabold text-[#1F1B4D]">{f.title}</h3>
              <p className="text-[13px] leading-snug text-[#5F5B7A]">{f.body}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-[18px] font-extrabold tracking-tight text-[#1F1B4D]">Free and Premium</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E2E0EF] bg-white p-4 sm:p-5">
          <FreeTag />
          <h3 className="mt-2 text-[16px] font-extrabold text-[#1F1B4D]">{plan.free.title}</h3>
          <ul className="mt-2.5 space-y-1.5">
            {plan.free.features.map((f) => (
              <TierCheck key={f}>{f}</TierCheck>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => showConceptToast('Add Assessify free')}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#E9E6FF] text-[14px] font-bold text-[#4338E8] hover:bg-[#D9D4FF]"
          >
            Add free version
          </button>
        </div>
        <div className="rounded-2xl border border-[#C9C2FF] bg-gradient-to-b from-[#F7F6FF] to-white p-4 shadow-[inset_0_0_0_1px_#C9C2FF] sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <PremiumTag />
            <PricePlaceholder />
          </div>
          <h3 className="mt-2 text-[16px] font-extrabold text-[#1F1B4D]">{plan.premium.title}</h3>
          <ul className="mt-2.5 space-y-1.5">
            {plan.premium.features.map((f) => (
              <TierCheck key={f}>{f}</TierCheck>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => showConceptToast('Get Assessify Premium')}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#4338E8] text-[14px] font-bold text-white hover:bg-[#3529d1]"
          >
            Get full version →
          </button>
        </div>
      </div>

      <ConceptFooter />
    </div>
  );
}

function Lvl({ tone, children }: { tone: string; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    l1: 'bg-[#FEF3C7] text-[#7A4F00]',
    l2: 'bg-[#E9E6FF] text-[#3730A3]',
    l3: 'bg-[#DCFCE7] text-[#166534]',
  };
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[13px] font-bold ${styles[tone] || styles.l2}`}>
      {children}
    </span>
  );
}
