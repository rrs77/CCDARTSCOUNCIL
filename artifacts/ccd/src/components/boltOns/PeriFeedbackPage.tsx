import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { useWorkspaceProfile } from '../../hooks/useWorkspaceProfile';
import { ADDON_PLANS } from './addonPlans';
import { periFeedbackAllowsParentContact } from './entitlements';
import {
  AddonIllustration,
  AddonTierSplit,
  FooterNote,
  requestAddonPlan,
} from './shared';

export function PeriFeedbackPage() {
  const plan = ADDON_PLANS.perifeedback;
  const canContactParents = periFeedbackAllowsParentContact();
  const { schoolName, classes, loading: profileLoading } = useWorkspaceProfile();

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
            Save notes and set practice goals as you go. Full turns them into carefully controlled, parent-friendly
            updates. Free is a private notebook only — no parent messaging.
          </p>
          <ul className="mt-4 space-y-1.5">
            {plan.featureBullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2 text-[13px] leading-relaxed text-[#77738F]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#138E88]" aria-hidden />
                {bullet}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                document.getElementById('peri-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="inline-flex h-11 items-center rounded-xl bg-[#138E88] px-4 text-[13px] font-extrabold text-white hover:bg-[#0f766e]"
            >
              Compare Free &amp; Full
            </button>
            <button
              type="button"
              onClick={() => requestAddonPlan(`PeriFeedback · ${plan.free.cta}`)}
              className="inline-flex h-11 items-center rounded-xl border border-[#BFE8E1] bg-white px-4 text-[13px] font-extrabold text-[#0F766E] hover:bg-[#E9F8F5]"
            >
              {plan.free.cta}
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

        <aside className="space-y-3" aria-label="PeriFeedback product highlights">
          <AddonIllustration plan={plan} />
          <div className="rounded-2xl border border-[#BFE8E1] bg-white p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#138E88]">
              Classes from Settings
            </p>
            <p className="mt-1 text-[13px] font-extrabold text-[#1F1B4D]">
              {schoolName?.trim()
                ? schoolName
                : 'Linked to your CCDesigner workspace'}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-[#77738F]">
              {profileLoading
                ? 'Loading shared workspace profile…'
                : classes.length > 0
                  ? `${classes.length} class${classes.length === 1 ? '' : 'es'} linked from Settings → My classes.`
                  : 'School and class details come from Settings → My classes via the shared workspace profile — not a separate PeriFeedback copy.'}
            </p>
          </div>
        </aside>
      </section>

      <section id="peri-plans" className="mt-10 scroll-mt-24" aria-labelledby="peri-plans-heading">
        <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="peri-plans-heading" className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D]">
              Choose how you keep in touch
            </h2>
            <p className="mt-1 text-[13px] text-[#77738F]">
              Free records a little. Full connects the lesson journey — including parents.
            </p>
          </div>
          <p className="text-[12px] font-bold text-[#138E88]">Parent communication: Full only</p>
        </div>

        <div className="mt-4">
          <AddonTierSplit
            plan={plan}
            onFree={() => requestAddonPlan(`PeriFeedback · ${plan.free.cta}`)}
            onFull={() => requestAddonPlan(`PeriFeedback · ${plan.full.cta}`)}
          />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="peri-flow-heading">
        <h2 id="peri-flow-heading" className="text-[20px] font-extrabold tracking-tight text-[#1F1B4D]">
          A simple routine, a better parent experience
        </h2>
        <p className="mt-1 text-[13px] text-[#77738F]">
          The Full journey is designed around a lesson, not an admin dashboard.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          {[
            { n: '01', title: 'Capture', sub: 'Teach & record', detail: 'What went well, what comes next' },
            { n: '02', title: 'Prepare', sub: 'Review the update', detail: 'Professional, friendly parent wording' },
            { n: '03', title: 'Share', sub: 'Send with permission', detail: 'Parent communication is Full only' },
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
                Parent communications are not available on Free
              </p>
              <p className="mt-0.5 text-[12px] text-[#77738F]">
                Keep notes in your private workspace. Upgrade to prepare, approve and send parent updates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => requestAddonPlan(`PeriFeedback · ${plan.full.cta}`)}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[#138E88] px-4 text-[12px] font-extrabold text-white hover:bg-[#0f766e]"
            >
              {plan.full.cta} →
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
          <AccordionItem value="classes" className="border-b-0">
            <AccordionTrigger className="text-[14px] font-bold text-[#1F1B4D] hover:no-underline">
              Where do school and class names come from?
            </AccordionTrigger>
            <AccordionContent className="text-[13px] leading-relaxed text-[#77738F]">
              From CCDesigner Settings → My classes, stored in the shared workspace_profiles table. PeriFeedback
              reads that profile via useWorkspaceProfile / workspaceProfileApi — it does not keep a separate class list.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <FooterNote />
    </div>
  );
}
