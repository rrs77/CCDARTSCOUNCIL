import { FileDown, Grid2X2, Home, Maximize2, Minimize2 } from "lucide-react";
import { MapNav } from "@/components/MapNav";
import { assetUrl } from "@/content/sectionIllustrations";
import type { Presentation } from "@/content/layoutPresentation";

/**
 * Thin canvas chrome — Overview returns to the index; Map jumps sections.
 */
export function PresentChrome({
  presentation,
  focusId,
  fullscreen,
  onOverview,
  onToggleFullscreen,
  onJump,
}: {
  presentation: Presentation;
  focusId: string | null;
  fullscreen: boolean;
  onOverview: () => void;
  onToggleFullscreen: () => void;
  onJump: (id: string) => void;
}) {
  return (
    <>
      <div className="facts-nav">
        <MapNav
          presentation={presentation}
          focusId={focusId}
          onOverview={onOverview}
          onJump={onJump}
        />
        <a className="facts-nav-home" href="/" aria-label="Home" title="Home">
          <Home strokeWidth={2.25} aria-hidden />
          <span className="facts-nav-home-text">Home</span>
        </a>
      </div>

      <div className="facts-toolbar" role="toolbar" aria-label="The facts tools">
        <a
          className="facts-nav-pdf"
          href={assetUrl("the-facts-briefing.pdf")}
          download="the-facts-briefing.pdf"
          aria-label="Download The facts as a PDF"
        >
          <FileDown strokeWidth={2.25} aria-hidden />
          <span className="facts-nav-pdf-full">Download The facts as a PDF</span>
          <span className="facts-nav-pdf-short">Download PDF</span>
        </a>
        {focusId ? (
          <>
            <button
              type="button"
              className="present-btn"
              onClick={onOverview}
              aria-label="Overview"
              title="Overview (Esc)"
            >
              <Grid2X2 className="h-4 w-4" aria-hidden />
              <span>Overview</span>
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
          </>
        ) : null}
      </div>
    </>
  );
}
