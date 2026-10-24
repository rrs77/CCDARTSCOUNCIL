import React from 'react';
import { BarChart3, Sparkles, Trophy } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { useWorkspaceProfile } from '../../hooks/useWorkspaceProfile';
import { ADDON_PLANS } from './addonPlans';
import {
  AddonIllustration,
  AddonTierSplit,
  FooterNote,
  requestAddonPlan,
} from './shared';

export function AssessifyPage() {
  const plan = ADDON_PLANS.assessify;
  const { schoolName, classes, loading: profileLoading } = useWorkspaceProfile();

  return (
    <div className="ccd-boltons">
      <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="ccd-studio-eyebrow">
            WORKSPACE / <span>ASSESSIFY</span>
          </p>
          <h1 className="ccd-studio-title">Assessify</h1>
          <p className="ccd-studio-sub max-w-xl">
            Purposeful assessment for creative and practical subjects, without losing the human touch.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-[#E9E6FF] px-3 py-1.5 text-[12px] font-bold text-[#4338E8]">
          EYFS → KS5 · Subject-specific criteria
        </span>
      </header>

      <section className="grid gap-5 overflow-hidden rounded-[22px] border border-[#D9D4FF] bg-gradient-to-br from-[#EFEDFF] via-[#F4F3FA] to-white p-5 sm:p-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#6554D8]">
            Free to begin · Full when you are ready
          </p>
          <h2 className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight text-[#1F1B4D] sm:text-[30px]">
            See the progress.
            <br />
            Spend less time reporting it.
          </h2>
          <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-[#77738F]">
            Capture achievement, identify next steps and give every pupil meaningful feedback. Full adds
            teacher-controlled AI support and richer progress reporting — Free stays limited on purpose.
          </p>
          <ul className="mt-4 space-y-1.5">
            {plan.featureBullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-[13px] leading-relaxed text-[#77738F]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4338E8]" aria-hidden />
                {bullet}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                document.getElementById('assessify-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="inline-flex h-11 items-center rounded-xl bg-[#4338E8] px-4 text-[13px] font-extrabold text-white hover:bg-[#3529d1]"
            >
              Compare Free &amp; Full →
            </button>
            <button
              type="button"
              onClick={() => requestAddonPlan(`Assessify · ${plan.free.cta}`)}
              className="inline-flex h-11 items-center rounded-xl border border-[#D9D4FF] bg-white px-4 text-[13px] font-extrabold text-[#4338E8] hover:bg-[#EFEDFF]"
            >
              {plan.free.cta}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {['Music', 'Drama', 'Dance', 'Art & design', 'Adaptable to computing'].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-[#6554D8] ring-1 ring-[#D9D4FF]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <aside className="space-y-3" aria-label="Assessify product highlights">
          <AddonIllustration plan={plan} />
          <div className="rounded-2xl border border-[#D9D4FF] bg-white p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#6554D8]">
              Classes from Settings
            </p>
            <p className="mt-1 text-[13px] font-extrabold text-[#1F1B4D]">
              {schoolName?.trim()
                ? schoolName
                : 'Uses your CCDesigner My classes list'}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-[#77738F]">
              {profileLoading
                ? 'Loading shared workspace profile…'
                : classes.length > 0
                  ? `${classes.length} class${classes.length === 1 ? '' : 'es'} linked from Settings → My classes.`
                  : 'School name, year groups and class names stay in Settings — Assessify reads the shared workspace profile instead of inventing its own.'}
            </p>
          </div>
        </aside>
      </section>

      <section id="assessify-plans" className="mt-10 scroll-mt-24" aria-labelledby="assessify-plans-heading">
        <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="assessify-plans-heading" className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D]">
              Choose how you assess
            </h2>
            <p className="mt-1 text-[13px] text-[#77738F]">
              A limited free introduction, or the full toolkit for every class.
            </p>
          </div>
          <p className="text-[12px] font-bold text-[#4338E8]">Free stays deliberately limited</p>
        </div>

        <div className="mt-4">
          <AddonTierSplit
            plan={plan}
            onFree={() => requestAddonPlan(`Assessify · ${plan.free.cta}`)}
            onFull={() => requestAddonPlan(`Assessify · ${plan.full.cta}`)}
          />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="assessify-why-heading">
        <h2 id="assessify-why-heading" className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D]">
          Why Full feels different
        </h2>
        <p className="mt-1 text-[13px] text-[#77738F]">Upgrade for real teacher time saved, not cosmetic extras.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: <Sparkles className="h-4 w-4" />,
              title: 'AI helps write the difficult bit',
              body: 'Turn your recorded evidence into an editable, age-appropriate next step. Teacher approval is essential before it is shared.',
            },
            {
              icon: <BarChart3 className="h-4 w-4" />,
              title: 'Spot patterns across classes',
              body: 'Subject criteria, graphs and half-term comparisons show where pupils need support or challenge.',
            },
            {
              icon: <Trophy className="h-4 w-4" />,
              title: 'Make small successes matter',
              body: 'Visual goals and milestones celebrate meaningful progress, especially for SEND/SEMH pupils.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[#E2E0EF] bg-white p-4 shadow-[0_6px_18px_rgba(31,27,77,0.04)]"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#E9E6FF] text-[#4338E8]">
                {card.icon}
              </span>
              <h3 className="mt-3 text-[14px] font-extrabold text-[#1F1B4D]">{card.title}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-[#77738F]">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="assessify-faq-heading">
        <h2 id="assessify-faq-heading" className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D]">
          Before you upgrade
        </h2>
        <Accordion type="single" collapsible className="mt-3 rounded-2xl border border-[#E2E0EF] bg-white px-4">
          <AccordionItem value="ai-auto">
            <AccordionTrigger className="text-[14px] font-bold text-[#1F1B4D] hover:no-underline">
              Will AI assess pupils automatically?
            </AccordionTrigger>
            <AccordionContent className="text-[13px] leading-relaxed text-[#77738F]">
              No. AI should draft or suggest feedback from evidence the teacher has entered, never make unreviewed
              attainment decisions. Free has no AI.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="subjects">
            <AccordionTrigger className="text-[14px] font-bold text-[#1F1B4D] hover:no-underline">
              Can I assess Music, Drama, Dance and Art?
            </AccordionTrigger>
            <AccordionContent className="text-[13px] leading-relaxed text-[#77738F]">
              Yes, the design supports age-appropriate subject templates from EYFS to KS5. Assessment criteria should
              be configurable for other practical subjects, including computing.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="classes" className="border-b-0">
            <AccordionTrigger className="text-[14px] font-bold text-[#1F1B4D] hover:no-underline">
              Where do my classes come from?
            </AccordionTrigger>
            <AccordionContent className="text-[13px] leading-relaxed text-[#77738F]">
              From CCDesigner Settings → My classes. Class names, year groups and school name are stored in the shared
              workspace profile so Assessify and other apps on the same project can read them without keeping separate
              copies.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <FooterNote />
    </div>
  );
}
