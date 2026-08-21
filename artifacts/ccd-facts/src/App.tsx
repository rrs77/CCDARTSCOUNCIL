import { animate, motion, useMotionValue } from "framer-motion";
import { Home, ZoomIn, ZoomOut } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { LogoMark } from "@/components/LogoMark";
import { TopicModal } from "@/components/TopicModal";
import {
  clusters,
  getStat,
  journey,
  keyFactStatIds,
  meta,
  type ClusterDef,
} from "@/content/facts.content";

function useViewport() {
  const [size, setSize] = useState({ w: 390, h: 844 });
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function App() {
  const { w, h } = useViewport();
  const reduced = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);
  const [intro, setIntro] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !params.get("chapter") && params.get("skipIntro") !== "1";
  });
  const [showKeys] = useState(
    () => new URLSearchParams(window.location.search).get("edit") === "1",
  );

  const stageRef = useRef<HTMLDivElement>(null);
  const scaleMv = useMotionValue(0.22);
  const xMv = useMotionValue(0);
  const yMv = useMotionValue(0);

  const scaleRef = useRef(0.22);
  const xRef = useRef(0);
  const yRef = useRef(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; camX: number; camY: number } | null>(null);
  const moved = useRef(false);

  const syncRefs = useCallback(() => {
    scaleRef.current = scaleMv.get();
    xRef.current = xMv.get();
    yRef.current = yMv.get();
  }, [scaleMv, xMv, yMv]);

  const setCamera = useCallback(
    (scale: number, x: number, y: number, animated: boolean) => {
      const s = clamp(scale, 0.1, 1.4);
      const duration = !animated || reduced ? 0.01 : 0.58;
      const ease: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
      if (animated && !reduced) {
        animate(scaleMv, s, { duration, ease });
        animate(xMv, x, { duration, ease });
        animate(yMv, y, { duration, ease });
      } else {
        scaleMv.set(s);
        xMv.set(x);
        yMv.set(y);
      }
      scaleRef.current = s;
      xRef.current = x;
      yRef.current = y;
    },
    [reduced, scaleMv, xMv, yMv],
  );

  const fitOverview = useCallback(() => {
    const xs = clusters.map((c) => c.x);
    const ys = clusters.map((c) => c.y);
    const minX = Math.min(...xs) - 180;
    const maxX = Math.max(...xs) + 640;
    const minY = Math.min(...ys) - 140;
    const maxY = Math.max(...ys) + 360;
    const worldW = maxX - minX;
    const worldH = maxY - minY;
    const topPad = w < 640 ? 220 : 130;
    const bottomPad = 80;
    const s = Math.min((w - 28) / worldW, (h - topPad - bottomPad) / worldH, 0.36);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return { s, x: -cx * s, y: -cy * s + (topPad - bottomPad) / 5 };
  }, [w, h]);

  const flyToCluster = useCallback(
    (id: string | null) => {
      if (!id) {
        const { s, x, y } = fitOverview();
        setCamera(s, x, y, true);
        setActive(null);
        const url = new URL(window.location.href);
        url.searchParams.delete("chapter");
        if (showKeys) url.searchParams.set("edit", "1");
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
        return;
      }
      const ch = clusters.find((c) => c.id === id);
      if (!ch) return;
      const targetScale = w < 640 ? 0.8 : 0.95;
      const x = -(ch.x + 260) * targetScale;
      const y = -(ch.y + 200) * targetScale + (w < 640 ? 40 : 16);
      setCamera(targetScale, x, y, true);
      setActive(id);
      const url = new URL(window.location.href);
      url.searchParams.set("chapter", id);
      if (showKeys) url.searchParams.set("edit", "1");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    },
    [fitOverview, setCamera, showKeys, w],
  );

  // Opening beat: homepage “connection” world, then reveal the facts map
  useEffect(() => {
    if (!intro) {
      const { s, x, y } = fitOverview();
      setCamera(s, x, y, false);
      return undefined;
    }
    const t = window.setTimeout(() => {
      setIntro(false);
      const { s, x, y } = fitOverview();
      setCamera(s, x, y, !reduced);
    }, reduced ? 0 : 1600);
    return () => window.clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ch = new URLSearchParams(window.location.search).get("chapter");
    if (ch && clusters.some((c) => c.id === ch)) {
      setIntro(false);
      const t = window.setTimeout(() => flyToCluster(ch), 40);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [flyToCluster]);

  const zoomAt = useCallback(
    (clientX: number, clientY: number, nextScale: number) => {
      syncRefs();
      const prev = scaleRef.current;
      const s = clamp(nextScale, 0.1, 1.4);
      const rectX = clientX - w / 2;
      const rectY = clientY - h / 2;
      const worldX = (rectX - xRef.current) / prev;
      const worldY = (rectY - yRef.current) / prev;
      setCamera(s, rectX - worldX * s, rectY - worldY * s, false);
    },
    [h, setCamera, syncRefs, w],
  );

  // Non-passive wheel so we can preventDefault (pan / zoom)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (active) return; // modal open — do not pan/zoom canvas
      e.preventDefault();
      syncRefs();
      if (e.ctrlKey || e.metaKey) {
        zoomAt(e.clientX, e.clientY, scaleRef.current * Math.exp(-e.deltaY * 0.01));
        return;
      }
      // Mouse wheel → zoom; trackpad two-finger → pan (when both axes move or small deltas)
      const mostlyVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX) * 2;
      if (mostlyVertical && Math.abs(e.deltaX) < 1.2) {
        zoomAt(e.clientX, e.clientY, scaleRef.current * Math.exp(-e.deltaY * 0.0018));
        return;
      }
      setCamera(scaleRef.current, xRef.current - e.deltaX, yRef.current - e.deltaY, false);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [active, setCamera, syncRefs, zoomAt]);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (active) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    syncRefs();
    if (pointers.current.size === 1) {
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        camX: xRef.current,
        camY: yRef.current,
      };
      pinchStart.current = null;
    } else if (pointers.current.size === 2) {
      dragStart.current = null;
      const pts = [...pointers.current.values()];
      pinchStart.current = {
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        scale: scaleRef.current,
      };
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      zoomAt(midX, midY, pinchStart.current.scale * (dist / Math.max(1, pinchStart.current.dist)));
      moved.current = true;
      return;
    }
    if (dragStart.current && pointers.current.size === 1) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.hypot(dx, dy) > 8) moved.current = true;
      setCamera(
        scaleRef.current,
        dragStart.current.camX + dx,
        dragStart.current.camY + dy,
        false,
      );
    }
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragStart.current = null;
  };

  const activeCluster: ClusterDef | undefined = useMemo(
    () => clusters.find((c) => c.id === active),
    [active],
  );
  const journeyIndex = active ? journey.indexOf(active) : -1;

  const pathD = useMemo(() => {
    const pts = journey
      .map((id) => clusters.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => `${c!.x + 36},${c!.y + 30}`);
    return pts.length ? `M ${pts.join(" L ")}` : "";
  }, []);

  return (
    <div className="facts-app">
      {intro ? (
        <div className="intro-beat" role="presentation">
          <div className="intro-beat-inner slide-auto-enter">
            <div className="mx-auto mb-5 w-fit rounded-full shadow-[0_0_40px_rgba(182,255,126,0.22)]">
              <LogoMark size={w < 640 ? 72 : 96} />
            </div>
            <p className="pitch-eyebrow text-[var(--lime)]">{meta.brand}</p>
            <h1 className="pitch-h1 display mt-3 text-white">
              {meta.heroLineBefore}{" "}
              <span className="italic font-normal" style={{ fontFamily: "var(--font-serif)", color: "#B6FF7E" }}>
                {meta.heroLineAccent}
              </span>
            </h1>
            <p className="pitch-body-lg mt-3 max-w-md text-white/80">{meta.heroSupport}</p>
            <button
              type="button"
              className="chip-lime mt-6"
              onClick={() => {
                setIntro(false);
                const { s, x, y } = fitOverview();
                setCamera(s, x, y, !reduced);
              }}
            >
              {meta.ui.enterCta}
            </button>
          </div>
        </div>
      ) : null}

      <header className={`topbar ${intro ? "opacity-0 pointer-events-none" : ""}`}>
        <div className="flex items-center gap-2.5">
          <div className="rounded-full shadow-[0_0_24px_rgba(182,255,126,0.2)]">
            <LogoMark size={w < 640 ? 34 : 40} />
          </div>
          <div className="leading-tight text-white">
            <div className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--lime)]">
              {meta.brand}
            </div>
            <div className="text-sm font-semibold">
              {meta.experienceLead}{" "}
              <span className="italic font-normal" style={{ fontFamily: "var(--font-serif)", color: "#B6FF7E" }}>
                {meta.experienceAccent}
              </span>
              {showKeys ? <span className="edit-key"> meta.experienceAccent</span> : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="icon-btn"
            aria-label="Zoom out"
            onClick={() => {
              syncRefs();
              zoomAt(w / 2, h / 2, scaleRef.current * 0.82);
            }}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Zoom in"
            onClick={() => {
              syncRefs();
              zoomAt(w / 2, h / 2, scaleRef.current * 1.22);
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          {active ? (
            <button type="button" className="chip-overview" onClick={() => flyToCluster(null)}>
              {meta.ui.overviewChip}
            </button>
          ) : null}
          <button
            type="button"
            className="chip-home"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            <Home className="h-3.5 w-3.5" />
            {meta.ui.homeLabel}
          </button>
        </div>
      </header>

      {/* Persistent CCD mark while exploring (walkthrough-style) */}
      {active ? (
        <div className="pointer-events-none absolute left-3 top-[4.15rem] z-20 opacity-90 sm:left-4">
          <LogoMark size={26} />
        </div>
      ) : null}

      {!active ? (
        <div className="overview-facts" aria-label="Key facts">
          <p className="overview-facts-title">
            {meta.ui.exploreHint}
            {showKeys ? <span className="edit-key"> overviewStatIds</span> : null}
          </p>
          <div className="overview-facts-grid">
            {keyFactStatIds.map((id) => {
              const s = getStat(id);
              if (!s) return null;
              return (
                <button
                  key={id}
                  type="button"
                  className="overview-fact"
                  onClick={() => flyToCluster(s.zoomClusterId ?? "glance")}
                >
                  <span className="overview-fact-value">{s.value}</span>
                  <span className="overview-fact-label">{s.label}</span>
                  {showKeys ? <span className="edit-key">stats.{id}</span> : null}
                </button>
              );
            })}
          </div>
          <p className="overview-hint">{meta.ui.exploreHint}</p>
        </div>
      ) : null}

      <div
        ref={stageRef}
        className="canvas-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <motion.div className="canvas-world" style={{ scale: scaleMv, x: xMv, y: yMv }}>
          <div className="world-glow" aria-hidden />
          <svg className="world-path" width="2400" height="3600" aria-hidden>
            <path
              d={pathD}
              fill="none"
              stroke="rgba(182,255,126,0.22)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {clusters.map((ch) => {
            const isActive = active === ch.id;
            const isCover = ch.id === "cover";
            return (
              <div
                key={ch.id}
                className={`node ${isActive ? "node-active" : ""} ${isCover ? "node-cover" : ""}`}
                style={{ left: ch.x, top: ch.y }}
              >
                <button
                  type="button"
                  className="node-heading"
                  onPointerDown={(e) => {
                    // Allow tap without starting a world-drag from the heading
                    e.stopPropagation();
                    moved.current = false;
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    flyToCluster(isActive ? null : ch.id);
                  }}
                >
                  <span className="node-kicker">
                    {ch.n < 10 ? `0${ch.n}` : ch.n}
                    {showKeys ? <span className="edit-key"> clusters.{ch.id}</span> : null}
                  </span>
                  <span className="node-title">{ch.title}</span>
                  <span className="node-line">{ch.overviewLine}</span>
                </button>
              </div>
            );
          })}
        </motion.div>
      </div>

      {activeCluster ? (
        <TopicModal
          cluster={activeCluster}
          showKeys={showKeys}
          onClose={() => flyToCluster(null)}
          footer={
            <>
              <button type="button" className="chip-outline" onClick={() => flyToCluster(null)}>
                {meta.ui.overviewChip}
              </button>
              {journeyIndex >= 0 && journeyIndex < journey.length - 1 ? (
                <button
                  type="button"
                  className="chip-lime"
                  onClick={() => flyToCluster(journey[journeyIndex + 1])}
                >
                  {meta.ui.continuePath}
                </button>
              ) : null}
            </>
          }
        />
      ) : null}
    </div>
  );
}
