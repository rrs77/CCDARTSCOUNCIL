import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FrameNode } from "@/content/layoutPresentation";
import { stackLabel } from "@/content/stackLabels";

/**
 * Overview = a visual stack / deck of large section cards.
 * Front card fills most of the viewport; neighbours peek behind.
 * Click a card or use lime side arrows to open / cycle.
 */
export function StackOverview({
  sections,
  frontIndex,
  reduced,
  onFrontChange,
  onOpen,
}: {
  sections: FrameNode[];
  frontIndex: number;
  reduced?: boolean;
  onFrontChange: (index: number) => void;
  onOpen: (id: string) => void;
}) {
  const n = sections.length;
  if (!n) return null;
  const front = ((frontIndex % n) + n) % n;

  const prev = () => onFrontChange((front - 1 + n) % n);
  const next = () => onFrontChange((front + 1) % n);

  // Show front + a few behind for the deck peek
  const visible = [0, 1, 2, 3]
    .map((offset) => {
      const i = (front + offset) % n;
      return { frame: sections[i]!, offset, index: i };
    })
    .reverse(); // draw back first

  return (
    <div className="stack-overview" aria-label="Section stack">
      <button
        type="button"
        className="stack-arrow stack-arrow--left"
        aria-label="Previous section card"
        onClick={prev}
      >
        <ChevronLeft className="stack-arrow-icon" strokeWidth={2.5} aria-hidden />
      </button>

      <div className="stack-deck">
        <AnimatePresence initial={false}>
          {visible.map(({ frame, offset, index }) => {
            const isFront = offset === 0;
            const y = offset * 18;
            const x = offset * 14;
            const scale = 1 - offset * 0.045;
            const opacity = 1 - offset * 0.12;
            return (
              <motion.button
                key={frame.id}
                type="button"
                className={`stack-card ${isFront ? "is-front" : "is-back"}`}
                style={{ zIndex: 20 - offset }}
                initial={reduced ? false : { opacity: 0, y: 40 }}
                animate={{
                  opacity,
                  x,
                  y,
                  scale,
                }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.92 }}
                transition={{ duration: reduced ? 0.01 : 0.35, ease: [0.4, 0, 0.2, 1] }}
                onClick={() => {
                  if (isFront) onOpen(frame.id);
                  else onFrontChange(index);
                }}
                aria-label={
                  isFront
                    ? `Open ${stackLabel(frame.id, frame.title)}`
                    : `Bring ${stackLabel(frame.id, frame.title)} to front`
                }
                aria-current={isFront ? "true" : undefined}
              >
                <div className="stack-card-inner">
                  <p className="stack-card-kicker">The facts</p>
                  <h2 className="stack-card-title">{stackLabel(frame.id, frame.title)}</h2>
                  {frame.sentence || frame.quote ? (
                    <p className="stack-card-blurb">{frame.quote || frame.sentence}</p>
                  ) : null}
                  {isFront ? (
                    <span className="stack-card-hint">Open section</span>
                  ) : null}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <button
        type="button"
        className="stack-arrow stack-arrow--right"
        aria-label="Next section card"
        onClick={next}
      >
        <ChevronRight className="stack-arrow-icon" strokeWidth={2.5} aria-hidden />
      </button>

      <div className="stack-dots" role="tablist" aria-label="Sections">
        {sections.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === front}
            className={`stack-dot ${i === front ? "is-active" : ""}`}
            aria-label={stackLabel(s.id, s.title)}
            onClick={() => onFrontChange(i)}
          />
        ))}
      </div>
    </div>
  );
}
