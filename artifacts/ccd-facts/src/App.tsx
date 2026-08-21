import { animate, motion, useMotionValue } from "framer-motion";
import { ChevronRight, Home, Pencil, ZoomIn, ZoomOut } from "lucide-react";
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
  getStrandIndex,
  getStrandItem,
  getTopic,
  meta,
  overview,
  strand,
  topicOrder,
  type StrandItem,
  type TopicDef,
} from "@/content/facts.content";
import { isEditingField } from "@/content/editableStore";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const FLY_MS = 0.42;
const SHRINK_MS = 360;
const TRAVEL_MS = 480;
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

function cameFrom(prev: { x: number; y: number } | undefined, next: { x: number; y: number }): TravelDir {
  if (!prev) return null;
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

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export default function App() {
  const { w, h } = useViewport();
  const reduced = useReducedMotion();
  const [modalId, setModalId] = useState<string | null>(null);
  const [glanceOpen, setGlanceOpen] = useState(false);
  const [shrinking, setShrinking] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [fromDir, setFromDir] = useState<TravelDir>(null);
  const [editMode, setEditMode] = useState(
    () => new URLSearchParams(window.location.search).get("edit") === "1",
  );
  const showKeys = editMode;
  const lastTopicRef = useRef<TopicDef | null>(null);
  const focusIdRef = useRef<string | null>(null);
  const overviewScaleRef = useRef(0.35);
  const travelingRef = useRef(false);

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
    (scale: number, x: number, y: number, animated: boolean, duration = FLY_MS) => {
      const minS = overviewScaleRef.current * 0.85;
      const maxS = overviewScaleRef.current * MAX_ZOOM_MULT;
      const s = clamp(scale, minS, maxS);
      const dur = !animated || reduced ? 0.01 : duration;
      if (animated && !reduced) {
        animate(scaleMv, s, { duration: dur, ease: EASE_OUT });
        animate(xMv, x, { duration: dur, ease: EASE_OUT });
        animate(yMv, y, { duration: dur, ease: EASE_OUT });
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

  const cameraForPoint = useCallback(
    (pt: { x: number; y: number }) => {
      const base = overviewScaleRef.current || fitOverview().s;
      const targetScale = clamp(base * 2.65, base * 1.8, base * MAX_ZOOM_MULT);
      const cx = pt.x + 56;
      const cy = pt.y + 18;
      return { s: targetScale, x: -cx * targetScale, y: -cy * targetScale };
    },
    [fitOverview],
  );

  const goOverview = useCallback(() => {
    travelingRef.current = false;
    setShrinking(false);
    const { s, x, y } = fitOverview();
    setCamera(s, x, y, true);
    setModalId(null);
    setGlanceOpen(false);
    focusIdRef.current = null;
    setFocusId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("topic");
    url.searchParams.delete("glance");
    if (editMode) url.searchParams.set("edit", "1");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, [editMode, fitOverview, setCamera]);

  const openGlance = useCallback(
    (dir: TravelDir = null) => {
      setFromDir(dir);
      setShrinking(false);
      setModalId(null);
      focusIdRef.current = "situation";
      setFocusId("situation");
      const item = getStrandItem("situation");
      if (item) {
        const cam = cameraForPoint(item);
        setCamera(cam.s, cam.x, cam.y, true);
      }
      setGlanceOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("topic");
      url.searchParams.set("glance", "1");
      if (editMode) url.searchParams.set("edit", "1");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    },
    [cameraForPoint, editMode, setCamera],
  );

  const closeGlance = useCallback(() => {
    setGlanceOpen(false);
    setShrinking(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("glance");
    if (editMode) url.searchParams.set("edit", "1");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, [editMode]);

  const openTopic = useCallback(
    (id: string, dir: TravelDir = null) => {
      const topic = getTopic(id);
      if (!topic) return;
      setFromDir(dir);
      setShrinking(false);
      focusIdRef.current = id;
      setFocusId(id);
      lastTopicRef.current = topic;
      const item = getStrandItem(id) ?? topic;
      const cam = cameraForPoint(item);
      setCamera(cam.s, cam.x, cam.y, true);
      setGlanceOpen(false);
      setModalId(id);
      const url = new URL(window.location.href);
      url.searchParams.delete("glance");
      url.searchParams.set("topic", id);
      if (editMode) url.searchParams.set("edit", "1");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    },
    [cameraForPoint, editMode, setCamera],
  );

  const closeModal = useCallback(() => {
    setModalId(null);
    setShrinking(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("topic");
    if (editMode) url.searchParams.set("edit", "1");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, [editMode]);

  const openStrandItem = useCallback(
    (item: StrandItem, dir: TravelDir) => {
      if (item.kind === "glance") openGlance(dir);
      else openTopic(item.id, dir);
    },
    [openGlance, openTopic],
  );

  /** Shrink open modal → pan along strand → expand next info */
  const travelStrand = useCallback(
    async (delta: 1 | -1) => {
      if (travelingRef.current || shrinking) return;
      const openId = glanceOpen ? "situation" : modalId ?? focusIdRef.current;
      let idx = getStrandIndex(openId);
      if (idx < 0) idx = delta > 0 ? -1 : 0;
      const nextIdx = idx + delta;
      if (nextIdx < 0 || nextIdx >= strand.length) return;

      const fromItem = idx >= 0 ? strand[idx] : null;
      const toItem = strand[nextIdx];
      const dir = cameFrom(fromItem ?? undefined, toItem);
      travelingRef.current = true;

      // 1) Shrink current modal back toward its box
      if (glanceOpen || modalId) {
        setShrinking(true);
        await wait(reduced ? 40 : SHRINK_MS);
        setGlanceOpen(false);
        setModalId(null);
        setShrinking(false);
      }

      // 2) Camera travels along the connector (midpoint on the strand segment)
      const base = overviewScaleRef.current || fitOverview().s;
      const travelScale = clamp(base * 1.55, base, base * MAX_ZOOM_MULT);
      if (fromItem) {
        const mid = {
          x: (fromItem.x + toItem.x) / 2 + 56,
          y: (fromItem.y + toItem.y) / 2 + 18,
        };
        setCamera(travelScale, -mid.x * travelScale, -mid.y * travelScale, true, TRAVEL_MS / 1000);
        await wait(reduced ? 40 : TRAVEL_MS * 0.55);
      }
      const cam = cameraForPoint(toItem);
      setCamera(cam.s, cam.x, cam.y, true, TRAVEL_MS / 1000);
      await wait(reduced ? 40 : TRAVEL_MS * 0.55);

      // 3) Expand next box into the large modal
      focusIdRef.current = toItem.id;
      setFocusId(toItem.id);
      openStrandItem(toItem, dir);
      travelingRef.current = false;
    },
    [
      cameraForPoint,
      fitOverview,
      glanceOpen,
      modalId,
      openStrandItem,
      reduced,
      setCamera,
      shrinking,
    ],
  );

  useEffect(() => {
    const { s, x, y } = fitOverview();
    setCamera(s, x, y, false);
    stageRef.current?.focus({ preventScroll: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("edit") === "1") setEditMode(true);
    if (params.get("glance") === "1") {
      setGlanceOpen(true);
      setFocusId("situation");
      focusIdRef.current = "situation";
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
      if (modalId || glanceOpen || shrinking) return;
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
  }, [glanceOpen, modalId, setCamera, shrinking, syncRefs, zoomAt]);

  // Keyboard — strand travel (not modal paging). Works without focusing the canvas.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditingField()) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (glanceOpen) closeGlance();
        else if (modalId) closeModal();
        else goOverview();
        return;
      }
      const forward = e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "d" || e.key === "D" || e.key === "s" || e.key === "S";
      const back = e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "a" || e.key === "A" || e.key === "w" || e.key === "W";
      if (forward) {
        e.preventDefault();
        void travelStrand(1);
        return;
      }
      if (back) {
        e.preventDefault();
        void travelStrand(-1);
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
  }, [
    closeGlance,
    closeModal,
    glanceOpen,
    goOverview,
    h,
    modalId,
    travelStrand,
    w,
    zoomAt,
  ]);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (modalId || glanceOpen || shrinking) return;
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
    if (modalId || glanceOpen || shrinking) return;
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
    if (modalId || glanceOpen || shrinking) {
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
      // Swipe along the strand: left-to-right (dx>0) → previous; right-to-left → next
      if (dist > 56 && dt < 420) {
        if (Math.abs(dx) >= Math.abs(dy)) void travelStrand(dx < 0 ? 1 : -1);
        else void travelStrand(dy < 0 ? 1 : -1);
      }
      dragStart.current = null;
    }
  };

  const activeTopic = modalId ? getTopic(modalId) : undefined;
  useEffect(() => {
    if (activeTopic) lastTopicRef.current = activeTopic;
  }, [activeTopic]);
  const panelTopic = activeTopic ?? lastTopicRef.current;
  const topicIndex = modalId ? topicOrder.indexOf(modalId as (typeof topicOrder)[number]) : -1;

  const strandPath = useMemo(() => {
    if (strand.length < 2) return "";
    const pts = strand.map((s) => ({ x: s.x + 56, y: s.y + 16 }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const cur = pts[i];
      const c1x = prev.x + (cur.x - prev.x) * 0.4;
      const c1y = prev.y;
      const c2x = cur.x - (cur.x - prev.x) * 0.4;
      const c2y = cur.y;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${cur.x} ${cur.y}`;
    }
    return d;
  }, []);

  const toggleEdit = () => {
    setEditMode((on) => {
      const next = !on;
      const url = new URL(window.location.href);
      if (next) url.searchParams.set("edit", "1");
      else url.searchParams.delete("edit");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
      return next;
    });
  };

  const anyModal = glanceOpen || !!modalId || shrinking;

  return (
    <div className={`facts-app ${editMode ? "facts-app--edit" : ""}`}>
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
            className={`icon-btn ${editMode ? "icon-btn-active" : ""}`}
            aria-label={editMode ? "Exit edit mode" : "Edit mode"}
            aria-pressed={editMode}
            onClick={toggleEdit}
          >
            <Pencil className="h-4 w-4" />
          </button>
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
            <img className="overview-hero" src={heroUrl()} alt="" draggable={false} />
            <div className="overview-forest" aria-hidden />
            <div className="overview-vignette" aria-hidden />

            <svg className="overview-path" width={overview.width} height={overview.height} aria-hidden>
              <path
                d={strandPath}
                fill="none"
                stroke="rgba(182,255,126,0.45)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div
              className="overview-headline"
              style={{ left: overview.headlineX, top: overview.headlineY }}
            >
              <p className="overview-brand">{meta.brand}</p>
              <h1>
                {meta.situationHeadline}
                {showKeys ? <span className="edit-key"> meta.situationHeadline</span> : null}
              </h1>
              <p className="overview-support">
                {meta.situationLine}
                {showKeys ? <span className="edit-key"> meta.situationLine</span> : null}
              </p>
            </div>

            <p
              className="overview-explore-hint"
              style={{ left: overview.hintX, top: overview.hintY }}
            >
              {meta.ui.exploreHint}
            </p>

            {strand.map((item) => {
              const isHot = focusId === item.id || modalId === item.id || (item.id === "situation" && glanceOpen);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`topic-chip strand-box ${isHot ? "topic-chip-active" : ""}`}
                  style={{ left: item.x, top: item.y }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    moved.current = false;
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openStrandItem(item, null);
                  }}
                >
                  <span>{item.label}</span>
                  <ChevronRight className="topic-chip-chevron" strokeWidth={2.5} />
                  {showKeys ? <span className="edit-key"> strand.{item.id}</span> : null}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {!anyModal ? (
        <div className="compass-pad" aria-label="Explore the strand">
          <button type="button" className="compass-btn compass-up" onClick={() => void travelStrand(-1)}>
            ↑
          </button>
          <button type="button" className="compass-btn compass-left" onClick={() => void travelStrand(-1)}>
            ←
          </button>
          <button type="button" className="compass-btn compass-right" onClick={() => void travelStrand(1)}>
            →
          </button>
          <button type="button" className="compass-btn compass-down" onClick={() => void travelStrand(1)}>
            ↓
          </button>
        </div>
      ) : null}

      <GlanceModal
        open={glanceOpen}
        shrinking={shrinking && glanceOpen}
        onClose={closeGlance}
        showKeys={showKeys}
      />

      {panelTopic ? (
        <TopicModal
          open={!!activeTopic}
          shrinking={shrinking && !!modalId}
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
                  onClick={() => void travelStrand(1)}
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
