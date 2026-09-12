import { Printer, Save, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { assetUrl } from "@/content/sectionIllustrations";
import { modalBackdropTransition, modalBounce, modalPanelTransition } from "@/lib/modalMotion";

const PDF_HREF = assetUrl("the-facts-briefing.pdf");
const PDF_NAME = "the-facts-briefing.pdf";

export function BriefingPdfModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const bounce = modalBounce(reduced);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, open]);

  const printPdf = () => {
    const win = frameRef.current?.contentWindow;
    if (win) {
      win.focus();
      win.print();
      return;
    }
    window.open(PDF_HREF, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="briefing-modal-root"
          role="dialog"
          aria-modal="true"
          aria-labelledby="briefing-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduced ? 0.01 : 0.16 } }}
          transition={modalBackdropTransition(reduced)}
        >
          <button type="button" className="briefing-modal-backdrop" aria-label="Close" onClick={onClose} />
          <motion.div
            className="briefing-modal"
            initial={bounce.initial}
            animate={bounce.animate}
            exit={bounce.exit}
            transition={modalPanelTransition(reduced)}
          >
            <header className="briefing-modal-header">
              <div className="briefing-modal-heading">
                <p className="briefing-modal-kicker">Creative Curriculum Designer</p>
                <h2 id="briefing-modal-title" className="briefing-modal-title">
                  The facts
                </h2>
              </div>
              <div className="briefing-modal-tools">
                <button type="button" className="briefing-modal-action" onClick={printPdf}>
                  <Printer aria-hidden />
                  <span>Print</span>
                </button>
                <a className="briefing-modal-action" href={PDF_HREF} download={PDF_NAME}>
                  <Save aria-hidden />
                  <span>Save</span>
                </a>
                <button
                  type="button"
                  className="briefing-modal-close"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X aria-hidden />
                </button>
              </div>
            </header>
            <iframe
              ref={frameRef}
              className="briefing-modal-frame"
              title="The facts briefing PDF"
              src={PDF_HREF}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
