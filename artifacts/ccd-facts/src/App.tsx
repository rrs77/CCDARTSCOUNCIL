import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DetailModal } from "@/components/DetailModal";
import { LogoMark } from "@/components/LogoMark";
import { PresentChrome } from "@/components/PresentChrome";
import { SectionScene } from "@/components/SectionScene";
import { StagePathway } from "@/components/StagePathway";
import { meta } from "@/content/facts.content";
import { getFrame, presentationFromMarkdown, type FrameNode } from "@/content/layoutPresentation";
import { STAGE_ORDER, SECTION_PATH } from "@/content/stackLabels";
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
 * Title → key-stage pathway overview.
 * Click a zone → framed section. Info → detail modal.
 */
export default function App() {
  const presentation = useMemo(() => presentationFromMarkdown(rawContent), []);
  const { w } = useViewport();
  const reduced = useReducedMotion();

  const stages = useMemo(() => {
    const byId = new Map(presentation.frames.filter((f) => !f.parentId).map((f) => [f.id, f]));
    const ordered: FrameNode[] = [];
    for (const id of STAGE_ORDER) {
      const f = byId.get(id);
      if (f) ordered.push(f);
    }
    return ordered;
  }, [presentation.frames]);

  const [modalId, setModalId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"overview" | "frame">("frame");
  const [chromeVisible, setChromeVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const idleTimer = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

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
    // Nested leaf (optional tab) → treat as its hub for side-arrow position
    const f = getFrame(presentation, focusedId);
    if (!f?.mainSectionId) return -1;
    return sectionPath.indexOf(f.mainSectionId as (typeof SECTION_PATH)[number]);
  }, [focusedId, presentation, sectionPath]);

  const showOverview = useCallback(() => {
    setModalId(null);
    setViewMode("overview");
    setFocusedId(null);
    persist(null);
    writeUrl(null);
  }, [persist, writeUrl]);

  const openTitle = useCallback(() => {
    setModalId(null);
    setFocusedId("title");
    setViewMode("frame");
    persist("title");
    writeUrl("title");
  }, [persist, writeUrl]);

  /** Framed main section — side arrows step here. */
  const openSection = useCallback(
    (id: string) => {
      const frame = getFrame(presentation, id);
      if (!frame) {
        showOverview();
        return;
      }
      setModalId(null);
      setFocusedId(id);
      setViewMode("frame");
      persist(id);
      writeUrl(id);
    },
    [persist, presentation, showOverview, writeUrl],
  );

  /** Info / optional tab → large detail modal (toggle if same id already open). */
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
      // Keep framed section underneath when possible
      const hubId = frame.parentId ? frame.mainSectionId : frame.id;
      if (viewMode !== "frame" || !focusedId) {
        setFocusedId(hubId === "title" || sectionPath.includes(hubId as (typeof SECTION_PATH)[number]) ? hubId : id);
        setViewMode("frame");
      }
      setModalId(id);
      persist(id);
      writeUrl(id);
    },
    [focusedId, modalId, persist, presentation, sectionPath, showOverview, viewMode, writeUrl],
  );


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
      openSection(sectionPath[next]!);
    },
    [openSection, sectionIndex, sectionPath, showOverview],
  );

  // Boot — title slide, then Overview is the stage pathway
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace(/^#\/?/, "");
    const fromUrl = params.get("section") || hash || null;
    if (fromUrl === "title" || !fromUrl) {
      openTitle();
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
      if (!id || id === "title") openTitle();
      else if (getFrame(presentation, id)) openSection(id);
      else showOverview();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [openSection, openTitle, presentation, showOverview]);

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
        if (viewMode === "frame") goSection(1);
        else showOverview();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (viewMode === "frame") goSection(-1);
        else openTitle();
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        openTitle();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [bumpChrome, goSection, modalId, openTitle, showOverview, viewMode]);

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

  const sceneFrame =
    viewMode === "frame" && focusedId ? getFrame(presentation, focusedId) ?? null : null;
  const modalFrame = modalId ? getFrame(presentation, modalId) ?? null : null;
  const canPrev = sectionIndex > 0;
  const canNext = sectionIndex >= 0 && sectionIndex < sectionPath.length - 1;

  return (
    <div className="facts-app">
      <header className={`topbar ${chromeVisible ? "is-visible" : "is-dim"}`}>
        <div className="topbar-brand">
          <LogoMark size={w < 640 ? 53 : 63} />
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
        className="canvas-stage stack-stage"
        tabIndex={0}
        aria-label={presentation.title}
        onPointerDown={() => bumpChrome()}
      >
        {viewMode === "overview" ? (
          <StagePathway stages={stages} onOpen={openSection} onOpenDetail={openDetail} />
        ) : sceneFrame ? (
          <SectionScene
            frame={sceneFrame}
            presentation={presentation}
            reduced={reduced}
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => goSection(-1)}
            onNext={() => goSection(1)}
            onSelect={() => openDetail(sceneFrame.id)}
            onOpenDetail={() => openDetail(sceneFrame.id)}
            onOpenChild={(id) => openDetail(id)}
          />
        ) : null}
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
        sectionLinks={stages
          .filter((f) => f.id !== modalId)
          .map((f) => ({ id: f.id, title: f.title }))}
        onNavigate={(id) => openDetail(id)}
        onClose={() => setModalId(null)}
      />

    </div>
  );
}
