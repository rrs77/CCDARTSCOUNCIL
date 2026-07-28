import { Atom, Dna, Flame, Lightbulb } from "lucide-react";
import { CtaButton, FadeIn, SectionHeading } from "@/components/ui";

const AREAS = [
  {
    title: "Biology",
    body: "Cells, organisation, infection, bioenergetics, homeostasis, inheritance and ecology — explained clearly and linked to exam-style questions.",
  },
  {
    title: "Chemistry",
    body: "Atomic structure, bonding, quantitative chemistry, chemical changes, energy changes and rates — with confidence in calculations.",
  },
  {
    title: "Physics",
    body: "Energy, electricity, particles, forces, waves and magnetism — building intuition for formulas and practical understanding.",
  },
];

export function SciencePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 90% 10%, rgba(124,183,163,0.35), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(212,160,23,0.2), transparent 50%)",
          }}
        />
        <div className="safe-px relative mx-auto max-w-6xl py-16 sm:py-20">
          <p className="text-xs font-bold tracking-[0.18em] text-sage uppercase">
            Combined Science
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Combined Science made clearer — across Biology, Chemistry and Physics
          </h1>
          <p className="mt-5 max-w-2xl text-base text-mint/90 sm:text-lg">
            Peer tutoring from a student who achieved Grade 9 in Combined Science. Lessons connect
            ideas across the three sciences and tackle the topics that feel hardest right now.
          </p>
          <div className="mt-8">
            <CtaButton href="/contact">Enquire about Science</CtaButton>
          </div>
        </div>
      </section>

      <section className="atmosphere">
        <div className="safe-px mx-auto max-w-6xl py-16 sm:py-20">
          <FadeIn>
            <SectionHeading title="Understanding that lasts beyond the lesson">
              Combined Science covers a lot of ground. Together we slow down where needed, spot
              patterns between topics, and practise the kinds of questions you will meet in class
              and in exams.
            </SectionHeading>
          </FadeIn>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {AREAS.map((area, i) => (
              <FadeIn key={area.title} delay={0.06 * i}>
                <article className="h-full rounded-2xl bg-white/70 p-6 ring-1 ring-teal/10 sm:p-7">
                  <h2 className="font-display text-xl font-bold text-teal">{area.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
                    {area.body}
                  </p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="safe-px mx-auto max-w-6xl py-16 sm:py-20">
          <FadeIn>
            <SectionHeading eyebrow="Approach" title="How Science sessions help">
              Friendly, structured support that respects how much there is to learn — without
              rushing past the foundations.
            </SectionHeading>
          </FadeIn>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {[
              {
                icon: Lightbulb,
                title: "Demystify tricky ideas",
                body: "Abstract concepts broken into plain language, then rebuilt with examples you can remember.",
              },
              {
                icon: Atom,
                title: "Link the sciences",
                body: "See how Chemistry, Physics and Biology overlap so revision feels joined-up, not fragmented.",
              },
              {
                icon: Flame,
                title: "Strengthen weak spots",
                body: "Target the units that feel hardest — from required practicals to calculation-heavy questions.",
              },
              {
                icon: Dna,
                title: "Grow exam confidence",
                body: "Practise applying knowledge under timed conditions and learn how mark schemes reward clear answers.",
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={0.05 * i}>
                <div className="flex gap-4">
                  <item.icon className="mt-0.5 h-7 w-7 shrink-0 text-gold" strokeWidth={1.75} />
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm text-ink-soft sm:text-base">{item.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn>
            <div className="mt-14 flex flex-col gap-4 rounded-2xl bg-teal px-6 py-7 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div>
                <p className="font-display text-xl font-bold">Combined Science · £45 per hour</p>
                <p className="mt-1 text-sm text-mint/85">
                  Online or in-home within three miles of Oaklands School, Chelmsford
                </p>
              </div>
              <CtaButton href="/contact">Book Science tuition</CtaButton>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
