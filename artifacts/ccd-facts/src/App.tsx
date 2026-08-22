import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DetailModal } from "@/components/DetailModal";
import { LogoMark } from "@/components/LogoMark";
import { PresentChrome } from "@/components/PresentChrome";
import { WorldCanvas } from "@/components/WorldCanvas";
import { meta } from "@/content/facts.content";
import { getFrame, presentationFromMarkdown } from "@/content/layoutPresentation";
import { SECTION_PATH } from "@/content/stackLabels";
import rawContent from "../CONTENT.md?raw";

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

function isTypingTarget() {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const t = el.tagName;
  return t === "INPUT" || t === "TEXTAREA" || el.getAttribute("role") === "textbox";
}

/**
 * One connected canvas. Overview fits the path; arrows / Map travel with camera zoom.
 * Info opens the large detail modal (toggle close). Content meaning unchanged.
 */
export default function App() {
  const presentation = useMemo(() => presentationFromMarkdown(rawContent), []);
  const viewport = useViewport();
  const reduced = useReducedMotion();

  const sectionLinks = useMemo(() => {
    return SECTION_PATH.map((id) => getFrame(presentation, id))
      .filter(Boolean)
      .map((f) => ({ id: f!.id, title: f!.title }));
  }, [presentation]);

  const [modalId, setModalId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"overview" | "frame">("overview");
  const [chromeVisible, setChromeVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const idleTimer = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const overviewStride = useRef(0);

  const persist = useCallback((id: string | null) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id }));
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

  const sectionPath = useMemo(() => {
    return SECTION_PATH.filter((id) => !!getFrame(presentation, id));
  }, [presentation]);

  const sectionIndex = useMemo(() => {
    if (!focusedId) return -1;
    const exact = sectionPath.indexOf(focusedId as (typeof SECTION_PATH)[number]);
    if (exact >= 0) return exact;
    const f = getFrame(presentation, focusedId);
    if (!f?.mainSectionId) return -1;
    return sectionPath.indexOf(f.mainSectionId as (typeof SECTION_PATH)[number]);
  }, [focusedId, presentation, sectionPath]);

  const showOverview = useCallback(() => {
    setModalId(null);
    setViewMode("overview");
    setFocusedId(null);
    overviewStride.current = 0;
    persist(null);
    writeUrl(null);
  }, [persist, writeUrl]);

  const openSection = useCallback(
    (id: string) => {
      const frame = getFrame(presentation, id);
      if (!frame) {
        showOverview();
        return;
      }
      const hubId = frame.parentId ? frame.mainSectionId : frame.id;
      setModalId(null);
      setFocusedId(hubId);
      setViewMode("frame");
      persist(hubId);
      writeUrl(hubId);
    },
    [persist, presentation, showOverview, writeUrl],
  );

  const openDetail = useCallback(
    (id: string) => {
      if (modalId === id) {
        setModalId(null);
        return;
      }
      const frame = getFrame(presentation, id);
      if (!frame) {
        showOverview();
        return;
      }
      const hubId = frame.parentId ? frame.mainSectionId : frame.id;
      if (viewMode !== "frame" || focusedId !== hubId) {
        setFocusedId(hubId);
        setViewMode("frame");
      }
      setModalId(id);
      persist(id);
      writeUrl(id);
    },
    [focusedId, modalId, persist, presentation, showOverview, viewMode, writeUrl],
  );

  const overviewTimer = useRef<number | null>(null);

  const goSection = useCallback(
    (delta: number) => {
      if (!sectionPath.length) {
        showOverview();
        return;
      }
      const i = sectionIndex < 0 ? 0 : sectionIndex;
      const next = i + delta;
      if (next < 0 || next >= sectionPath.length) {
        showOverview();
        return;
      }
      overviewStride.current += 1;
      if (overviewTimer.current) window.clearTimeout(overviewTimer.current);
      // Every few hops, briefly show how places connect
      if (overviewStride.current > 0 && overviewStride.current % 4 === 0) {
        setModalId(null);
        setViewMode("overview");
        setFocusedId(null);
        overviewTimer.current = window.setTimeout(() => {
          openSection(sectionPath[next]!);
        }, reduced ? 80 : 900);
        return;
      }
      openSection(sectionPath[next]!);
    },
    [openSection, reduced, sectionIndex, sectionPath, showOverview],
  );

  useEffect(
    () => () => {
      if (overviewTimer.current) window.clearTimeout(overviewTimer.current);
    },
    [],
  );

  // Boot — overview of the full canvas unless a deep link is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace(/^#\/?/, "");
    const fromUrl = params.get("section") || hash || null;
    if (!fromUrl || fromUrl === "overview") {
      showOverview();
    } else if (getFrame(presentation, fromUrl)) {
      openSection(fromUrl);
    } else {
      showOverview();
    }
    stageRef.current?.focus({ preventScroll: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.replace(/^#\/?/, "");
      const id = params.get("section") || hash || null;
      if (!id || id === "overview") showOverview();
      else if (getFrame(presentation, id)) openSection(id);
      else showOverview();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [openSection, presentation, showOverview]);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget()) return;
      bumpChrome();
      if (e.key === "Escape") {
        e.preventDefault();
        if (document.fullscreenElement) {
          void document.exitFullscreen();
          return;
        }
        if (modalId) {
          setModalId(null);
          return;
        }
        if (viewMode === "frame") {
          showOverview();
          return;
        }
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        if (viewMode === "overview") {
          const first = sectionPath[0];
          if (first) openSection(first);
        } else {
          goSection(1);
        }
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (viewMode === "overview") return;
        goSection(-1);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        showOverview();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [bumpChrome, goSection, modalId, openSection, sectionPath, showOverview, viewMode]);

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

  const modalFrame = modalId ? getFrame(presentation, modalId) ?? null : null;
  const canPrev = sectionIndex > 0;
  const canNext = sectionIndex >= 0 && sectionIndex < sectionPath.length - 1;

  return (
    <div className={`facts-app${modalId ? " is-detail-open" : ""}`}>
      <header className={`topbar ${chromeVisible ? "is-visible" : "is-dim"}`}>
        <div className="topbar-brand">
          <LogoMark size={viewport.w < 640 ? 53 : 63} />
          <div className="topbar-brand-text">
            <div className="topbar-brand-name">{meta.brand}</div>
            <div className="topbar-brand-title">
              {meta.experienceLead}{" "}
              <span className="topbar-brand-accent">{meta.experienceAccent}</span>
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
        onPointerDown={() => bumpChrome()}
      >
        <WorldCanvas
          presentation={presentation}
          focusedId={focusedId}
          viewMode={viewMode}
          reduced={reduced}
          canPrev={canPrev}
          canNext={canNext}
          viewport={viewport}
          onOverview={showOverview}
          onFocus={openSection}
          onOpenDetail={openDetail}
          onOpenChild={openDetail}
          onPrev={() => goSection(-1)}
          onNext={() => goSection(1)}
        />
      </div>

      <PresentChrome
        presentation={presentation}
        focusId={modalId ?? (viewMode === "overview" ? null : focusedId)}
        chromeVisible={chromeVisible}
        fullscreen={fullscreen}
        onOverview={showOverview}
        onToggleFullscreen={toggleFullscreen}
        onJump={(id) => openSection(id)}
      />

      <DetailModal
        frame={modalFrame}
        open={!!modalId && !!modalFrame}
        sectionLinks={sectionLinks.filter((s) => s.id !== modalId)}
        onNavigate={(id) => openDetail(id)}
        onClose={() => setModalId(null)}
      />
    </div>
  );
}
