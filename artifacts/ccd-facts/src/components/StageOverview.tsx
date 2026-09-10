import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { StageIconBadge } from "@/components/StageIconBadge";
import type { FrameNode } from "@/content/layoutPresentation";
import { stageComment, stageLabel } from "@/content/stackLabels";
import { sectionAccent } from "@/content/sectionAccent";

function overviewLabel(frame: FrameNode): string {
  if (frame.id === "music-hubs-and-national-centre") {
    return "Music Hubs & National Centre";
  }
  if (frame.id === "enrichment-framework") {
    return "Enrichment Framework";
  }
  return stageLabel(frame.id, frame.title);
}

function overviewBlurb(frame: FrameNode): string {
  if (frame.id === "enrichment-framework") {
    return "Non-statutory guidance into usable partnership, access and evidence.";
  }
  if (frame.id === "music-hubs-and-national-centre") {
    return "National funding streams and the infrastructure for arts partnership.";
  }
  return stageComment(frame.id, frame.sentence || "Open this stage to explore the evidence.");
}

const easeOut = [0.22, 1, 0.36, 1] as const;

/**
 * Arts-led entrance — brand first, one clear path into the evidence journey.
 * Motion is intentional: atmosphere, stagger, and hover presence — not noise.
 */
export function StageOverview({
  stages,
  onOpen,
}: {
  stages: FrameNode[];
  onOpen: (id: string) => void;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <div className="stage-launcher">
      <div className="stage-launcher-atmosphere" aria-hidden>
        <motion.span
          className="stage-orb stage-orb--a"
          animate={reduced ? undefined : { x: [0, 28, -12, 0], y: [0, -18, 10, 0] }}
          transition={reduced ? undefined : { duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="stage-orb stage-orb--b"
          animate={reduced ? undefined : { x: [0, -22, 16, 0], y: [0, 14, -20, 0] }}
          transition={reduced ? undefined : { duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="stage-orb stage-orb--c"
          animate={reduced ? undefined : { opacity: [0.35, 0.55, 0.4, 0.35], scale: [1, 1.08, 0.96, 1] }}
          transition={reduced ? undefined : { duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <header className="stage-launcher-intro">
        <motion.p
          className="stage-launcher-brand"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.55, ease: easeOut }}
        >
          Creative Curriculum Designer
        </motion.p>
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.65, delay: reduced ? 0 : 0.06, ease: easeOut }}
        >
          The <em>facts</em>
        </motion.h1>
        <motion.p
          className="stage-launcher-lead"
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.55, delay: reduced ? 0 : 0.14, ease: easeOut }}
        >
          Evidence for creative education in England — from early years to higher education,
          partnership and enrichment.
        </motion.p>
      </header>

      <ul className="stage-launcher-list" aria-label="Evidence stages">
        {stages.map((frame, i) => {
          const label = overviewLabel(frame);
          const blurb = overviewBlurb(frame);
          const accent = sectionAccent(frame.id);
          return (
            <motion.li
              key={frame.id}
              initial={reduced ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduced ? 0.01 : 0.5,
                delay: reduced ? 0 : 0.18 + i * 0.055,
                ease: easeOut,
              }}
            >
              <button
                type="button"
                className="stage-launcher-item"
                style={{ ["--stage-accent" as string]: accent }}
                onClick={() => onOpen(frame.id)}
                aria-label={`Open ${label}`}
              >
                <span className="stage-launcher-item-mark">
                  <StageIconBadge id={frame.mainSectionId || frame.id} />
                </span>
                <span className="stage-launcher-item-copy">
                  <span className="stage-launcher-item-title">{label}</span>
                  <span className="stage-launcher-item-blurb">{blurb}</span>
                </span>
                <span className="stage-launcher-item-go" aria-hidden>
                  <ArrowUpRight strokeWidth={2} />
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
