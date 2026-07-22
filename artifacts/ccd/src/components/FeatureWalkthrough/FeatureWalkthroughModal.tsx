import { useEffect } from 'react';
import { X } from 'lucide-react';

interface FeatureWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Cache-bust so browsers / the PWA service worker don't keep serving an old pitch build.
const PROMO_SRC = `${import.meta.env.BASE_URL}ccd-pitch/?autoplay=1&v=2026-07-21`;
const SITE_URL = 'https://www.ccdesigner.co.uk';

export function FeatureWalkthroughModal({ isOpen, onClose }: FeatureWalkthroughModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

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
        title="Close and return to ccdesigner.co.uk"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
