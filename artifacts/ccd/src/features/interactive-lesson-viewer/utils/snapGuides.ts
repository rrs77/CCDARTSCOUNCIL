/** Smart alignment guides / snapping for stage transforms (percent space). */

export interface GuideLine {
  orientation: 'v' | 'h';
  /** Position as % of stage. */
  pos: number;
  kind: 'center' | 'edge' | 'object';
}

export interface SnapBox {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const STAGE_GUIDES: GuideLine[] = [
  { orientation: 'v', pos: 0, kind: 'edge' },
  { orientation: 'v', pos: 50, kind: 'center' },
  { orientation: 'v', pos: 100, kind: 'edge' },
  { orientation: 'h', pos: 0, kind: 'edge' },
  { orientation: 'h', pos: 50, kind: 'center' },
  { orientation: 'h', pos: 100, kind: 'edge' },
];

const THRESHOLD = 1.25; // % of stage

function objectGuides(others: SnapBox[], excludeId?: string): GuideLine[] {
  const lines: GuideLine[] = [];
  for (const o of others) {
    if (excludeId && o.id === excludeId) continue;
    lines.push(
      { orientation: 'v', pos: o.x, kind: 'object' },
      { orientation: 'v', pos: o.x + o.width / 2, kind: 'object' },
      { orientation: 'v', pos: o.x + o.width, kind: 'object' },
      { orientation: 'h', pos: o.y, kind: 'object' },
      { orientation: 'h', pos: o.y + o.height / 2, kind: 'object' },
      { orientation: 'h', pos: o.y + o.height, kind: 'object' },
    );
  }
  return lines;
}

/**
 * Snap a moving box's edges/centre to stage + sibling guides.
 * Returns adjusted x/y and active guide lines to render.
 */
export function snapBoxPosition(
  box: SnapBox,
  others: SnapBox[],
  threshold = THRESHOLD,
): { x: number; y: number; guides: GuideLine[] } {
  const guides = [...STAGE_GUIDES, ...objectGuides(others, box.id)];
  let x = box.x;
  let y = box.y;
  const active: GuideLine[] = [];

  const left = box.x;
  const cx = box.x + box.width / 2;
  const right = box.x + box.width;
  const top = box.y;
  const cy = box.y + box.height / 2;
  const bottom = box.y + box.height;

  let bestVX = threshold + 1;
  let bestVY = threshold + 1;
  let snapDX = 0;
  let snapDY = 0;
  let guideV: GuideLine | null = null;
  let guideH: GuideLine | null = null;

  for (const g of guides) {
    if (g.orientation === 'v') {
      for (const edge of [left, cx, right]) {
        const d = Math.abs(edge - g.pos);
        if (d < bestVX) {
          bestVX = d;
          snapDX = g.pos - edge;
          guideV = g;
        }
      }
    } else {
      for (const edge of [top, cy, bottom]) {
        const d = Math.abs(edge - g.pos);
        if (d < bestVY) {
          bestVY = d;
          snapDY = g.pos - edge;
          guideH = g;
        }
      }
    }
  }

  if (guideV && bestVX <= threshold) {
    x += snapDX;
    active.push(guideV);
  }
  if (guideH && bestVY <= threshold) {
    y += snapDY;
    active.push(guideH);
  }

  return { x, y, guides: active };
}
