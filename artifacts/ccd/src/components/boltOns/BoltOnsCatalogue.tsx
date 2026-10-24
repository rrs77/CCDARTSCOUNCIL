import React from 'react';
import {
  ArrowUpRight,
  Pencil,
  Target,
} from 'lucide-react';
import { ADDON_PLANS } from './addonPlans';
import type { BoltOnsPageId } from './types';
import {
  AddonIllustration,
  AddonTierSplit,
  FooterNote,
  requestAddonPlan,
} from './shared';

interface Props {
  onNavigate: (page: BoltOnsPageId) => void;
}

export function BoltOnsCatalogue({ onNavigate }: Props) {
  const assessify = ADDON_PLANS.assessify;
  const peri = ADDON_PLANS.perifeedback;

  return (
    <div className="ccd-boltons">
      <header className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="ccd-studio-eyebrow">
            WORKSPACE / <span>BOLT-ONS</span>
          </p>
          <h1 className="ccd-studio-title">Tools that grow with your teaching.</h1>
          <p className="ccd-studio-sub max-w-xl">
            CCDesigner plans your lessons. These optional bolt-ons help you see progress and share success —
            start free, unlock Full when you need more.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-[#E9E6FF] px-3 py-1.5 text-[12px] font-bold text-[#4338E8]">
          One connected creative teaching toolkit
        </span>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <article
          className="flex flex-col overflow-hidden rounded-[22px] border p-5 shadow-[0_10px_28px_rgba(67,56,232,0.07)] sm:p-6"
          style={{
            borderColor: assessify.accent.border,
            backgroundImage: `linear-gradient(to bottom right, ${assessify.accent.soft}, white)`,
          }}
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D] sm:text-[22px]">
                {assessify.name}
              </h2>
              <p className="mt-0.5 text-[13px] font-semibold" style={{ color: assessify.accent.primary }}>
                {assessify.tagline}
              </p>
            </div>
            <span
              className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ring-1"
              style={{ color: assessify.accent.primary, borderColor: assessify.accent.border }}
            >
              Free + Full
            </span>
          </div>

          <div className="mb-4">
            <AddonIllustration plan={assessify} />
          </div>

          <p className="text-[15px] font-extrabold text-[#1F1B4D]">{assessify.benefitHeadline}</p>
          <ul className="mt-2 space-y-1.5">
            {assessify.featureBullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-[13px] leading-relaxed text-[#77738F]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: assessify.accent.primary }} aria-hidden />
                {bullet}
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <AddonTierSplit
              plan={assessify}
              onFree={() => requestAddonPlan(`${assessify.name} · ${assessify.free.cta}`)}
              onFull={() => requestAddonPlan(`${assessify.name} · ${assessify.full.cta}`)}
            />
          </div>

          <button
            type="button"
            onClick={() => onNavigate('assessify')}
            className="mt-4 text-left text-[12px] font-bold underline-offset-2 hover:underline"
            style={{ color: assessify.accent.primary }}
          >
            Learn more about Assessify →
          </button>
        </article>

        <article
          className="flex flex-col overflow-hidden rounded-[22px] border p-5 shadow-[0_10px_28px_rgba(19,142,136,0.07)] sm:p-6"
          style={{
            borderColor: peri.accent.border,
            backgroundImage: `linear-gradient(to bottom right, ${peri.accent.soft}, white)`,
          }}
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D] sm:text-[22px]">
                {peri.name}
              </h2>
              <p className="mt-0.5 text-[13px] font-semibold" style={{ color: peri.accent.primary }}>
                {peri.tagline}
              </p>
            </div>
            <span
              className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ring-1"
              style={{ color: peri.accent.primary, borderColor: peri.accent.border }}
            >
              Free + Full
            </span>
          </div>

          <div className="mb-4">
            <AddonIllustration plan={peri} />
          </div>

          <p className="text-[15px] font-extrabold text-[#1F1B4D]">{peri.benefitHeadline}</p>
          <ul className="mt-2 space-y-1.5">
            {peri.featureBullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-[13px] leading-relaxed text-[#77738F]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: peri.accent.primary }} aria-hidden />
                {bullet}
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <AddonTierSplit
              plan={peri}
              onFree={() => requestAddonPlan(`${peri.name} · ${peri.free.cta}`)}
              onFull={() => requestAddonPlan(`${peri.name} · ${peri.full.cta}`)}
            />
          </div>

          <button
            type="button"
            onClick={() => onNavigate('perifeedback')}
            className="mt-4 text-left text-[12px] font-bold underline-offset-2 hover:underline"
            style={{ color: peri.accent.primary }}
          >
            Learn more about PeriFeedback →
          </button>
        </article>
      </div>

      <section className="mt-10" aria-labelledby="boltons-built-heading">
        <h2 id="boltons-built-heading" className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D]">
          Built around how teachers actually work
        </h2>
        <p className="mt-1 text-[13px] text-[#77738F]">Useful on their own. Even better alongside CCDesigner.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: <Pencil className="h-4 w-4" />,
              title: 'Keep planning free',
              body: 'CCDesigner stays your free creative lesson planning and resource hub.',
            },
            {
              icon: <Target className="h-4 w-4" />,
              title: 'Make progress visible',
              body: 'Assessify brings assessment criteria, evidence and individual next steps together.',
            },
            {
              icon: <ArrowUpRight className="h-4 w-4" />,
              title: 'Share meaningful updates',
              body: 'PeriFeedback Full turns weekly teaching notes into parent-friendly communication.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#E2E0EF] bg-white p-4 shadow-[0_6px_18px_rgba(31,27,77,0.04)]"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#E9E6FF] text-[#4338E8]">
                {item.icon}
              </span>
              <h3 className="mt-3 text-[14px] font-extrabold text-[#1F1B4D]">{item.title}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-[#77738F]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="boltons-journey-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="boltons-journey-heading" className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D]">
            One connected teaching journey
          </h2>
          <p className="text-[11px] font-semibold text-[#77738F]">Classes come from Settings → My classes</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          {[
            { n: '01', title: 'Plan', product: 'CCDesigner', flow: 'Activities → lessons → units' },
            { n: '02', title: 'Review', product: 'Assessify', flow: 'Assessment → next steps → progress' },
            { n: '03', title: 'Communicate', product: 'PeriFeedback', flow: 'Lesson notes → practice → parents' },
          ].map((step, i) => (
            <React.Fragment key={step.n}>
              <div className="rounded-2xl border border-[#E2E0EF] bg-[#F8F8FD] p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4338E8]">
                  {step.n} · {step.title}
                </p>
                <p className="mt-1 text-[14px] font-extrabold text-[#1F1B4D]">{step.product}</p>
                <p className="mt-0.5 text-[12px] text-[#77738F]">{step.flow}</p>
              </div>
              {i < 2 ? (
                <span className="hidden text-center text-[#C4C0D8] sm:block" aria-hidden>
                  →
                </span>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="mt-10 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#1F1B4D] via-[#2A2468] to-[#4338E8] p-6 text-white sm:p-8">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/70">
          Start free. Add power when you need it.
        </p>
        <h2 className="mt-2 max-w-xl text-[22px] font-extrabold tracking-tight sm:text-[26px]">
          Try the essentials. Unlock Full when your workload grows.
        </h2>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/80">
          Free tiers stay deliberately limited — no AI, no parent messaging, capped classes. Full unlocks the toolkit.
        </p>
        <button
          type="button"
          onClick={() => requestAddonPlan('Compare Free & Full')}
          className="mt-5 inline-flex h-11 items-center rounded-xl bg-white px-4 text-[13px] font-extrabold text-[#1F1B4D] transition hover:bg-[#F4F3FA]"
        >
          Compare Free &amp; Full →
        </button>
      </section>

      <FooterNote />
    </div>
  );
}
