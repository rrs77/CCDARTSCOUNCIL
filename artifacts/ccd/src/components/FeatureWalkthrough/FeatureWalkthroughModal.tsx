import { useEffect } from 'react';
import { X } from 'lucide-react';

interface FeatureWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROMO_SRC = `${import.meta.env.BASE_URL}ccd-pitch/?autoplay=1`;

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

  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Feature walkthrough"
    >
      <iframe
        src={PROMO_SRC}
        title="Creative Curriculum Designer promo"
        className="h-full w-full border-0"
        allow="autoplay"
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-[110] rounded-full bg-black/40 p-2.5 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
        aria-label="Close walkthrough"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
