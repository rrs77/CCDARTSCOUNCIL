import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Maximize, Minimize, Volume2, VolumeX, X } from 'lucide-react';
import {
  FEATURE_DEMO_PATH,
  FEATURE_DEMO_VIDEO_MP4,
  FEATURE_DEMO_VIDEO_POSTER,
  FEATURE_DEMO_VIDEO_WEBM,
  PARTNERS_FUNDING_VIDEO_TITLE,
} from './prototypeCopy';

/**
 * In-app MP4 player — archived feature-demo replay (card modal).
 * Post-login welcome video was removed; keep `variant` for call-site compat.
 */
interface FeatureDemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Welcome path removed — always plays the archived feature demo. */
  variant?: 'welcome' | 'archive';
  closeLabel?: string;
}

type VideoWithWebkitFullscreen = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
  webkitRequestFullscreen?: () => void;
  msRequestFullscreen?: () => void;
};

/** Resolve a path under `public/` with Vite BASE_URL. */
export function publicAssetHref(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalisedBase = base.endsWith('/') ? base : `${base}/`;
  const normalisedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalisedBase}${normalisedPath}`;
}

export function featureDemoPlayerHref(): string {
  return publicAssetHref(FEATURE_DEMO_PATH.replace(/^\//, ''));
}

function isVideoFullscreen(video: VideoWithWebkitFullscreen | null): boolean {
  if (!video) return false;
  if (video.webkitDisplayingFullscreen) return true;
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  const fullscreenEl = document.fullscreenElement || doc.webkitFullscreenElement;
  return fullscreenEl === video;
}

function enterVideoFullscreen(video: VideoWithWebkitFullscreen): void {
  if (typeof video.requestFullscreen === 'function' && document.fullscreenEnabled !== false) {
    void video.requestFullscreen();
    return;
  }
  if (typeof video.webkitRequestFullscreen === 'function') {
    video.webkitRequestFullscreen();
    return;
  }
  if (typeof video.msRequestFullscreen === 'function') {
    video.msRequestFullscreen();
    return;
  }
  if (typeof video.webkitEnterFullscreen === 'function') {
    video.webkitEnterFullscreen();
  }
}

function exitVideoFullscreen(video: VideoWithWebkitFullscreen): void {
  if (typeof video.webkitExitFullscreen === 'function' && video.webkitDisplayingFullscreen) {
    video.webkitExitFullscreen();
    return;
  }
  if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
    void document.exitFullscreen();
    return;
  }
  const doc = document as Document & { webkitExitFullscreen?: () => void };
  if (typeof doc.webkitExitFullscreen === 'function') {
    doc.webkitExitFullscreen();
  }
}

const WELCOME_FADE_MS = 900;

export function FeatureDemoVideoModal({
  isOpen,
  onClose,
  variant: _variant = 'archive',
  closeLabel,
}: FeatureDemoVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closingRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(false);
  const [needsUnmuteHint, setNeedsUnmuteHint] = useState(false);
  const title = PARTNERS_FUNDING_VIDEO_TITLE;
  const doneLabel = closeLabel ?? 'Continue to sign in';
  void _variant;

  const syncFullscreenState = useCallback(() => {
    setIsFullscreen(isVideoFullscreen(videoRef.current as VideoWithWebkitFullscreen | null));
  }, []);

  const finishClose = useCallback(() => {
    closingRef.current = false;
    setFadingOut(false);
    setVisible(false);
    setNeedsUnmuteHint(false);
    setMuted(false);
    const video = videoRef.current as VideoWithWebkitFullscreen | null;
    if (video) {
      try {
        video.pause();
        if (isVideoFullscreen(video)) exitVideoFullscreen(video);
      } catch {
        /* ignore */
      }
    }
    onClose();
  }, [onClose]);

  /** Fade the immersive layer out, then dismiss. */
  const beginFadeOut = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setFadingOut(true);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => {
      fadeTimerRef.current = null;
      finishClose();
    }, WELCOME_FADE_MS);
  }, [finishClose]);

  useEffect(() => {
    if (!isOpen) {
      closingRef.current = false;
      setFadingOut(false);
      setVisible(false);
      setIsFullscreen(false);
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      return;
    }
    // Next frame so the opacity transition can fade in.
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (!isVideoFullscreen(videoRef.current as VideoWithWebkitFullscreen | null)) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const video = videoRef.current as VideoWithWebkitFullscreen | null;
    if (!video) return;

    const onFsChange = () => syncFullscreenState();
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    video.addEventListener('webkitbeginfullscreen', onFsChange);
    video.addEventListener('webkitendfullscreen', onFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      video.removeEventListener('webkitbeginfullscreen', onFsChange);
      video.removeEventListener('webkitendfullscreen', onFsChange);
    };
  }, [isOpen, syncFullscreenState]);

  useEffect(() => {
    const video = videoRef.current as VideoWithWebkitFullscreen | null;
    if (!isOpen || !video) return;

    setLoadError(false);
    closingRef.current = false;
    setFadingOut(false);

    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    const mp4 = publicAssetHref(FEATURE_DEMO_VIDEO_MP4);
    if (video.getAttribute('src') !== mp4) {
      video.setAttribute('src', mp4);
      video.load();
    }

    video.currentTime = 0;
    video.muted = false;
    setMuted(false);
    setNeedsUnmuteHint(false);

    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        // Autoplay with sound blocked — mute and retry so playback still starts immediately.
        video.muted = true;
        setMuted(true);
        setNeedsUnmuteHint(true);
        try {
          await video.play();
        } catch {
          setLoadError(true);
        }
      }
    };

    void tryPlay();

    return () => {
      video.pause();
    };
  }, [isOpen, syncFullscreenState]);

  const toggleFullscreen = () => {
    const video = videoRef.current as VideoWithWebkitFullscreen | null;
    if (!video) return;
    try {
      if (isVideoFullscreen(video)) {
        exitVideoFullscreen(video);
      } else {
        enterVideoFullscreen(video);
      }
    } catch {
      /* Fullscreen can be denied */
    }
    syncFullscreenState();
  };

  const unmute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setMuted(false);
    setNeedsUnmuteHint(false);
    void video.play().catch(() => undefined);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted) setNeedsUnmuteHint(false);
  };

  if (!isOpen) return null;

  const mp4Src = publicAssetHref(FEATURE_DEMO_VIDEO_MP4);
  const webmSrc = publicAssetHref(FEATURE_DEMO_VIDEO_WEBM);
  const posterSrc = publicAssetHref(FEATURE_DEMO_VIDEO_POSTER);
  const fullPlayerHref = featureDemoPlayerHref();

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[rgba(21,18,51,0.55)] p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-demo-video-title"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#E2E0EF]/30 shadow-2xl"
        style={{
          background: 'linear-gradient(165deg, #1F1B4D 0%, #2a2466 55%, #4338E8 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#FFC93C]">
              Feature overview
            </p>
            <h2
              id="feature-demo-video-title"
              className="mt-1 text-lg font-extrabold tracking-tight text-white sm:text-xl"
              style={{
                fontFamily:
                  "var(--ss-font-display, 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif)",
              }}
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close video"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 sm:px-5">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black shadow-inner">
            <video
              ref={videoRef}
              className="aspect-video w-full bg-black"
              controls
              playsInline
              preload="auto"
              poster={posterSrc}
              onError={() => setLoadError(true)}
              onLoadedData={() => setLoadError(false)}
            >
              <source src={mp4Src} type="video/mp4" />
              {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
              Your browser does not support embedded video.
            </video>
            {loadError && (
              <div className="border-t border-white/10 bg-black/80 px-4 py-3 text-center text-sm text-white/85">
                Video could not load.{' '}
                <a
                  href={fullPlayerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#FFC93C] underline-offset-2 hover:underline"
                >
                  Open the feature-demo page
                </a>{' '}
                instead.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#FFC93C]/45 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-[#FFC93C] transition-colors hover:bg-white/10"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Maximize className="h-4 w-4 shrink-0" aria-hidden />
              )}
              <span>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span>
            </button>
            <a
              href={fullPlayerHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[#FFC93C] underline-offset-2 transition-opacity hover:underline hover:opacity-90"
            >
              Open full feature-demo page
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#FFC93C] px-4 py-2.5 text-sm font-bold text-[#1F1B4D] transition-opacity hover:opacity-90"
          >
            {doneLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
