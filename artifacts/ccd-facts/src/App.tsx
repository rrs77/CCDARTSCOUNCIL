import { animate, motion, useMotionValue } from "framer-motion";
import { ChevronRight, Home, ZoomIn, ZoomOut } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GlanceModal } from "@/components/GlanceModal";
import { LogoMark } from "@/components/LogoMark";
import { TopicModal, type TravelDir } from "@/components/TopicModal";
import {
  getTopic,
  meta,
  overview,
  topicOrder,
  topics,
  type CompassDir,
  type TopicDef,
} from "@/content/facts.content";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const FLY_MS = 0.42;
/** Cap zoom relative to the fitted overview scale (~8–12×). */
const MAX_ZOOM_MULT = 10;

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

function cameFrom(prev: TopicDef | undefined, next: TopicDef): TravelDir {
  if (!prev || prev.id === next.id) return null;
  const dx = prev.x - next.x;
  const dy = prev.y - next.y;
  if (Math.abs(dx) < 40 && Math.abs(dy) < 40) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

function heroUrl() {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${overview.heroImage}`.replace(/\/{2,}/g, "/").replace(":/", "://");
}

export default function App() {
  const { w, h } = useViewport();
  const reduced = useReducedMotion();
  const [modalId, setModalId] = useState<string | null>(null);
  const [glanceOpen, setGlanceOpen] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [fromDir, setFromDir] = useState<TravelDir>(null);
  const [showKeys] = useState(
    () => new URLSearchParams(window.location.search).get("edit") === "1",
  );
  const lastTopicRef = useRef<TopicDef | null>(null);
  const focusIdRef = useRef<string | null>(null);
  const overviewScaleRef = useRef(0.35);

  const stageRef = useRef<HTMLDivElement>(null);
  const scaleMv = useMotionValue(0.35);
  const xMv = useMotionValue(0);
  const yMv = useMotionValue(0);
  const scaleRef = useRef(0.35);
  const xRef = useRef(0);
  const yRef = useRef(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; camX: number; camY: number; t: number } | null>(
    null,
  );
  const moved = useRef(false);

  const syncRefs = useCallback(() => {
    scaleRef.current = scaleMv.get();
    xRef.current = xMv.get();
    yRef.current = yMv.get();
  }, [scaleMv, xMv, yMv]);

  const setCamera = useCallback(
    (scale: number, x: number, y: number, animated: boolean) => {
      const minS = overviewScaleRef.current * 0.85;
      const maxS = overviewScaleRef.current * MAX_ZOOM_MULT;
      const s = clamp(scale, minS, maxS);
      const duration = !animated || reduced ? 0.01 : FLY_MS;
      if (animated && !reduced) {
        animate(scaleMv, s, { duration, ease: EASE_OUT });
        animate(xMv, x, { duration, ease: EASE_OUT });
        animate(yMv, y, { duration, ease: EASE_OUT });
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
    const padX = 24;
    const padTop = w < 640 ? 72 : 64;
    const padBottom = w < 640 ? 100 : 56;
    const s = Math.min((w - padX * 2) / overview.width, (h - padTop - padBottom) / overview.height);
    overviewScaleRef.current = s;
    const cx = overview.width / 2;
    const cy = overview.height / 2;
    return { s, x: -cx * s, y: -cy * s + (padTop - padBottom) / 6 };
  }, [w, h]);

  const cameraForMarker = useCallback(
    (topic: TopicDef) => {
      const base = overviewScaleRef.current || fitOverview().s;
      const targetScale = clamp(base * 2.65, base * 1.8, base * MAX_ZOOM_MULT);
      const cx = topic.x + 70;
      const cy = topic.y + 18;
      return { s: targetScale, x: -cx * targetScale, y: -cy * targetScale };
    },
    [fitOverview],
  );

  const goOverview = useCallback(() => {
    const { s, x, y } = fitOverview();
    setCamera(s, x, y, true);
    setModalId(null);
    setGlanceOpen(false);
    focusIdRef.current = null;
    setFocusId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("topic");
    url.searchParams.delete("glance");
    if (showKeys) url.searchParams.set("edit", "1");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, [fitOverview, setCamera, showKeys]);

  const openGlance = useCallback(() => {
    setModalId(null);
    setGlanceOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("topic");
    url.searchParams.set("glance", "1");
    if (showKeys) url.searchParams.set("edit", "1");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, [showKeys]);

  const closeGlance = useCallback(() => {
    setGlanceOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("glance");
    if (showKeys) url.searchParams.set("edit", "1");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, [showKeys]);

  const openTopic = useCallback(
    (id: string) => {
      const topic = getTopic(id);
      if (!topic) return;
      const prev =
        topics.find((t) => t.id === focusIdRef.current) ?? lastTopicRef.current ?? undefined;
      setFromDir(cameFrom(prev, topic));
      focusIdRef.current = id;
      setFocusId(id);
      lastTopicRef.current = topic;
      const cam = cameraForMarker(topic);
      setCamera(cam.s, cam.x, cam.y, true);
      setGlanceOpen(false);
      setModalId(id);
      const url = new URL(window.location.href);
      url.searchParams.set("topic", id);
      if (showKeys) url.searchParams.set("edit", "1");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    },
    [cameraForMarker, setCamera, showKeys],
  );

  const closeModal = useCallback(() => {
    setModalId(null);
    // Stay spatially near the marker; Esc again / Home returns to overview
    const url = new URL(window.location.href);
    url.searchParams.delete("topic");
    if (showKeys) url.searchParams.set("edit", "1");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, [showKeys]);

  const step = useCallback(
    (dir: CompassDir) => {
      const currentId = modalId ?? focusIdRef.current ?? topicOrder[0];
      const current = getTopic(currentId);
      if (!current) return;
      const nextId = current.neighbors[dir];
      if (nextId) openTopic(nextId);
    },
    [modalId, openTopic],
  );

  // Land on overview picture
  useEffect(() => {
    const { s, x, y } = fitOverview();
    setCamera(s, x, y, false);
    stageRef.current?.focus({ preventScroll: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("glance") === "1") {
      setGlanceOpen(true);
      return undefined;
    }
    const id = params.get("topic") || params.get("chapter");
    if (id && getTopic(id)) {
      const t = window.setTimeout(() => openTopic(id), 40);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [openTopic]);

  const zoomAt = useCallback(
    (clientX: number, clientY: number, nextScale: number) => {
      syncRefs();
      const prev = scaleRef.current;
      const minS = overviewScaleRef.current * 0.85;
      const maxS = overviewScaleRef.current * MAX_ZOOM_MULT;
      const s = clamp(nextScale, minS, maxS);
      const rectX = clientX - w / 2;
      const rectY = clientY - h / 2;
      const worldX = (rectX - xRef.current) / prev;
      const worldY = (rectY - yRef.current) / prev;
      setCamera(s, rectX - worldX * s, rectY - worldY * s, false);
    },
    [h, setCamera, syncRefs, w],
  );

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (modalId || glanceOpen) return;
      e.preventDefault();
      syncRefs();
      if (e.ctrlKey || e.metaKey) {
        zoomAt(e.clientX, e.clientY, scaleRef.current * Math.exp(-e.deltaY * 0.01));
        return;
      }
      const mostlyVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX) * 2;
      if (mostlyVertical && Math.abs(e.deltaX) < 1.2) {
        zoomAt(e.clientX, e.clientY, scaleRef.current * Math.exp(-e.deltaY * 0.0018));
        return;
      }
      setCamera(scaleRef.current, xRef.current - e.deltaX, yRef.current - e.deltaY, false);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [glanceOpen, modalId, setCamera, syncRefs, zoomAt]);

  // Keyboard — works without clicking canvas first (window listener; skip when typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (glanceOpen) closeGlance();
        else if (modalId) closeModal();
        else goOverview();
        return;
      }
      if (modalId || glanceOpen) return; // arrows reserved for modal pages / not canvas
      const map: Record<string, CompassDir> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        W: "up",
        s: "down",
        S: "down",
        a: "left",
        A: "left",
        d: "right",
        D: "right",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        step(dir);
        return;
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomAt(w / 2, h / 2, scaleRef.current * 1.18);
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomAt(w / 2, h / 2, scaleRef.current * 0.85);
      }
      if (e.key === "Home") {
        e.preventDefault();
        goOverview();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeGlance, closeModal, glanceOpen, goOverview, h, modalId, step, w, zoomAt]);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (modalId || glanceOpen) return;
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
        t: performance.now(),
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
    if (modalId || glanceOpen) return;
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
    if (modalId || glanceOpen) {
      pointers.current.clear();
      dragStart.current = null;
      return;
    }
    const start = dragStart.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0 && start) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const dt = performance.now() - start.t;
      const dist = Math.hypot(dx, dy);
      // Quick swipe → neighbouring topic
      if (dist > 56 && dt < 420 && !pinchStart.current) {
        if (Math.abs(dx) >= Math.abs(dy)) step(dx < 0 ? "right" : "left");
        else step(dy < 0 ? "down" : "up");
      }
      dragStart.current = null;
    }
  };

  const activeTopic = modalId ? getTopic(modalId) : undefined;
  useEffect(() => {
    if (activeTopic) lastTopicRef.current = activeTopic;
  }, [activeTopic]);
  const panelTopic = activeTopic ?? lastTopicRef.current;

  const pathD = useMemo(() => {
    const pts = topicOrder
      .map((id) => getTopic(id))
      .filter(Boolean)
      .map((t) => `${t!.x + 56},${t!.y + 16}`);
    if (pts.length < 2) return "";
    return `M ${pts[0]} C ${pts[0]} ${pts[1]} ${pts[1]} S ${pts[2] ?? pts[1]} ${pts[2] ?? pts[1]} ${
      pts[3] ? `S ${pts[3]} ${pts[3]}` : ""
    }`.trim();
  }, []);

  const sparsePath = useMemo(() => {
    const ordered = topicOrder.map((id) => getTopic(id)!).filter(Boolean);
    if (ordered.length < 2) return "";
    // Soft asymmetric curve through chips — not a node graph
    const [a, b, c, d] = ordered;
    return `M ${a.x + 48} ${a.y + 16}
      Q ${a.x + 200} ${a.y + 180} ${b.x + 48} ${b.y + 16}
      Q ${b.x + 280} ${b.y - 120} ${c.x + 48} ${c.y + 16}
      Q ${c.x + 160} ${c.y + 200} ${d.x + 48} ${d.y + 16}`;
  }, []);

  const topicIndex = modalId ? topicOrder.indexOf(modalId as (typeof topicOrder)[number]) : -1;

  return (
    <div className="facts-app">
      <header className="topbar">
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
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="icon-btn"
            aria-label="Zoom out"
            onClick={() => zoomAt(w / 2, h / 2, scaleRef.current * 0.82)}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Zoom in"
            onClick={() => zoomAt(w / 2, h / 2, scaleRef.current * 1.22)}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button type="button" className="chip-overview" onClick={goOverview}>
            {meta.ui.overviewChip}
          </button>
          <button type="button" className="chip-home" onClick={() => { window.location.href = "/"; }}>
            <Home className="h-3.5 w-3.5" />
            {meta.ui.homeLabel}
          </button>
        </div>
      </header>

      <div
        ref={stageRef}
        className="canvas-stage"
        tabIndex={0}
        aria-label="The facts canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <motion.div className="canvas-world" style={{ scale: scaleMv, x: xMv, y: yMv }}>
          <div
            className="overview-picture"
            style={{ width: overview.width, height: overview.height }}
          >
            <img
              className="overview-hero"
              src={heroUrl()}
              alt=""
              draggable={false}
            />
            <div className="overview-forest" aria-hidden />
            <div className="overview-vignette" aria-hidden />

            <svg className="overview-path" width={overview.width} height={overview.height} aria-hidden>
              <path
                d={sparsePath || pathD}
                fill="none"
                stroke="rgba(182,255,126,0.28)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div
              className="overview-headline"
              style={{ left: overview.headlineX, top: overview.headlineY }}
            >
              <p className="overview-brand">{meta.brand}</p>
              <button type="button" className="overview-headline-btn" onClick={openGlance}>
                <h1>
                  {meta.situationHeadline}
                  {showKeys ? <span className="edit-key"> meta.situationHeadline</span> : null}
                </h1>
                <p className="overview-support">
                  {meta.situationLine}
                  {showKeys ? <span className="edit-key"> meta.situationLine</span> : null}
                </p>
                <span className="overview-headline-cta">{meta.ui.openGlance}</span>
              </button>
            </div>

            <p
              className="overview-explore-hint"
              style={{ left: overview.hintX, top: overview.hintY }}
            >
              {meta.ui.exploreHint}
            </p>

            {topics.map((t) => {
              const isHot = focusId === t.id || modalId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`topic-chip ${isHot ? "topic-chip-active" : ""}`}
                  style={{ left: t.x, top: t.y }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    moved.current = false;
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openTopic(t.id);
                  }}
                >
                  <span>{t.markerLabel}</span>
                  <ChevronRight className="topic-chip-chevron" strokeWidth={2.5} />
                  {showKeys ? <span className="edit-key"> topics.{t.id}</span> : null}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Mobile / optional D-pad */}
      {!modalId && !glanceOpen ? (
        <div className="compass-pad" aria-label="Explore directions">
          <button type="button" className="compass-btn compass-up" onClick={() => step("up")}>
            ↑
          </button>
          <button type="button" className="compass-btn compass-left" onClick={() => step("left")}>
            ←
          </button>
          <button type="button" className="compass-btn compass-right" onClick={() => step("right")}>
            →
          </button>
          <button type="button" className="compass-btn compass-down" onClick={() => step("down")}>
            ↓
          </button>
        </div>
      ) : null}

      <GlanceModal open={glanceOpen} onClose={closeGlance} showKeys={showKeys} />

      {panelTopic ? (
        <TopicModal
          open={!!activeTopic}
          cluster={panelTopic}
          showKeys={showKeys}
          fromDir={fromDir}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="chip-outline" onClick={goOverview}>
                {meta.ui.overviewChip}
              </button>
              {topicIndex >= 0 && topicIndex < topicOrder.length - 1 ? (
                <button
                  type="button"
                  className="chip-lime"
                  onClick={() => openTopic(topicOrder[topicIndex + 1])}
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
