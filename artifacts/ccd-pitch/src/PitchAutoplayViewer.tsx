import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { slides } from "@/slideLoader";

const SLIDE_MS = 9000;
const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;
const SITE_URL = "https://www.ccdesigner.co.uk";
const SWIPE_THRESHOLD_PX = 45;
/** Idle delay before chrome fades during autoplay (video-player UX). */
const CHROME_HIDE_MS = 2200;
/** Reveal chrome when the pointer is within this many px of the bottom edge. */
const BOTTOM_HOTZONE_PX = 72;

function leaveWalkthrough() {
  // When embedded in the CCD login modal iframe, ask the parent to close
  // instead of navigating the whole app away to the marketing site.
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "ccd-pitch-close" }, "*");
      return;
    }
  } catch {
    // Cross-origin parent — fall through to marketing redirect
  }
  window.location.href = SITE_URL;
}

export function PitchAutoplayViewer() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [tick, setTick] = useState(0);
  const [stageDims, setStageDims] = useState({ width: 0, height: 0 });
  // Follow the phone’s real orientation — portrait tall / landscape wide.
  // No forced 90° CSS rotate and no orientation.lock.
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    () =>
      window.innerHeight >= window.innerWidth ? "portrait" : "landscape",
  );
  const stageRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hideChromeTimerRef = useRef<number | null>(null);
  const chromePinnedRef = useRef(false);
  const indexRef = useRef(0);
  indexRef.current = index;

  // Video-style chrome: visible when paused; auto-hides while playing unless
  // the pointer is near the bottom / over the nav strip.
  const [chromeVisible, setChromeVisible] = useState(true);

  const bump = useCallback(() => setTick((t) => t + 1), []);

  const clearHideChromeTimer = useCallback(() => {
    if (hideChromeTimerRef.current != null) {
      window.clearTimeout(hideChromeTimerRef.current);
      hideChromeTimerRef.current = null;
    }
  }, []);

  const scheduleHideChrome = useCallback(() => {
    clearHideChromeTimer();
    if (!playing || chromePinnedRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    hideChromeTimerRef.current = window.setTimeout(() => {
      setChromeVisible(false);
      hideChromeTimerRef.current = null;
    }, CHROME_HIDE_MS);
  }, [playing, clearHideChromeTimer]);

  const revealChrome = useCallback(() => {
    setChromeVisible(true);
    scheduleHideChrome();
  }, [scheduleHideChrome]);

  useEffect(() => {
    if (!playing) {
      clearHideChromeTimer();
      setChromeVisible(true);
      return;
    }
    // Fresh play: show briefly, then fade like a video control bar.
    setChromeVisible(true);
    scheduleHideChrome();
    return () => clearHideChromeTimer();
  }, [playing, scheduleHideChrome, clearHideChromeTimer]);

  const onShellPointerMove = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      const shell = shellRef.current;
      if (!shell) return;
      const clientY =
        "touches" in event
          ? event.touches[0]?.clientY
          : (event as React.MouseEvent).clientY;
      if (clientY == null) return;
      const fromBottom = shell.getBoundingClientRect().bottom - clientY;
      if (fromBottom <= BOTTOM_HOTZONE_PX) {
        revealChrome();
      }
    },
    [revealChrome],
  );

  const onNavPointerEnter = useCallback(() => {
    chromePinnedRef.current = true;
    clearHideChromeTimer();
    setChromeVisible(true);
  }, [clearHideChromeTimer]);

  const onNavPointerLeave = useCallback(() => {
    chromePinnedRef.current = false;
    scheduleHideChrome();
  }, [scheduleHideChrome]);

  const jumpTo = useCallback(
    (next: number) => {
      const wrapped = (next + slides.length) % slides.length;
      setIndex(wrapped);
      bump();
      iframeRef.current?.contentWindow?.postMessage(
        { type: "navigateToSlide", position: slides[wrapped].position },
        "*",
      );
    },
    [bump],
  );

  const goPrev = useCallback(() => jumpTo(indexRef.current - 1), [jumpTo]);
  const goNext = useCallback(() => jumpTo(indexRef.current + 1), [jumpTo]);

  useEffect(() => {
    const update = () => {
      const vv = window.visualViewport;
      const w = Math.round(vv?.width ?? window.innerWidth);
      const h = Math.round(vv?.height ?? window.innerHeight);
      setOrientation(h >= w ? "portrait" : "landscape");

      // Keep the shell filling the live iframe viewport after rotate.
      const shell = shellRef.current;
      if (shell) {
        shell.style.width = "100%";
        shell.style.height = "100%";
        shell.style.minHeight = `${h}px`;
      }
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    // iOS often fires orientationchange before the new viewport settles.
    const onOrientation = () => {
      window.setTimeout(update, 50);
      window.setTimeout(update, 120);
      window.setTimeout(update, 350);
    };
    window.addEventListener("orientationchange", onOrientation);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("orientationchange", onOrientation);
      vv?.removeEventListener("resize", update);
    };
  }, []);

  // Autoplay.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      jumpTo(indexRef.current + 1);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [playing, tick, jumpTo]);

  // Fit a 16:9 stage into the available area (recomputes on resize/rotation).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => {
      const availW = stage.clientWidth;
      const availH = stage.clientHeight;
      if (availW <= 0 || availH <= 0) return;
      const width = Math.min(availW, availH * (16 / 9));
      const height = Math.min(availH, availW * (9 / 16));
      setStageDims({ width, height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    const onOrientation = () => {
      window.setTimeout(update, 50);
      window.setTimeout(update, 120);
      window.setTimeout(update, 350);
    };
    window.addEventListener("orientationchange", onOrientation);
    window.addEventListener("resize", update);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener("resize", update);
      vv?.removeEventListener("resize", update);
    };
  }, [orientation]);

  // Keyboard navigation (the overlay keeps focus in this window).
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        goPrev();
      } else if (
        event.key === "ArrowRight" ||
        event.key === "ArrowDown" ||
        event.key === " "
      ) {
        event.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  // Tap / swipe on the stage overlay — exactly one step per gesture.
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const onOverlayTouchStart = (event: React.TouchEvent) => {
    touchRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  };

  const onOverlayTouchEnd = (event: React.TouchEvent) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) >= SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      // Tap: the first 35% of the stage goes back, the rest advances.
      const fraction = start.x / window.innerWidth;
      if (fraction < 0.35) goPrev();
      else goNext();
    }
    // Mark so the synthetic click that follows a tap is ignored.
    if (touchClickGuard.current != null) window.clearTimeout(touchClickGuard.current);
    touchClickGuardActive.current = true;
    touchClickGuard.current = window.setTimeout(() => {
      touchClickGuardActive.current = false;
    }, 500);
  };

  const touchClickGuard = useRef<number | null>(null);
  const touchClickGuardActive = useRef(false);

  const onOverlayClick = (event: React.MouseEvent) => {
    if (touchClickGuardActive.current) return;
    const fraction = event.clientX / window.innerWidth;
    if (fraction < 0.35) goPrev();
    else goNext();
  };

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const firstPosition = slides.length > 0 ? slides[0].position : 1;
  // Explicit index.html — directory URLs like `/ccd-pitch/slide1` fall through
  // to the parent SPA shell under Vite and some static hosts.
  const slideSrc = `${base}/slide${firstPosition}/index.html`;

  return (
    <div
      ref={shellRef}
      className="pitch-autoplay-shell relative flex select-none flex-col overflow-hidden bg-black"
      data-orientation={orientation}
      data-chrome-visible={chromeVisible ? "true" : "false"}
      onMouseMove={onShellPointerMove}
      onTouchStart={onShellPointerMove}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100svh",
        maxHeight: "100dvh",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        boxSizing: "border-box",
      }}
    >
      {/* Stage fills the shell; nav overlays the bottom like video chrome. */}
      <div ref={stageRef} className="pitch-stage relative min-h-0 flex-1">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {/*
            The slide renders inside the iframe at a fixed 16:9 design
            resolution and is scaled down with a CSS transform. This keeps
            typography and layout identical to desktop on small screens
            instead of letting px-based minimums overlap and clip.
          */}
          <div
            className="pitch-stage-frame"
            style={{
              width: Math.floor(stageDims.width),
              height: Math.floor(stageDims.height),
              overflow: "hidden",
              position: "relative",
              flexShrink: 0,
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            <iframe
              ref={iframeRef}
              src={slideSrc}
              tabIndex={-1}
              style={{
                width: DESIGN_WIDTH,
                height: DESIGN_HEIGHT,
                border: "none",
                transform: `scale(${stageDims.width > 0 ? stageDims.width / DESIGN_WIDTH : 1})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
              }}
              title="Feature walkthrough slide"
              aria-label={`Slide ${index + 1} of ${slides.length}: ${slides[index]?.title ?? ""}`}
            />
          </div>
        </div>
        {/* Transparent overlay: viewer owns all tap/swipe/click navigation */}
        <div
          className="absolute inset-0 z-10"
          style={{ touchAction: "manipulation" }}
          onClick={onOverlayClick}
          onTouchStart={onOverlayTouchStart}
          onTouchEnd={onOverlayTouchEnd}
          role="presentation"
        />
      </div>

      {/* Bottom hot zone — catches hover/tap near the edge while chrome is faded. */}
      <div
        className="pitch-chrome-hotzone"
        aria-hidden
        onMouseEnter={revealChrome}
        onTouchStart={revealChrome}
      />

      {/* Compact controls — overlays stage; auto-hides while playing */}
      <div
        className="pitch-nav-strip z-20 flex items-center justify-center gap-1.5 border-t border-white/10 bg-[#002D24] px-2 py-1.5 sm:gap-2 sm:px-3"
        role="toolbar"
        aria-label="Walkthrough navigation"
        aria-hidden={!chromeVisible}
        data-chrome-hidden={chromeVisible ? "false" : "true"}
        onMouseEnter={onNavPointerEnter}
        onMouseLeave={onNavPointerLeave}
        onFocusCapture={onNavPointerEnter}
        onBlurCapture={(event) => {
          // Keep chrome while focus remains inside the strip.
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            onNavPointerLeave();
          }
        }}
      >
        <button
          type="button"
          onClick={() => {
            setPlaying((p) => !p);
            bump();
          }}
          className="pitch-nav-btn"
          title={playing ? "Pause" : "Play"}
          aria-label={playing ? "Pause autoplay" : "Play autoplay"}
          aria-pressed={playing}
          tabIndex={chromeVisible ? 0 : -1}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={goPrev}
          className="pitch-nav-btn"
          title="Previous slide"
          aria-label="Previous slide"
          tabIndex={chromeVisible ? 0 : -1}
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </button>

        <div
          className="pitch-nav-count shrink-0 whitespace-nowrap px-1.5 font-mono text-[0.7rem] tabular-nums text-white/70"
          aria-live="polite"
        >
          {index + 1} / {slides.length}
        </div>

        <button
          type="button"
          onClick={goNext}
          className="pitch-nav-btn"
          title="Next slide"
          aria-label="Next slide"
          tabIndex={chromeVisible ? 0 : -1}
        >
          <ChevronRight className="h-4.5 w-4.5" />
        </button>

        <button
          type="button"
          onClick={leaveWalkthrough}
          className="pitch-nav-btn"
          title="Close walkthrough"
          aria-label="Close walkthrough"
          tabIndex={chromeVisible ? 0 : -1}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
