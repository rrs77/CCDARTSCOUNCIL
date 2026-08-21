import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ReactNode, type SyntheticEvent } from "react";
import { ChapterBody } from "@/chapters/ChapterBody";
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
 * True overlay modal: fixed header, scrollable body.
 * `shrinking` plays the strand “collapse back to box” before travel.
 */
export function TopicModal({
  cluster,
  showKeys,
  onClose,
  footer,
  fromDir = null,
  open,
  shrinking = false,
}: {
  cluster: TopicDef;
  showKeys?: boolean;
  onClose: () => void;
  footer?: ReactNode;
  fromDir?: TravelDir;
  open: boolean;
  shrinking?: boolean;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const visible = open || shrinking;

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
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, open, shrinking]);

  useEffect(() => {
    if (open && !shrinking) bodyRef.current?.scrollTo({ top: 0 });
  }, [cluster.id, open, shrinking]);

  const stopCanvas = (e: SyntheticEvent) => e.stopPropagation();

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
            className={`topic-modal ${shrinking ? "topic-modal--shrinking" : ""}`}
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
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </header>

            <div className="topic-modal-scroll-wrap">
              <div
                ref={bodyRef}
                className="topic-modal-body"
                onWheel={stopCanvas}
                onTouchMove={stopCanvas}
              >
                <ChapterBody cluster={cluster} showKeys={showKeys} hideTitle />
                <div className="topic-modal-body-end" aria-hidden />
              </div>
              <div className="topic-modal-fade" aria-hidden />
            </div>

            {footer ? <footer className="topic-modal-footer">{footer}</footer> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
