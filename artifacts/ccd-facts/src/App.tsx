import { animate, motion, useMotionValue } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { LogoMark } from "@/components/LogoMark";
import { PresentChrome } from "@/components/PresentChrome";
import { SectionFrame } from "@/components/SectionFrame";
import { meta } from "@/content/facts.content";
import { getFrame, presentationFromMarkdown } from "@/content/layoutPresentation";
import rawContent from "../CONTENT.md?raw";

/** Prezi-like swift ease — cubic-bezier(.4, 0, .2, 1) */
const EASE_OUT: [number, number, number, number] = [0.4, 0, 0.2, 1];
const MOVE_MS = 0.62;
const ZOOM_IN = 1.2;
const ZOOM_OUT = 1 / ZOOM_IN;
/** Leave room so a piece of the parent stays visible when entering a child */
const FRAME_FIT = 0.72;
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

export default function App() {
  const presentation = useMemo(() => presentationFromMarkdown(rawContent), []);
  const { w, h } = useViewport();
  const reduced = useReducedMotion();

  const [focusId, setFocusId] = useState<string | null>(null);
  const [pathIndex, setPathIndex] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const focusIdRef = useRef<string | null>(null);
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
      const minS = overviewScaleRef.current * 0.7;
      const maxS = overviewScaleRef.current * 14;
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
    const padX = 56;
    const padTop = 80;
    const padBottom = 100;
    const s = Math.min(
      (w - padX * 2) / presentation.world.width,
      (h - padTop - padBottom) / presentation.world.height,
    );
    overviewScaleRef.current = s;
    const cx = presentation.world.width / 2;
    const cy = presentation.world.height / 2;
    return { s, x: -cx * s, y: -cy * s };
  }, [h, presentation.world.height, presentation.world.width, w]);

  const cameraForFrameId = useCallback(
    (id: string) => {
      const frame = getFrame(presentation, id);
      if (!frame) return fitOverview();
      const padTop = 48;
      const padBottom = 88;
      const availW = w * FRAME_FIT;
      const availH = (h - padTop - padBottom) * FRAME_FIT;
      let s = Math.min(availW / frame.w, availH / frame.h);
      // Bias toward right-of-centre content; keep a sliver of parent when nested
      let cx = frame.x + frame.w * 0.58;
      let cy = frame.y + frame.h * 0.55;
      if (frame.parentId) {
        const parent = getFrame(presentation, frame.parentId);
        if (parent) {
          // Pull camera slightly toward parent so a piece stays in view
          const pcx = parent.x + parent.w * 0.45;
          const pcy = parent.y + parent.h * 0.5;
          cx = cx * 0.82 + pcx * 0.18;
          cy = cy * 0.82 + pcy * 0.18;
          s *= 0.92;
        }
      }
      return { s, x: -cx * s, y: -cy * s + (padTop - padBottom) / 14 };
    },
    [fitOverview, h, presentation, w],
  );

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

  const goOverview = useCallback(
    (animated = true) => {
      const { s, x, y } = fitOverview();
      setCamera(s, x, y, animated);
      focusIdRef.current = null;
      setFocusId(null);
      const idx = presentation.path.lastIndexOf("overview");
      pathIndexRef.current = Math.max(0, idx);
      setPathIndex(pathIndexRef.current);
      persist(null, pathIndexRef.current);
      writeUrl(null);
    },
    [fitOverview, persist, presentation.path, setCamera, writeUrl],
  );

  const openFrame = useCallback(
    (id: string, animated = true, pathIdx?: number) => {
      const cam = cameraForFrameId(id);
      setCamera(cam.s, cam.x, cam.y, animated);
      focusIdRef.current = id;
      setFocusId(id);
      let idx = pathIdx;
      if (idx == null) {
        const found = presentation.path.indexOf(id);
        idx = found >= 0 ? found : pathIndexRef.current;
      }
      pathIndexRef.current = idx;
      setPathIndex(idx);
      persist(id, idx);
      writeUrl(id);
    },
    [cameraForFrameId, persist, presentation.path, setCamera, writeUrl],
  );

  const goPath = useCallback(
    (delta: 1 | -1) => {
      const path = presentation.path;
      let i = pathIndexRef.current + delta;
      if (i < 0) i = 0;
      if (i >= path.length) i = path.length - 1;
      const id = path[i];
      pathIndexRef.current = i;
      setPathIndex(i);
      if (id === "overview") goOverview(true);
      else openFrame(id, true, i);
    },
    [goOverview, openFrame, presentation.path],
  );

  const goHome = useCallback(() => {
    pathIndexRef.current = 1;
    setPathIndex(1);
    openFrame("title", true, 1);
  }, [openFrame]);

  const resume = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        goHome();
        return;
      }
      const saved = JSON.parse(raw) as { id: string | null; idx: number };
      if (saved.id) openFrame(saved.id, true, saved.idx);
      else goOverview(true);
    } catch {
      goHome();
    }
  }, [goHome, goOverview, openFrame]);

  // Boot
  useEffect(() => {
    fitOverview();
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace(/^#\/?/, "");
    const fromUrl = params.get("section") || hash || null;

    const savedRaw = localStorage.getItem(STORAGE_KEY);
    let saved: { id: string | null; idx: number } | null = null;
    try {
      saved = savedRaw ? JSON.parse(savedRaw) : null;
    } catch {
      saved = null;
    }

    if (fromUrl && getFrame(presentation, fromUrl)) {
      openFrame(fromUrl, false);
    } else if (saved?.id && getFrame(presentation, saved.id)) {
      // Offer resume via chrome; start at overview then user can Resume — or auto-resume
      openFrame(saved.id, false, saved.idx);
    } else {
      goOverview(false);
    }
    stageRef.current?.focus({ preventScroll: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.replace(/^#\/?/, "");
      const id = params.get("section") || hash || null;
      if (id && getFrame(presentation, id)) openFrame(id, true);
      else goOverview(true);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [goOverview, openFrame, presentation]);

  useEffect(() => {
    fitOverview();
    if (focusIdRef.current) {
      const cam = cameraForFrameId(focusIdRef.current);
      setCamera(cam.s, cam.x, cam.y, false);
    } else {
      const { s, x, y } = fitOverview();
      setCamera(s, x, y, false);
    }
  }, [w, h, cameraForFrameId, fitOverview, setCamera]);

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
      const minS = overviewScaleRef.current * 0.7;
      const maxS = overviewScaleRef.current * 14;
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
      const frame = focusIdRef.current ? getFrame(presentation, focusIdRef.current) : null;
      let cx = w / 2;
      let cy = h / 2;
      if (frame) {
        syncRefs();
        const fx = frame.x + frame.w / 2;
        const fy = frame.y + frame.h / 2;
        cx = w / 2 + xRef.current + fx * scaleRef.current;
        cy = h / 2 + yRef.current + fy * scaleRef.current;
      }
      zoomAt(cx, cy, scaleRef.current * (dir === "in" ? ZOOM_IN : ZOOM_OUT));
    },
    [h, presentation, syncRefs, w, zoomAt],
  );

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
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
  }, [bumpChrome, setCamera, syncRefs, zoomAt]);

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
        if (focusIdRef.current) {
          const frame = getFrame(presentation, focusIdRef.current);
          if (frame?.parentId) openFrame(frame.parentId, true);
          else goOverview(true);
        } else goOverview(true);
        return;
      }
      if (e.key === " " || e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goPath(1);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPath(-1);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        goHome();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [bumpChrome, goHome, goOverview, goPath, openFrame, presentation, zoomByStep]);

  const onPointerDown = (e: ReactPointerEvent) => {
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
    const start = swipeStart.current;
    swipeStart.current = null;
    if (start && pointers.current.size <= 1) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) > 72 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        // swipe left = forward; swipe right = back
        goPath(dx < 0 ? 1 : -1);
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
    const mains = presentation.frames.filter((f) => f.level <= 2);
    if (mains.length < 2) return "";
    const pts = mains.map((f) => ({ x: f.x + f.w / 2, y: f.y + f.h / 2 }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      d += ` C ${a.x + (b.x - a.x) * 0.4} ${a.y}, ${b.x - (b.x - a.x) * 0.4} ${b.y}, ${b.x} ${b.y}`;
    }
    return d;
  }, [presentation.frames]);

  const isOverview = focusId === null;

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

            {presentation.frames
              .filter((frame) => {
                if (isOverview) return !frame.parentId;
                if (!focusId) return !frame.parentId;
                const focus = getFrame(presentation, focusId);
                if (!focus) return !frame.parentId;
                if (!frame.parentId) return true; // always keep hubs for parent peek
                const hubId = focus.parentId ?? focus.id;
                return frame.parentId === hubId || frame.id === focusId;
              })
              .map((frame) => (
                <SectionFrame
                  key={frame.id}
                  frame={frame}
                  active={focusId === frame.id}
                  overview={isOverview}
                  onOpen={() => openFrame(frame.id)}
                />
              ))}
          </div>
        </motion.div>
      </div>

      <PresentChrome
        presentation={presentation}
        focusId={focusId}
        pathIndex={pathIndex}
        chromeVisible={chromeVisible}
        fullscreen={fullscreen}
        onOverview={() => goOverview(true)}
        onHome={goHome}
        onPrev={() => goPath(-1)}
        onNext={() => goPath(1)}
        onResume={resume}
        onZoomIn={() => zoomByStep("in")}
        onZoomOut={() => zoomByStep("out")}
        onToggleFullscreen={toggleFullscreen}
        onJump={(id) => openFrame(id)}
      />
    </div>
  );
}
