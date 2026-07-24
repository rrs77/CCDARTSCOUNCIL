import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, X } from 'lucide-react';
import { publicAssetHref } from '../login/FeatureDemoVideoModal';

interface FeatureWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Use explicit index.html — bare `/ccd-pitch/` is caught by the Vite/Vercel SPA
// fallback and serves the main CCD shell instead of the pitch promo.
// Cache-bust so browsers / the PWA service worker don't keep serving an old pitch build.
const PROMO_PATH = 'ccd-pitch/index.html?autoplay=1&v=2026-07-24h';
const PITCH_CLOSE_MESSAGE = 'ccd-pitch-close';
const SITE_URL = 'https://www.ccdesigner.co.uk';

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => void;
  msRequestFullscreen?: () => void;
};

function isElementFullscreen(el: HTMLElement | null): boolean {
  if (!el) return false;
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  const fullscreenEl = document.fullscreenElement || doc.webkitFullscreenElement;
  return fullscreenEl === el;
}

function enterElementFullscreen(el: FsElement): void {
  if (typeof el.requestFullscreen === 'function' && document.fullscreenEnabled !== false) {
    void el.requestFullscreen();
    return;
  }
  if (typeof el.webkitRequestFullscreen === 'function') {
    el.webkitRequestFullscreen();
    return;
  }
  if (typeof el.msRequestFullscreen === 'function') {
    el.msRequestFullscreen();
  }
}

function exitElementFullscreen(): void {
  if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
    void document.exitFullscreen();
    return;
  }
  const doc = document as Document & { webkitExitFullscreen?: () => void };
  if (typeof doc.webkitExitFullscreen === 'function') {
    doc.webkitExitFullscreen();
  }
}

/**
 * Minimal walkthrough modal: forest card, thin lime edge, close + fullscreen.
 * The ccd-pitch slideshow fills the frame — no titles, disclaimer, or footer CTAs.
 */
export function FeatureWalkthroughModal({ isOpen, onClose }: FeatureWalkthroughModalProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const promoSrc = publicAssetHref(PROMO_PATH);

  const syncFullscreenState = useCallback(() => {
    setIsFullscreen(isElementFullscreen(mediaRef.current));
  }, []);

  const handleClose = useCallback(() => {
    if (isElementFullscreen(mediaRef.current)) {
      exitElementFullscreen();
    }
    onClose();
    // Only bounce back to the marketing site when this modal was opened from
    // that origin (Arts Council / pitch flows). In-app use should just close.
    try {
      if (document.referrer.includes('ccdesigner.co.uk')) {
        window.location.href = SITE_URL;
      }
    } catch {
      // ignore
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isElementFullscreen(mediaRef.current)) {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
      return;
    }

    const onFsChange = () => syncFullscreenState();
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, [isOpen, syncFullscreenState]);

  // PitchAutoplayViewer posts this when its own Close control is used inside the iframe.
  useEffect(() => {
    if (!isOpen) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === PITCH_CLOSE_MESSAGE) handleClose();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isOpen, handleClose]);

  // Must stay a direct click handler so requestFullscreen keeps the user gesture.
  const toggleFullscreen = () => {
    const media = mediaRef.current as FsElement | null;
    if (!media) return;
    try {
      if (isElementFullscreen(media)) {
        exitElementFullscreen();
      } else {
        enterElementFullscreen(media);
      }
    } catch {
      // Fullscreen can be denied by the browser.
    }
    syncFullscreenState();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Feature walkthrough"
      onClick={handleClose}
    >
      <div
        className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#B6FF7E]/35 shadow-2xl"
        style={{
          background:
            'linear-gradient(165deg, #002D24 0%, #0a3d32 55%, #123f35 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 sm:right-3 sm:top-3">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-lg border border-[#B6FF7E]/35 bg-[#002D24]/75 p-2 text-[#B6FF7E] shadow-sm backdrop-blur-sm transition-colors hover:bg-[#002D24]/95 hover:text-white"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" aria-hidden />
            ) : (
              <Maximize className="h-4 w-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-white/15 bg-[#002D24]/75 p-2 text-white/80 shadow-sm backdrop-blur-sm transition-colors hover:bg-[#002D24]/95 hover:text-white"
            aria-label="Close walkthrough"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={mediaRef}
          className="overflow-hidden bg-black [&:fullscreen]:flex [&:fullscreen]:h-screen [&:fullscreen]:w-screen [&:fullscreen]:items-center [&:fullscreen]:justify-center [&:fullscreen>iframe]:h-full [&:fullscreen>iframe]:w-full [&:fullscreen>iframe]:[aspect-ratio:auto]"
        >
          <iframe
            key={promoSrc}
            src={promoSrc}
            title="Feature walkthrough slideshow"
            className="aspect-video w-full border-0 bg-black"
            allow="autoplay; fullscreen"
          />
        </div>
      </div>
    </div>
  );
}
