/**
 * Platform contract file — do not restructure.
 *
 * This file is part of the contract between the slides artifact and
 * the surrounding workspace tooling (preview, thumbnails, exports).
 * Reorganizing it, swapping the router, or changing the structure
 * of `AllSlides` can quietly break that tooling even when the page
 * still looks correct in the preview.
 *
 * Agents: see the slides skill `<workspace_contract>` for the full
 * rules, and `references/visual_qa.md` → "Platform contract sanity
 * check" if this file has been hand-edited and needs repair.
 */

import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

import { slides } from "@/slideLoader";
import BrandStamp from "@/components/BrandStamp";
import { PitchAutoplayViewer } from "@/PitchAutoplayViewer";

// Slides that already present a full-size logo get no corner stamp.
const NO_BRAND_SLIDES = new Set([
  "CCDesignerIntro.tsx",
]);
function showBrand(filepath: string): boolean {
  return !NO_BRAND_SLIDES.has(filepath.split("/").pop() ?? "");
}

function getSlideIndex(pathname: string): number {
  // Accept `/slideN` and `/slideN/index.html` (static hosts / Vite need the
  // explicit index file; wouter may keep that path until the first navigate).
  const match = pathname.match(/^\/slide(\d+)(?:\/index\.html)?$/);
  if (!match) return -1;
  const position = parseInt(match[1], 10);
  return slides.findIndex((s) => s.position === position);
}

function SlideEditor() {
  const [location, navigate] = useLocation();
  const currentIndex = getSlideIndex(location);

  // In the workspace, the slide iframe is nested inside another iframe,
  // so window.parent !== window.parent.parent. In the deployed SlideViewer,
  // the parent is the top-level window, so they're equal. Disable local
  // navigation only in the workspace — the parent owns it there.
  const navigationDisabledRef = useRef(window.parent !== window.parent.parent);
  const touchHandledRefStable = useRef(false);

  useEffect(() => {
    if (currentIndex === -1) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (navigationDisabledRef.current) return;
      if (event.key === " ") {
        event.preventDefault();
      }
      if ((event.key === "ArrowLeft" || event.key === "ArrowUp") && currentIndex > 0) {
        navigate(`/slide${slides[currentIndex - 1].position}`);
      }
      if (
        (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === " ") &&
        currentIndex < slides.length - 1
      ) {
        navigate(`/slide${slides[currentIndex + 1].position}`);
      }
    };

    const INTERACTIVE =
      "a,button,video,audio,input,select,textarea,details,summary,iframe,svg,canvas," +
      '[role="button"],[contenteditable="true"]';

    const isInteractive = (target: EventTarget | null) =>
      (target as HTMLElement | null)?.closest?.(INTERACTIVE);

    const touchHandledRef = touchHandledRefStable;

    const onClick = (event: MouseEvent) => {
      if (touchHandledRef.current) {
        touchHandledRef.current = false;
        return;
      }
      if (event.button !== 0 || event.metaKey || event.ctrlKey) return;
      if (isInteractive(event.target)) return;

      if (navigationDisabledRef.current) {
        window.parent.postMessage({ type: "advanceSlide" }, "*");
        return;
      }

      if (currentIndex < slides.length - 1) {
        navigate(`/slide${slides[currentIndex + 1].position}`);
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;
    let touchTarget: EventTarget | null = null;

    const onTouchStart = (event: TouchEvent) => {
      touchHandledRef.current = false;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      touchTarget = event.target;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const dx = event.changedTouches[0].clientX - touchStartX;
      const dy = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) >= 10 || Math.abs(dy) >= 10) return;
      if (isInteractive(touchTarget)) return;
      touchHandledRef.current = true;

      if (navigationDisabledRef.current) {
        window.parent.postMessage({ type: "advanceSlide" }, "*");
        return;
      }

      const fraction = touchStartX / window.innerWidth;
      if (fraction < 0.4 && currentIndex > 0) {
        navigate(`/slide${slides[currentIndex - 1].position}`);
      } else if (fraction >= 0.4 && currentIndex < slides.length - 1) {
        navigate(`/slide${slides[currentIndex + 1].position}`);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("click", onClick);
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", onClick);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [currentIndex, navigate]);

  return (
    <div className="select-none">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className="relative"
          style={{ display: index === currentIndex ? "block" : "none" }}
        >
          <slide.Component />
          {showBrand(slide.filepath) && <BrandStamp />}
        </div>
      ))}
    </div>
  );
}

