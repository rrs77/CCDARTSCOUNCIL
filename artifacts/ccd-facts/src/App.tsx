import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DetailModal } from "@/components/DetailModal";
import { LogoMark } from "@/components/LogoMark";
import { PresentChrome } from "@/components/PresentChrome";
import { SectionScene } from "@/components/SectionScene";
import { StackOverview } from "@/components/StackOverview";
import { meta } from "@/content/facts.content";
import { getFrame, presentationFromMarkdown, type FrameNode } from "@/content/layoutPresentation";
import { STACK_ORDER } from "@/content/stackLabels";
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
 * Stack overview → open section scene → eye / second click opens large modal.
 * Lime side arrows: stack cycles cards; open section steps sections.
 * Overview returns to the stack. No flowchart.
 */
export default function App() {
  const presentation = useMemo(() => presentationFromMarkdown(rawContent), []);
  const { w } = useViewport();
  const reduced = useReducedMotion();

  const sections = useMemo(() => {
    const byId = new Map(presentation.frames.filter((f) => !f.parentId).map((f) => [f.id, f]));
    const ordered: FrameNode[] = [];
    for (const id of STACK_ORDER) {
      const f = byId.get(id);
      if (f) ordered.push(f);
    }
    for (const f of presentation.frames) {
      if (!f.parentId && f.kind !== "title" && !ordered.some((o) => o.id === f.id)) {
        ordered.push(f);
      }
    }
    return ordered;
  }, [presentation.frames]);

  /** Arrow path: title → content sections (Overview is the separate stack). */
  const story = useMemo(() => {
    const title = getFrame(presentation, "title");
    return title ? [title, ...sections] : sections;
  }, [presentation, sections]);

  const [modalId, setModalId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"overview" | "frame">("frame");
  const [frontIndex, setFrontIndex] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const idleTimer = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const sectionIndex = useMemo(() => {
    if (!focusedId) return -1;
    const root = getFrame(presentation, focusedId);
    const id = root?.parentId ? root.parentId : focusedId;
    return story.findIndex((s) => s.id === id);
  }, [focusedId, presentation, story]);

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

  const resolveRoot = useCallback(
    (id: string): { frame: FrameNode | null; childId: string | null } => {
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

  const showOverview = useCallback(() => {
    setModalId(null);
    setViewMode("overview");
    setFocusedId(null);
    setActiveChildId(null);
    persist(null);
    writeUrl(null);
  }, [persist, writeUrl]);

  /** Open a section / title out from the stack (or Map). */
  const openSection = useCallback(
    (id: string) => {
      setModalId(null);
      const { frame, childId } = resolveRoot(id);
      if (!frame) {
        showOverview();
        return;
      }
      setActiveChildId(childId);
      setFocusedId(id);
      setViewMode("frame");
      if (frame.kind !== "title") {
        const idx = sections.findIndex((s) => s.id === frame.id);
        if (idx >= 0) setFrontIndex(idx);
      }
      persist(id);
      writeUrl(id);
    },
    [persist, resolveRoot, sections, showOverview, writeUrl],
  );

  const openDetail = useCallback(
    (id: string) => {
      const { frame, childId } = resolveRoot(id);
      if (frame) {
        setActiveChildId(childId);
        setFocusedId(id);
        setViewMode("frame");
        if (frame.kind !== "title") {
          const idx = sections.findIndex((s) => s.id === frame.id);
          if (idx >= 0) setFrontIndex(idx);
        }
      }
      setModalId(id);
      persist(id);
      writeUrl(id);
    },
    [persist, resolveRoot, sections, writeUrl],
  );

  /** In open section: click frame → modal; eye → modal. */
  const handleSelect = useCallback(
    (id: string) => {
      if (viewMode === "frame") {
        openDetail(id);
        return;
      }
      openSection(id);
    },
    [openDetail, openSection, viewMode],
  );

  const stepSection = useCallback(
    (delta: 1 | -1) => {
      setModalId(null);
      if (viewMode === "overview") {
        setFrontIndex((i) => {
          const n = sections.length;
          if (!n) return 0;
          return (i + delta + n) % n;
        });
        return;
      }
      const cur = sectionIndex >= 0 ? sectionIndex : 0;
      const next = cur + delta;
      if (next < 0 || next >= story.length) return;
      const frame = story[next]!;
      if (frame.kind !== "title") {
        const idx = sections.findIndex((s) => s.id === frame.id);
        if (idx >= 0) setFrontIndex(idx);
      }
      setActiveChildId(null);
      setFocusedId(frame.id);
      setViewMode("frame");
      persist(frame.id);
      writeUrl(frame.id);
    },
    [persist, sectionIndex, sections, story, viewMode, writeUrl],
  );

  // Boot — title opening slide (stack is Overview)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace(/^#\/?/, "");
    const fromUrl = params.get("section") || hash || null;
    if (fromUrl && getFrame(presentation, fromUrl)) {
      openSection(fromUrl);
    } else {
      openSection("title");
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
        openSection(id);
      } else {
        showOverview();
      }
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
      if (e.key === " " || e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (viewMode === "overview") stepSection(1);
        else stepSection(1);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        stepSection(-1);
        return;
      }
      if (e.key === "Enter" && viewMode === "overview") {
        e.preventDefault();
        const card = sections[frontIndex];
        if (card) openSection(card.id);
      }
      if (e.key === "Home") {
        e.preventDefault();
        showOverview();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [
    bumpChrome,
    frontIndex,
    modalId,
    openSection,
    sections,
    showOverview,
    stepSection,
    viewMode,
  ]);

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

  const openFrame =
    viewMode === "frame" && focusedId
      ? resolveRoot(focusedId).frame
      : null;
  const modalFrame = modalId ? getFrame(presentation, modalId) ?? null : null;
  const activeIdx = sectionIndex >= 0 ? sectionIndex : 0;

  return (
    <div className="facts-app">
      <header className={`topbar ${chromeVisible ? "is-visible" : "is-dim"}`}>
        <div className="topbar-brand">
          <LogoMark size={w < 640 ? 42 : 50} />
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
          <StackOverview
            sections={sections}
            frontIndex={frontIndex}
            reduced={reduced}
            onFrontChange={setFrontIndex}
            onOpen={openSection}
          />
        ) : openFrame ? (
          <SectionScene
            frame={openFrame}
            presentation={presentation}
            activeChildId={activeChildId}
            reduced={reduced}
            canPrev={activeIdx > 0}
            canNext={activeIdx < story.length - 1}
            onPrev={() => stepSection(-1)}
            onNext={() => stepSection(1)}
            onSelect={() => handleSelect(openFrame.id)}
            onOpenDetail={() => openDetail(focusedId ?? openFrame.id)}
            onOpenChild={(id) => openDetail(id)}
          />
        ) : null}
      </div>

      <PresentChrome
        presentation={presentation}
        focusId={viewMode === "overview" ? null : focusedId}
        chromeVisible={chromeVisible}
        fullscreen={fullscreen}
        onOverview={showOverview}
        onToggleFullscreen={toggleFullscreen}
        onJump={(id) => openSection(id)}
      />

      <DetailModal
        frame={modalFrame}
        open={!!modalId && !!modalFrame}
        sectionLinks={sections
          .filter((f) => f.id !== modalId)
          .map((f) => ({ id: f.id, title: f.title }))}
        onNavigate={(id) => openSection(id)}
        onClose={() => setModalId(null)}
      />
    </div>
  );
}
