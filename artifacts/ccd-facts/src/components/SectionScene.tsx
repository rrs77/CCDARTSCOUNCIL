import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { SectionFrame } from "@/components/SectionFrame";
import type { FrameNode, Presentation } from "@/content/layoutPresentation";

/**
 * Full framed section view after a stack card opens out.
 * Lime side arrows step to the previous / next SECTION (not modal tabs).
 */
export function SectionScene({
  frame,
  presentation,
  activeChildId,
  reduced,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onSelect,
  onOpenDetail,
  onOpenChild,
}: {
  frame: FrameNode;
  presentation: Presentation;
  activeChildId?: string | null;
  reduced?: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelect: () => void;
  onOpenDetail: () => void;
  onOpenChild?: (id: string) => void;
}) {
  return (
    <div className="section-scene">
      <button
        type="button"
        className="stack-arrow stack-arrow--left"
        aria-label="Previous section"
        disabled={!canPrev}
        onClick={onPrev}
      >
        <ChevronLeft className="stack-arrow-icon" strokeWidth={2.5} aria-hidden />
      </button>

      <motion.div
        key={frame.id}
        className="section-scene-stage"
        initial={reduced ? false : { opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <SectionFrame
          frame={frame}
          presentation={presentation}
          highlighted
          activeChildId={activeChildId}
          layout="scene"
          onOpen={onSelect}
          onOpenDetail={onOpenDetail}
          onOpenChild={onOpenChild}
        />
      </motion.div>

      <button
        type="button"
        className="stack-arrow stack-arrow--right"
        aria-label="Next section"
        disabled={!canNext}
        onClick={onNext}
      >
        <ChevronRight className="stack-arrow-icon" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}
