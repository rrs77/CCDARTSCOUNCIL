import { ChevronLeft, ChevronRight } from "lucide-react";
import { animate, motion, useMotionValue } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { SectionFrame } from "@/components/SectionFrame";
import {
  CAMERA_EASE,
  CAMERA_TRAVEL_S,
  fitCamera,
  fitOverview,
  type CameraPose,
} from "@/camera";
import {
  buildHubConnectorPath,
  getFrame,
  type FrameNode,
  type Presentation,
} from "@/content/layoutPresentation";

const ARROW_CAPTION = "Arrows travel the path. Extra facts open on click.";

/**
 * Connected world canvas: hubs live in one plane; the camera zooms/pans between them.
 * Overview = fit all places (titles readable, detail quiet). Focus = settle on one section.
 */
export function WorldCanvas({
  presentation,
  focusedId,
  viewMode,
  reduced,
  canPrev,
  canNext,
  viewport,
  onOverview,
  onFocus,
  onOpenDetail,
  onOpenChild,
  onPrev,
  onNext,
}: {
  presentation: Presentation;
  focusedId: string | null;
  viewMode: "overview" | "frame";
  reduced?: boolean;
  canPrev: boolean;
  canNext: boolean;
  viewport: { w: number; h: number };
  onOverview: () => void;
  onFocus: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onOpenChild?: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const hubs = useMemo(
    () => presentation.frames.filter((f) => !f.parentId),
    [presentation.frames],
  );
  const connector = useMemo(() => buildHubConnectorPath(hubs), [hubs]);
  const focusFrame = focusedId ? getFrame(presentation, focusedId) : null;
  const density = viewMode === "overview" ? "overview" : "focus";

  const targetPose = useMemo((): CameraPose => {
    if (viewMode === "overview" || !focusFrame) {
      return fitOverview(presentation.world, viewport);
    }
    return fitCamera(
      { x: focusFrame.x, y: focusFrame.y, w: focusFrame.w, h: focusFrame.h },
      viewport,
      64,
      1.02,
    );
  }, [focusFrame, presentation.world, viewMode, viewport]);

  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const scale = useMotionValue(targetPose.scale);
  const settled = useRef(false);

  // Seed initial pose without animating on first paint
  useEffect(() => {
    tx.set(viewport.w / 2 - targetPose.cx * targetPose.scale);
    ty.set(viewport.h / 2 - targetPose.cy * targetPose.scale);
    scale.set(targetPose.scale);
    settled.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot only
  }, []);

  useEffect(() => {
    if (!settled.current) return;
    const duration = reduced ? 0.12 : CAMERA_TRAVEL_S;
    const ease = reduced ? "linear" : CAMERA_EASE;
    const nextTx = viewport.w / 2 - targetPose.cx * targetPose.scale;
    const nextTy = viewport.h / 2 - targetPose.cy * targetPose.scale;
    const controls = [
      animate(tx, nextTx, { duration, ease }),
      animate(ty, nextTy, { duration, ease }),
      animate(scale, targetPose.scale, { duration, ease }),
    ];
    return () => controls.forEach((c) => c.stop());
  }, [reduced, scale, targetPose, tx, ty, viewport.h, viewport.w]);

  const onFrameOpen = (frame: FrameNode) => {
    if (viewMode === "overview") {
      onFocus(frame.id);
      return;
    }
    if (focusFrame?.id === frame.id) {
      onOpenDetail(frame.id);
      return;
    }
    onFocus(frame.id);
  };

  return (
    <div className="world-stage" aria-label={presentation.title}>
      <motion.div
        className="canvas-world prezi-world"
        style={{
          width: presentation.world.width,
          height: presentation.world.height,
          x: tx,
          y: ty,
          scale,
        }}
      >
        <div className="prezi-world-wash" aria-hidden />
        <div
          className="overview-picture"
          style={{ width: presentation.world.width, height: presentation.world.height }}
        >
          {connector ? (
            <svg
              className="overview-path"
              aria-hidden
              width={presentation.world.width}
              height={presentation.world.height}
            >
              <defs>
                {/* Punch card rects out of the stroke so it never paints over type/charts */}
                <mask id="path-under-cards">
                  <rect
                    x={0}
                    y={0}
                    width={presentation.world.width}
                    height={presentation.world.height}
                    fill="white"
                  />
                  {hubs.map((h) => (
                    <rect
                      key={`mask-${h.id}`}
                      x={h.x - 4}
                      y={h.y - 4}
                      width={h.w + 8}
                      height={h.h + 8}
                      rx={22}
                      ry={22}
                      fill="black"
                    />
                  ))}
                </mask>
              </defs>
              <path
                d={connector}
                fill="none"
                stroke="rgba(182, 255, 126, 0.28)"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                mask="url(#path-under-cards)"
                pointerEvents="none"
              />
            </svg>
          ) : null}

          {hubs.map((frame) => (
            <SectionFrame
              key={frame.id}
              frame={frame}
              presentation={presentation}
              highlighted={viewMode === "frame" && focusFrame?.id === frame.id}
              density={density}
              activeChildId={null}
              layout="world"
              onOpen={() => onFrameOpen(frame)}
              onOpenDetail={() => onOpenDetail(frame.id)}
              onOpenChild={onOpenChild}
            />
          ))}
        </div>
      </motion.div>

      {viewMode === "frame" && focusFrame ? (
        <div className="world-chrome" aria-hidden={false}>
          <button
            type="button"
            className="stack-arrow stack-arrow--left world-arrow"
            aria-label="Previous section"
            disabled={!canPrev}
            onClick={onPrev}
          >
            <ChevronLeft className="stack-arrow-icon" strokeWidth={2.5} aria-hidden />
          </button>
          <button
            type="button"
            className="stack-arrow stack-arrow--right world-arrow"
            aria-label="Next section"
            disabled={!canNext}
            onClick={onNext}
          >
            <ChevronRight className="stack-arrow-icon" strokeWidth={2.5} aria-hidden />
          </button>
          <p className="world-caption">{ARROW_CAPTION}</p>
          <button type="button" className="world-overview-chip" onClick={onOverview}>
            See the path
          </button>
        </div>
      ) : (
        <p className="world-overview-hint">Click a place to travel there</p>
      )}
    </div>
  );
}
