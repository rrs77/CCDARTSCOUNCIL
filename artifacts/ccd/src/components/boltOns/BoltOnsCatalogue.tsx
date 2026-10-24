import React from 'react';
import {
  ArrowUpRight,
  Pencil,
  Target,
} from 'lucide-react';
import type { BoltOnsPageId } from './types';
import { FooterNote, showConceptToast } from './shared';

interface Props {
  onNavigate: (page: BoltOnsPageId) => void;
}

const PILL = 'rounded-full bg-white/80 px-2 py-0.5 text-[13px] font-bold ring-1';

export function BoltOnsCatalogue({ onNavigate }: Props) {
  return (
    <div className="ccd-boltons">
      <header className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="ccd-studio-title !text-[28px] !leading-tight">Tools that grow with your teaching.</h1>
          <p className="ccd-studio-sub !mt-1 max-w-xl !text-[#5F5B7A]">
            CCDesigner plans your lessons. These optional bolt-ons help you see progress and share success.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-[#E9E6FF] px-3 py-1 text-[13px] font-bold text-[#4338E8]">
          One connected creative teaching toolkit
        </span>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="grid gap-4 rounded-2xl border border-[#D9D4FF] bg-gradient-to-br from-[#EFEDFF] to-white p-4 shadow-[0_6px_18px_rgba(67,56,232,0.06)] sm:grid-cols-[1fr_184px] sm:p-5">
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D]">Assessify</h2>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[13px] font-extrabold text-[#4338E8] ring-1 ring-[#D9D4FF]">
                Free + Premium
              </span>
            </div>
            <p className="mt-1 text-[14px] font-bold text-[#1F1B4D]">Assessment without the paperwork.</p>
            <p className="mt-1 text-[13px] leading-snug text-[#5F5B7A]">
              Subject-specific rubrics, meaningful pupil feedback and a clear view of creative progression — with
              powerful AI help in Premium.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('assessify')}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#4338E8] px-4 text-[14px] font-extrabold text-white transition hover:bg-[#3529d1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338E8]"
              >
                Explore Assessify →
              </button>
              <span className={`${PILL} text-[#4338E8] ring-[#D9D4FF]`}>Creative subjects</span>
              <span className={`${PILL} text-[#4338E8] ring-[#D9D4FF]`}>AI in Premium</span>
            </div>
          </div>
          <div
            className="hidden self-start rounded-xl border border-[#D9D4FF] bg-white p-3 sm:block"
            aria-hidden
          >
            <p className="text-[13px] font-extrabold text-[#1F1B4D]">Year 4 · Music</p>
            {[
              { label: 'Rhythm', pct: 81 },
              { label: 'Listening', pct: 70 },
              { label: 'Creating', pct: 89 },
            ].map((row) => (
              <div key={row.label} className="mt-2">
                <div className="flex justify-between text-[13px] font-semibold text-[#1F1B4D]">
                  <span>{row.label}</span>
                  <span>{row.pct}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#EFEDFF]">
                  <div className="h-full rounded-full bg-[#4338E8]" style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="grid gap-4 rounded-2xl border border-[#BFE8E1] bg-gradient-to-br from-[#E9F8F5] to-white p-4 shadow-[0_6px_18px_rgba(19,142,136,0.06)] sm:grid-cols-[1fr_184px] sm:p-5">
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D]">PeriFeedback</h2>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[13px] font-extrabold text-[#0F766E] ring-1 ring-[#BFE8E1]">
                Free + Premium
              </span>
            </div>
            <p className="mt-1 text-[14px] font-bold text-[#1F1B4D]">From a great lesson to a great update.</p>
            <p className="mt-1 text-[13px] leading-snug text-[#5F5B7A]">
              Record what happened, set practice goals and — with Premium — keep parents informed with professional
              lesson updates.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('perifeedback')}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1F1B4D] px-4 text-[14px] font-extrabold text-white transition hover:bg-[#16133a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F1B4D]"
              >
                Explore PeriFeedback →
              </button>
              <span className={`${PILL} text-[#0F766E] ring-[#BFE8E1]`}>Visiting tutors</span>
              <span className={`${PILL} text-[#0F766E] ring-[#BFE8E1]`}>Parent updates in Premium</span>
            </div>
          </div>
          <div
            className="hidden self-start rounded-xl border border-[#BFE8E1] bg-white p-3 sm:block"
            aria-hidden
          >
            <p className="text-[13px] font-extrabold text-[#1F1B4D]">Piano · Week 5</p>
            <p className="mt-1 text-[13px] leading-snug text-[#5F5B7A]">
              Confident right-hand melody and a steadier pulse.
            </p>
            <p className="mt-2 text-[13px] font-bold text-[#0F766E]">✓ Practice goal saved</p>
            <p className="mt-1 rounded-lg bg-[#FFF6DF] px-2 py-1 text-[13px] font-semibold text-[#8A5A00]">
              🔒 Parent update · Premium
            </p>
          </div>
        </article>
      </div>

      <section className="mt-6" aria-labelledby="boltons-built-heading">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="boltons-built-heading" className="text-[16px] font-extrabold tracking-tight text-[#1F1B4D]">
            Built around how teachers actually work
          </h2>
          <p className="text-[13px] text-[#5F5B7A]">Useful on their own. Even better alongside CCDesigner.</p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
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
              body: 'PeriFeedback Premium turns weekly teaching notes into parent-friendly communication.',
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 rounded-xl border border-[#E2E0EF] bg-white p-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9E6FF] text-[#4338E8]">
                {item.icon}
              </span>
              <div className="min-w-0">
                <h3 className="text-[14px] font-extrabold text-[#1F1B4D]">{item.title}</h3>
                <p className="mt-0.5 text-[13px] leading-snug text-[#5F5B7A]">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6" aria-labelledby="boltons-journey-heading">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="boltons-journey-heading" className="text-[16px] font-extrabold tracking-tight text-[#1F1B4D]">
            One connected teaching journey
          </h2>
          <p className="text-[13px] text-[#5F5B7A]">An integration concept, not a current sync claim</p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          {[
            { n: '01', title: 'Plan', product: 'CCDesigner', flow: 'Activities → lessons → units' },
            { n: '02', title: 'Review', product: 'Assessify', flow: 'Assessment → next steps → progress' },
            { n: '03', title: 'Communicate', product: 'PeriFeedback', flow: 'Lesson notes → practice → parents' },
          ].map((step, i) => (
            <React.Fragment key={step.n}>
              <div className="rounded-xl border border-[#E2E0EF] bg-[#F8F8FD] px-3 py-2">
                <p className="text-[13px] text-[#1F1B4D]">
                  <span className="font-extrabold text-[#4338E8]">
                    {step.n} · {step.title}
                  </span>{' '}
                  <span className="font-extrabold">{step.product}</span>
                </p>
                <p className="text-[13px] text-[#5F5B7A]">{step.flow}</p>
              </div>
              {i < 2 ? (
                <span className="hidden text-center text-[#8A86A3] sm:block" aria-hidden>
                  →
                </span>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="mt-6 flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#1F1B4D] via-[#2A2468] to-[#4338E8] p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <h2 className="text-[16px] font-extrabold tracking-tight">
            Start free. Unlock more when your workload grows.
          </h2>
          <p className="mt-0.5 text-[13px] text-white/85">
            No need to move away from CCDesigner, and no need to pay for a tool you do not use.
          </p>
        </div>
        <button
          type="button"
          onClick={() => showConceptToast('Compare plans')}
          className="inline-flex h-11 w-fit shrink-0 items-center rounded-xl bg-white px-4 text-[14px] font-extrabold text-[#1F1B4D] transition hover:bg-[#F4F3FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Compare plans →
        </button>
      </section>

      <FooterNote />
    </div>
  );
}
