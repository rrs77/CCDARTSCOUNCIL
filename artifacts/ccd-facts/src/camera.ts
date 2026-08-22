/** Camera fit helpers for the Prezi-style world canvas. */

export type CameraRect = { x: number; y: number; w: number; h: number };

export type CameraPose = {
  /** World-space point pinned to viewport centre */
  cx: number;
  cy: number;
  scale: number;
};

const OVERVIEW_PAD = 96;
const FOCUS_PAD = 72;

/** Fit a world rect into the viewport; returns centre + scale. */
export function fitCamera(
  rect: CameraRect,
  viewport: { w: number; h: number },
  pad = FOCUS_PAD,
  maxScale = 1.05,
): CameraPose {
  const availW = Math.max(120, viewport.w - pad * 2);
  const availH = Math.max(120, viewport.h - pad * 2);
  const scale = Math.min(availW / rect.w, availH / rect.h, maxScale);
  return {
    cx: rect.x + rect.w / 2,
    cy: rect.y + rect.h / 2,
    scale: Number.isFinite(scale) && scale > 0 ? scale : 0.2,
  };
}

export function fitOverview(
  world: { width: number; height: number },
  viewport: { w: number; h: number },
): CameraPose {
  return fitCamera(
    { x: 0, y: 0, w: world.width, h: world.height },
    viewport,
    OVERVIEW_PAD,
    0.95,
  );
}

/** CSS transform: centre viewport, scale, then pin world centre. */
export function cameraTransform(pose: CameraPose, viewport: { w: number; h: number }): string {
  const tx = viewport.w / 2 - pose.cx * pose.scale;
  const ty = viewport.h / 2 - pose.cy * pose.scale;
  return `translate(${tx}px, ${ty}px) scale(${pose.scale})`;
}

export const CAMERA_TRAVEL_S = 0.85;
export const CAMERA_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
