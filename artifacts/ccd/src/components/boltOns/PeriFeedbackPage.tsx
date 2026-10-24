import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { periFeedbackAllowsParentContact } from './entitlements';
import {
  FeatureRow,
  FooterNote,
  SampleLabel,
  StatusPill,
  showConceptToast,
} from './shared';

export function PeriFeedbackPage() {
  const canContactParents = periFeedbackAllowsParentContact();

  return (
    <div className="ccd-boltons">
      <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="ccd-studio-eyebrow">
            WORKSPACE / <span>PERIFEEDBACK</span>
          </p>
          <h1 className="ccd-studio-title">PeriFeedback</h1>
          <p className="ccd-studio-sub max-w-xl">
            The simple way to record visiting music lessons and keep everyone informed.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-[#D5F3EA] px-3 py-1.5 text-[12px] font-bold text-[#0F766E]">
          For individual instrumental &amp; singing teachers
        </span>
      </header>

      <section className="grid gap-5 overflow-hidden rounded-[22px] border border-[#BFE8E1] bg-gradient-to-br from-[#E9F8F5] via-[#F4FBF9] to-white p-5 sm:p-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#138E88]">
            A smarter weekly teaching routine
          </p>
          <h2 className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight text-[#1F1B4D] sm:text-[30px]">
            Teach the lesson.
            <br />
            Share the progress.
          </h2>
          <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-[#77738F]">
            Save notes and set practice goals as you go. With Premium, turn them into carefully controlled,
            parent-friendly updates without repeating the same admin each week.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                document.getElementById('peri-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="inline-flex h-11 items-center rounded-xl bg-[#138E88] px-4 text-[13px] font-extrabold text-white hover:bg-[#0f766e]"
            >
              Compare Free &amp; Premium
            </button>
            <button
              type="button"
              onClick={() => {
                document.getElementById('peri-sample')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="inline-flex h-11 items-center rounded-xl border border-[#BFE8E1] bg-white px-4 text-[13px] font-extrabold text-[#0F766E] hover:bg-[#E9F8F5]"
            >
              See a sample lesson note
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {['Piano', 'Strings', 'Woodwind', 'Brass', 'Percussion', 'Singing'].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-[#0F766E] ring-1 ring-[#BFE8E1]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <aside
          id="peri-sample"
          className="rounded-2xl border border-[#BFE8E1] bg-white p-4 shadow-[0_10px_28px_rgba(19,142,136,0.08)]"
          aria-label="Weekly piano lesson sample — illustrative data"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <SampleLabel>Weekly piano lesson</SampleLabel>
              <p className="mt-0.5 text-[12px] font-bold text-[#77738F]">Sample pupil 01 · illustrative</p>
            </div>
            <span className="rounded-full bg-[#D5F3EA] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#0F766E]">
              Lesson recorded
            </span>
          </div>
          <p className="text-[11px] font-bold text-[#77738F]">Monday · 30-minute lesson</p>
          <p className="mt-3 text-[12px] font-extrabold text-[#1F1B4D]">Achievement:</p>
          <p className="text-[12px] leading-snug text-[#77738F]">
            Played the melody with fewer stops and improved hand position.
          </p>
          <p className="mt-2 text-[12px] font-extrabold text-[#1F1B4D]">Practice:</p>
          <p className="text-[12px] leading-snug text-[#77738F]">
            Repeat bars 5–8 slowly, three times each day.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#F8F8FD] px-2.5 py-2 text-center">
              <p className="text-[18px] font-extrabold text-[#1F1B4D]">3</p>
              <p className="text-[10px] font-bold text-[#77738F]">Goals completed</p>
            </div>
            <div className="rounded-xl bg-[#F8F8FD] px-2.5 py-2 text-center">
              <p className="text-[18px] font-extrabold text-[#1F1B4D]">1</p>
              <p className="text-[10px] font-bold text-[#77738F]">Next focus</p>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-[#0F766E]">
            <span aria-hidden>✓</span> Note saved
          </p>
          {!canContactParents ? (
            <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#FFF6DF] px-2.5 py-1.5 text-[11px] font-semibold text-[#8A5A00]">
              <span aria-hidden>🔒</span> Parent message preview · Premium feature
            </p>
          ) : null}
        </aside>
      </section>

      <section id="peri-plans" className="mt-10 scroll-mt-24" aria-labelledby="peri-plans-heading">
        <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="peri-plans-heading" className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D]">
              Choose how you keep in touch
            </h2>
            <p className="mt-1 text-[13px] text-[#77738F]">
              The free plan records a little. Premium connects the whole lesson journey.
            </p>
          </div>
          <p className="text-[12px] font-bold text-[#138E88]">Parent communication: Premium only</p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[22px] border border-[#E2E0EF] bg-white p-5 sm:p-6">
            <p className="text-[14px] font-extrabold text-[#1F1B4D]">PeriFeedback Free</p>
            <p className="mt-0.5 text-[12px] text-[#77738F]">A personal record for occasional teaching</p>
            <p className="mt-3 text-[32px] font-extrabold tracking-tight text-[#1F1B4D]">
              £0 <span className="text-[13px] font-bold text-[#77738F]">forever · proposed plan</span>
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#77738F]">
              A restricted personal notebook: enough to try the workflow, not a communication platform.
            </p>
            <ul className="mt-4 space-y-2.5">
              <FeatureRow included label="Up to 3 pupil profiles" status="limit" />
              <FeatureRow included label="Up to 10 lesson entries per month" />
              <FeatureRow included label="Manual lesson notes" />
              <FeatureRow included label="One practice target per pupil" />
              <FeatureRow included label="View recent lesson history" />
              <FeatureRow included={false} label="No ability to contact parents" />
              <FeatureRow included={false} label="No emails, messaging, delivery or share links" />
              <FeatureRow included={false} label="No automated reports or bulk exports" />
            </ul>
            <p className="mt-3 text-[11px] text-[#77738F]">View saved notes; no automatic sending</p>
            <button
              type="button"
              onClick={() => showConceptToast('Use Free')}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#E9E6FF] px-4 text-[13px] font-extrabold text-[#4338E8] hover:bg-[#D9D4FF]"
            >
              Use Free
            </button>
          </div>

          <div className="relative rounded-[22px] border-2 border-[#138E88] bg-gradient-to-b from-[#E9F8F5] to-white p-5 shadow-[0_12px_32px_rgba(19,142,136,0.12)] sm:p-6">
            <div className="absolute -top-3 right-5">
              <StatusPill status="core-upgrade">Best for working tutors</StatusPill>
            </div>
            <p className="text-[14px] font-extrabold text-[#1F1B4D]">PeriFeedback Premium ♫</p>
            <p className="mt-0.5 text-[12px] text-[#138E88]">Turn weekly notes into outstanding communication</p>
            <p className="mt-3 text-[28px] font-extrabold tracking-tight text-[#1F1B4D]">
              Pricing TBC <span className="text-[13px] font-bold text-[#77738F]">tutor / school options</span>
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#77738F]">
              For instrumental teachers and schools running regular peripatetic lessons.
            </p>
            <ul className="mt-4 space-y-2.5">
              <FeatureRow included label="Send approved lesson updates to parents" status="core-upgrade" />
              <FeatureRow included label="Professional, branded weekly feedback" />
              <FeatureRow included label="Reusable achievement and practice-goal templates" />
              <FeatureRow included label="More pupil profiles and lesson entries" />
              <FeatureRow included label="Parent contact preferences and delivery history" />
              <FeatureRow included label="Termly summaries and PDF reports" status="proposed" />
              <FeatureRow included label="Progress and practice tracking over time" status="proposed" />
              <FeatureRow included label="School-approved tutor oversight and role permissions" status="proposed" />
            </ul>
            <p className="mt-3 text-[11px] font-semibold text-[#138E88]">
              Approvals and permissions required before contact
            </p>
            <button
              type="button"
              onClick={() => showConceptToast('Explore Premium')}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#138E88] px-4 text-[13px] font-extrabold text-white hover:bg-[#0f766e]"
            >
              Explore Premium →
            </button>
          </div>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="peri-flow-heading">
        <h2 id="peri-flow-heading" className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D]">
          A simple routine, a better parent experience
        </h2>
        <p className="mt-1 text-[13px] text-[#77738F]">
          The Premium journey is designed around a lesson, not an admin dashboard.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          {[
            { n: '01', title: 'Capture', sub: 'Teach & record', detail: 'What went well, what comes next' },
            { n: '02', title: 'Prepare', sub: 'Review the update', detail: 'Professional, friendly parent wording' },
            { n: '03', title: 'Share', sub: 'Send with permission', detail: 'Parent communication is Premium only' },
          ].map((step, i) => (
            <React.Fragment key={step.n}>
              <div className="rounded-2xl border border-[#E2E0EF] bg-[#F8F8FD] p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#138E88]">
                  {step.n} · {step.title}
                </p>
                <p className="mt-1 text-[14px] font-extrabold text-[#1F1B4D]">{step.sub}</p>
                <p className="mt-0.5 text-[12px] text-[#77738F]">{step.detail}</p>
              </div>
              {i < 2 ? (
                <span className="hidden text-center text-[#C4C0D8] sm:block" aria-hidden>
                  →
                </span>
              ) : null}
            </React.Fragment>
          ))}
        </div>

        {!canContactParents ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#BFE8E1] bg-[#E9F8F5] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-extrabold text-[#0F766E]">
                🔒 Parent communications are not available on Free
              </p>
              <p className="mt-0.5 text-[12px] text-[#77738F]">
                Keep notes in your private workspace. Upgrade to prepare, approve and send parent updates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                document.getElementById('peri-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#138E88] px-4 text-[12px] font-extrabold text-white hover:bg-[#0f766e]"
            >
              View Premium →
            </button>
          </div>
        ) : null}
      </section>

      <section className="mt-10" aria-labelledby="peri-faq-heading">
        <h2 id="peri-faq-heading" className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D]">
          Questions teachers will ask
        </h2>
        <Accordion type="single" collapsible className="mt-3 rounded-2xl border border-[#E2E0EF] bg-white px-4">
          <AccordionItem value="free-contact">
            <AccordionTrigger className="text-[14px] font-bold text-[#1F1B4D] hover:no-underline">
              Can Free users email, message or share links with parents?
            </AccordionTrigger>
            <AccordionContent className="text-[13px] leading-relaxed text-[#77738F]">
              No. The free plan has no contact action, message delivery, external share link, parent portal, or
              messaging API access. The restriction must also be enforced server-side.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="school-control">
            <AccordionTrigger className="text-[14px] font-bold text-[#1F1B4D] hover:no-underline">
              Can a school control who communicates with parents?
            </AccordionTrigger>
            <AccordionContent className="text-[13px] leading-relaxed text-[#77738F]">
              That should be a core paid school feature: verified tutor accounts, school-approved contact lists,
              permissions, audit history and a review flow where appropriate. It must be built and checked before
              launch.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="auto-send" className="border-b-0">
            <AccordionTrigger className="text-[14px] font-bold text-[#1F1B4D] hover:no-underline">
              Will the app send messages without my approval?
            </AccordionTrigger>
            <AccordionContent className="text-[13px] leading-relaxed text-[#77738F]">
              No. The proposed flow is review first, then explicitly send using approved contacts and permissions. No
              automatic unsolicited parent communication.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <FooterNote />
    </div>
  );
}
