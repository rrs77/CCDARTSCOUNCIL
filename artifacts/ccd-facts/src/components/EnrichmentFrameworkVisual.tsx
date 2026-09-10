import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

const AREAS = [
  { id: "civic", label: "Civic engagement", short: "Civic", tint: "#0d9488" },
  { id: "arts", label: "Arts and culture", short: "Arts", tint: "#c2410c" },
  { id: "nature", label: "Nature, outdoors & adventure", short: "Nature", tint: "#15803d" },
  { id: "sport", label: "Sport & physical activity", short: "Sport", tint: "#1d4ed8" },
  { id: "skills", label: "Wider life & future skills", short: "Skills", tint: "#a16207" },
] as const;

const BENCHMARKS = [
  {
    n: 1,
    title: "Strategically aligned",
    blurb: "Connect enrichment to curriculum intent, school priorities and structured plans.",
    ccd: "Tag activities to curriculum objectives and school priorities inside planning.",
  },
  {
    n: 2,
    title: "Broad and well-rounded",
    blurb: "Offer across civic, arts, nature, sport and wider life skills.",
    ccd: "Surface gaps across the five enrichment areas on a simple dashboard.",
  },
  {
    n: 3,
    title: "Well communicated",
    blurb: "Clear information; celebrate participation and achievement.",
    ccd: "Keep resources, dates and expectations together for teachers and families.",
  },
  {
    n: 4,
    title: "Community & student voice",
    blurb: "Shape the offer with pupils, parents and staff feedback.",
    ccd: "Capture student voice and partner feedback against activities over time.",
  },
  {
    n: 5,
    title: "Accessible for all",
    blurb: "Engage disadvantaged pupils, SEND and those at risk of missing out.",
    ccd: "Record adaptations, cost, transport and timing barriers with privacy controls.",
  },
  {
    n: 6,
    title: "Works with partners",
    blurb: "Local, national and virtual partners beyond the school’s own staff.",
    ccd: "Music Hubs, arts orgs, CPD, events, calendar and add-to-planning.",
  },
  {
    n: 7,
    title: "Outcomes-focused",
    blurb: "Intended outcomes and proportionate measurement.",
    ccd: "Attach outcomes and gather light-touch evidence of engagement.",
  },
  {
    n: 8,
    title: "Continuously improved",
    blurb: "Review, learn and improve the offer over time.",
    ccd: "Show how provision changes; export summaries for leaders and governors.",
  },
] as const;

/**
 * Interactive Enrichment Framework panel — five areas + eight tap-able benchmarks.
 * Used in the detail modal (and optionally on the focused canvas scene).
 */
export function EnrichmentFrameworkVisual({
  density = "detail",
}: {
  density?: "canvas" | "detail";
}) {
  const reduced = useReducedMotion() ?? false;
  const [active, setActive] = useState<number>(6);
  const compact = density === "canvas";
  const selected = BENCHMARKS.find((b) => b.n === active) ?? BENCHMARKS[5]!;

  return (
    <div className={`enrich-visual${compact ? " enrich-visual--canvas" : ""}`}>
      <p className="enrich-visual-kicker">Five enrichment areas</p>
      <ul className="enrich-areas" aria-label="Five enrichment areas">
        {AREAS.map((area, i) => (
          <motion.li
            key={area.id}
            className="enrich-area"
            style={{ ["--area-tint" as string]: area.tint }}
            initial={reduced ? false : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: reduced ? 0.01 : 0.42,
              delay: reduced ? 0 : 0.06 * i,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          >
            <span className="enrich-area-dot" aria-hidden />
            <span className="enrich-area-label">{compact ? area.short : area.label}</span>
          </motion.li>
        ))}
      </ul>

      <p className="enrich-visual-kicker enrich-visual-kicker--bench">Eight benchmarks · tap to explore</p>
      <div className="enrich-bench-grid" role="list">
        {BENCHMARKS.map((b, i) => {
          const on = b.n === active;
          return (
            <motion.button
              key={b.n}
              type="button"
              role="listitem"
              className={`enrich-bench${on ? " is-active" : ""}`}
              aria-pressed={on}
              aria-label={`Benchmark ${b.n}: ${b.title}`}
              onClick={() => setActive(b.n)}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduced ? 0.01 : 0.35,
                delay: reduced ? 0 : 0.04 * i + 0.2,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              whileHover={reduced ? undefined : { y: -2 }}
              whileTap={reduced ? undefined : { scale: 0.98 }}
            >
              <span className="enrich-bench-n">{b.n}</span>
              <span className="enrich-bench-title">{b.title}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.aside
          key={selected.n}
          className="enrich-bench-detail"
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: reduced ? 0.01 : 0.28 }}
        >
          <p className="enrich-bench-detail-label">
            Benchmark {selected.n}
            {selected.n === 6 ? " · closest match for CCDesigner" : ""}
          </p>
          <p className="enrich-bench-detail-title">{selected.title}</p>
          <p className="enrich-bench-detail-body">{selected.blurb}</p>
          <p className="enrich-bench-detail-ccd">
            <span>For CCDesigner</span>
            {selected.ccd}
          </p>
        </motion.aside>
      </AnimatePresence>
    </div>
  );
}
