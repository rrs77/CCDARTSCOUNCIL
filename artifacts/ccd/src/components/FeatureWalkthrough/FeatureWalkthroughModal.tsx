import { useCallback, useEffect, useState } from 'react';
import { Maximize, Minimize, X } from 'lucide-react';
import { publicAssetHref } from '../login/FeatureDemoVideoModal';

interface FeatureWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Use explicit index.html — bare `/ccd-pitch/` is caught by the Vite/Vercel SPA
// fallback and serves the main CCD shell instead of the pitch promo.
// Cache-bust so browsers / the PWA service worker don't keep serving an old pitch build.
const PROMO_PATH = 'ccd-pitch/index.html?autoplay=1&v=2026-07-24i';
const PITCH_CLOSE_MESSAGE = 'ccd-pitch-close';
const SITE_URL = 'https://www.ccdesigner.co.uk';

/**
 * Minimal walkthrough modal: forest card, thin lime edge, close + enlarge.
 * Controls sit above the iframe so clicks are not swallowed by the embed.
 *
 * Enlarge is an in-app near-viewport expand — not browser Fullscreen API.
 * requestFullscreen on a wrapper (or even the iframe) around the pitch embed
 * is unreliable across Safari / iOS and often rejects silently, which made the
 * previous Enlarge control look broken even after clicks reached the button.
 */
export function FeatureWalkthroughModal({ isOpen, onClose }: FeatureWalkthroughModalProps) {
  const [isEnlarged, setIsEnlarged] = useState(false);

  const promoSrc = publicAssetHref(PROMO_PATH);

  const handleClose = useCallback(() => {
    setIsEnlarged(false);
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
    if (!isOpen) {
      setIsEnlarged(false);
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Collapse enlarge first, then close the modal.
      if (isEnlarged) {
        e.preventDefault();
        setIsEnlarged(false);
        return;
      }
      handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isEnlarged, handleClose]);

  // PitchAutoplayViewer posts this when its own Close control is used inside the iframe.
  useEffect(() => {
    if (!isOpen) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === PITCH_CLOSE_MESSAGE) handleClose();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isOpen, handleClose]);

  const toggleEnlarge = () => {
    setIsEnlarged((prev) => !prev);
  };

  if (!isOpen) return null;

  return (
    <div
      className={
        isEnlarged
          ? 'fixed inset-0 z-[95] flex items-stretch justify-center bg-black/80 p-0 sm:p-2'
          : 'fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-3 sm:p-5'
      }
      role="dialog"
      aria-modal="true"
      aria-label="Feature walkthrough"
      onClick={handleClose}
    >
      <div
        className={
          isEnlarged
            ? 'relative flex h-full w-full max-w-none flex-col overflow-hidden rounded-none border border-[#B6FF7E]/35 shadow-2xl sm:rounded-2xl'
            : 'relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#B6FF7E]/35 shadow-2xl'
        }
        style={{
          background:
            'linear-gradient(165deg, #002D24 0%, #0a3d32 55%, #123f35 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Keep controls outside the iframe box — iframes steal clicks from overlays. */}
        <div className="flex shrink-0 items-center justify-end gap-2 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={toggleEnlarge}
            className="inline-flex items-center justify-center rounded-lg border border-[#B6FF7E]/40 bg-white/5 p-2 text-[#B6FF7E] transition-colors hover:bg-white/10"
            aria-label={isEnlarged ? 'Exit enlarge' : 'Enlarge'}
            aria-pressed={isEnlarged}
            title={isEnlarged ? 'Exit enlarge' : 'Enlarge'}
          >
            {isEnlarged ? (
              <Minimize className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Maximize className="h-4 w-4 shrink-0" aria-hidden />
            )}
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

        <div
          className={
            isEnlarged
              ? 'flex min-h-0 flex-1 overflow-hidden bg-black'
              : 'overflow-hidden bg-black'
          }
        >
          <iframe
            key={promoSrc}
            src={promoSrc}
            title="Feature walkthrough slideshow"
            className={
              isEnlarged
                ? 'h-full min-h-0 w-full flex-1 border-0 bg-black'
                : 'aspect-video w-full border-0 bg-black'
            }
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
