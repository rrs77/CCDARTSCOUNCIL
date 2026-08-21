import { useState } from "react";
import {
  ChartAlevelIndex,
  ChartDisadvantage,
  ChartFunding,
  ChartGcseIndex,
  ChartHe,
  ChartLongTerm,
  ChartNoGcse,
  ChartPrimaryHours,
} from "@/components/charts/Charts";
import {
  ALEVEL_SHARE_DEPRIVATION,
  CLA_DEPRIVATION_NO_MUSIC,
  HE_SUMMARY,
  OFQUAL_ALEVEL_YOY_2026,
  OFQUAL_GCSE_YOY_2026,
  PRIMARY_HOURS,
  PRINCIPAL_SOURCES,
  WORKFORCE,
  type ChapterId,
} from "@/data/stats";

function WhyCcd({ children }: { children: React.ReactNode }) {
  return (
    <aside className="why-ccd">
      <strong>Why this matters for CCDesigner</strong>
      <p>{children}</p>
    </aside>
  );
}

function Drill({ text, onClear }: { text: string; onClear: () => void }) {
  return (
    <div className="drill-panel">
      <div className="mb-1 flex items-center justify-between gap-2">
        <strong className="text-sm text-[#002d24]">Detail</strong>
        <button type="button" className="text-xs font-semibold text-[#2A9D8F]" onClick={onClear}>
          Clear
        </button>
      </div>
      {text}
    </div>
  );
}

