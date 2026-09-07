import { ArrowRight } from "lucide-react";
import { StageIconBadge } from "@/components/StageIconBadge";
import type { FrameNode } from "@/content/layoutPresentation";
import { stageLabel } from "@/content/stackLabels";

function overviewLabel(frame: FrameNode): string {
  if (frame.id === "music-hubs-and-national-centre") {
    return "Music Hubs & National Centre";
  }
  return stageLabel(frame.id, frame.title);
}

export function StageOverview({
  stages,
  onOpen,
}: {
  stages: FrameNode[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="stage-launcher">
      <h1>Choose a stage</h1>
      <div className="stage-launcher-list">
        {stages.map((frame) => {
          const label = overviewLabel(frame);
          return (
            <button
              key={frame.id}
              type="button"
              className="stage-launcher-item"
              onClick={() => onOpen(frame.id)}
              aria-label={`Open ${label}`}
            >
              <StageIconBadge id={frame.mainSectionId || frame.id} />
              <span>{label}</span>
              <ArrowRight className="stage-launcher-arrow" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}