// Do not rewrite this component. Each slide must remain wrapped in
// `<div className="slide">` sized 1920×1080 — the class name and
// dimensions are part of the platform contract. See the file-level
// banner above for context.
function AllSlides() {
  return (
    <div className="bg-black">
      {slides.map((slide) => (
        <div
          key={slide.id}
          className="slide relative aspect-video overflow-hidden"
          style={{ width: "1920px", height: "1080px" }}
        >
          <div className="h-full w-full [&_.h-screen]:!h-full [&_.w-screen]:!w-full">
            <slide.Component />
          </div>
          {showBrand(slide.filepath) && <BrandStamp />}
        </div>
      ))}
    </div>
  );
}

// This component is used for the deployed view at `/`
function SlideViewer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Letterbox the 16:9 stage into the live viewport. Follows device
  // orientation (portrait tall / landscape wide) — no forced 90° rotate.
  const fitDims = () => {
    const vv = window.visualViewport;
    const availW = Math.round(vv?.width ?? window.innerWidth);
    const availH = Math.round(vv?.height ?? window.innerHeight);
    const orientation =
      availH >= availW ? ("portrait" as const) : ("landscape" as const);
    return {
      width: Math.min(availW, availH * (16 / 9)),
      height: Math.min(availH, availW * (9 / 16)),
      orientation,
    };
  };
  const [dims, setDims] = useState(fitDims);

  useEffect(() => {
    const update = () => setDims(fitDims());
    const onOrientation = () => {
      window.setTimeout(update, 50);
      window.setTimeout(update, 120);
      window.setTimeout(update, 350);
    };
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", onOrientation);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", onOrientation);
      vv?.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== " ") return;
      if (event.key === " ") event.preventDefault();
      iframeRef.current?.contentWindow?.dispatchEvent(
        new KeyboardEvent("keydown", { key: event.key, code: event.code, bubbles: true }),
      );
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const firstPosition = slides.length > 0 ? slides[0].position : 1;

  return (
    <div
      className="slide-viewer h-[100svh] h-[100dvh] w-screen max-h-[100dvh] overflow-hidden bg-black flex items-center justify-center"
      data-orientation={dims.orientation}
      style={{
        width: "100%",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        boxSizing: "border-box",
      }}
      onClick={() => iframeRef.current?.focus()}
    >
      {/* Fixed 16:9 design resolution scaled to fit — keeps slide layout
          identical across phones, tablets and desktops. */}
      <div
        className="pitch-stage-frame"
        style={{
          width: dims.width,
          height: dims.height,
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      >
        <iframe
          ref={iframeRef}
          src={`${base}/slide${firstPosition}/index.html`}
          style={{
            width: 1280,
            height: 720,
            border: "none",
            transform: `scale(${dims.width > 0 ? dims.width / 1280 : 1})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
          }}
          onLoad={() => iframeRef.current?.focus()}
          title="Slide viewer"
        />
      </div>
    </div>
  );
}

export default function App() {
  const [location, navigate] = useLocation();
  const isHome = location === "/" || location === "/index.html";

  // DO NOT edit this useEffect - redirects unknown routes to the first slide.
  // The "/" and "/allslides" routes are handled separately below.
  useEffect(() => {
    if (
      !isHome &&
      location !== "/allslides" &&
      getSlideIndex(location) === -1
    ) {
      if (slides.length > 0) {
        navigate(`/slide${slides[0].position}`, { replace: true });
      }
    }
  }, [location, navigate, isHome]);

  // DO NOT edit this useEffect - allows the parent frame to navigate
  // between slides via postMessage so it can avoid changing the iframe
  // src (which causes a white flash).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "navigateToSlide" &&
        typeof event.data.position === "number" &&
        slides.some((s) => s.position === event.data.position)
      ) {
        navigate(`/slide${event.data.position}`);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate]);

  if (isHome) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoplay") === "1") return <PitchAutoplayViewer />;
    return <SlideViewer />;
  }
  if (location === "/allslides") return <AllSlides />;
  return <SlideEditor />;
}
