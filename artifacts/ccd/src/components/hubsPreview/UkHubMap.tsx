import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Minus, Plus } from 'lucide-react';
import {
  type BBox,
  ENGLAND,
  type MapFocus,
  type MapIndex,
  focusBBox,
  focusName,
  hubLabel,
  parentFocus,
} from './ukHubMapData';

/** Indigo/lilac map (default). Music Hubs browse uses pale green + numbered markers. */
const PALETTES = {
  indigo: {
    region: ['#E4E8F8', '#D9DFF5', '#CDD5F2', '#EAEAF8'],
    hub: ['#D8DCF6', '#CDD3F3', '#C2C9F0', '#E0E4F7', '#D3D8F4'],
    district: ['#DCE0F6', '#D2D7F3', '#C8CEF0', '#E4E7F8', '#CFD5F2'],
    nation: '#EEF1F6',
    muted: '#F1F3F8',
    hover: '#B8B6F0',
    selected: '#6B68D8',
    coast: '#C5CEE8',
    ink: '#1F1B4D',
    count: '#4338E8',
    bg: 'radial-gradient(120% 90% at 55% 35%, #FBFBFF 0%, #F0F1FA 55%, #E8EAF6 100%)',
  },
  green: {
    region: ['#D8EBD9', '#CFE6D1', '#C5E0C8', '#DEEFE0'],
    hub: ['#CDE4CF', '#C2DDC5', '#B7D6BB', '#D4E9D6', '#C8E1CB'],
    district: ['#D3E7D5', '#C9E0CC', '#BFD9C2', '#DCECDD', '#CEE4D1'],
    nation: '#E8F2E9',
    muted: '#EFF5F0',
    hover: '#8FCF96',
    selected: '#2F6B3A',
    coast: '#C5D9C8',
    ink: '#14301A',
    count: '#0B6B5F',
    bg: 'radial-gradient(120% 90% at 55% 35%, #FBFDFB 0%, #F1F7F2 55%, #E5EFE7 100%)',
  },
} as const;

const FLY_MS = 720;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface Props {
  ix: MapIndex;
  focus: MapFocus;
  onFocus: (f: MapFocus) => void;
  hover: string | null;
  onHover: (id: string | null) => void;
  className?: string;
  showBreadcrumb?: boolean;
  /** Green numbered badges on regions (Music Hubs browse mockup). */
  showRegionCounts?: boolean;
  /** Map colour system — Music Hubs browse uses pale green. */
  palette?: keyof typeof PALETTES;
}

interface Item {
  id: string;
  name: string;
  lads: string[];
  focus: MapFocus;
  label: [number, number];
  labelText: string;
  priority: number;
}

function mapLabel(text: string) {
  return text.replace(/ Music( Education)? Hub$/, '').replace(/ \(BLMK\)/, '').replace(/^Bedfordshire, Luton and Milton Keynes$/, 'BLMK');
}

function splitLabel(text: string): string[] {
  if (text.length <= 16) return [text];
  const words = text.split(' ');
  let best = [text];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const diff = Math.abs(a.length - b.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = [a, b];
    }
  }
  return best;
}

