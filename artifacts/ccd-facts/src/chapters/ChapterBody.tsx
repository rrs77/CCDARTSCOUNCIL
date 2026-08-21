import { motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { ContentChart } from "@/components/charts/Charts";
import {
  getChart,
  getStat,
  meta,
  principalSourceIds,
  sources,
  type TopicDef,
} from "@/content/facts.content";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

function WhyCcd({ children, showKeys }: { children: ReactNode; showKeys?: boolean }) {
  return (
    <aside className="why-ccd">
      <strong>
        {meta.ui.whyCcdLabel}
        {showKeys ? <span className="edit-key"> whyThisMattersForCCD</span> : null}
      </strong>
      <p className="pitch-body">{children}</p>
    </aside>
  );
}

function Drill({ text, onClear }: { text: string; onClear: () => void }) {
  return (
    <div className="drill-panel">
      <div className="mb-1 flex items-center justify-between gap-2">
        <strong className="text-sm text-[#002d24]">{meta.ui.drillLabel}</strong>
        <button type="button" className="text-xs font-semibold text-[#14b8a6]" onClick={onClear}>
          {meta.ui.drillClear}
        </button>
      </div>
      <p className="pitch-body m-0">{text}</p>
    </div>
  );
}

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE },
  },
};

const reducedItem = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.12 } },
};

export function ChapterBody({
  cluster,
  showKeys,
  hideTitle,
}: {
  cluster: TopicDef;
  showKeys?: boolean;
  hideTitle?: boolean;
}) {
  const [drill, setDrill] = useState<string | null>(null);
  const reduced = useReducedMotion() ?? false;
  const item = reduced ? reducedItem : itemVariants;
  const charts = [...(cluster.chartIds ?? []), ...(cluster.nestedChartIds ?? [])];

  return (
    <motion.div key={cluster.id} variants={listVariants} initial="hidden" animate="show">
      {!hideTitle ? (
        <motion.h2 className="display pitch-h2 mb-2 leading-tight text-[#002d24]" variants={item}>
          {cluster.title}
          {showKeys ? <span className="edit-key"> topics.{cluster.id}.title</span> : null}
        </motion.h2>
      ) : null}

      <motion.p className="mb-3 pitch-body font-medium text-[#14b8a6]" variants={item}>
        {cluster.investorLine}
        {showKeys ? <span className="edit-key"> investorLine</span> : null}
      </motion.p>

      <motion.div className="mt-3 space-y-2.5 text-[#33443e]" variants={item}>
        {cluster.body.map((p, i) => (
          <p key={i} className="pitch-body m-0">
            {p}
          </p>
        ))}
      </motion.div>

      {cluster.statIds?.length ? (
        <motion.div className="stat-grid mt-4" variants={item}>
          {cluster.statIds.map((id) => {
            const s = getStat(id);
            if (!s) return null;
            return (
              <div key={id} className="stat-pill">
                <div className="num pitch-stat">
                  {s.value}
                  {showKeys ? <span className="edit-key"> stats.{id}</span> : null}
                </div>
                <div className="lbl pitch-caption">
                  <strong>{s.label}</strong>
                  <br />
                  {s.footnote}
                </div>
              </div>
            );
          })}
        </motion.div>
      ) : null}

      {charts.map((cid, i) => {
        const chart = getChart(cid);
        if (!chart) return null;
        const nested = i >= (cluster.chartIds?.length ?? 0);
        return (
          <motion.div
            key={cid}
            className={`mt-4 chart-hero ${nested ? "chart-nested" : ""}`}
            variants={item}
          >
            {nested ? <p className="chart-nested-label">Detail</p> : null}
            <ContentChart
              chart={chart}
              showKeys={showKeys}
              onDrill={(label) => setDrill(label ? `Selected: ${label}` : null)}
            />
          </motion.div>
        );
      })}

      {cluster.id === "ccd" ? (
        <motion.ol className="mt-4 list-decimal space-y-1.5 pl-4 pitch-caption text-[#33443e]" variants={item}>
          {principalSourceIds.map((id) => {
            const s = sources[id];
            if (!s) return null;
            return (
              <li key={id}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label} ({s.year})
                  </a>
                ) : (
                  `${s.label} (${s.year})`
                )}
              </li>
            );
          })}
          <li className="list-none pt-2 italic text-[#6b7d80]">{meta.verificationNote}</li>
          <li className="list-none italic text-[#6b7d80]">{meta.closing}</li>
        </motion.ol>
      ) : null}

      {drill ? (
        <motion.div variants={item}>
          <Drill text={drill} onClear={() => setDrill(null)} />
        </motion.div>
      ) : null}

      <motion.div variants={item}>
        <WhyCcd showKeys={showKeys}>{cluster.whyThisMattersForCCD}</WhyCcd>
      </motion.div>
    </motion.div>
  );
}
