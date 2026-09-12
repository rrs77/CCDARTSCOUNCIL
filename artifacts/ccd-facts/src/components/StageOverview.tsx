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
  if (frame.id === "cold-spots-place-and-income") {
    return "Cold spots";
  }
  if (frame.id === "national-plans-and-free-resources") {
    return "National plans";
  }
  if (frame.id === "a-solution") {
    return "A solution";
  }
  return stageLabel(frame.id, frame.title);
}

function overviewBlurb(frame: FrameNode): string {
  if (frame.id === "enrichment-framework") {
    return "Non-statutory guidance into usable partnership, access and evidence.";
  }
  if (frame.id === "cold-spots-place-and-income") {
    return "Entitlement still tracks place, FSM and parental income.";
  }
  if (frame.id === "music-hubs-and-national-centre") {
    return "National funding streams and the infrastructure for arts partnership.";
  }
  if (frame.id === "national-plans-and-free-resources") {
    return "Curriculum reform, Turn It Up, and free national resources already in motion.";
  }
  if (frame.id === "a-solution") {
    return "A practical connection layer for teachers and arts organisations.";
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
        <motion.span
          className="stage-ribbon"
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0.01 : 1.1, delay: reduced ? 0 : 0.2, ease: easeOut }}
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
          initial={reduced ? false : { opacity: 0, y: 22, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: reduced ? 0.01 : 0.75, delay: reduced ? 0 : 0.05, ease: easeOut }}
        >
          The <em>facts</em>
        </motion.h1>
        <motion.p
          className="stage-launcher-kicker"
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.45, delay: reduced ? 0 : 0.14, ease: easeOut }}
        >
          Arts education
        </motion.p>
        <motion.p
          className="stage-launcher-heading"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.18, ease: easeOut }}
        >
          At a tipping point — with ambitious plans ahead.
        </motion.p>
        <motion.p
          className="stage-launcher-lead"
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.55, delay: reduced ? 0 : 0.22, ease: easeOut }}
        >
          What’s needed now is shared expertise and connection.
        </motion.p>
      </header>

      <ul className="stage-launcher-list" aria-label="Evidence stages">
        {stages.map((frame, i) => {
          const label = overviewLabel(frame);
          const blurb = overviewBlurb(frame);
          const accent = sectionAccent(frame.id);
          const index = String(i + 1).padStart(2, "0");
          return (
            <motion.li
              key={frame.id}
              initial={reduced ? false : { opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: reduced ? 0.01 : 0.55,
                delay: reduced ? 0 : 0.22 + i * 0.06,
                ease: easeOut,
              }}
            >
              <motion.button
                type="button"
                className="stage-launcher-item"
                style={{ ["--stage-accent" as string]: accent }}
                onClick={() => onOpen(frame.id)}
                aria-label={`Open ${label}`}
                whileHover={reduced ? undefined : { y: -6, scale: 1.01 }}
                whileTap={reduced ? undefined : { scale: 0.985 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
              >
                <span className="stage-launcher-item-index" aria-hidden>
                  {index}
                </span>
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
              </motion.button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
