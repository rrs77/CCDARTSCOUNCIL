import React from 'react';
import { BarChart3, Sparkles, Trophy } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import {
  FeatureRow,
  FooterNote,
  SampleLabel,
  StatusPill,
  showConceptToast,
} from './shared';

export function AssessifyPage() {
  return (
    <div className="ccd-boltons">
      <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="ccd-studio-eyebrow">
            YOUR TOOLS / <span>ASSESSIFY</span>
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
            Free to begin · Premium when you are ready
          </p>
          <h2 className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight text-[#1F1B4D] sm:text-[30px]">
            See the progress.
            <br />
            Spend less time reporting it.
          </h2>
          <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-[#77738F]">
            Capture achievement, identify next steps and give every pupil meaningful feedback. Premium adds
            teacher-controlled AI support and richer progress reporting.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                document.getElementById('assessify-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="inline-flex h-11 items-center rounded-xl bg-[#4338E8] px-4 text-[13px] font-extrabold text-white hover:bg-[#3529d1]"
            >
              Compare Free &amp; Premium →
            </button>
            <button
              type="button"
              onClick={() => {
                document.getElementById('assessify-sample')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="inline-flex h-11 items-center rounded-xl border border-[#D9D4FF] bg-white px-4 text-[13px] font-extrabold text-[#4338E8] hover:bg-[#EFEDFF]"
            >
              See a sample dashboard
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

        <aside
          id="assessify-sample"
          className="rounded-2xl border border-[#D9D4FF] bg-white p-4 shadow-[0_10px_28px_rgba(67,56,232,0.08)]"
          aria-label="Teacher sample dashboard — illustrative data"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <SampleLabel>Year 4 · Music</SampleLabel>
              <p className="mt-0.5 text-[13px] font-extrabold text-[#1F1B4D]">
                Teacher&apos;s sample dashboard · illustrative data
              </p>
            </div>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { n: '26', l: 'Pupils' },
              { n: '4', l: 'Assessment strands' },
              { n: '8', l: 'Next steps flagged' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-[#F8F8FD] px-2 py-2.5 text-center">
                <p className="text-[18px] font-extrabold text-[#1F1B4D]">{s.n}</p>
                <p className="text-[10px] font-bold text-[#77738F]">{s.l}</p>
              </div>
            ))}
          </div>
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-[#77738F]">
            Assessment strands
          </p>
          {[
            { name: 'Performing', state: 'Secure' },
            { name: 'Composing', state: 'Developing' },
            { name: 'Listening', state: 'Secure' },
          ].map((row) => (
            <div
              key={row.name}
              className="mb-1.5 flex items-center justify-between rounded-lg bg-[#F8F8FD] px-2.5 py-2 text-[12px]"
            >
              <span className="font-bold text-[#1F1B4D]">{row.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  row.state === 'Secure' ? 'bg-[#D5F3EA] text-[#0F766E]' : 'bg-[#FFF6DF] text-[#8A5A00]'
                }`}
              >
                {row.state}
              </span>
            </div>
          ))}
          <div className="mt-3 rounded-xl border border-[#E2E0EF] bg-[#F8F8FD] p-3">
            <p className="text-[11px] font-extrabold text-[#1F1B4D]">Teacher&apos;s next step</p>
            <p className="mt-1 text-[12px] leading-snug text-[#77738F]">
              Build confidence in creating a four-bar rhythm using a steady pulse.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#4338E8]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              AI wording support · Premium
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
              A free working introduction, or the time-saving toolkit for every class.
            </p>
          </div>
          <p className="text-[12px] font-bold text-[#4338E8]">Recommended: Premium for regular users</p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[22px] border border-[#E2E0EF] bg-white p-5 sm:p-6">
            <p className="text-[14px] font-extrabold text-[#1F1B4D]">Assessify Free</p>
            <p className="mt-0.5 text-[12px] text-[#77738F]">Get started with confident assessment</p>
            <p className="mt-3 text-[32px] font-extrabold tracking-tight text-[#1F1B4D]">
              £0 <span className="text-[13px] font-bold text-[#77738F]">forever · proposed plan</span>
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#77738F]">
              For teachers trying subject-based assessment with one small teaching group.
            </p>
            <ul className="mt-4 space-y-2.5">
              <FeatureRow included label="1 class and up to 10 pupils" status="limit" />
              <FeatureRow included label="Manual assessment against subject-specific criteria" />
              <FeatureRow included label="Simple pupil notes and next-step targets" />
              <FeatureRow included label="One basic rubric template per subject" />
              <FeatureRow included label="Simple individual assessment history" />
              <FeatureRow included label="Preview of the progress dashboard" />
              <FeatureRow included={false} label="No AI assistance or personalised AI reports" />
              <FeatureRow included={false} label="No bulk reporting, graphs or Excel export" />
            </ul>
            <p className="mt-3 text-[11px] text-[#77738F]">Basic data remains viewable if a trial ends</p>
            <button
              type="button"
              onClick={() => showConceptToast('Use Free')}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#E9E6FF] px-4 text-[13px] font-extrabold text-[#4338E8] hover:bg-[#D9D4FF]"
            >
              Use Free
            </button>
          </div>

          <div className="relative rounded-[22px] border-2 border-[#4338E8] bg-gradient-to-b from-[#EFEDFF] to-white p-5 shadow-[0_12px_32px_rgba(67,56,232,0.12)] sm:p-6">
            <div className="absolute -top-3 right-5">
              <StatusPill status="available">Most useful</StatusPill>
            </div>
            <p className="text-[14px] font-extrabold text-[#1F1B4D]">Assessify Premium ✦</p>
            <p className="mt-0.5 text-[12px] text-[#6554D8]">Less administration. Deeper insight.</p>
            <p className="mt-3 text-[28px] font-extrabold tracking-tight text-[#1F1B4D]">
              Pricing TBC{' '}
              <span className="text-[13px] font-bold text-[#77738F]">teacher / school options</span>
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#77738F]">
              For teachers, subject leaders and schools recording progress regularly.
            </p>
            <ul className="mt-4 space-y-2.5">
              <FeatureRow included label="AI-assisted personalised comments and next steps" status="core-upgrade" />
              <FeatureRow included label="Multiple classes and pupils, subject to fair use" />
              <FeatureRow included label="Customisable criteria, rubrics and progression milestones" />
              <FeatureRow included label="Individual and class progress visualisations" status="roadmap" />
              <FeatureRow included label="Parent-, pupil- and SLT-ready report drafts" status="roadmap" />
              <FeatureRow included label="Excel/PDF exports and year-group summaries" status="roadmap" />
              <FeatureRow included label="Support and challenge flags, including SEND/SEMH needs" />
              <FeatureRow included label="ProgressPath-style milestones and certificates" status="roadmap" />
            </ul>
            <p className="mt-3 text-[11px] font-semibold text-[#4338E8]">
              AI output is always reviewed by a teacher
            </p>
            <button
              type="button"
              onClick={() => showConceptToast('Explore Premium')}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#4338E8] px-4 text-[13px] font-extrabold text-white hover:bg-[#3529d1]"
            >
              Explore Premium →
            </button>
          </div>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="assessify-why-heading">
        <h2 id="assessify-why-heading" className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D]">
          Why Premium feels different
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
              body: 'Subject criteria, graphs and half-term comparisons show where pupils need support or challenge. Planned capability.',
            },
            {
              icon: <Trophy className="h-4 w-4" />,
              title: 'Make small successes matter',
              body: 'Visual goals and future ProgressPath certificates celebrate meaningful milestones, especially for SEND/SEMH pupils.',
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
              attainment decisions.
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
          <AccordionItem value="graphs" className="border-b-0">
            <AccordionTrigger className="text-[14px] font-bold text-[#1F1B4D] hover:no-underline">
              Are progress graphs and exports already live?
            </AccordionTrigger>
            <AccordionContent className="text-[13px] leading-relaxed text-[#77738F]">
              Not assumed here. Existing planning material schedules richer graphs, Excel progress sheets and reports
              for a January 2027 target. These are marked as roadmap features until implemented and tested.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <FooterNote />
    </div>
  );
}