export function ChapterBody({ id }: { id: ChapterId }) {
  const [drill, setDrill] = useState<string | null>(null);

  switch (id) {
    case "cover":
      return (
        <div className="space-y-4 text-[#f2f7f4]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lime)]">
            CCDESIGNER
          </p>
          <h1 className="display text-3xl leading-[1.12] sm:text-4xl">
            The State of Creative Education in England
          </h1>
          <p className="text-base text-white/80 sm:text-lg">
            A concise evidence overview for funding, partnership and development.
            Prepared and re-verified 21 August 2026.
          </p>
          <div className="space-y-3 text-sm leading-relaxed text-white/85 sm:text-[0.95rem]">
            <p>
              Creative education in England is at a point of change. Long-term evidence
              shows substantial contraction in arts qualifications, teaching time and
              parts of the specialist workforce, alongside a pronounced entitlement gap
              linked to disadvantage. Curriculum reform and the National Centre for Arts
              and Music Education create an opportunity to strengthen access and
              partnership.
            </p>
            <p>
              CCDesigner is a free national planning and resource platform for performing
              and creative arts teachers from EYFS to KS5. It aims to bring planning,
              reusable activity blocks, curriculum links and resources into one place,
              while connecting teachers directly with arts organisations through
              dedicated hubs.
            </p>
            <p>
              It is not a solution to structural inequality on its own. Its intended
              contribution is to reduce the distance between excellent practice and the
              teacher who needs it; make high-quality resources easier to find, retain
              and adapt; strengthen communication between schools and cultural
              organisations; and support differentiation and responsive planning. A
              digital platform cannot replace specialist teachers, instruments, spaces or
              live cultural experiences. It can help ensure ideas, knowledge and
              connections are not confined by postcode.
            </p>
            <p className="italic text-white/70">
              Early-years principle: children should be able to shape and respond to
              their learning. Creative subjects need not always be confined to a
              conventional classroom.
            </p>
          </div>
          <p className="text-xs text-white/55">
            Click any topic on the map — or use the chapter strip — to zoom in.
          </p>
        </div>
      );

    case "glance":
      return (
        <div>
          <h2 className="display mb-2 text-2xl text-[#002d24]">Key findings at a glance</h2>
          <p className="mb-4 text-sm text-[#5c6b66]">
            Usable on its own. Ofqual 2026 figures are provisional (rounded to 5).
            “No entries” does not mean “not taught”.
          </p>
          <div className="stat-grid">
            <div className="stat-pill">
              <div className="num">−42%</div>
              <div className="lbl">Arts GCSE entries, 2010–2022/23 (CLA 2024)</div>
            </div>
            <div className="stat-pill">
              <div className="num">−21%</div>
              <div className="lbl">Arts A-level entries, 2010/11–2022/23 (CLA 2024)</div>
            </div>
            <div className="stat-pill">
              <div className="num">42% / 41% / 84%</div>
              <div className="lbl">Schools with no GCSE Music / Drama / Dance, 2022/23</div>
            </div>
            <div className="stat-pill">
              <div className="num">~1 in 4</div>
              <div className="lbl">Primary teachers with under 1 hour of arts / week</div>
            </div>
            <div className="stat-pill">
              <div className="num">47% vs 6%</div>
              <div className="lbl">Independent vs state primary &gt;2.5 hrs arts / week</div>
            </div>
            <div className="stat-pill">
              <div className="num">54% vs 21%</div>
              <div className="lbl">No GCSE Music — most vs least deprived LA fifth (CLA 2026)</div>
            </div>
            <div className="stat-pill">
              <div className="num">3.8% vs 5.9%</div>
              <div className="lbl">Arts share of A-levels — most vs least deprived fifth</div>
            </div>
            <div className="stat-pill">
              <div className="num">2026 GCSEs</div>
              <div className="lbl">
                Art &amp; Design {OFQUAL_GCSE_YOY_2026[0].change > 0 ? "+" : ""}
                {OFQUAL_GCSE_YOY_2026[0].change}% · Drama {OFQUAL_GCSE_YOY_2026[1].change}% ·
                Music {OFQUAL_GCSE_YOY_2026[2].change}% · Perf/EA +
                {OFQUAL_GCSE_YOY_2026[3].change}%
              </div>
            </div>
            <div className="stat-pill">
              <div className="num">2026 A levels</div>
              <div className="lbl">
                Drama {OFQUAL_ALEVEL_YOY_2026[0].change}% · Music{" "}
                {OFQUAL_ALEVEL_YOY_2026[1].change}% · Art &amp; Design{" "}
                {OFQUAL_ALEVEL_YOY_2026[2].change}%
              </div>
            </div>
          </div>
          <WhyCcd>
            These figures set the case for a connection layer: teachers and arts
            organisations need a practical way to find, adapt and share outstanding work
            where entitlement is uneven.
          </WhyCcd>
        </div>
      );

    case "longterm":
      return (
        <div>
          <h2 className="display mb-2 text-2xl text-[#002d24]">The long-term picture</h2>
          <p className="mb-3 text-sm text-[#5c6b66]">
            Do not collapse these into a single index — each series has its own baseline.
          </p>
          <ChartLongTerm
            onSelect={(label) =>
              setDrill(
                `${label}: long-term percentage change to 2022/23 (CLA Report Card 2024). Click other bars to compare series.`,
              )
            }
          />
          {drill ? <Drill text={drill} onClear={() => setDrill(null)} /> : null}
          <WhyCcd>
            CCDesigner aims to support teachers working inside a system that has already
            contracted — by making planning and partnership more usable day to day.
          </WhyCcd>
        </div>
      );

    case "primary":
      return (
        <div>
          <h2 className="display mb-2 text-2xl text-[#002d24]">Primary provision</h2>
          <p className="mb-3 text-sm text-[#5c6b66]">
            Some schools report music or drama only later, or inside English — treat that
            as a research question, not a proven national pattern. No official national
            statistic exists for weekly Year 7 music/drama teaching time.
          </p>
          <ChartPrimaryHours
            onSelect={(which) =>
              setDrill(
                which === "independent"
                  ? `${PRIMARY_HOURS.independentOver2_5}% of independent primary teachers report more than 2.5 hours of arts timetabled per week.`
                  : `${PRIMARY_HOURS.stateOver2_5}% of state primary teachers report more than 2.5 hours of arts timetabled per week.`,
              )
            }
          />
          <div className="stat-grid mt-3">
            <div className="stat-pill">
              <div className="num">
                {PRIMARY_HOURS.hoursFellHighestFsm}% vs {PRIMARY_HOURS.hoursFellLowestFsm}%
              </div>
              <div className="lbl">
                Highest-FSM vs lowest-FSM schools reporting reduced arts hours in the
                prior two years
              </div>
            </div>
            <div className="stat-pill">
              <div className="num">{PRIMARY_HOURS.noExternalPartners}%</div>
              <div className="lbl">
                Primary teachers reporting no external artist / cultural organisation
              </div>
            </div>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-[#33443e]">
            {PRIMARY_HOURS.subjectLeads.map((s) => (
              <li key={s.subject}>
                <strong>{s.subject}</strong> subject lead: {s.pct}%
              </li>
            ))}
          </ul>
          {drill ? <Drill text={drill} onClear={() => setDrill(null)} /> : null}
          <WhyCcd>
            Where generalists carry the arts, reusable activity blocks and Partner Hubs
            aim to make excellent practice easier to find and adapt — without claiming to
            replace specialists.
          </WhyCcd>
        </div>
      );

    case "secondary":
      return (
        <div>
          <h2 className="display mb-2 text-2xl text-[#002d24]">Secondary disadvantage</h2>
          <p className="mb-3 text-sm text-[#5c6b66]">
            Percentage of state-funded mainstream schools with entries. Technical Awards
            narrow some gaps. These data cannot tell whether Year 7 or 8 receive a weekly
            lesson.
          </p>
          <ChartDisadvantage
            onSelect={(subject) => {
              const row = subject
                ? `Selected: ${subject}. Least vs most disadvantaged fifth — % of schools with entries (DfE Tables 18–19, 2024/25).`
                : null;
              if (row) setDrill(row);
            }}
          />
          {drill ? <Drill text={drill} onClear={() => setDrill(null)} /> : null}
          <WhyCcd>
            CCD aims to help cover cold spots by connecting schools with organisation
            resources — as a proposed connection layer, not a signed partnership claim.
          </WhyCcd>
        </div>
      );

    case "availability":
      return (
        <div>
          <h2 className="display mb-2 text-2xl text-[#002d24]">GCSE availability</h2>
          <ChartNoGcse
            onSelect={(subject) =>
              setDrill(
                `${subject}: share of schools with no GCSE entries in 2022/23 (CLA 2024). “No entries” ≠ “not taught”. Stay qualification-neutral when interpreting.`,
              )
            }
          />
          <div className="stat-grid mt-3">
            <div className="stat-pill">
              <div className="num">
                {CLA_DEPRIVATION_NO_MUSIC.most}% vs {CLA_DEPRIVATION_NO_MUSIC.least}%
              </div>
              <div className="lbl">
                Schools with no GCSE Music — most vs least deprived LA fifth (CLA 2026)
              </div>
            </div>
            <div className="stat-pill">
              <div className="num">FSM</div>
              <div className="lbl">
                Under-represented in all arts GCSEs; over-represented in arts Level 2
                vocational entries
              </div>
            </div>
          </div>
          {drill ? <Drill text={drill} onClear={() => setDrill(null)} /> : null}
          <WhyCcd>
            Where GCSE pathways thin out, teachers still need planning stubs and links to
            official organisation materials — CCD holds the planning layer, not the
            copyrighted resource itself.
          </WhyCcd>
        </div>
      );

    case "gcse":
      return (
        <div>
          <h2 className="display mb-2 text-2xl text-[#002d24]">Latest GCSE movement</h2>
          <p className="mb-3 text-sm text-[#5c6b66]">
            Ofqual provisional summer 2026 vs 2025. All GCSEs +1.1%; age-16 population
            +1.2%. Collected by 15 April 2026; rounded to 5. Read against long-term
            contraction — Music rose 2024–25 then eased in 2026.
          </p>
          <ChartGcseIndex
            onSelect={(series) => setDrill(`Focused series: ${series}. Index baseline 2024 = 100.`)}
          />
          {drill ? <Drill text={drill} onClear={() => setDrill(null)} /> : null}
          <WhyCcd>
            Short-term movement does not undo the long-term fall. CCD aims to help
            teachers keep creative learning cumulative year to year.
          </WhyCcd>
        </div>
      );

    case "alevel":
      return (
        <div>
          <h2 className="display mb-2 text-2xl text-[#002d24]">A-level pipeline</h2>
          <p className="mb-3 text-sm text-[#5c6b66]">
            All A-levels +2.9% in 2026 provisional data, while arts subjects remain well
            below 2010/11. Arts A-level share {ALEVEL_SHARE_DEPRIVATION.most}% vs{" "}
            {ALEVEL_SHARE_DEPRIVATION.least}% in most vs least deprived fifths. FSM pupils
            under-represented in A-level Music, Dance, Drama and Design &amp; Technology.
          </p>
          <ChartAlevelIndex
            onSelect={(series) => setDrill(`Focused series: ${series}. Drama 7,410→6,710 (−9.5%); Music 4,875→4,635 (−4.9%).`)}
          />
          {drill ? <Drill text={drill} onClear={() => setDrill(null)} /> : null}
          <WhyCcd>
            A thinner post-16 pipeline makes earlier connection — from primary through
            KS4 — more important. CCD aims to support that continuum.
          </WhyCcd>
        </div>
      );

    case "teachers":
      return (
        <div>
          <h2 className="display mb-2 text-2xl text-[#002d24]">Teachers and teaching time</h2>
          <div className="stat-grid mb-3">
            <div className="stat-pill">
              <div className="num">{WORKFORCE.artsTeachersFall}%</div>
              <div className="lbl">Arts teachers vs 2010 (CLA 2024)</div>
            </div>
            <div className="stat-pill">
              <div className="num">{WORKFORCE.teachingHoursFall}%</div>
              <div className="lbl">
                Arts teaching hours, 2011/12–2022/23 (excl. Dance) — CLA 2024
              </div>
            </div>
            <div className="stat-pill">
              <div className="num">
                {WORKFORCE.ebaccHours2025}% vs {WORKFORCE.ebaccHours2010}%
              </div>
              <div className="lbl">
                Secondary hours in EBacc subjects, 2025/26 vs 2010/11 (DfE School
                Workforce Nov 2025; {WORKFORCE.timetablingCoverage}% of eligible
                secondaries supplied timetabling data)
              </div>
            </div>
            <div className="stat-pill">
              <div className="num">~{WORKFORCE.noSubjectQualPostA}%</div>
              <div className="lbl">
                Expressive-arts teachers with no subject-relevant post-A-level
                qualification (CLA 2026) — does not mean ineffective
              </div>
            </div>
          </div>
          <WhyCcd>
            CCD complements expertise. It aims to reduce planning friction for
            specialists and generalists alike — not to replace teachers, instruments or
            live cultural experiences.
          </WhyCcd>
        </div>
      );

    case "poverty":
      return (
        <div>
          <h2 className="display mb-2 text-2xl text-[#002d24]">Poverty, place and access</h2>
          <p className="mb-3 text-sm text-[#5c6b66]">
            FSM status and LA deprivation are related but not identical. Association is
            not proof of causation. West Midlands and North East: highest FSM rates and
            lowest arts GCSE entry share among regions.
          </p>
          <div className="stat-grid">
            <div className="stat-pill">
              <div className="num">
                {CLA_DEPRIVATION_NO_MUSIC.most}% vs {CLA_DEPRIVATION_NO_MUSIC.least}%
              </div>
              <div className="lbl">No GCSE Music — most vs least deprived LA fifth</div>
            </div>
            <div className="stat-pill">
              <div className="num">
                {PRIMARY_HOURS.hoursFellHighestFsm}% vs {PRIMARY_HOURS.hoursFellLowestFsm}%
              </div>
              <div className="lbl">Primary arts hours reduced — highest vs lowest FSM</div>
            </div>
            <div className="stat-pill">
              <div className="num">
                {ALEVEL_SHARE_DEPRIVATION.most}% vs {ALEVEL_SHARE_DEPRIVATION.least}%
              </div>
              <div className="lbl">Arts share of A-level entries by deprivation fifth</div>
            </div>
          </div>
          <WhyCcd>
            CCD aims to prioritise underserved areas in how hubs and resources are
            surfaced — helping teachers reach beyond postcode limits for ideas and
            partners.
          </WhyCcd>
        </div>
      );

    case "he":
      return (
        <div>
          <h2 className="display mb-2 text-2xl text-[#002d24]">Higher education</h2>
          <p className="mb-3 text-sm text-[#5c6b66]">
            {HE_SUMMARY.domesticCad.toLocaleString()} domestic Creative Arts &amp; Design
            undergraduates; {HE_SUMMARY.cadYoy}% vs total domestic {HE_SUMMARY.allDomesticYoy > 0 ? "+" : ""}
            {HE_SUMMARY.allDomesticYoy}%; share {HE_SUMMARY.shareFrom}%→{HE_SUMMARY.shareTo}%.
            Long-term about {HE_SUMMARY.longTermSince2010}% since 2010 (CLA 2024). Do not
            invent a national percentage of universities closing arts courses.
          </p>
          <ChartHe
            onSelect={(subject) =>
              setDrill(`${subject}: year-on-year change in domestic undergraduate numbers (HESA 2024/25 via CLA 2026).`)
            }
          />
          {drill ? <Drill text={drill} onClear={() => setDrill(null)} /> : null}
          <WhyCcd>
            A contracting HE pathway reinforces the need to protect school-stage creative
            learning and keep connections alive earlier in the journey.
          </WhyCcd>
        </div>
      );

    case "hubs":
      return (
        <div>
          <h2 className="display mb-2 text-2xl text-[#002d24]">Music Hubs funding</h2>
          <p className="mb-3 text-sm text-[#5c6b66]">
            43 partnerships. Do not say hub funding has simply “declined”. The earlier
            £79m figure over AY 2023/24–2024/25 is not comparable to the current annual
            settlement. Show streams separately — they are not additive like-for-like
            totals. Capital aims to reach more than 130,000 instruments and pieces of kit
            by the end of 2026/27.
          </p>
          <ChartFunding
            onSelect={(label) =>
              setDrill(
                `${label}. Keep revenue, capital and Centre contract support as separate streams (Turn It Up, July 2026).`,
              )
            }
          />
          {drill ? <Drill text={drill} onClear={() => setDrill(null)} /> : null}
          <WhyCcd>
            Hubs are a natural CCD partnership model: teachers pull organisation planning
            stubs into their library while official materials stay on the organisation
            site.
          </WhyCcd>
        </div>
      );

    case "centre":
      return (
        <div>
          <h2 className="display mb-2 text-2xl text-[#002d24]">
            National Centre for Arts and Music Education
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-[#33443e]">
            <p>
              Phased establishment from September 2026, backed by up to £13 million over
              three years. The Centre is intended to become Music Hubs fundholder from 1
              September 2027 (procurement documentation; the music plan also references
              August 2027).
            </p>
            <p>
              As organisations come together nationally, the opportunity is stronger
              coordination — not duplication. CCDesigner’s proposition aligns with
              connecting teachers and cultural organisations, without claiming any formal
              relationship with the Centre.
            </p>
          </div>
          <WhyCcd>
            CCD aims to make school–organisation connections usable in everyday planning
            as the national architecture evolves.
          </WhyCcd>
        </div>
      );

    case "meaning":
      return (
        <div>
          <h2 className="display mb-2 text-2xl text-[#002d24]">
            What the evidence means for CCDesigner
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-[#33443e]">
            <li>
              <strong>Connect rather than duplicate</strong> — help teachers find and adapt
              outstanding practice; keep official materials on organisation sites.
            </li>
            <li>
              <strong>Support generalist and specialist</strong> — planning stubs, activity
              blocks and curriculum links for different levels of confidence.
            </li>
            <li>
              <strong>Design for different learners</strong> — differentiation and
              responsive planning, including SEND-aware pathways.
            </li>
            <li>
              <strong>Keep learning cumulative</strong> — capture ideas → build lessons →
              half-term and term plans from EYFS to A-level.
            </li>
            <li>
              <strong>Make partnership measurable</strong> — Partner Hubs as a clear
              connection layer teachers can actually use.
            </li>
            <li>
              <strong>Prioritise underserved areas</strong> — surface routes into resources
              where entitlement is thinnest.
            </li>
            <li>
              <strong>Keep children active</strong> — early-years ethos: children help
              shape learning; arts need not always sit in a typical classroom.
            </li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-[#33443e]">
            Strongest funding case: evidence of fragmentation, unequal entitlement and
            teacher-capacity pressure, while national policy seeks school–cultural
            partnerships. CCD aims to make those connections usable day-to-day. We don’t
            need more resources so much as to make the outstanding ones easier to find,
            connect and build upon.
          </p>
          <p className="mt-3 text-xs text-[#5c6b66]">
            Organisation logos on the live site are for demonstration only — not
            endorsements or signed partnerships. This is a prototype / demo connection
            layer.
          </p>
        </div>
      );

    case "conclusion":
      return (
        <div>
          <h2 className="display mb-2 text-2xl text-[#002d24]">Conclusion &amp; sources</h2>
          <p className="mb-3 text-sm leading-relaxed text-[#33443e]">
            Creative education in England has contracted over the long term, with a clear
            entitlement gap linked to disadvantage. Recent Ofqual provisional figures show
            mixed short-term movement, not a reversal of the long-term picture. National
            reform, Music Hubs and the National Centre create space for better connection.
            CCDesigner aims to be part of that practical response — connecting teachers
            and arts organisations without over-claiming impact.
          </p>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#002d24]">
            Principal sources
          </h3>
          <ol className="list-decimal space-y-1.5 pl-4 text-sm text-[#33443e]">
            {PRINCIPAL_SOURCES.map((s) => (
              <li key={s.id}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label} ({s.year})
                  </a>
                ) : (
                  `${s.label} (${s.year})`
                )}
              </li>
            ))}
          </ol>
          <p className="source-note mt-4">
            Verification note: figures on this canvas were re-checked against the cited
            CLA, Ofqual, DfE and HESA analyses on 21 August 2026. Where ChatGPT or older
            briefings conflicted with the primary table, the primary table was preferred.
            Unverified national percentages (for example a single figure for universities
            closing arts courses, or weekly Year 7 teaching time) were omitted.
          </p>
        </div>
      );

    default:
      return null;
  }
}
