import { Minus, Plus, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode, type SyntheticEvent, type WheelEvent } from "react";
import { ContentChart } from "@/components/charts/Charts";
import { getChart } from "@/content/facts.content";
import type { ContentBlock } from "@/content/parseContent";
import type { FrameNode } from "@/content/layoutPresentation";
import { modalBackdropTransition, modalBounce, modalPanelTransition } from "@/lib/modalMotion";

function heroUrl(file: string) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${file}`.replace(/\/{2,}/g, "/").replace(":/", "://");
}

function linkifyText(
  text: string,
  links: { id: string; title: string }[],
  onNavigate?: (id: string) => void,
): ReactNode {
  if (!onNavigate || !links.length) return text;
  // Longest titles first so “Secondary and access” wins over shorter matches
  const sorted = [...links].sort((a, b) => b.title.length - a.title.length);
  const pattern = new RegExp(
    `(${sorted.map((l) => l.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  const parts = text.split(pattern);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    const hit = sorted.find((l) => l.title.toLowerCase() === part.toLowerCase());
    if (!hit) return <span key={i}>{part}</span>;
    return (
      <button
        key={i}
        type="button"
        className="detail-inline-link"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(hit.id);
        }}
      >
        {part}
      </button>
    );
  });
}

function Blocks({
  blocks,
  contentZoom,
  sectionLinks,
  onNavigate,
}: {
  blocks: ContentBlock[];
  contentZoom: number;
  sectionLinks?: { id: string; title: string }[];
  onNavigate?: (id: string) => void;
}) {
  const links = sectionLinks ?? [];
  return (
    <div className="detail-blocks" style={{ ["--detail-zoom" as string]: String(contentZoom) }}>
      {blocks.map((b, i) => {
        if (b.type === "paragraph") {
          return (
            <p key={i} className="detail-sentence">
              {linkifyText(b.text, links, onNavigate)}
            </p>
          );
        }
        if (b.type === "list") {
          return (
            <ul key={i} className="detail-list">
              {b.items.map((item, j) => (
                <li key={j}>{linkifyText(item, links, onNavigate)}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "quote") {
          return (
            <aside key={i} className="detail-quote">
              <p>{linkifyText(b.text, links, onNavigate)}</p>
            </aside>
          );
        }
        if (b.type === "stat") {
          return (
            <div key={i} className="detail-stat">
              <p className="detail-stat-value">{b.value}</p>
              <p className="detail-stat-label">{b.label}</p>
            </div>
          );
        }
        if (b.type === "chart") {
          const chart = getChart(b.chartId);
          if (!chart) return null;
          return (
            <div key={i} className="detail-chart">
              <ContentChart chart={chart} />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

/**
 * Large landscape detail modal (~92vw × 72dvh).
 * Second click from a focused canvas/Map heading. Next/Prev owned by App.
 */
export function DetailModal({
  frame,
  open,
  onClose,
  sectionLinks = [],
  onNavigate,
}: {
  frame: FrameNode | null;
  open: boolean;
  onClose: () => void;
  sectionLinks?: { id: string; title: string }[];
  onNavigate?: (id: string) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      bodyRef.current?.scrollTo({ top: 0 });
      setZoom(1);
    }
  }, [open, frame?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        e.stopPropagation();
        setZoom((z) => Math.min(2.2, z * 1.15));
        return;
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        e.stopPropagation();
        setZoom((z) => Math.max(0.7, z / 1.15));
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, open]);

  const onWheelZoom = useCallback((e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    e.stopPropagation();
    const factor = Math.exp(-e.deltaY * 0.0015);
    setZoom((z) => Math.min(2.2, Math.max(0.7, z * factor)));
  }, []);

  const stop = (e: SyntheticEvent) => e.stopPropagation();
  if (!frame) return null;

  const topChart = frame.chartId ? getChart(frame.chartId) : undefined;
  const hasBlocks = frame.blocks.length > 0;
  const bounce = modalBounce(reduced);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="detail-modal-root"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
          onPointerDown={stop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduced ? 0.01 : 0.16 } }}
          transition={modalBackdropTransition(reduced)}
        >
          <button type="button" className="detail-modal-backdrop" aria-label="Close" onClick={onClose} />
          <motion.div
            className="detail-modal"
            initial={bounce.initial}
            animate={bounce.animate}
            exit={bounce.exit}
            transition={modalPanelTransition(reduced)}
            onPointerDown={stop}
          >
            <header className="detail-modal-header">
              <div className="detail-modal-header-text">
                {frame.titleSmall ? <p className="detail-modal-kicker">{frame.titleSmall}</p> : null}
                <h2 id="detail-modal-title" className="detail-modal-title">
                  {frame.title}
                </h2>
              </div>
              <div className="detail-modal-tools">
                <button
                  type="button"
                  className="detail-modal-zoom"
                  aria-label="Zoom out"
                  title="Zoom out (−)"
                  onClick={() => setZoom((z) => Math.max(0.7, z / 1.15))}
                >
                  <Minus className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <span className="detail-modal-zoom-label" aria-hidden>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  className="detail-modal-zoom"
                  aria-label="Zoom in"
                  title="Zoom in (+)"
                  onClick={() => setZoom((z) => Math.min(2.2, z * 1.15))}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <button type="button" className="detail-modal-close" aria-label="Close" onClick={onClose}>
                  <X className="h-6 w-6" strokeWidth={2.5} />
                </button>
              </div>
            </header>

            <div
              className="detail-modal-scroll"
              ref={bodyRef}
              onWheel={onWheelZoom}
              onPointerDown={stop}
            >
              <div
                className="detail-modal-zoom-surface"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  width: `${100 / zoom}%`,
                }}
              >
                <div className="detail-modal-layout">
                  <div className="detail-modal-copy">
                    {!hasBlocks && frame.heroStat ? (
                      <div className="detail-stat">
                        <p className="detail-stat-value">{frame.heroStat.value}</p>
                        <p className="detail-stat-label">{frame.heroStat.label}</p>
                      </div>
                    ) : null}
                    {!hasBlocks && frame.sentence ? <p className="detail-sentence">{frame.sentence}</p> : null}
                    {!hasBlocks && frame.quote ? (
                      <aside className="detail-quote">
                        <p>{frame.quote}</p>
                      </aside>
                    ) : null}

                    {hasBlocks ? (
                      <Blocks
                        blocks={frame.blocks}
                        contentZoom={1}
                        sectionLinks={sectionLinks}
                        onNavigate={onNavigate}
                      />
                    ) : null}

                    {frame.subsections?.map((sub) => (
                      <section key={sub.title} className="detail-subsection">
                        <h3 className="detail-subsection-title">{sub.title}</h3>
                        <Blocks
                          blocks={sub.blocks}
                          contentZoom={1}
                          sectionLinks={sectionLinks}
                          onNavigate={onNavigate}
                        />
                      </section>
                    ))}

                    {frame.footnotes?.length ? (
                      <ol className="detail-footnotes">
                        {frame.footnotes.map((fn) => (
                          <li key={fn.id}>
                            {fn.url ? (
                              <a href={fn.url} target="_blank" rel="noopener noreferrer">
                                {fn.text}
                              </a>
                            ) : (
                              fn.text
                            )}
                          </li>
                        ))}
                      </ol>
                    ) : null}

                    {sectionLinks.length && onNavigate ? (
                      <nav className="detail-see-also" aria-label="Other sections">
                        <p className="detail-see-also-label">See also</p>
                        <ul>
                          {sectionLinks.slice(0, 8).map((s) => (
                            <li key={s.id}>
                              <button
                                type="button"
                                className="detail-see-also-link"
                                onClick={() => onNavigate(s.id)}
                              >
                                See {s.title}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </nav>
                    ) : null}
                  </div>

                  <div className="detail-modal-visual">
                    {frame.photoHero && !frame.heroStat && !topChart ? (
                      <div className="detail-photo-bubble">
                        <img
                          src={heroUrl("hero-arts.jpg")}
                          alt=""
                          className={`crop-${frame.photoCrop}`}
                          draggable={false}
                        />
                      </div>
                    ) : null}
                    {frame.heroStat && !hasBlocks ? (
                      <div className="detail-stat detail-stat--hero">
                        <p className="detail-stat-value">{frame.heroStat.value}</p>
                        <p className="detail-stat-label">{frame.heroStat.label}</p>
                      </div>
                    ) : null}
                    {topChart && !frame.blocks.some((b) => b.type === "chart" && b.chartId === frame.chartId) ? (
                      <div className="detail-chart">
                        <ContentChart chart={topChart} />
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="detail-modal-end" aria-hidden />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
