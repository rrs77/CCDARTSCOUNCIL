import { Lightbulb } from "lucide-react";
import { ContentChart } from "@/components/charts/Charts";
import { getChart } from "@/content/facts.content";
import type { FrameNode } from "@/content/layoutPresentation";
import { sectionAccent } from "@/content/sectionAccent";
import { assetUrl, sectionIllustration } from "@/content/sectionIllustrations";
import { stageComment, stageLabel } from "@/content/stackLabels";

const BULB_HINT = "Tap the lightbulb for more detail.";

/**
 * Uniform stage zone — title, short comment, chart and/or circular illustration.
 * Zone click → detail modal. Lightbulb → comments modal.
 */
function StageZone({
  frame,
  onOpen,
  onOpenComments,
}: {
  frame: FrameNode;
  onOpen: () => void;
  onOpenComments: () => void;
}) {
  const isSolution = frame.id === "a-solution";
  const chart =
    !isSolution && frame.chartId ? getChart(frame.chartId) : undefined;
  const illusFile = sectionIllustration(frame.id);
  const accent = sectionAccent(frame.id);
  const comment = stageComment(frame.id, frame.sentence);
  const label = stageLabel(frame.id, frame.title);
  const hasComments = !!(comment || frame.quote);

  return (
    <div
      className={`stage-zone${isSolution ? " stage-zone--solution" : ""}`}
      style={{ ["--frame-accent" as string]: accent }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${label}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="stage-zone-head">
        <h2 className="stage-zone-title">{label}</h2>
        {hasComments ? (
          <button
            type="button"
            className="stage-zone-bulb"
            title="Comments — Why this matters"
            aria-label={`More detail for ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments();
            }}
          >
            <Lightbulb className="stage-zone-bulb-icon" strokeWidth={2.25} />
          </button>
        ) : null}
        {hasComments ? <p className="stage-zone-hint">{BULB_HINT}</p> : null}
      </div>

      {comment ? <p className="stage-zone-comment">{comment}</p> : null}

      <div className={`stage-zone-visual${chart && illusFile ? " stage-zone-visual--split" : ""}`}>
        {illusFile ? (
          <div className="stage-zone-illus" aria-hidden>
            <img src={assetUrl(illusFile)} alt="" draggable={false} />
          </div>
        ) : null}

        {chart ? (
          <div className="stage-zone-chart">
            <ContentChart chart={chart} density="canvas" />
          </div>
        ) : null}

        {!chart && !illusFile && frame.heroStat ? (
          <div className="stage-zone-stat">
            <p className="stage-zone-stat-value">{frame.heroStat.value}</p>
            <p className="stage-zone-stat-label">{frame.heroStat.label}</p>
          </div>
        ) : null}

        {!chart && !illusFile && !frame.heroStat ? (
          <div className="stage-zone-stat stage-zone-stat--quiet">
            <p className="stage-zone-stat-value">CCD</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Overview pathway: distinct key-stage zones, top-to-bottom, uniform template.
 * Spaced so nothing overlaps. Click → detail modal; bulb → comments.
 */
export function StagePathway({
  stages,
  onOpen,
  onOpenComments,
}: {
  stages: FrameNode[];
  onOpen: (id: string) => void;
  onOpenComments: (id: string) => void;
}) {
  return (
    <div className="stage-pathway" aria-label="Key stages pathway">
      <p className="stage-pathway-kicker">Key stages → university → a solution</p>
      <div className="stage-pathway-track">
        {stages.map((frame, i) => (
          <div key={frame.id} className="stage-pathway-slot">
            {i > 0 ? <div className="stage-pathway-connector" aria-hidden /> : null}
            <StageZone
              frame={frame}
              onOpen={() => onOpen(frame.id)}
              onOpenComments={() => onOpenComments(frame.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
