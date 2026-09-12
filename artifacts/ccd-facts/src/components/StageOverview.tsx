import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { LogoMark } from "@/components/LogoMark";
import { StageIconBadge } from "@/components/StageIconBadge";
import { meta } from "@/content/facts.content";
import type { FrameNode } from "@/content/layoutPresentation";
import { assetUrl, SITUATION_HERO } from "@/content/sectionIllustrations";
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
    return "After the bell — a national ask that the arts offer is part of a good education.";
  }
  if (frame.id === "cold-spots-place-and-income") {
    return "Where you live, and what a school can spend, still decides the offer.";
  }
  if (frame.id === "music-hubs-and-national-centre") {
    return "The local backbone for schools that cannot staff music alone — and the money around it.";
  }
  if (frame.id === "national-plans-and-free-resources") {
    return "Curriculum reform, Turn It Up, and free national resources already in motion.";
  }
  if (frame.id === "a-solution") {
    return "A practical connection layer for teachers and arts organisations.";
  }
  return stageComment(frame.id, frame.sentence || "Open this stage to explore the evidence.");
}

const easeOut = [0.22, 0.61, 0.36, 1] as const;

/**
 * Opening index — brand lockup, byline, then a quiet grid into the evidence.
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
      <div className="stage-launcher-art" aria-hidden>
        <img src={assetUrl(SITUATION_HERO)} alt="" />
      </div>
      <header className="stage-launcher-intro">
        <motion.div
          className="stage-launcher-lockup"
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.4, ease: easeOut }}
        >
          <LogoMark size={52} title={meta.productName} />
          <p className="stage-launcher-brand">{meta.productName}</p>
        </motion.div>
        <div className="stage-launcher-intro-row">
          <div className="stage-launcher-titles">
            <motion.h1
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.04, ease: easeOut }}
            >
              {meta.experienceLead} <em>{meta.experienceAccent}</em>
            </motion.h1>
            <motion.p
              className="stage-launcher-byline"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.42, delay: reduced ? 0 : 0.1, ease: easeOut }}
            >
              {meta.heroLineBefore} <em>{meta.heroLineAccent}</em>
            </motion.p>
          </div>
          <motion.div
            className="stage-launcher-purpose"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.42, delay: reduced ? 0 : 0.08, ease: easeOut }}
          >
            <p className="stage-launcher-purpose-kicker">{meta.purposeKicker}</p>
            <p className="stage-launcher-purpose-heading">{meta.purposeHeading}</p>
            <p className="stage-launcher-purpose-deck">{meta.purposeDeck}</p>
          </motion.div>
        </div>
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
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduced ? 0.01 : 0.4,
                delay: reduced ? 0 : 0.16 + i * 0.035,
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
              </button>
            </motion.li>
          );
        })}
      </ul>

      <motion.footer
        className="stage-launcher-doc"
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.4, delay: reduced ? 0 : 0.52, ease: easeOut }}
      >
        <a
          className="stage-launcher-doc-link"
          href={assetUrl("the-facts-briefing.pdf")}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open The facts briefing as a PDF"
        >
          <span className="stage-launcher-doc-mark" aria-hidden>
            PDF
          </span>
          <span className="stage-launcher-doc-copy">
            <span className="stage-launcher-doc-label">The full briefing</span>
            <span className="stage-launcher-doc-hint">Every section, figure and source</span>
          </span>
        </a>
      </motion.footer>
    </div>
  );
}
