import { Link } from "wouter";
import { Monitor, Home, Compass, Sparkles, BookOpen, FlaskConical } from "lucide-react";
import { CtaButton, FadeIn, HeroGraphic, SectionHeading } from "@/components/ui";

export function HomePage() {
  return (
    <>
      <section className="hero-atmosphere relative isolate overflow-hidden text-white">
        <div className="mesh-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="safe-px relative mx-auto grid min-h-[calc(100dvh-4.5rem)] max-w-6xl items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:py-20">
          <div className="animate-fade-rise">
            <p className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              Old Moulsham Tutoring
            </p>
            <div className="mt-3 h-0.5 w-14 origin-left -rotate-3 bg-gold" aria-hidden />
            <h1 className="mt-5 font-display text-balance text-4xl leading-[1.1] font-extrabold tracking-tight text-white sm:text-5xl lg:text-[3.35rem]">
              Personalised tutoring from someone who understands
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-mint/90 sm:text-lg">
              Friendly, personalised support in Mathematics and Combined Science for students from
              Year 7 through to GCSE.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <CtaButton href="/contact">Enquire now</CtaButton>
              <CtaButton href="/#subjects" variant="outline">
                Explore subjects
              </CtaButton>
            </div>
            <p className="mt-6 text-sm font-semibold text-sage-soft">
              Maths and Combined Science tuition: £45 per hour
            </p>
          </div>

          <div className="animate-fade-rise relative" style={{ animationDelay: "0.15s" }}>
            <HeroGraphic />
          </div>
        </div>
      </section>

      <section className="atmosphere border-b border-teal/10">
        <div className="safe-px mx-auto max-w-6xl py-14 sm:py-16">
          <FadeIn>
            <div className="max-w-3xl">
              <p className="text-base leading-relaxed text-ink-soft sm:text-lg">
                Having recently achieved Grade 9 in both subjects, I understand the curriculum, the
                demands of GCSE study and the challenges students can encounter along the way.
              </p>
              <p className="mt-4 text-base leading-relaxed text-ink-soft sm:text-lg">
                This is high-quality peer tutoring — support from a successful student who has
                recently completed these qualifications, not from a classroom teacher. Lessons stay
                clear, relatable and focused on what you need.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="subjects" className="scroll-mt-24 bg-surface">
        <div className="safe-px mx-auto max-w-6xl py-16 sm:py-20">
          <FadeIn>
            <SectionHeading eyebrow="Subjects" title="Maths and Combined Science">
              Dedicated support for the two subjects that shape so much of GCSE success — planned
              around each student’s goals and gaps.
            </SectionHeading>
          </FadeIn>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <FadeIn delay={0.05}>
              <article className="group relative overflow-hidden rounded-2xl bg-teal text-white">
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-sage/20 blur-2xl transition group-hover:bg-sage/30" />
                <div className="relative p-7 sm:p-9">
                  <BookOpen className="mb-5 h-9 w-9 text-gold-soft" strokeWidth={1.75} />
                  <h3 className="font-display text-2xl font-bold">Mathematics</h3>
                  <p className="mt-3 text-mint/90">
                    From foundational number skills to exam technique — algebra, geometry, ratio,
                    probability and more, explained in a way that sticks.
                  </p>
                  <Link
                    href="/maths"
                    className="mt-6 inline-flex font-bold text-gold-soft transition hover:text-white"
                  >
                    View Maths tuition →
                  </Link>
                </div>
              </article>
            </FadeIn>

            <FadeIn delay={0.12}>
              <article className="group relative overflow-hidden rounded-2xl bg-ink text-white">
                <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-gold/20 blur-2xl transition group-hover:bg-gold/30" />
                <div className="relative p-7 sm:p-9">
                  <FlaskConical className="mb-5 h-9 w-9 text-sage" strokeWidth={1.75} />
                  <h3 className="font-display text-2xl font-bold">Combined Science</h3>
                  <p className="mt-3 text-mint/90">
                    Biology, Chemistry and Physics woven together — clarifying tricky concepts,
                    building exam confidence and connecting ideas across the sciences.
                  </p>
                  <Link
                    href="/science"
                    className="mt-6 inline-flex font-bold text-sage transition hover:text-white"
                  >
                    View Science tuition →
                  </Link>
                </div>
              </article>
            </FadeIn>
          </div>
        </div>
      </section>

      <section id="approach" className="scroll-mt-24 atmosphere">
        <div className="safe-px mx-auto max-w-6xl py-16 sm:py-20">
          <FadeIn>
            <SectionHeading eyebrow="How it works" title="Personalised lesson planning">
              Every lesson is planned around the individual student. We will identify the areas that
              need development, build confidence and work progressively towards stronger
              understanding and improved results.
            </SectionHeading>
          </FadeIn>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Compass,
                title: "Find the gaps",
                body: "We start by understanding where you are — topics that feel shaky, habits that slow you down, and what your school is covering now.",
              },
              {
                icon: Sparkles,
                title: "Build confidence",
                body: "Lessons move at a pace that feels right. Clear explanations, worked examples and plenty of practice help ideas click.",
              },
              {
                icon: BookOpen,
                title: "Progress steadily",
                body: "Each session builds on the last, with a focus on lasting understanding — so you walk into class and exams feeling prepared.",
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={0.06 * i}>
                <div className="h-full border-t-2 border-gold pt-6">
                  <item.icon className="mb-4 h-7 w-7 text-teal" strokeWidth={1.75} />
                  <h3 className="font-display text-xl font-bold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft sm:text-base">{item.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="tuition" className="scroll-mt-24 bg-teal-deep text-white">
        <div className="safe-px mx-auto max-w-6xl py-16 sm:py-20">
          <FadeIn>
            <SectionHeading
              light
              eyebrow="Where we learn"
              title="Online or in your home"
            >
              Lessons are available online or in your home if you live within three miles of
              Oaklands School in Chelmsford.
            </SectionHeading>
          </FadeIn>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <FadeIn delay={0.05}>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-7 backdrop-blur-sm sm:p-8">
                <Monitor className="mb-4 h-8 w-8 text-gold-soft" strokeWidth={1.75} />
                <h3 className="font-display text-xl font-bold">Online tuition</h3>
                <p className="mt-3 text-mint/90">
                  Flexible video lessons from wherever you are. Screen sharing, shared notes and
                  clear worked examples keep sessions interactive and focused.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.12}>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-7 backdrop-blur-sm sm:p-8">
                <Home className="mb-4 h-8 w-8 text-sage" strokeWidth={1.75} />
                <h3 className="font-display text-xl font-bold">Home tuition</h3>
                <p className="mt-3 text-mint/90">
                  In-person lessons at your home within a three-mile radius of Oaklands School,
                  Chelmsford — ideal when face-to-face support feels most helpful.
                </p>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.18}>
            <div className="mt-10 flex flex-col items-start justify-between gap-6 rounded-2xl bg-coral/15 px-6 py-6 sm:flex-row sm:items-center sm:px-8">
              <div>
                <p className="font-display text-2xl font-bold text-gold-soft">£45 per hour</p>
                <p className="mt-1 text-sm text-mint/85">
                  Maths and Combined Science tuition · Year 7 to GCSE
                </p>
              </div>
              <CtaButton href="/contact">Request a session</CtaButton>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
