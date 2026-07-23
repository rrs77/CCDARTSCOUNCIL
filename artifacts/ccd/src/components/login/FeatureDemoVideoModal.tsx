import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Maximize, Minimize, X } from 'lucide-react';
import {
  FEATURE_DEMO_PATH,
  FEATURE_DEMO_VIDEO_MP4,
  FEATURE_DEMO_VIDEO_POSTER,
  FEATURE_DEMO_VIDEO_WEBM,
  PARTNERS_FUNDING_VIDEO_TITLE,
} from './prototypeCopy';

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
  const fullscreenEl =
    document.fullscreenElement ||
    (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement;
  return fullscreenEl === video;
}

async function enterVideoFullscreen(video: VideoWithWebkitFullscreen): Promise<void> {
  // iOS Safari: native video fullscreen (works with playsInline)
  if (typeof video.webkitEnterFullscreen === 'function') {
    video.webkitEnterFullscreen();
    return;
  }
  if (typeof video.requestFullscreen === 'function') {
    await video.requestFullscreen();
    return;
  }
  if (typeof video.webkitRequestFullscreen === 'function') {
    video.webkitRequestFullscreen();
    return;
  }
  if (typeof video.msRequestFullscreen === 'function') {
    video.msRequestFullscreen();
  }
}

async function exitVideoFullscreen(video: VideoWithWebkitFullscreen): Promise<void> {
  if (typeof video.webkitExitFullscreen === 'function' && video.webkitDisplayingFullscreen) {
    video.webkitExitFullscreen();
    return;
  }
  if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
    await document.exitFullscreen();
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

    // Older iOS Safari still looks for the webkit attribute.
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    video.currentTime = 0;
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

  const toggleFullscreen = async () => {
    const video = videoRef.current as VideoWithWebkitFullscreen | null;
    if (!video) return;
    try {
      if (isVideoFullscreen(video)) {
        await exitVideoFullscreen(video);
      } else {
        await enterVideoFullscreen(video);
      }
    } catch {
      // Fullscreen can be denied by the browser; native controls remain as fallback.
    } finally {
      syncFullscreenState();
    }
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
              preload="metadata"
              poster={posterSrc}
              // Keep native fullscreen in the control bar where the browser supports it.
            >
              <source src={mp4Src} type="video/mp4" />
              <source src={webmSrc} type="video/webm" />
              Your browser does not support embedded video.
            </video>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
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
