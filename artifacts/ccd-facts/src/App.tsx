import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DetailModal } from "@/components/DetailModal";
import { LogoMark } from "@/components/LogoMark";
import { PresentChrome } from "@/components/PresentChrome";
import { SectionScene } from "@/components/SectionScene";
import { StagePathway } from "@/components/StagePathway";
import { meta } from "@/content/facts.content";
import { getFrame, presentationFromMarkdown, type FrameNode } from "@/content/layoutPresentation";
import { STAGE_ORDER } from "@/content/stackLabels";
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
 * Click a zone → detail modal. Next / Prev → overview.
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

  /** Click zone / Map → large detail modal; pathway stays underneath. */
  const openDetail = useCallback(
    (id: string) => {
      const frame = getFrame(presentation, id);
      if (!frame) {
        showOverview();
        return;
      }
      if (frame.kind === "title") {
        setFocusedId("title");
        setViewMode("frame");
        setModalId("title");
        persist("title");
        writeUrl("title");
        return;
      }
      setFocusedId(id);
      setViewMode("overview");
      setModalId(id);
      persist(id);
      writeUrl(id);
    },
    [persist, presentation, showOverview, writeUrl],
  );

  // Boot — title slide, then Overview is the stage pathway
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace(/^#\/?/, "");
    const fromUrl = params.get("section") || hash || null;
    if (fromUrl === "title" || !fromUrl) {
      openTitle();
    } else if (getFrame(presentation, fromUrl)) {
      openDetail(fromUrl);
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
      else if (getFrame(presentation, id)) openDetail(id);
      else showOverview();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [openDetail, openTitle, presentation, showOverview]);

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

  /** Next / Prev → overview (never walk postage stamps). */
  const goOverview = useCallback(() => {
    setModalId(null);
    showOverview();
  }, [showOverview]);

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
          showOverview();
          return;
        }
        if (viewMode === "frame") {
          showOverview();
          return;
        }
        return;
      }
      if (
        e.key === " " ||
        e.key === "ArrowRight" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowUp"
      ) {
        e.preventDefault();
        goOverview();
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        openTitle();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [bumpChrome, goOverview, modalId, openTitle, showOverview, viewMode]);

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

  const titleFrame = getFrame(presentation, "title") ?? null;
  const modalFrame = modalId ? getFrame(presentation, modalId) ?? null : null;

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
          <StagePathway stages={stages} onOpen={openDetail} />
        ) : titleFrame ? (
          <SectionScene
            frame={titleFrame}
            presentation={presentation}
            reduced={reduced}
            canPrev={false}
            canNext
            onPrev={goOverview}
            onNext={goOverview}
            onSelect={() => openDetail("title")}
            onOpenDetail={() => openDetail("title")}
          />
        ) : null}
      </div>

      <PresentChrome
        presentation={presentation}
        focusId={modalId ?? (viewMode === "overview" ? null : focusedId)}
        chromeVisible={chromeVisible}
        fullscreen={fullscreen}
        onOverview={goOverview}
        onToggleFullscreen={toggleFullscreen}
        onJump={(id) => openDetail(id)}
      />

      <DetailModal
        frame={modalFrame}
        open={!!modalId && !!modalFrame}
        sectionLinks={stages
          .filter((f) => f.id !== modalId)
          .map((f) => ({ id: f.id, title: f.title }))}
        onNavigate={(id) => openDetail(id)}
        onClose={() => {
          setModalId(null);
          showOverview();
        }}
      />
    </div>
  );
}
