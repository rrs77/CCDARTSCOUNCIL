import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ContentChart } from "@/components/charts/Charts";
import { EditableText } from "@/components/EditableText";
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

/** Sources register — second page only; never the main story. */
export function SourcesPage({
  cluster,
  showKeys,
}: {
  cluster: TopicDef;
  showKeys?: boolean;
}) {
  const ids =
    cluster.id === "ccd"
      ? [...principalSourceIds]
      : cluster.sourceIds.length
        ? cluster.sourceIds
        : [];

  return (
    <div className="topic-sources-page">
      <h3 className="topic-sources-heading">
        Sources
        {showKeys ? <span className="edit-key"> sources</span> : null}
      </h3>
      <ol className="topic-sources-list">
        {ids.map((id) => {
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
      </ol>
      {cluster.id === "ccd" ? (
        <div className="topic-sources-notes">
          <p>{meta.verificationNote}</p>
          <p>{meta.closing}</p>
        </div>
      ) : null}
    </div>
  );
}

/** Stacked story paragraphs — each idea is its own block with real air between. */
function StoryParas({
  paragraphs,
  editMode,
  onChange,
  showKeys,
  topicId,
}: {
  paragraphs: string[];
  editMode?: boolean;
  onChange?: (next: string[]) => void;
  showKeys?: boolean;
  topicId: string;
}) {
  const focusAfterInsert = useRef<number | null>(null);

  useEffect(() => {
    if (focusAfterInsert.current == null) return;
    const idx = focusAfterInsert.current;
    focusAfterInsert.current = null;
    const el = document.querySelector(
      `[data-story-para="${topicId}-${idx}"]`,
    ) as HTMLElement | null;
    el?.focus();
  }, [paragraphs, topicId]);

  const setAt = (index: number, value: string) => {
    if (!onChange) return;
    const next = [...paragraphs];
    next[index] = value;
    onChange(next);
  };

  const insertAfter = (index: number) => {
    if (!onChange) return;
    const next = [...paragraphs];
    next.splice(index + 1, 0, "");
    focusAfterInsert.current = index + 1;
    onChange(next);
  };

  return (
    <ul className="topic-story-list">
      {paragraphs.map((p, i) => (
        <li key={`${topicId}-p-${i}`} className="topic-story-item">
          {editMode && onChange ? (
            <EditableText
              value={p}
              editMode
              as="p"
              className="pitch-body topic-story-para"
              data-story-para={`${topicId}-${i}`}
              placeholder="New paragraph…"
              aria-label={`Paragraph ${i + 1}`}
              onChange={(v) => setAt(i, v)}
              onEnterNewParagraph={() => insertAfter(i)}
            />
          ) : (
            <p className="pitch-body topic-story-para">{p}</p>
          )}
          {showKeys ? <span className="edit-key"> body[{i}]</span> : null}
        </li>
      ))}
    </ul>
  );
}

export function ChapterBody({
  cluster,
  showKeys,
  hideTitle,
  editMode,
}: {
  cluster: TopicDef;
  showKeys?: boolean;
  hideTitle?: boolean;
  editMode?: boolean;
}) {
  const [drill, setDrill] = useState<string | null>(null);
  const [body, setBody] = useState(cluster.body);
  const reduced = useReducedMotion() ?? false;
  const item = reduced ? reducedItem : itemVariants;
  const isCcd = cluster.id === "ccd";
  const charts = isCcd
    ? []
    : [...(cluster.chartIds ?? []), ...(cluster.nestedChartIds ?? [])];
  const hasFigures = !!(cluster.statIds?.length || charts.length);

  useEffect(() => {
    setBody(cluster.body);
  }, [cluster.id, cluster.body]);

  return (
    <motion.div
      key={cluster.id}
      className="topic-layout topic-layout--stack"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      <div className="topic-layout-story">
        {!hideTitle ? (
          <motion.h2 className="display pitch-h2 mb-3 leading-tight text-[#002d24]" variants={item}>
            {cluster.title}
            {showKeys ? <span className="edit-key"> topics.{cluster.id}.title</span> : null}
          </motion.h2>
        ) : null}

        {cluster.investorLine ? (
          <motion.p className="topic-lead" variants={item}>
            {cluster.investorLine}
            {showKeys ? <span className="edit-key"> investorLine</span> : null}
          </motion.p>
        ) : null}

        <motion.div variants={item}>
          <StoryParas
            topicId={cluster.id}
            paragraphs={body}
            editMode={editMode}
            showKeys={showKeys}
            onChange={editMode ? setBody : undefined}
          />
        </motion.div>
      </div>

      {hasFigures ? (
        <div className="topic-layout-figures">
          {cluster.statIds?.length ? (
            <motion.div className="stat-grid" variants={item}>
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
                className={`chart-hero ${nested ? "chart-nested" : ""}`}
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

          {drill ? (
            <motion.div variants={item}>
              <Drill text={drill} onClear={() => setDrill(null)} />
            </motion.div>
          ) : null}
        </div>
      ) : null}

      {/* Pull-out last — after body, reachable by scroll */}
      <motion.div className="topic-layout-why" variants={item}>
        <WhyCcd showKeys={showKeys}>{cluster.whyThisMattersForCCD}</WhyCcd>
      </motion.div>
    </motion.div>
  );
}
