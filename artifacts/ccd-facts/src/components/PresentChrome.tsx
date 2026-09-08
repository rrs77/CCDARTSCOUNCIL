import { Grid2X2, Home, Maximize2, Minimize2 } from "lucide-react";
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
      <a className="facts-nav-home" href="/" aria-label="Home" title="Home">
        <Home strokeWidth={2.25} aria-hidden />
      </a>

      {focusId ? (
        <div
          className={`present-chrome present-chrome--thin ${chromeVisible ? "is-visible" : ""}`}
          role="toolbar"
          aria-label="Canvas tools"
        >
          <button
            type="button"
            className="present-icon"
            onClick={onOverview}
            aria-label="Choose a stage"
            title="Choose a stage (Esc)"
          >
            <Grid2X2 className="h-4 w-4" aria-hidden />
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
      ) : null}
    </>
  );
}
