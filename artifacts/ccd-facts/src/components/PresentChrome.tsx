import {
  ChevronLeft,
  ChevronRight,
  Home,
  Map,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { MapNav } from "@/components/MapNav";
import type { Presentation } from "@/content/layoutPresentation";

export function PresentChrome({
  presentation,
  focusId,
  pathIndex,
  chromeVisible,
  fullscreen,
  onOverview,
  onHome,
  onPrev,
  onNext,
  onResume,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  onJump,
}: {
  presentation: Presentation;
  focusId: string | null;
  pathIndex: number;
  chromeVisible: boolean;
  fullscreen: boolean;
  onOverview: () => void;
  onHome: () => void;
  onPrev: () => void;
  onNext: () => void;
  onResume: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
  onJump: (id: string) => void;
}) {
  const pathLen = Math.max(1, presentation.path.filter((p) => p !== "overview").length);
  const step = Math.min(pathIndex + 1, pathLen);
  const current =
    focusId === null
      ? "Overview"
      : presentation.frames.find((f) => f.id === focusId)?.title ?? "Section";

  return (
    <>
      <MapNav
        presentation={presentation}
        focusId={focusId}
        onOverview={onOverview}
        onJump={onJump}
      />

      <div className={`present-chrome ${chromeVisible ? "is-visible" : ""}`} role="toolbar" aria-label="Presentation">
        <div className="present-chrome-left">
          <button type="button" className="present-btn" onClick={onPrev} title="Previous (←)">
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          <button type="button" className="present-btn present-btn-primary" onClick={onNext} title="Next (→ / Space)">
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="present-chrome-center">
          <p className="present-current">{current}</p>
          <div className="present-progress" aria-hidden>
            <div className="present-progress-bar" style={{ width: `${(step / pathLen) * 100}%` }} />
          </div>
          <p className="present-step">
            {step} / {pathLen}
          </p>
        </div>

        <div className="present-chrome-right">
          <button type="button" className="present-btn" onClick={onOverview} title="Overview">
            <Map className="h-4 w-4" />
            <span>Overview</span>
          </button>
          <button type="button" className="present-btn" onClick={onHome} title="Home (start)">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </button>
          <button type="button" className="present-btn" onClick={onResume} title="Resume presentation">
            Resume
          </button>
          <button type="button" className="present-icon" onClick={onZoomOut} aria-label="Zoom out" title="Zoom out (−)">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button type="button" className="present-icon" onClick={onZoomIn} aria-label="Zoom in" title="Zoom in (+)">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="present-icon"
            onClick={onToggleFullscreen}
            aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            title="Full screen"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </>
  );
}
