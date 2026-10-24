import React from 'react';
import {
  FileText,
  Mail,
  Pencil,
  Smartphone,
  Target,
  Users,
} from 'lucide-react';
import { ADDON_PLANS } from './addonPlans';
import { periFeedbackAllowsParentContact } from './entitlements';
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
  { icon: Pencil, title: 'Quick lesson notes', body: 'Capture what went well in under a minute.' },
  { icon: Target, title: 'Practice goals', body: 'Set and track goals week to week.' },
  { icon: Smartphone, title: 'Works on your phone', body: 'Fill notes between lessons.' },
  { icon: Users, title: 'Pupil history', body: 'Every note for a pupil in one timeline.' },
  { icon: FileText, title: 'Termly summaries', body: "Pull a term's notes together (Premium)." },
  { icon: Mail, title: 'Parent updates', body: 'Friendly, professional emails (Premium).' },
];

export function PeriFeedbackPage() {
  const plan = ADDON_PLANS.perifeedback;
  const canContactParents = periFeedbackAllowsParentContact();

  return (
    <div>
      <section
        className="mb-5 grid items-center gap-5 overflow-hidden rounded-2xl border border-[#E2E0EF] bg-gradient-to-br from-[#E6F6F3] to-white p-4 shadow-[0_12px_32px_rgba(31,27,77,0.05)] sm:p-5 lg:grid-cols-[4fr_7fr] lg:gap-7 lg:p-6"
        aria-labelledby="peri-hero-title"
      >
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <ProductIcon variant="perifeedback" />
            <PremTag />
          </div>
          <h1
            id="peri-hero-title"
            className="text-[28px] font-extrabold leading-tight tracking-tight text-[#1F1B4D]"
          >
            {plan.benefitHeadline}
          </h1>
          <p className="mt-1 max-w-md text-[15px] leading-snug text-[#3F3B5C]">{plan.lede}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => showConceptToast('Start PeriFeedback free')}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0F766E] px-4 text-[14px] font-bold text-white shadow-[0_6px_16px_rgba(15,118,110,0.25)] hover:bg-[#0c5f59]"
            >
              Start PeriFeedback free →
            </button>
            <span className="text-[13px] text-[#5F5B7A]">No card needed to start</span>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white shadow-[0_24px_48px_rgba(31,27,77,0.12)]"
          aria-label="PeriFeedback preview with example data"
        >
          <div className="flex items-center gap-1.5 border-b border-[#EEEDF6] bg-[#FAFAFD] px-3.5 py-2.5 text-[13px] font-bold text-[#1F1B4D]">
            <span className="h-2 w-2 rounded-full bg-[#E2E0EF]" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-[#E2E0EF]" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-[#E2E0EF]" aria-hidden />
            <span className="ml-2">Lesson note · Piano · Week 5</span>
            <span className="ml-auto">
              <ExampleTag>Example data</ExampleTag>
            </span>
          </div>
          <div className="grid gap-3 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-[13px] font-semibold text-[#5F5B7A]">
                Pupil
                <select
                  className="mt-1 h-11 w-full rounded-[10px] border border-[#D9D4FF] bg-white px-3 text-[14px] text-[#1F1B4D]"
                  defaultValue="a"
                  aria-label="Example pupil"
                >
                  <option value="a">Pupil A · Grade 2</option>
                </select>
              </label>
              <label className="block text-[13px] font-semibold text-[#5F5B7A]">
                Lesson
                <input
                  className="mt-1 h-11 w-full rounded-[10px] border border-[#D9D4FF] bg-white px-3 text-[14px] text-[#1F1B4D]"
                  defaultValue="Mon · 10:20"
                  readOnly
                  aria-label="Example lesson time"
                />
              </label>
            </div>
            <label className="block text-[13px] font-semibold text-[#5F5B7A]">
              What went well
              <textarea
                className="mt-1 min-h-[72px] w-full resize-none rounded-[10px] border border-[#D9D4FF] bg-white px-3 py-2.5 text-[14px] text-[#1F1B4D]"
                defaultValue="Confident right-hand melody and a much steadier pulse."
                readOnly
                aria-label="Example what went well"
              />
            </label>
            <label className="block text-[13px] font-semibold text-[#5F5B7A]">
              Practice goal
              <input
                className="mt-1 h-11 w-full rounded-[10px] border border-[#D9D4FF] bg-white px-3 text-[14px] text-[#1F1B4D]"
                defaultValue="Hands together, bars 1–8, ten minutes a day"
                readOnly
                aria-label="Example practice goal"
              />
            </label>
            <p className="flex items-center gap-2 text-[13px] font-bold text-[#166534]">
              <span aria-hidden>✓</span> Practice goal saved
            </p>
            {!canContactParents ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#F3DFA8] bg-[#FFF6DF] px-3 py-2.5 text-[13px] font-semibold text-[#7A4F00]">
                <span aria-hidden>🔒</span>
                Send this update to parents
                <span className="ml-auto">
                  <PremTag>Premium</PremTag>
                </span>
              </div>
            ) : null}
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
            <span className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E6F6F3] text-[#0F766E]">
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
            onClick={() => showConceptToast('Add PeriFeedback free')}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#E6F6F3] text-[14px] font-bold text-[#0F766E] hover:bg-[#d5f0eb]"
          >
            Add free version
          </button>
        </div>
        <div className="rounded-2xl border border-[#BFE8E1] bg-gradient-to-b from-[#E6F6F3] to-white p-4 sm:p-5">
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
            onClick={() => showConceptToast('Get PeriFeedback Premium')}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0F766E] text-[14px] font-bold text-white hover:bg-[#0c5f59]"
          >
            Get full version →
          </button>
        </div>
      </div>

      <ConceptFooter />
    </div>
  );
}
