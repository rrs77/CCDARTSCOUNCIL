import { animate, motion, useMotionValue } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { DetailModal } from "@/components/DetailModal";
import { LogoMark } from "@/components/LogoMark";
import { PresentChrome } from "@/components/PresentChrome";
import { SectionFrame } from "@/components/SectionFrame";
import { meta } from "@/content/facts.content";
import { getFrame, presentationFromMarkdown, type FrameNode } from "@/content/layoutPresentation";
import rawContent from "../CONTENT.md?raw";

const EASE_OUT: [number, number, number, number] = [0.4, 0, 0.2, 1];
const MOVE_MS = 0.55;
const ZOOM_IN = 1.2;
const ZOOM_OUT = 1 / ZOOM_IN;
const VIEW_PAD = 48;
const STORAGE_KEY = "ccd-facts-location";

function useViewport() {
  const [size, setSize] = useState({ w: 1280, h: 800 });
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

function isZoomInKey(e: KeyboardEvent) {
  return e.key === "+" || e.key === "=" || e.code === "Equal" || e.code === "NumpadAdd";
}
function isZoomOutKey(e: KeyboardEvent) {
  return e.key === "-" || e.key === "_" || e.code === "Minus" || e.code === "NumpadSubtract";
}

function isTypingTarget() {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const t = el.tagName;
  return t === "INPUT" || t === "TEXTAREA" || el.getAttribute("role") === "textbox";
}

/**
 * Navigation:
 * - Click canvas item → large detail modal
 * - Next / Prev → close modal, show that stop on the canvas (fitted, ≥48px pad), do not auto-open modal
 * - Overview / Escape → full world overview
 */
export default function App() {
  const presentation = useMemo(() => presentationFromMarkdown(rawContent), []);
  const { w, h } = useViewport();
  const reduced = useReducedMotion();

  const [modalId, setModalId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [pathIndex, setPathIndex] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<"overview" | "frame">("overview");

  const pathIndexRef = useRef(0);
  const overviewScaleRef = useRef(0.2);
  const idleTimer = useRef<number | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const scaleMv = useMotionValue(0.2);
  const xMv = useMotionValue(0);
  const yMv = useMotionValue(0);
  const scaleRef = useRef(0.2);
  const xRef = useRef(0);
  const yRef = useRef(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; camX: number; camY: number } | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const syncRefs = useCallback(() => {
    scaleRef.current = scaleMv.get();
    xRef.current = xMv.get();
    yRef.current = yMv.get();
  }, [scaleMv, xMv, yMv]);

  const setCamera = useCallback(
    (scale: number, x: number, y: number, animated: boolean) => {
      const minS = overviewScaleRef.current * 0.55;
      const maxS = overviewScaleRef.current * 16;
      const s = clamp(scale, minS, maxS);
      const dur = !animated || reduced ? 0.01 : MOVE_MS;
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
    const padX = Math.max(VIEW_PAD, 56);
    const padTop = Math.max(VIEW_PAD, 80);
    const padBottom = Math.max(VIEW_PAD, 100);
    const s = Math.min(
      (w - padX * 2) / presentation.world.width,
      (h - padTop - padBottom) / presentation.world.height,
    );
    overviewScaleRef.current = s;
    const cx = presentation.world.width / 2;
    const cy = presentation.world.height / 2;
    return { s, x: -cx * s, y: -cy * s };
  }, [h, presentation.world.height, presentation.world.width, w]);

  /** Fit one frame with ≥48px viewport padding — never crop headings. */
  const cameraForFrame = useCallback(
    (frame: FrameNode) => {
      const pad = VIEW_PAD;
      const chromeBottom = 96;
      const chromeTop = 72;
      const availW = w - pad * 2;
      const availH = h - pad * 2 - chromeBottom - chromeTop;
      const s = Math.min(availW / frame.w, availH / frame.h);
      const cx = frame.x + frame.w / 2;
      const cy = frame.y + frame.h / 2;
      return {
        s,
        x: -cx * s,
        y: -cy * s + (chromeTop - chromeBottom) / 8,
      };
    },
    [h, w],
  );

  /**
   * Canvas stop for a path id: hubs are fitted directly; leaves fit their
   * parent hub (one ring) with the child satellite emphasised — never two
   * overlapping rings through the same heading.
   */
  const resolveCanvasTarget = useCallback(
    (id: string | null): { frame: FrameNode | null; childId: string | null } => {
      if (!id || id === "overview") return { frame: null, childId: null };
      const frame = getFrame(presentation, id);
      if (!frame) return { frame: null, childId: null };
      if (frame.parentId) {
        const parent = getFrame(presentation, frame.parentId);
        return { frame: parent ?? frame, childId: frame.id };
      }
      return { frame, childId: null };
    },
    [presentation],
  );

  const showOverview = useCallback(
    (animated: boolean) => {
      const base = fitOverview();
      setCamera(base.s, base.x, base.y, animated);
      setViewMode("overview");
      setHighlightId(null);
    },
    [fitOverview, setCamera],
  );

  const [activeChildId, setActiveChildId] = useState<string | null>(null);

  const persist = useCallback((id: string | null, idx: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, idx }));
    } catch {
      /* ignore */
    }
  }, []);

  const writeUrl = useCallback((id: string | null) => {
    const url = new URL(window.location.href);
    if (!id) {
      url.hash = "";
      url.searchParams.delete("section");
    } else {
      url.hash = `#/${id}`;
      url.searchParams.set("section", id);
    }
    window.history.pushState({ section: id }, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const syncPathToId = useCallback(
    (id: string | null) => {
      if (!id) {
        pathIndexRef.current = 0;
        setPathIndex(0);
        return;
      }
      const found = presentation.path.indexOf(id);
      if (found >= 0) {
        pathIndexRef.current = found;
        setPathIndex(found);
      }
    },
    [presentation.path],
  );

  const syncPathToOverviewEnd = useCallback(() => {
    const idx = presentation.path.lastIndexOf("overview");
    pathIndexRef.current = Math.max(0, idx);
    setPathIndex(pathIndexRef.current);
  }, [presentation.path]);

  /** Click → open detail modal. Canvas stays on that stop (fitted). */
  const openDetail = useCallback(
    (id: string) => {
      setModalId(id);
      const { frame, childId } = resolveCanvasTarget(id);
      setActiveChildId(childId ?? (frame?.id === id ? null : id));
      if (frame) {
        const cam = cameraForFrame(frame);
        setCamera(cam.s, cam.x, cam.y, true);
        setViewMode("frame");
        setHighlightId(frame.id);
      }
      syncPathToId(id);
      persist(id, pathIndexRef.current);
      writeUrl(id);
    },
    [cameraForFrame, persist, resolveCanvasTarget, setCamera, syncPathToId, writeUrl],
  );

  /** Close modal; stay on canvas stop (or overview). */
  const closeModal = useCallback(
    (toOverview = false) => {
      setModalId(null);
      if (toOverview) {
        setActiveChildId(null);
        showOverview(true);
        syncPathToOverviewEnd();
        persist(null, pathIndexRef.current);
        writeUrl(null);
      }
    },
    [persist, showOverview, syncPathToOverviewEnd, writeUrl],
  );

  /**
   * Next / Prev: dismiss modal → full overview, highlight next stop’s hub
   * (and its satellite if the stop is a leaf). Never auto-open the modal.
   */
  const stepPath = useCallback(
    (delta: 1 | -1) => {
      const path = presentation.path;
      let i = pathIndexRef.current + delta;
      if (i < 0) i = 0;
      if (i >= path.length) i = path.length - 1;
      pathIndexRef.current = i;
      setPathIndex(i);
      const id = path[i]!;
      setModalId(null);

      const base = fitOverview();
      setCamera(base.s, base.x, base.y, true);
      setViewMode("overview");

      if (id === "overview") {
        setActiveChildId(null);
        setHighlightId(null);
        persist(null, i);
        writeUrl(null);
        return;
      }

      const { frame, childId } = resolveCanvasTarget(id);
      setActiveChildId(childId);
      setHighlightId(frame?.id ?? null);
      persist(id, i);
      writeUrl(id);

      // Ease overview toward the highlighted hub so the next stop is obvious,
      // still at overview scale (readable map, not a cropped close-up).
      if (frame) {
        const cx = frame.x + frame.w / 2;
        const cy = frame.y + frame.h / 2;
        const bx = (base.x + -cx * base.s) / 2;
        const by = (base.y + -cy * base.s) / 2;
        setCamera(base.s, bx, by, true);
      }
    },
    [fitOverview, persist, presentation.path, resolveCanvasTarget, setCamera, writeUrl],
  );

  const goHome = useCallback(() => {
    pathIndexRef.current = Math.max(1, presentation.path.indexOf("title"));
    setPathIndex(pathIndexRef.current);
    setModalId(null);
    setActiveChildId(null);
    const title = getFrame(presentation, "title");
    if (title) {
      const cam = cameraForFrame(title);
      setCamera(cam.s, cam.x, cam.y, true);
      setViewMode("frame");
      setHighlightId("title");
      persist("title", pathIndexRef.current);
      writeUrl("title");
    } else {
      showOverview(true);
    }
  }, [cameraForFrame, persist, presentation, setCamera, showOverview, writeUrl]);

  // Boot
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace(/^#\/?/, "");
    const fromUrl = params.get("section") || hash || null;
    fitOverview();
    if (fromUrl && getFrame(presentation, fromUrl)) {
      pathIndexRef.current = Math.max(0, presentation.path.indexOf(fromUrl));
      setPathIndex(pathIndexRef.current);
      const { frame, childId } = resolveCanvasTarget(fromUrl);
      setActiveChildId(childId);
      setModalId(null);
      if (frame) {
        const cam = cameraForFrame(frame);
        setCamera(cam.s, cam.x, cam.y, false);
        setViewMode("frame");
        setHighlightId(frame.id);
      } else {
        showOverview(false);
      }
    } else {
      showOverview(false);
    }
    stageRef.current?.focus({ preventScroll: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.replace(/^#\/?/, "");
      const id = params.get("section") || hash || null;
      setModalId(null);
      if (id && getFrame(presentation, id)) {
        const found = presentation.path.indexOf(id);
        if (found >= 0) {
          pathIndexRef.current = found;
          setPathIndex(found);
        }
        const { frame, childId } = resolveCanvasTarget(id);
        setActiveChildId(childId);
        if (frame) {
          const cam = cameraForFrame(frame);
          setCamera(cam.s, cam.x, cam.y, true);
          setViewMode("frame");
          setHighlightId(frame.id);
        }
      } else {
        setActiveChildId(null);
        showOverview(true);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [cameraForFrame, presentation, resolveCanvasTarget, setCamera, showOverview]);

  useEffect(() => {
    if (viewMode === "overview") {
      const base = fitOverview();
      setCamera(base.s, base.x, base.y, false);
    } else if (highlightId) {
      const frame = getFrame(presentation, highlightId);
      if (frame) {
        const cam = cameraForFrame(frame);
        setCamera(cam.s, cam.x, cam.y, false);
      }
    }
  }, [w, h]); // eslint-disable-line react-hooks/exhaustive-deps

  const bumpChrome = useCallback(() => {
    setChromeVisible(true);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setChromeVisible(false), 3200);
  }, []);

  useEffect(() => {
    bumpChrome();
    const onMove = () => bumpChrome();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("keydown", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onMove);
    };
  }, [bumpChrome]);

  const zoomAt = useCallback(
    (clientX: number, clientY: number, nextScale: number) => {
      syncRefs();
      const prev = scaleRef.current;
      const minS = overviewScaleRef.current * 0.55;
      const maxS = overviewScaleRef.current * 16;
      const s = clamp(nextScale, minS, maxS);
      const rectX = clientX - w / 2;
      const rectY = clientY - h / 2;
      const worldX = (rectX - xRef.current) / prev;
      const worldY = (rectY - yRef.current) / prev;
      setCamera(s, rectX - worldX * s, rectY - worldY * s, false);
    },
    [h, setCamera, syncRefs, w],
  );

  const zoomByStep = useCallback(
    (dir: "in" | "out") => {
      zoomAt(w / 2, h / 2, scaleRef.current * (dir === "in" ? ZOOM_IN : ZOOM_OUT));
    },
    [h, w, zoomAt],
  );

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (modalId) return;
      e.preventDefault();
      bumpChrome();
      syncRefs();
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > Math.abs(e.deltaX) * 2) {
        zoomAt(e.clientX, e.clientY, scaleRef.current * Math.exp(-e.deltaY * 0.0018));
        return;
      }
      setCamera(scaleRef.current, xRef.current - e.deltaX, yRef.current - e.deltaY, false);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [bumpChrome, modalId, setCamera, syncRefs, zoomAt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget()) return;
      bumpChrome();
      if (isZoomInKey(e)) {
        e.preventDefault();
        zoomByStep("in");
        return;
      }
      if (isZoomOutKey(e)) {
        e.preventDefault();
        zoomByStep("out");
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (document.fullscreenElement) {
          void document.exitFullscreen();
          return;
        }
        if (modalId) {
          closeModal(false);
          return;
        }
        setActiveChildId(null);
        showOverview(true);
        syncPathToOverviewEnd();
        persist(null, pathIndexRef.current);
        writeUrl(null);
        return;
      }
      if (e.key === " " || e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        stepPath(1);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        stepPath(-1);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        goHome();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [
    bumpChrome,
    closeModal,
    goHome,
    modalId,
    persist,
    showOverview,
    stepPath,
    syncPathToOverviewEnd,
    writeUrl,
    zoomByStep,
  ]);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (modalId) return;
    bumpChrome();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    swipeStart.current = { x: e.clientX, y: e.clientY };
    syncRefs();
    if (pointers.current.size === 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, camX: xRef.current, camY: yRef.current };
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
    if (modalId) return;
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      zoomAt(midX, midY, pinchStart.current.scale * (dist / Math.max(1, pinchStart.current.dist)));
      return;
    }
    if (dragStart.current && pointers.current.size === 1) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setCamera(scaleRef.current, dragStart.current.camX + dx, dragStart.current.camY + dy, false);
    }
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    if (modalId) {
      pointers.current.clear();
      return;
    }
    const start = swipeStart.current;
    swipeStart.current = null;
    if (start && pointers.current.size <= 1) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) > 72 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        stepPath(dx < 0 ? 1 : -1);
      }
    }
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragStart.current = null;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      void document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const strandPath = useMemo(() => {
    const mains = presentation.frames.filter((f) => !f.parentId);
    if (mains.length < 2) return "";
    const pts = mains.map((f) => ({ x: f.x + f.w / 2, y: f.y + f.h / 2 }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!;
      const b = pts[i]!;
      d += ` C ${a.x + (b.x - a.x) * 0.4} ${a.y}, ${b.x - (b.x - a.x) * 0.4} ${b.y}, ${b.x} ${b.y}`;
    }
    return d;
  }, [presentation.frames]);

  const modalFrame = modalId ? getFrame(presentation, modalId) ?? null : null;

  // Only root hubs on canvas — one ring each. Leaves open via satellites / modal.
  const visibleFrames = presentation.frames.filter((f) => !f.parentId);

  return (
    <div className="facts-app">
      <header className={`topbar ${chromeVisible ? "is-visible" : "is-dim"}`}>
        <div className="flex items-center gap-2.5">
          <LogoMark size={w < 640 ? 34 : 40} />
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
        <a className="chip-home" href="/">
          Site home
        </a>
      </header>

      <div
        ref={stageRef}
        className="canvas-stage"
        tabIndex={0}
        aria-label={presentation.title}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <motion.div className="canvas-world" style={{ scale: scaleMv, x: xMv, y: yMv }}>
          <div
            className="overview-picture prezi-world"
            style={{ width: presentation.world.width, height: presentation.world.height }}
          >
            <div className="prezi-world-wash" aria-hidden />
            <svg
              className="overview-path"
              width={presentation.world.width}
              height={presentation.world.height}
              aria-hidden
            >
              <path
                d={strandPath}
                fill="none"
                stroke="rgba(182,255,126,0.28)"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </svg>

            {visibleFrames.map((frame) => (
              <SectionFrame
                key={frame.id}
                frame={frame}
                presentation={presentation}
                highlighted={highlightId === frame.id}
                activeChildId={highlightId === frame.id ? activeChildId : null}
                onOpen={() => openDetail(frame.id)}
                onOpenChild={(id) => openDetail(id)}
              />
            ))}
          </div>
        </motion.div>
      </div>

      <PresentChrome
        presentation={presentation}
        focusId={activeChildId ?? highlightId}
        pathIndex={pathIndex}
        chromeVisible={chromeVisible}
        fullscreen={fullscreen}
        onOverview={() => {
          setModalId(null);
          setActiveChildId(null);
          showOverview(true);
          syncPathToOverviewEnd();
          persist(null, pathIndexRef.current);
          writeUrl(null);
        }}
        onHome={goHome}
        onPrev={() => stepPath(-1)}
        onNext={() => stepPath(1)}
        onResume={() => {
          if (activeChildId) openDetail(activeChildId);
          else if (highlightId) openDetail(highlightId);
          else goHome();
        }}
        onZoomIn={() => zoomByStep("in")}
        onZoomOut={() => zoomByStep("out")}
        onToggleFullscreen={toggleFullscreen}
        onJump={(id) => {
          setModalId(null);
          const found = presentation.path.indexOf(id);
          if (found >= 0) {
            pathIndexRef.current = found;
            setPathIndex(found);
          }
          const { frame, childId } = resolveCanvasTarget(id);
          setActiveChildId(childId);
          if (frame) {
            const cam = cameraForFrame(frame);
            setCamera(cam.s, cam.x, cam.y, true);
            setViewMode("frame");
            setHighlightId(frame.id);
            persist(id, pathIndexRef.current);
            writeUrl(id);
          }
        }}
      />

      <DetailModal
        frame={modalFrame}
        open={!!modalId && !!modalFrame}
        onClose={() => closeModal(false)}
      />
    </div>
  );
}
