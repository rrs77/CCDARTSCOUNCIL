import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Maximize, Minimize, X } from 'lucide-react';
import { publicAssetHref } from '../login/FeatureDemoVideoModal';
import { PARTNERS_FUNDING_CONTINUE_CTA } from '../login/prototypeCopy';

interface FeatureWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Use explicit index.html — bare `/ccd-pitch/` is caught by the Vite/Vercel SPA
// fallback and serves the main CCD shell instead of the pitch promo.
// Cache-bust so browsers / the PWA service worker don't keep serving an old pitch build.
const PROMO_PATH = 'ccd-pitch/index.html?autoplay=1&v=2026-07-24g';
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
 * Feature walkthrough slideshow in the FeatureDemoVideoModal chrome:
 * forest card, lime (#B6FF7E) surrounds, header, footer CTAs — iframe replaces <video>.
 */
export function FeatureWalkthroughModal({ isOpen, onClose }: FeatureWalkthroughModalProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const promoSrc = publicAssetHref(PROMO_PATH);
  const fullPitchHref = publicAssetHref('ccd-pitch/index.html');

  const syncFullscreenState = useCallback(() => {
    setIsFullscreen(isElementFullscreen(mediaRef.current));
  }, []);

  const handleClose = useCallback(() => {
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
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-walkthrough-title"
      onClick={handleClose}
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
              id="feature-walkthrough-title"
              className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Feature walkthrough
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close walkthrough"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 sm:px-5">
          <div
            ref={mediaRef}
            className="overflow-hidden rounded-xl border border-white/10 bg-black shadow-inner [&:fullscreen]:flex [&:fullscreen]:h-screen [&:fullscreen]:w-screen [&:fullscreen]:items-center [&:fullscreen]:justify-center [&:fullscreen]:rounded-none [&:fullscreen]:border-0 [&:fullscreen>iframe]:h-full [&:fullscreen>iframe]:w-full [&:fullscreen>iframe]:[aspect-ratio:auto]"
          >
            <iframe
              key={promoSrc}
              src={promoSrc}
              title="Creative Curriculum Designer promo"
              className="aspect-video w-full border-0 bg-black"
              allow="autoplay; fullscreen"
            />
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
              href={fullPitchHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[#B6FF7E] underline-offset-2 transition-opacity hover:underline hover:opacity-90"
            >
              Open full walkthrough page
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            </a>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg bg-[#B6FF7E] px-4 py-2.5 text-sm font-semibold text-[#002D24] transition-opacity hover:opacity-90"
          >
            {PARTNERS_FUNDING_CONTINUE_CTA}
          </button>
        </div>
      </div>
    </div>
  );
}
