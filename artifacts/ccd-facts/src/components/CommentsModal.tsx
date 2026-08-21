import { Lightbulb, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { modalBounce, modalBackdropTransition, modalPanelTransition } from "@/lib/modalMotion";

export type CommentsPayload = {
  id: string;
  title: string;
  /** Short pathway comment */
  comment?: string;
  /** “Why this matters…” pull-out */
  why?: string;
  /** Extra supporting comment lines (not stats/charts) */
  extras?: string[];
};

/**
 * Compact landscape modal for zone comments / “Why this matters”.
 * Bounce-in shared with the detail modal.
 */
export function CommentsModal({
  payload,
  open,
  onClose,
}: {
  payload: CommentsPayload | null;
  open: boolean;
  onClose: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const bounce = modalBounce(reduced);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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

  if (!payload) return null;

  const hasBody = !!(payload.comment || payload.why || (payload.extras && payload.extras.length));

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="comments-modal-root"
          role="dialog"
          aria-modal="true"
          aria-labelledby="comments-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduced ? 0.01 : 0.16 } }}
          transition={modalBackdropTransition(reduced)}
        >
          <button
            type="button"
            className="comments-modal-backdrop"
            aria-label="Close comments"
            onClick={onClose}
          />
          <motion.div
            className="comments-modal"
            initial={bounce.initial}
            animate={bounce.animate}
            exit={bounce.exit}
            transition={modalPanelTransition(reduced)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <header className="comments-modal-header">
              <div className="comments-modal-header-mark" aria-hidden>
                <Lightbulb className="comments-modal-bulb" strokeWidth={2.25} />
              </div>
              <div className="comments-modal-header-text">
                <p className="comments-modal-kicker">Why this matters</p>
                <h2 id="comments-modal-title" className="comments-modal-title">
                  {payload.title}
                </h2>
              </div>
              <button
                type="button"
                className="comments-modal-close"
                aria-label="Close"
                onClick={onClose}
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </header>

            <div className="comments-modal-body">
              {!hasBody ? (
                <p className="comments-modal-empty">No comments for this section yet.</p>
              ) : (
                <>
                  {payload.comment ? (
                    <p className="comments-modal-lead">{payload.comment}</p>
                  ) : null}
                  {payload.why ? (
                    <aside className="comments-modal-why">
                      <p>{payload.why}</p>
                    </aside>
                  ) : null}
                  {payload.extras?.map((line, i) => (
                    <p key={i} className="comments-modal-extra">
                      {line}
                    </p>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
