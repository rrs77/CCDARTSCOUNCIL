import { useEffect } from 'react';
import { X } from 'lucide-react';

interface FeatureWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Use explicit index.html — bare `/ccd-pitch/` is caught by the Vite/Vercel SPA
// fallback and serves the main CCD shell instead of the pitch promo.
// Cache-bust so browsers / the PWA service worker don't keep serving an old pitch build.
const PROMO_SRC = `${import.meta.env.BASE_URL}ccd-pitch/index.html?autoplay=1&v=2026-07-24`;
const SITE_URL = 'https://www.ccdesigner.co.uk';
const PITCH_CLOSE_MESSAGE = 'ccd-pitch-close';

export function FeatureWalkthroughModal({ isOpen, onClose }: FeatureWalkthroughModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // PitchAutoplayViewer posts this when its own Close control is used inside the iframe.
  useEffect(() => {
    if (!isOpen) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === PITCH_CLOSE_MESSAGE) onClose();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    // Only bounce back to the marketing site when this modal was opened from
    // that origin (Arts Council / pitch flows). In-app use should just close.
    try {
      if (document.referrer.includes('ccdesigner.co.uk')) {
        window.location.href = SITE_URL;
        return;
      }
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Feature walkthrough"
    >
      <iframe
        key={PROMO_SRC}
        src={PROMO_SRC}
        title="Creative Curriculum Designer promo"
        className="h-full w-full border-0"
        allow="autoplay"
      />
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-4 top-4 z-[110] rounded-full bg-[#002D24]/70 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-[#002D24]/90 hover:text-[#B6FF7E]"
        aria-label="Close walkthrough"
        title="Close walkthrough"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
