import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import { ChapterBody, SourcesPage } from "@/chapters/ChapterBody";
import { meta, type TopicDef } from "@/content/facts.content";

export type TravelDir = "left" | "right" | "up" | "down" | null;

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

function enterOffset(fromDir: TravelDir, reduced: boolean) {
  if (reduced) return { opacity: 0, scale: 0.92 };
  switch (fromDir) {
    case "right":
      return { opacity: 0, x: 16, y: 10, scale: 0.92 };
    case "left":
      return { opacity: 0, x: -16, y: 10, scale: 0.92 };
    case "up":
      return { opacity: 0, x: 0, y: -10, scale: 0.92 };
    case "down":
      return { opacity: 0, x: 0, y: 14, scale: 0.92 };
    default:
      return { opacity: 0, x: 0, y: 12, scale: 0.92 };
  }
}

/**
 * Landscape overlay modal: fixed header, scrollable body, optional Sources page.
 * Arrow keys are owned by strand travel — page dots change pages inside this topic.
 */
export function TopicModal({
  cluster,
  showKeys,
  onClose,
  footer,
  fromDir = null,
  open,
  shrinking = false,
  editMode = false,
}: {
  cluster: TopicDef;
  showKeys?: boolean;
  onClose: () => void;
  footer?: ReactNode;
  fromDir?: TravelDir;
  open: boolean;
  shrinking?: boolean;
  editMode?: boolean;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const reduced = useReducedMotion() ?? false;
  const visible = open || shrinking;
  const hasSourcesPage =
    cluster.id === "ccd" || (cluster.sourceIds?.length ?? 0) > 0;
  const pageCount = hasSourcesPage ? 2 : 1;
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!open) return;
    setPage(0);
  }, [open, cluster.id]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  useEffect(() => {
    if (!open || shrinking) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
      // Arrows intentionally NOT handled — strand travel owns them
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, open, shrinking]);

  useEffect(() => {
    if (open && !shrinking) bodyRef.current?.scrollTo({ top: 0 });
  }, [cluster.id, open, shrinking, page]);

  const stopCanvas = (e: SyntheticEvent) => e.stopPropagation();

  const pageLabel = useMemo(() => {
    if (page === 0) return "Story";
    return "Sources";
  }, [page]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="topic-modal-root"
          className="topic-modal-root"
          role="dialog"
          aria-modal="true"
          aria-labelledby="topic-modal-title"
          onPointerDown={stopCanvas}
          onWheel={stopCanvas}
          onTouchMove={stopCanvas}
          initial={{ opacity: 0 }}
          animate={{ opacity: shrinking ? 0 : 1 }}
          exit={{ opacity: 0, transition: { duration: reduced ? 0.01 : 0.18 } }}
          transition={{ duration: reduced ? 0.01 : shrinking ? 0.36 : 0.22, ease: EASE }}
        >
          <motion.button
            type="button"
            className="topic-modal-backdrop"
            aria-label="Close"
            onClick={shrinking ? undefined : onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: shrinking ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : shrinking ? 0.3 : 0.24 }}
          />
          <motion.div
            key={cluster.id}
            className={`topic-modal topic-modal--landscape ${shrinking ? "topic-modal--shrinking" : ""}`}
            onPointerDown={stopCanvas}
            onWheel={stopCanvas}
            onTouchMove={stopCanvas}
            initial={enterOffset(fromDir, reduced)}
            animate={
              shrinking
                ? reduced
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.16, y: 48 }
                : { opacity: 1, x: 0, y: 0, scale: 1 }
            }
            exit={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.16, y: 48, transition: { duration: 0.36, ease: EASE } }
            }
            transition={{ duration: reduced ? 0.01 : shrinking ? 0.36 : 0.28, ease: EASE }}
            style={{ transformOrigin: "50% 90%" }}
          >
            <header className="topic-modal-header">
              <div className="topic-modal-header-text">
                <p className="topic-modal-kicker">{meta.brand}</p>
                <h2 id="topic-modal-title" className="topic-modal-title">
                  {cluster.title}
                </h2>
              </div>
              <button
                type="button"
                className="topic-modal-close"
                aria-label={meta.ui.closeModal}
                onClick={onClose}
                disabled={shrinking}
              >
                <X className="h-6 w-6" strokeWidth={2.5} />
              </button>
            </header>

            <div className="topic-modal-scroll-wrap">
              <div
                ref={bodyRef}
                className="topic-modal-body"
                onWheel={stopCanvas}
                onTouchStart={(e) => {
                  if (shrinking || pageCount < 2) return;
                  const t = e.touches[0];
                  swipeRef.current = { x: t.clientX, y: t.clientY };
                }}
                onTouchEnd={(e) => {
                  if (shrinking || pageCount < 2) return;
                  const start = swipeRef.current;
                  swipeRef.current = null;
                  if (!start) return;
                  const t = e.changedTouches[0];
                  const dx = t.clientX - start.x;
                  const dy = t.clientY - start.y;
                  if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
                  if (dx < 0) setPage((p) => Math.min(pageCount - 1, p + 1));
                  else setPage((p) => Math.max(0, p - 1));
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${cluster.id}-${page}`}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, x: -10 }}
                    transition={{ duration: reduced ? 0.01 : 0.22, ease: EASE }}
                  >
                    {page === 0 ? (
                      <ChapterBody
                        cluster={cluster}
                        showKeys={showKeys}
                        hideTitle
                        editMode={editMode}
                      />
                    ) : (
                      <SourcesPage cluster={cluster} showKeys={showKeys} />
                    )}
                    <div className="topic-modal-body-end" aria-hidden />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="topic-modal-fade" aria-hidden />
            </div>

            <footer className="topic-modal-footer topic-modal-footer--pager">
              {pageCount > 1 ? (
                <div className="glance-pager topic-inline-pager">
                  <button
                    type="button"
                    className="glance-pager-btn"
                    disabled={page === 0 || shrinking}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {meta.ui.prevPage}
                  </button>
                  <div className="glance-dots" role="tablist" aria-label="Pages">
                    {Array.from({ length: pageCount }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={i === page}
                        className={`glance-dot ${i === page ? "glance-dot-active" : ""}`}
                        aria-label={i === 0 ? "Story" : "Sources"}
                        onClick={() => setPage(i)}
                        disabled={shrinking}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="glance-pager-btn"
                    disabled={page >= pageCount - 1 || shrinking}
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  >
                    {page === 0 ? "Sources" : meta.ui.nextPage}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <span className="topic-page-label" aria-hidden>
                  {pageLabel}
                </span>
              )}
              {footer ? <div className="topic-modal-footer-actions">{footer}</div> : null}
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