export function UkHubMap({
  ix,
  focus,
  onFocus,
  hover,
  onHover,
  className = '',
  showBreadcrumb = true,
  showRegionCounts = false,
  palette = 'indigo',
}: Props) {
  const tones = PALETTES[palette];
  const REGION_TONES = tones.region;
  const HUB_TONES = tones.hub;
  const DISTRICT_TONES = tones.district;
  const NATION_FILL = tones.nation;
  const MUTED = tones.muted;
  const HOVER = tones.hover;
  const SELECTED = tones.selected;
  const COAST = tones.coast;
  const INK = tones.ink;
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const cam = useRef<BBox>(ix.data.viewBox);
  const anim = useRef<number | null>(null);
  const [settled, setSettled] = useState<{ box: BBox; px: number }>({ box: ix.data.viewBox, px: 1 });
  const [moving, setMoving] = useState(false);
  const [hint, setHint] = useState(false);
  const hintTimer = useRef<number | undefined>(undefined);
  const settleTimer = useRef<number | undefined>(undefined);
  const reduceMotion = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduceMotion.current = mq.matches;
    const on = () => (reduceMotion.current = mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const apply = useCallback((b: BBox) => {
    cam.current = b;
    svgRef.current?.setAttribute('viewBox', b.map((v) => v.toFixed(1)).join(' '));
  }, []);

  const settle = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const b = cam.current;
    setSettled({ box: [...b] as BBox, px: b[2] / Math.max(1, el.clientWidth) });
    setMoving(false);
  }, []);

  const fit = useCallback((b: BBox): BBox => {
    const el = wrapRef.current;
    const cw = el?.clientWidth || 800;
    const ch = el?.clientHeight || 600;
    const aspect = cw / ch;
    const pad = b[2] >= ix.data.viewBox[2] * 0.9 ? 0.03 : 0.08;
    let w = b[2] * (1 + pad * 2);
    let h = b[3] * (1 + pad * 2);
    const topPx = showBreadcrumb ? 56 : 16;
    h += (topPx / ch) * h;
    if (w / h < aspect) w = h * aspect;
    else h = w / aspect;
    const cx = b[0] + b[2] / 2;
    const cy = b[1] + b[3] / 2 - (topPx / ch) * h * 0.45;
    return [cx - w / 2, cy - h / 2, w, h];
  }, [showBreadcrumb, ix]);

  const flyTo = useCallback(
    (target: BBox, ms = FLY_MS) => {
      if (anim.current) cancelAnimationFrame(anim.current);
      const from = cam.current;
      if (reduceMotion.current || ms === 0) {
        apply(target);
        settle();
        return;
      }
      setMoving(true);
      const fc = [from[0] + from[2] / 2, from[1] + from[3] / 2];
      const tc = [target[0] + target[2] / 2, target[1] + target[3] / 2];
      const ratio = target[2] / from[2];
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        const e = easeInOut(t);
        const w = from[2] * Math.pow(ratio, e);
        const h = from[3] * Math.pow(target[3] / from[3], e);
        const cx = fc[0] + (tc[0] - fc[0]) * e;
        const cy = fc[1] + (tc[1] - fc[1]) * e;
        apply([cx - w / 2, cy - h / 2, w, h]);
        if (t < 1) anim.current = requestAnimationFrame(step);
        else {
          anim.current = null;
          apply(target);
          settle();
        }
      };
      anim.current = requestAnimationFrame(step);
    },
    [apply, settle],
  );

  // Frame the focus whenever it changes.
  const firstFrame = useRef(true);
  useLayoutEffect(() => {
    const target = fit(focusBBox(ix, focus));
    if (firstFrame.current) {
      firstFrame.current = false;
      apply(target);
      settle();
      return;
    }
    flyTo(target);
  }, [ix, focus, fit, flyTo, apply, settle]);

  // Refit on resize without animation.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      apply(fit(focusBBox(ix, focus)));
      settle();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ix, focus, fit, apply, settle]);

  // ---------- free navigation ----------
  const clampBox = useCallback(
    (b: BBox): BBox => {
      const [, , vw] = ix.data.viewBox;
      const minW = 140;
      const maxW = vw * 1.6;
      let w = Math.min(maxW, Math.max(minW, b[2]));
      const k = w / b[2];
      const h = b[3] * k;
      const cx = b[0] + b[2] / 2;
      const cy = b[1] + b[3] / 2;
      const [x0, y0, W, H] = ix.data.viewBox;
      const ccx = Math.min(x0 + W, Math.max(x0, cx));
      const ccy = Math.min(y0 + H, Math.max(y0, cy));
      w = Math.max(w, 1);
      return [ccx - w / 2, ccy - h / 2, w, h];
    },
    [ix],
  );

  const toUser = (clientX: number, clientY: number) => {
    const el = wrapRef.current!;
    const r = el.getBoundingClientRect();
    const [x, y, w, h] = cam.current;
    return [x + ((clientX - r.left) / r.width) * w, y + ((clientY - r.top) / r.height) * h];
  };

  const zoomAt = useCallback(
    (factor: number, ux: number, uy: number) => {
      const [x, y, w, h] = cam.current;
      const nw = w * factor;
      const nh = h * factor;
      const nb: BBox = [ux - (ux - x) * factor, uy - (uy - y) * factor, nw, nh];
      apply(clampBox(nb));
      setMoving(true);
      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(settle, 140);
    },
    [apply, clampBox, settle],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) {
        setHint(true);
        window.clearTimeout(hintTimer.current);
        hintTimer.current = window.setTimeout(() => setHint(false), 1400);
        return;
      }
      e.preventDefault();
      if (anim.current) cancelAnimationFrame(anim.current);
      const [ux, uy] = toUser(e.clientX, e.clientY);
      zoomAt(Math.exp(e.deltaY * 0.01), ux, uy);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ x: number; y: number; box: BBox; moved: boolean; pinch?: number } | null>(null);
  const suppressClick = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (anim.current) cancelAnimationFrame(anim.current);
    const pts = [...pointers.current.values()];
    drag.current = {
      x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
      y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
      box: cam.current,
      moved: false,
      pinch: pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : undefined,
    };
    suppressClick.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const d = drag.current;
    if (!d.moved && Math.hypot(mx - d.x, my - d.y) < 5 && !(pts.length === 2 && d.pinch)) return;
    if (!d.moved) {
      d.moved = true;
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    }
    const el = wrapRef.current!;
    const r = el.getBoundingClientRect();
    let box = d.box;
    if (pts.length === 2 && d.pinch) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const factor = d.pinch / Math.max(1, dist);
      const ux = box[0] + ((d.x - r.left) / r.width) * box[2];
      const uy = box[1] + ((d.y - r.top) / r.height) * box[3];
      box = [ux - (ux - box[0]) * factor, uy - (uy - box[1]) * factor, box[2] * factor, box[3] * factor];
    }
    const dx = ((mx - d.x) / r.width) * box[2];
    const dy = ((my - d.y) / r.height) * box[3];
    apply(clampBox([box[0] - dx, box[1] - dy, box[2], box[3]]));
    setMoving(true);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (drag.current?.moved) {
      suppressClick.current = true;
      settle();
    }
    if (pointers.current.size === 0) drag.current = null;
    else {
      const pts = [...pointers.current.values()];
      drag.current = { x: pts[0].x, y: pts[0].y, box: cam.current, moved: true };
    }
  };

  const zoomButton = (factor: number) => {
    const [x, y, w, h] = cam.current;
    const target = clampBox([x + w / 2 - (w * factor) / 2, y + h / 2 - (h * factor) / 2, w * factor, h * factor]);
    flyTo(target, 320);
  };

  // ---------- what is interactive at this level ----------
  const level = focus.level;
  const ctx = useMemo(() => {
    const lad = focus.level === 'lad' ? ix.lad(focus.id) : undefined;
    const hubId = focus.level === 'hub' ? focus.id : lad?.hub ?? null;
    const nationId =
      focus.level === 'nation' ? focus.id : lad && !lad.hub ? lad.nation : null;
    const regionId = focus.level === 'region' ? focus.id : null;
    return { hubId, nationId, regionId, ladId: lad?.code ?? null };
  }, [ix, focus]);

  const items: Item[] = useMemo(() => {
    const d = ix.data;
    if (ctx.hubId) {
      return ix.ladsInHub(ctx.hubId).map((l) => ({
        id: l.code,
        name: l.name,
        lads: [l.code],
        focus: { level: 'lad', id: l.code },
        label: l.label,
        labelText: l.name,
        priority: l.bbox[2] * l.bbox[3],
      }));
    }
    if (ctx.nationId && ctx.nationId !== ENGLAND) {
      return ix.ladsInNation(ctx.nationId).map((l) => ({
        id: l.code,
        name: l.name,
        lads: [l.code],
        focus: { level: 'lad', id: l.code },
        label: l.label,
        labelText: l.name,
        priority: l.bbox[2] * l.bbox[3],
      }));
    }
    if (ctx.regionId) {
      return ix.hubsInRegion(ctx.regionId).map((h) => ({
        id: h.id,
        name: hubLabel(h),
        lads: h.lads,
        focus: { level: 'hub', id: h.id },
        label: h.label,
        labelText: mapLabel(hubLabel(h)),
        priority: h.bbox[2] * h.bbox[3],
      }));
    }
    const regions: Item[] = d.regions.map((r) => ({
      id: r.code,
      name: r.name,
      lads: d.lads.filter((l) => l.region === r.code).map((l) => l.code),
      focus: { level: 'region', id: r.code },
      label: r.label,
      labelText: r.name,
      priority: r.bbox[2] * r.bbox[3],
    }));
    if (ctx.nationId === ENGLAND) return regions;
    const nations: Item[] = d.nations
      .filter((n) => n.code !== ENGLAND)
      .map((n) => ({
        id: n.code,
        name: n.name,
        lads: d.lads.filter((l) => l.nation === n.code).map((l) => l.code),
        focus: { level: 'nation', id: n.code },
        label: n.label,
        labelText: n.name,
        priority: n.bbox[2] * n.bbox[3] * 2,
      }));
    return [...nations, ...regions];
  }, [ix, ctx]);

  const itemOfLad = useMemo(() => {
    const m = new Map<string, Item>();
    for (const it of items) for (const c of it.lads) m.set(c, it);
    return m;
  }, [items]);

  const selectedItemId = ctx.ladId || ctx.hubId || ctx.regionId || null;
  const tipItem = useMemo(() => {
    const id = hover || selectedItemId;
    if (!id) return null;
    return items.find((it) => it.id === id) ?? null;
  }, [hover, selectedItemId, items]);

  const fillFor = (code: string): string => {
    const l = ix.lad(code)!;
    const it = itemOfLad.get(code);
    if (it && (ctx.ladId === it.id || ctx.hubId === it.id || ctx.regionId === it.id)) return SELECTED;
    if (it && hover === it.id) return HOVER;
    if (!it) return MUTED;
    if (ctx.hubId || (ctx.nationId && ctx.nationId !== ENGLAND)) return DISTRICT_TONES[l.tone % DISTRICT_TONES.length];
    if (ctx.regionId) return HUB_TONES[(ix.hub(it.id)?.tone ?? 0) % HUB_TONES.length];
    if (l.nation !== ENGLAND) return NATION_FILL;
    const r = l.region ? ix.region(l.region) : undefined;
    return REGION_TONES[(r?.tone ?? 0) % REGION_TONES.length];
  };

  const outsideFocus = (code: string): MapFocus => {
    const l = ix.lad(code)!;
    if (ctx.hubId && l.hub) return { level: 'hub', id: l.hub };
    if (l.nation !== ENGLAND) return { level: 'nation', id: l.nation };
    if (l.region) return { level: 'region', id: l.region };
    return { level: 'uk' };
  };

  const activate = (f: MapFocus) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    onFocus(f);
  };

  // ---------- labels with simple collision avoidance ----------
  const labels = useMemo(() => {
    const px = settled.px;
    const fs = (ctx.hubId || (ctx.nationId && ctx.nationId !== ENGLAND) ? 12.5 : 13) * px;
    const [vx, vy, vw, vh] = settled.box;
    const placed: BBox[] = [];
    const out: { id: string; x: number; y: number; lines: string[]; fs: number; selected: boolean }[] = [];
    const sorted = [...items].sort((a, b) => {
      if (a.id === ctx.ladId) return -1;
      if (b.id === ctx.ladId) return 1;
      return b.priority - a.priority;
    });
    for (const it of sorted) {
      const [x, y] = it.label;
      if (x < vx || x > vx + vw || y < vy || y > vy + vh) continue;
      const lines = splitLabel(it.labelText);
      const w = Math.max(...lines.map((s) => s.length)) * fs * 0.56 + fs * 0.6;
      const h = lines.length * fs * 1.2 + fs * 0.3;
      const box: BBox = [x - w / 2, y - h / 2, w, h];
      const margin = 8 * px;
      if (box[0] < vx + margin || box[1] < vy + margin || box[0] + w > vx + vw - margin || box[1] + h > vy + vh - margin) continue;
      const hit = placed.some((p) => !(box[0] + box[2] < p[0] || p[0] + p[2] < box[0] || box[1] + box[3] < p[1] || p[1] + p[3] < box[1]));
      if (hit) continue;
      placed.push(box);
      const selected =
        it.id === ctx.ladId || it.id === ctx.hubId || it.id === ctx.regionId;
      out.push({ id: it.id, x, y, lines, fs, selected });
    }
    return out;
  }, [items, settled, ctx]);

  const ladsDrawn = ix.data.lads;
  const hubOutlines = level !== 'uk' && !(ctx.nationId && ctx.nationId !== ENGLAND);
  const crumbs: MapFocus[] = [];
  for (let f: MapFocus | null = focus; f; f = parentFocus(ix, f)) crumbs.unshift(f);

  return (
    <div
      ref={wrapRef}
      className={`ukmap relative select-none overflow-hidden rounded-2xl border border-[#1F1B4D]/[0.06] ${className}`}
      style={{
        background: tones.bg,
        touchAction: 'none',
      }}
    >
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full"
        viewBox={ix.data.viewBox.join(' ')}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label={`Map of UK Music Hubs. Showing ${focusName(ix, focus)}.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => onHover(null)}
      >
        <g style={{ filter: moving ? undefined : 'drop-shadow(0 2px 6px rgba(31,27,77,0.08))' }}>
          {ix.data.nations.map((n) => (
            <path key={n.code} d={n.d} fill={COAST} stroke={COAST} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          ))}
        </g>

        <g aria-hidden>
          {ladsDrawn
            .filter((l) => !itemOfLad.has(l.code))
            .map((l) => (
              <path
                key={l.code}
                d={l.d}
                fill={fillFor(l.code)}
                stroke={MUTED}
                strokeWidth={0.6}
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer transition-[fill] duration-150"
                onClick={() => activate(outsideFocus(l.code))}
              />
            ))}
        </g>

        {items.map((it) => {
          const isSel = selectedItemId === it.id;
          const fine = Boolean(ctx.hubId || (ctx.nationId && ctx.nationId !== ENGLAND));
          return (
            <g
              key={it.id}
              role="button"
              tabIndex={0}
              aria-label={`${it.name}${isSel ? ', selected' : ''}`}
              aria-pressed={isSel || undefined}
              className="ukmap-item cursor-pointer outline-none"
              onPointerEnter={() => onHover(it.id)}
              onPointerLeave={() => onHover(null)}
              onFocus={() => onHover(it.id)}
              onBlur={() => onHover(null)}
              onClick={() => activate(it.focus)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onFocus(it.focus);
                } else if (e.key === 'Escape') {
                  const p = parentFocus(ix, focus);
                  if (p) onFocus(p);
                }
              }}
            >
              {it.lads.map((code) => {
                const fill = fillFor(code);
                return (
                  <path
                    key={code}
                    d={ix.lad(code)!.d}
                    fill={fill}
                    stroke={fine ? '#FFFFFF' : fill}
                    strokeWidth={fine ? (isSel ? 0 : 1) : 0.6}
                    vectorEffect="non-scaling-stroke"
                    className="transition-[fill] duration-150"
                  />
                );
              })}
            </g>
          );
        })}

        <g aria-hidden fill="none" pointerEvents="none">
          {hubOutlines &&
            ix.data.hubs.map((h) => (
              <path
                key={h.id}
                d={h.outline}
                stroke={INK}
                strokeOpacity={ctx.hubId === h.id ? 0.45 : ctx.hubId ? 0.1 : 0.18}
                strokeWidth={ctx.hubId === h.id ? 1.5 : 1}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
            ))}
          {!ctx.hubId &&
            ix.data.regions.map((r) => (
              <path
                key={r.code}
                d={r.d}
                stroke="#FFFFFF"
                strokeWidth={level === 'uk' ? 1.25 : 1.5}
                strokeOpacity={0.95}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          {ix.data.nations.map((n) => (
            <path key={n.code} d={n.d} stroke="#FFFFFF" strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
          ))}
          {ix.data.insets.map((s) => (
            <rect
              key={s.name}
              x={s.box[0]}
              y={s.box[1]}
              width={s.box[2]}
              height={s.box[3]}
              rx={s.box[2] * 0.06}
              stroke={INK}
              strokeOpacity={0.16}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            >
              <title>{`${s.name} (inset, same scale)`}</title>
            </rect>
          ))}
        </g>

        <g
          aria-hidden
          pointerEvents="none"
          className="transition-opacity duration-200"
          style={{ opacity: moving ? 0 : 1 }}
          fontFamily="Plus Jakarta Sans, Inter, system-ui, sans-serif"
        >
          {labels.map((lb) => {
            const isSel = lb.selected || lb.id === selectedItemId;
            return (
              <text
                key={lb.id}
                x={lb.x}
                y={lb.y - ((lb.lines.length - 1) * lb.fs * 1.2) / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={lb.fs}
                fontWeight={isSel ? 650 : 560}
                letterSpacing={lb.fs * 0.01}
                fill={isSel ? '#FFFFFF' : INK}
                stroke={isSel ? SELECTED : '#FFFFFF'}
                strokeWidth={lb.fs * 0.28}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {lb.lines.map((ln, i) => (
                  <tspan key={i} x={lb.x} dy={i === 0 ? 0 : lb.fs * 1.2}>
                    {ln}
                  </tspan>
                ))}
              </text>
            );
          })}
        </g>

        {tipItem && !moving && (
          <g aria-hidden pointerEvents="none">
            <circle
              cx={tipItem.label[0]}
              cy={tipItem.label[1]}
              r={Math.max(5, 4.5 * settled.px)}
              fill="#FFFFFF"
              stroke={tones.count}
              strokeWidth={2.25 * settled.px}
            />
            <circle cx={tipItem.label[0]} cy={tipItem.label[1]} r={Math.max(2.2, 2 * settled.px)} fill={tones.count} />
          </g>
        )}

        {showRegionCounts && (focus.level === 'uk' || (focus.level === 'nation' && focus.id === ENGLAND)) && (
          <g aria-hidden pointerEvents="none" style={{ opacity: moving ? 0 : 1 }}>
            {ix.data.regions.map((r) => {
              const n = ix.hubsInRegion(r.code).length;
              if (!n) return null;
              const [x, y] = r.label;
              const rad = Math.max(11, 10 * settled.px);
              return (
                <g key={`count-${r.code}`} transform={`translate(${x}, ${y + 14 * settled.px})`}>
                  <circle r={rad} fill={tones.count} stroke="#FFFFFF" strokeWidth={2 * settled.px} />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={Math.max(10, 11 * settled.px)}
                    fontWeight={700}
                    fill="#FFFFFF"
                    fontFamily="Plus Jakarta Sans, Inter, system-ui, sans-serif"
                  >
                    {n}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {tipItem && !moving && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-[#1A1A40] px-2.5 py-1.5 text-[12px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(26,26,64,0.65)]"
          style={{
            left: `${((tipItem.label[0] - settled.box[0]) / settled.box[2]) * 100}%`,
            top: `${((tipItem.label[1] - settled.box[1]) / settled.box[3]) * 100}%`,
            marginTop: '-14px',
          }}
        >
          {mapLabel(tipItem.name)}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#1A1A40]" />
        </div>
      )}

      {showBreadcrumb && (
        <nav
          aria-label="Map location"
          className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-0.5 rounded-full border border-white/70 bg-white/80 px-1.5 py-1 text-[13px] shadow-[0_1px_2px_rgba(31,27,77,0.06),0_4px_16px_rgba(31,27,77,0.06)] backdrop-blur-md"
        >
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <span key={i} className="flex items-center">
                {i > 0 && <ChevronRight className="mx-0.5 h-3.5 w-3.5 text-[#1F1B4D]/30" aria-hidden />}
                <button
                  type="button"
                  disabled={last}
                  aria-current={last ? 'location' : undefined}
                  onClick={() => onFocus(c)}
                  className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                    last ? 'text-[#1F1B4D]' : 'text-[#1F1B4D]/60 hover:bg-[#4338E8]/[0.06] hover:text-[#1F1B4D]'
                  }`}
                >
                  {i === 0 ? 'UK' : focusName(ix, c)}
                </button>
              </span>
            );
          })}
        </nav>
      )}

      <div
        className={`absolute ${showBreadcrumb ? 'left-3 top-14' : 'left-3 top-3'} flex flex-col overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-[0_1px_2px_rgba(31,27,77,0.06),0_6px_20px_rgba(31,27,77,0.1)] backdrop-blur-md`}
      >
        <button type="button" aria-label="Zoom in" onClick={() => zoomButton(1 / 1.7)} className="ukmap-ctl">
          <Plus className="h-4 w-4" />
        </button>
        <span className="mx-2 h-px bg-[#1F1B4D]/[0.08]" aria-hidden />
        <button type="button" aria-label="Zoom out" onClick={() => zoomButton(1.7)} className="ukmap-ctl">
          <Minus className="h-4 w-4" />
        </button>
      </div>

      <p className="pointer-events-none absolute bottom-2 left-3 max-w-[70%] text-[10px] leading-tight text-[#1F1B4D]/40">
        Contains OS data © Crown copyright and database right 2024 · ONS (OGL v3) · Hub areas: Arts Council England
      </p>

      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-1/2 mx-auto w-max -translate-y-1/2 rounded-full bg-[#1F1B4D]/90 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-opacity duration-300 ${
          hint ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Hold ⌘ or Ctrl and scroll to zoom
      </div>

      <div className="sr-only" aria-live="polite">
        {`Showing ${focusName(ix, focus)}`}
      </div>
    </div>
  );
}
