import { Home, ZoomIn, ZoomOut } from "lucide-react";
import { meta } from "@/content/facts.content";

/** Same zoom language everywhere — overview chrome and modal headers. */
export function ZoomChrome({
  onZoomIn,
  onZoomOut,
  onOverview,
  showOverview = true,
  compact = false,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onOverview?: () => void;
  showOverview?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`zoom-chrome ${compact ? "zoom-chrome--compact" : ""}`} role="group" aria-label="Zoom">
      <button type="button" className="zoom-chrome-btn" aria-label={meta.ui.zoomOut} title={meta.ui.zoomOut} onClick={onZoomOut}>
        <ZoomOut className="h-4 w-4" strokeWidth={2.25} />
        {!compact ? <span>{meta.ui.zoomOut}</span> : null}
      </button>
      <button type="button" className="zoom-chrome-btn" aria-label={meta.ui.zoomIn} title={meta.ui.zoomIn} onClick={onZoomIn}>
        <ZoomIn className="h-4 w-4" strokeWidth={2.25} />
        {!compact ? <span>{meta.ui.zoomIn}</span> : null}
      </button>
      {showOverview && onOverview ? (
        <button
          type="button"
          className="zoom-chrome-btn zoom-chrome-btn--home"
          aria-label={meta.ui.overviewChip}
          title={meta.ui.overviewChip}
          onClick={onOverview}
        >
          <Home className="h-4 w-4" strokeWidth={2.25} />
          {!compact ? <span>{meta.ui.overviewChip}</span> : null}
        </button>
      ) : null}
    </div>
  );
}

/** Repeated “click to go into this” affordance on every tappable heading. */
export function ZoomIntoIcon({ className = "" }: { className?: string }) {
  return (
    <span className={`zoom-into-icon ${className}`} aria-hidden title={meta.ui.zoomIn}>
      <ZoomIn className="h-3.5 w-3.5" strokeWidth={2.5} />
    </span>
  );
}

export function ZoomHintCaption() {
  return <p className="zoom-hint-caption">{meta.ui.zoomHint}</p>;
}
