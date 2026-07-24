import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Maximize, Minimize, X } from 'lucide-react';
import {
  FEATURE_DEMO_PATH,
  FEATURE_DEMO_VIDEO_MP4,
  FEATURE_DEMO_VIDEO_POSTER,
  FEATURE_DEMO_VIDEO_WEBM,
  PARTNERS_FUNDING_VIDEO_TITLE,
} from './prototypeCopy';

/**
 * Archived MP4 player (July 2026).
 * Login first-open CTA now opens FeatureWalkthroughModal (ccd-pitch) instead.
 * Kept in-repo for optional replay; do not wire back as the primary post-notice path.
 */
interface FeatureDemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
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

/**
 * Enter fullscreen on the <video> itself.
 *
 * Important: do NOT call webkitEnterFullscreen first. Desktop Safari exposes that
 * method, but it only works for iOS native video fullscreen — calling it fails and
 * previously prevented requestFullscreen from ever running.
 */
function enterVideoFullscreen(video: VideoWithWebkitFullscreen): void {
  // Chrome / Firefox / desktop Safari: standard Fullscreen API (sync call keeps user gesture).
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

  // iOS Safari: presentation-mode fullscreen (works with playsInline).
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

export function FeatureDemoVideoModal({ isOpen, onClose }: FeatureDemoVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const syncFullscreenState = useCallback(() => {
    setIsFullscreen(isVideoFullscreen(videoRef.current as VideoWithWebkitFullscreen | null));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't dismiss the modal while native fullscreen is active — Escape exits fullscreen first.
      if (e.key === 'Escape' && !isVideoFullscreen(videoRef.current as VideoWithWebkitFullscreen | null)) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
      return;
    }

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
    const video = videoRef.current;
    if (!isOpen || !video) return;

    setLoadError(false);

    // Older iOS Safari still looks for the webkit attribute.
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    video.currentTime = 0;
    // CTA that opened this modal is a user gesture — play should succeed without muted.
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Autoplay may be blocked until the user presses play — controls remain available.
      });
    }

    return () => {
      video.pause();
    };
  }, [isOpen]);

  // Must stay a direct click handler so requestFullscreen keeps the user gesture.
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
      // Fullscreen can be denied by the browser; native controls remain as fallback.
    }
    // Events (fullscreenchange / webkitbeginfullscreen) also sync; this covers sync failures.
    syncFullscreenState();
  };

  if (!isOpen) return null;

  const mp4Src = publicAssetHref(FEATURE_DEMO_VIDEO_MP4);
  const webmSrc = publicAssetHref(FEATURE_DEMO_VIDEO_WEBM);
  const posterSrc = publicAssetHref(FEATURE_DEMO_VIDEO_POSTER);
  const fullPlayerHref = featureDemoPlayerHref();

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-demo-video-title"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#B6FF7E]/25 shadow-2xl"
        style={{
          background:
            'linear-gradient(165deg, #002D24 0%, #0a3d32 55%, #123f35 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B6FF7E]/90">
              Feature overview
            </p>
            <h2
              id="feature-demo-video-title"
              className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {PARTNERS_FUNDING_VIDEO_TITLE}
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
              // Do not set controlsList="nofullscreen" — native control bar fullscreen must stay available.
            >
              <source src={mp4Src} type="video/mp4" />
              <source src={webmSrc} type="video/webm" />
              Your browser does not support embedded video.
            </video>
            {loadError && (
              <div className="border-t border-white/10 bg-black/80 px-4 py-3 text-center text-sm text-white/85">
                Video could not load.{' '}
                <a
                  href={fullPlayerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#B6FF7E] underline-offset-2 hover:underline"
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
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#B6FF7E]/40 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-[#B6FF7E] transition-colors hover:bg-white/10"
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
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[#B6FF7E] underline-offset-2 transition-opacity hover:underline hover:opacity-90"
            >
              Open full feature-demo page
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#B6FF7E] px-4 py-2.5 text-sm font-semibold text-[#002D24] transition-opacity hover:opacity-90"
          >
            Continue to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
