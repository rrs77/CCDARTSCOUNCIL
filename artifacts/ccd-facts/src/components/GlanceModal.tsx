import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { glanceModal, meta, type GlancePage } from "@/content/facts.content";

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/**
 * Two-page key findings modal — clear H2s, not a 9-card grid.
 * Left/right + swipe change pages while open; body stays overflow-y auto.
 */
export function GlanceModal({
  open,
  onClose,
  showKeys,
}: {
  open: boolean;
  onClose: () => void;
  showKeys?: boolean;
}) {
  const pages: GlancePage[] = glanceModal.pages;
  const [page, setPage] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (!open) return;
    setPage(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) bodyRef.current?.scrollTo({ top: 0 });
  }, [page, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        e.stopPropagation();
        setPage((p) => Math.max(0, p - 1));
        return;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        e.stopPropagation();
        setPage((p) => Math.min(pages.length - 1, p + 1));
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, open, pages.length]);

  const stopCanvas = (e: SyntheticEvent) => e.stopPropagation();

  const current = pages[page];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="glance-modal-root"
          className="topic-modal-root"
          role="dialog"
          aria-modal="true"
          aria-labelledby="glance-modal-title"
          onPointerDown={stopCanvas}
          onWheel={stopCanvas}
          onTouchMove={stopCanvas}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduced ? 0.01 : 0.18 } }}
          transition={{ duration: reduced ? 0.01 : 0.22, ease: EASE }}
        >
          <motion.button
            type="button"
            className="topic-modal-backdrop"
            aria-label="Close"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.24 }}
          />
          <motion.div
            className="topic-modal glance-modal"
            onPointerDown={stopCanvas}
            onWheel={stopCanvas}
            onTouchMove={stopCanvas}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, transition: { duration: 0.18 } }}
            transition={{ duration: reduced ? 0.01 : 0.26, ease: EASE }}
          >
            <header className="topic-modal-header">
              <div className="topic-modal-header-text">
                <p className="topic-modal-kicker">{meta.brand}</p>
                <h2 id="glance-modal-title" className="topic-modal-title">
                  {glanceModal.title}
                  {showKeys ? <span className="edit-key"> glanceModal.title</span> : null}
                </h2>
              </div>
              <button
                type="button"
                className="topic-modal-close"
                aria-label={meta.ui.closeModal}
                onClick={onClose}
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </header>

            <div className="topic-modal-scroll-wrap">
              <div
                ref={bodyRef}
                className="topic-modal-body"
                onWheel={stopCanvas}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  swipeRef.current = { x: t.clientX, y: t.clientY };
                }}
                onTouchEnd={(e) => {
                  const start = swipeRef.current;
                  swipeRef.current = null;
                  if (!start) return;
                  const t = e.changedTouches[0];
                  const dx = t.clientX - start.x;
                  const dy = t.clientY - start.y;
                  if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
                  if (dx < 0) setPage((p) => Math.min(pages.length - 1, p + 1));
                  else setPage((p) => Math.max(0, p - 1));
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={current.id}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, x: -10 }}
                    transition={{ duration: reduced ? 0.01 : 0.22, ease: EASE }}
                  >
                    <h3 className="glance-page-heading">
                      {current.heading}
                      {showKeys ? (
                        <span className="edit-key"> glanceModal.pages[{page}].heading</span>
                      ) : null}
                    </h3>

                    {current.figures ? (
                      <div className="glance-figures">
                        {current.figures.map((f) => (
                          <article key={f.label} className="glance-figure">
                            <p className="glance-figure-value">{f.value}</p>
                            <p className="glance-figure-label">{f.label}</p>
                            <p className="glance-figure-source">{f.source}</p>
                          </article>
                        ))}
                      </div>
                    ) : null}

                    {current.summary ? <p className="glance-summary">{current.summary}</p> : null}

                    {current.sections?.map((sec) => (
                      <section key={sec.title} className="glance-section">
                        <h4 className="glance-section-title">{sec.title}</h4>
                        <div className="glance-figures glance-figures--compact">
                          {sec.figures.map((f) => (
                            <article key={f.label} className="glance-figure">
                              <p className="glance-figure-value">{f.value}</p>
                              <p className="glance-figure-label">{f.label}</p>
                              <p className="glance-figure-source">{f.source}</p>
                            </article>
                          ))}
                        </div>
                        {sec.caveat ? <p className="glance-caveat">{sec.caveat}</p> : null}
                      </section>
                    ))}

                    {current.whyThisMattersForCCD ? (
                      <aside className="why-ccd">
                        <strong>{meta.ui.whyCcdLabel}</strong>
                        <p className="pitch-body">{current.whyThisMattersForCCD}</p>
                      </aside>
                    ) : null}

                    <div className="topic-modal-body-end" aria-hidden />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="topic-modal-fade" aria-hidden />
            </div>

            <footer className="glance-pager">
              <button
                type="button"
                className="glance-pager-btn"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                {meta.ui.prevPage}
              </button>
              <div className="glance-dots" role="tablist" aria-label="Pages">
                {pages.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={i === page}
                    className={`glance-dot ${i === page ? "glance-dot-active" : ""}`}
                    aria-label={`Page ${i + 1}: ${p.heading}`}
                    onClick={() => setPage(i)}
                  />
                ))}
              </div>
              <button
                type="button"
                className="glance-pager-btn"
                disabled={page >= pages.length - 1}
                onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
              >
                {meta.ui.nextPage}
                <ChevronRight className="h-4 w-4" />
              </button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

