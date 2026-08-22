import { Info } from "lucide-react";
import { ContentChart } from "@/components/charts/Charts";
import { getChart } from "@/content/facts.content";
import type { FrameNode } from "@/content/layoutPresentation";
import { sectionAccent } from "@/content/sectionAccent";
import { assetUrl, sectionIllustration } from "@/content/sectionIllustrations";
import { stageComment, stageLabel } from "@/content/stackLabels";

const INFO_HINT = "More information";

/**
 * Uniform stage zone — title, short comment, chart and/or circular illustration.
 * Zone click → framed section. Info → detail modal.
 */
function StageZone({
  frame,
  onOpen,
  onOpenDetail,
}: {
  frame: FrameNode;
  onOpen: () => void;
  onOpenDetail: () => void;
}) {
  const isSolution = frame.id === "a-solution";
  const chart =
    !isSolution && frame.chartId ? getChart(frame.chartId) : undefined;
  const illusFile = sectionIllustration(frame.id);
  const accent = sectionAccent(frame.id);
  const comment = stageComment(frame.id, frame.sentence);
  const label = stageLabel(frame.id, frame.title);
  const hasDetail = frame.blocks.length > 0 || !!frame.quote || !!frame.sentence;

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
        {hasDetail ? (
          <button
            type="button"
            className="stage-zone-eye"
            title={INFO_HINT}
            aria-label={`More information about ${label}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
          >
            <Info className="stage-zone-eye-icon" strokeWidth={2.25} />
          </button>
        ) : null}
        {hasDetail ? <p className="stage-zone-hint">{INFO_HINT}</p> : null}
      </div>

      {comment ? <p className="stage-zone-comment">{comment}</p> : null}

      <div className={`stage-zone-visual${chart && illusFile ? " stage-zone-visual--split" : ""}`}>
        {illusFile ? (
          <div
            className={`stage-zone-illus${isSolution ? " stage-zone-illus--illustration" : ""}`}
            aria-hidden
          >
            <img
              src={assetUrl(illusFile)}
              alt=""
              draggable={false}
              className={isSolution ? "prezi-illustration" : undefined}
            />
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
      </div>
    </div>
  );
}

/**
 * Overview pathway: distinct key-stage zones, top-to-bottom, uniform template.
 * Spaced so nothing overlaps. Click → framed section; Info → detail modal.
 */
export function StagePathway({
  stages,
  onOpen,
  onOpenDetail,
}: {
  stages: FrameNode[];
  onOpen: (id: string) => void;
  onOpenDetail: (id: string) => void;
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
              onOpenDetail={() => onOpenDetail(frame.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
