import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type SyntheticEvent } from "react";
import { ContentChart } from "@/components/charts/Charts";
import { getChart } from "@/content/facts.content";
import type { FrameNode } from "@/content/layoutPresentation";

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

function heroUrl(file: string) {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${file}`.replace(/\/{2,}/g, "/").replace(":/", "://");
}

/**
 * Large landscape detail modal — one click from the canvas.
 * Arrow keys / Next-Prev are owned by the app (dismiss → overview), not paging here.
 */
export function DetailModal({
  frame,
  open,
  onClose,
}: {
  frame: FrameNode | null;
  open: boolean;
  onClose: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) bodyRef.current?.scrollTo({ top: 0 });
  }, [open, frame?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, open]);

  const stop = (e: SyntheticEvent) => e.stopPropagation();
  if (!frame) return null;

  const chart = frame.chartId ? getChart(frame.chartId) : undefined;

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
          exit={{ opacity: 0, transition: { duration: reduced ? 0.01 : 0.18 } }}
          transition={{ duration: reduced ? 0.01 : 0.22, ease: EASE }}
        >
          <button type="button" className="detail-modal-backdrop" aria-label="Close" onClick={onClose} />
          <motion.div
            className="detail-modal"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: reduced ? 0.01 : 0.28, ease: EASE }}
            onPointerDown={stop}
          >
            <header className="detail-modal-header">
              <div>
                {frame.titleSmall ? <p className="detail-modal-kicker">{frame.titleSmall}</p> : null}
                <h2 id="detail-modal-title" className="detail-modal-title">
                  {frame.titleGiant || frame.title}
                </h2>
              </div>
              <button type="button" className="detail-modal-close" aria-label="Close" onClick={onClose}>
                <X className="h-6 w-6" strokeWidth={2.5} />
              </button>
            </header>

            <div className="detail-modal-scroll" ref={bodyRef} onWheel={stop}>
              <div className="detail-modal-layout">
                <div className="detail-modal-copy">
                  {frame.heroStat ? (
                    <div className="detail-stat">
                      <p className="detail-stat-value">{frame.heroStat.value}</p>
                      <p className="detail-stat-label">{frame.heroStat.label}</p>
                    </div>
                  ) : null}
                  {frame.sentence ? <p className="detail-sentence">{frame.sentence}</p> : null}
                  {frame.quote ? (
                    <aside className="detail-quote">
                      <p>{frame.quote}</p>
                    </aside>
                  ) : null}
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
                </div>

                <div className="detail-modal-visual">
                  {frame.photoHero && !frame.heroStat ? (
                    <div className="detail-photo-bubble">
                      <img
                        src={heroUrl("hero-arts.jpg")}
                        alt=""
                        className={`crop-${frame.photoCrop}`}
                        draggable={false}
                      />
                    </div>
                  ) : null}
                  {chart ? (
                    <div className="detail-chart">
                      <ContentChart chart={chart} />
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="detail-modal-end" aria-hidden />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
