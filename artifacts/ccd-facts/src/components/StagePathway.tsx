import { Eye } from "lucide-react";
import { ContentChart } from "@/components/charts/Charts";
import { SolutionDiagram } from "@/components/SolutionDiagram";
import { getChart } from "@/content/facts.content";
import type { FrameNode } from "@/content/layoutPresentation";
import { sectionAccent } from "@/content/sectionAccent";
import { stageComment, stageLabel } from "@/content/stackLabels";

/**
 * Uniform stage zone — title, one comment, one graph/stat set, optional why-pull-out.
 * Click opens the detail modal.
 */
function StageZone({
  frame,
  onOpen,
}: {
  frame: FrameNode;
  onOpen: () => void;
}) {
  const isSolution = frame.id === "a-solution";
  // Solution zone: product diagram only — never an exam/funding chart on the pathway.
  const chart =
    !isSolution && frame.chartId ? getChart(frame.chartId) : undefined;
  const accent = sectionAccent(frame.id);
  const comment = stageComment(frame.id, frame.sentence);
  const why = frame.quote;

  return (
    <button
      type="button"
      className={`stage-zone${isSolution ? " stage-zone--solution" : ""}`}
      style={{ ["--frame-accent" as string]: accent }}
      onClick={onOpen}
      aria-label={`Open ${stageLabel(frame.id, frame.title)}`}
    >
      <div className="stage-zone-head">
        <h2 className="stage-zone-title">{stageLabel(frame.id, frame.title)}</h2>
        <span className="stage-zone-eye" aria-hidden>
          <Eye className="stage-zone-eye-icon" strokeWidth={2.25} />
        </span>
      </div>

      {comment ? <p className="stage-zone-comment">{comment}</p> : null}

      <div className="stage-zone-visual">
        {isSolution ? (
          <SolutionDiagram />
        ) : chart ? (
          <div className="stage-zone-chart">
            <ContentChart chart={chart} density="canvas" />
          </div>
        ) : frame.heroStat ? (
          <div className="stage-zone-stat">
            <p className="stage-zone-stat-value">{frame.heroStat.value}</p>
            <p className="stage-zone-stat-label">{frame.heroStat.label}</p>
          </div>
        ) : (
          <div className="stage-zone-stat stage-zone-stat--quiet">
            <p className="stage-zone-stat-value">CCD</p>
          </div>
        )}
      </div>

      {why ? <p className="stage-zone-why">{why}</p> : null}
    </button>
  );
}

/**
 * Overview pathway: distinct key-stage zones, top-to-bottom, uniform template.
 * Spaced so nothing overlaps. Click → detail modal.
 */
export function StagePathway({
  stages,
  onOpen,
}: {
  stages: FrameNode[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="stage-pathway" aria-label="Key stages pathway">
      <p className="stage-pathway-kicker">Key stages → university → a solution</p>
      <div className="stage-pathway-track">
        {stages.map((frame, i) => (
          <div key={frame.id} className="stage-pathway-slot">
            {i > 0 ? <div className="stage-pathway-connector" aria-hidden /> : null}
            <StageZone frame={frame} onOpen={() => onOpen(frame.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
