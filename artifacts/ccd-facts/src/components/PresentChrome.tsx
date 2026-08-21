import { Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { MapNav } from "@/components/MapNav";
import type { Presentation } from "@/content/layoutPresentation";

/**
 * Thin canvas chrome — not a slide deck.
 * Map chip (left) + Overview + zoom + fullscreen (bottom). Fades when idle.
 */
export function PresentChrome({
  presentation,
  focusId,
  chromeVisible,
  fullscreen,
  onOverview,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  onJump,
}: {
  presentation: Presentation;
  focusId: string | null;
  chromeVisible: boolean;
  fullscreen: boolean;
  onOverview: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
  onJump: (id: string) => void;
}) {
  return (
    <>
      <MapNav
        presentation={presentation}
        focusId={focusId}
        onOverview={onOverview}
        onJump={onJump}
      />

      <div
        className={`present-chrome present-chrome--thin ${chromeVisible ? "is-visible" : ""}`}
        role="toolbar"
        aria-label="Canvas tools"
      >
        <button type="button" className="present-btn" onClick={onOverview} title="Overview (Esc)">
          Overview
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
    </>
  );
}
