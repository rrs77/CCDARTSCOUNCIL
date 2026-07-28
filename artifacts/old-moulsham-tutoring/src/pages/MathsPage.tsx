import { Calculator, LineChart, Shapes, Target } from "lucide-react";
import { CtaButton, FadeIn, SectionHeading } from "@/components/ui";

const TOPICS = [
  "Number and calculation",
  "Algebra and equations",
  "Ratio, proportion and rates of change",
  "Geometry and measures",
  "Probability and statistics",
  "Problem-solving and exam technique",
];

export function MathsPage() {
  return (
    <>
      <section className="hero-atmosphere relative overflow-hidden text-white">
        <div className="mesh-lines pointer-events-none absolute inset-0 opacity-30" aria-hidden />
        <div className="safe-px relative mx-auto max-w-6xl py-16 sm:py-20">
          <p className="text-xs font-bold tracking-[0.18em] text-gold-soft uppercase">Mathematics</p>
          <h1 className="mt-3 max-w-3xl font-display text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Maths tuition that builds clarity and confidence
          </h1>
          <p className="mt-5 max-w-2xl text-base text-mint/90 sm:text-lg">
            Personalised Mathematics support for Year 7 through to GCSE — from a peer tutor who
            recently achieved Grade 9 and knows what the course asks of you.
          </p>
          <div className="mt-8">
            <CtaButton href="/contact">Enquire about Maths</CtaButton>
          </div>
        </div>
      </section>

      <section className="atmosphere">
        <div className="safe-px mx-auto max-w-6xl py-16 sm:py-20">
          <FadeIn>
            <SectionHeading title="Support tailored to where you are">
              Whether you need to shore up foundations, stretch towards the higher grades, or
              prepare calmly for exams, lessons are planned around your current topics and the
              areas you find most challenging.
            </SectionHeading>
          </FadeIn>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Calculator,
                title: "Clear methods",
                body: "Step-by-step approaches that make multi-mark questions feel manageable.",
              },
              {
                icon: Shapes,
                title: "Visual thinking",
                body: "Diagrams and models to unlock geometry, graphs and spatial problems.",
              },
              {
                icon: LineChart,
                title: "Steady progress",
                body: "Targeted practice that tracks improvement without overwhelming you.",
              },
              {
                icon: Target,
                title: "Exam focus",
                body: "Timing, command words and common pitfalls — so marks are not left behind.",
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={0.05 * i}>
                <div className="h-full border-t-2 border-teal pt-5">
                  <item.icon className="mb-3 h-6 w-6 text-gold" strokeWidth={1.75} />
                  <h2 className="font-display text-lg font-bold text-ink">{item.title}</h2>
                  <p className="mt-2 text-sm text-ink-soft">{item.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="safe-px mx-auto max-w-6xl py-16 sm:py-20">
          <FadeIn>
            <SectionHeading eyebrow="Coverage" title="What we can work on">
              Sessions can focus on a single stubborn topic or build a broader revision plan across
              the GCSE specification.
            </SectionHeading>
          </FadeIn>

          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {TOPICS.map((topic, i) => (
              <FadeIn key={topic} delay={0.04 * i}>
                <li className="flex items-start gap-3 rounded-lg bg-mint/70 px-4 py-3.5 text-ink">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden />
                  <span className="font-medium">{topic}</span>
                </li>
              </FadeIn>
            ))}
          </ul>

          <FadeIn>
            <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-ink-soft">
                Maths tuition: <span className="font-bold text-ink">£45 per hour</span> · online or
                home (within 3 miles of Oaklands School)
              </p>
              <CtaButton href="/contact" variant="teal">
                Book Maths tuition
              </CtaButton>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
