import { Maximize2, Minimize2 } from "lucide-react";
import { MapNav } from "@/components/MapNav";
import type { Presentation } from "@/content/layoutPresentation";

/**
 * Thin canvas chrome — Overview returns to the stack; Map jumps sections.
 */
export function PresentChrome({
  presentation,
  focusId,
  chromeVisible,
  fullscreen,
  onOverview,
  onToggleFullscreen,
  onJump,
}: {
  presentation: Presentation;
  focusId: string | null;
  chromeVisible: boolean;
  fullscreen: boolean;
  onOverview: () => void;
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
        <button type="button" className="present-btn" onClick={onOverview} title="Overview — section stack (Esc)">
          Overview
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
