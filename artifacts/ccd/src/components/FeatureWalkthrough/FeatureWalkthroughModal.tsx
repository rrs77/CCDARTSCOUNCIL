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

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
  msFullscreenElement?: Element | null;
  msExitFullscreen?: () => void;
};

function getFullscreenElement(): Element | null {
  const doc = document as FsDocument;
  return (
    document.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.msFullscreenElement ||
    null
  );
}

function isElementFullscreen(el: HTMLElement | null): boolean {
  if (!el) return false;
  return getFullscreenElement() === el;
}

/**
 * Fullscreen the slideshow media frame (outer wrapper that contains the iframe).
 *
 * Prefer the standard Fullscreen API synchronously so the user gesture is kept.
 * Do not call iOS-only webkitEnterFullscreen — it is video-only and previously
 * blocked requestFullscreen from running in the feature-demo modal.
 */
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
  const doc = document as FsDocument;
  if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
    void document.exitFullscreen();
    return;
  }
  if (doc.webkitFullscreenElement && typeof doc.webkitExitFullscreen === 'function') {
    doc.webkitExitFullscreen();
    return;
  }
  if (doc.msFullscreenElement && typeof doc.msExitFullscreen === 'function') {
    doc.msExitFullscreen();
  }
}

const MEDIA_FULLSCREEN_CLASS =
  'overflow-hidden bg-black ' +
  '[&:fullscreen]:flex [&:fullscreen]:h-screen [&:fullscreen]:w-screen ' +
  '[&:fullscreen]:items-center [&:fullscreen]:justify-center ' +
  '[&:fullscreen>iframe]:h-full [&:fullscreen>iframe]:w-full [&:fullscreen>iframe]:[aspect-ratio:auto] ' +
  '[&:-webkit-full-screen]:flex [&:-webkit-full-screen]:h-screen [&:-webkit-full-screen]:w-screen ' +
  '[&:-webkit-full-screen]:items-center [&:-webkit-full-screen]:justify-center ' +
  '[&:-webkit-full-screen>iframe]:h-full [&:-webkit-full-screen>iframe]:w-full ' +
  '[&:-webkit-full-screen>iframe]:[aspect-ratio:auto]';

/**
 * Minimal walkthrough modal: forest card, thin lime edge, close + enlarge.
 * Controls sit above the iframe so clicks are not swallowed by the embed.
 * Fullscreen targets the media frame that wraps the iframe.
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
      // Native Escape exits fullscreen first; only close the modal when not fullscreen.
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
    document.addEventListener('MSFullscreenChange', onFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.removeEventListener('MSFullscreenChange', onFsChange);
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
    // fullscreenchange also syncs; this covers immediate sync failures.
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
        {/* Keep controls outside the iframe box — iframes steal clicks from overlays. */}
        <div className="flex items-center justify-end gap-2 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#B6FF7E]/40 bg-white/5 px-3 py-2 text-sm font-semibold text-[#B6FF7E] transition-colors hover:bg-white/10"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enlarge'}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Maximize className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span>{isFullscreen ? 'Exit fullscreen' : 'Enlarge'}</span>
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close walkthrough"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={mediaRef} className={MEDIA_FULLSCREEN_CLASS}>
          <iframe
            key={promoSrc}
            src={promoSrc}
            title="Feature walkthrough slideshow"
            className="aspect-video w-full border-0 bg-black"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
