import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface FeatureWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Use explicit index.html — bare `/ccd-pitch/` is caught by the Vite/Vercel SPA
// fallback and serves the main CCD shell instead of the pitch promo.
// Cache-bust so browsers / the PWA service worker don't keep serving an old pitch build.
const PROMO_SRC = `${import.meta.env.BASE_URL}ccd-pitch/index.html?autoplay=1&v=2026-07-24f`;
const SITE_URL = 'https://www.ccdesigner.co.uk';
const PITCH_CLOSE_MESSAGE = 'ccd-pitch-close';

function readViewportSize() {
  const vv = window.visualViewport;
  return {
    width: Math.round(vv?.width ?? window.innerWidth),
    height: Math.round(vv?.height ?? window.innerHeight),
    offsetTop: Math.round(vv?.offsetTop ?? 0),
    offsetLeft: Math.round(vv?.offsetLeft ?? 0),
  };
}

export function FeatureWalkthroughModal({ isOpen, onClose }: FeatureWalkthroughModalProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // Keep modal + iframe filling the live viewport across portrait ↔ landscape
  // (iOS Safari often settles layout after orientationchange / visualViewport resize).
  useEffect(() => {
    if (!isOpen) return;
    const shell = shellRef.current;
    if (!shell) return;

    const apply = () => {
      const { width, height, offsetTop, offsetLeft } = readViewportSize();
      shell.style.width = `${width}px`;
      shell.style.height = `${height}px`;
      shell.style.top = `${offsetTop}px`;
      shell.style.left = `${offsetLeft}px`;
      shell.dataset.orientation = height >= width ? 'portrait' : 'landscape';

      const iframe = iframeRef.current;
      if (iframe) {
        iframe.style.width = '100%';
        iframe.style.height = '100%';
      }
    };

    apply();
    const onOrientation = () => {
      window.setTimeout(apply, 50);
      window.setTimeout(apply, 120);
      window.setTimeout(apply, 350);
    };

    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', onOrientation);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', apply);
    vv?.addEventListener('scroll', apply);

    return () => {
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', onOrientation);
      vv?.removeEventListener('resize', apply);
      vv?.removeEventListener('scroll', apply);
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
      ref={shellRef}
      className="fixed z-[100] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Feature walkthrough"
      style={{
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        minHeight: '100svh',
        maxHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        boxSizing: 'border-box',
      }}
    >
      <iframe
        ref={iframeRef}
        key={PROMO_SRC}
        src={PROMO_SRC}
        title="Creative Curriculum Designer promo"
        className="min-h-0 w-full flex-1 border-0"
        allow="autoplay"
        style={{ width: '100%', height: '100%' }}
      />
      <button
        type="button"
        onClick={handleClose}
        className="absolute z-[110] rounded-full bg-[#002D24]/70 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-[#002D24]/90 hover:text-[#B6FF7E]"
        style={{
          top: 'max(0.75rem, env(safe-area-inset-top, 0px))',
          right: 'max(0.75rem, env(safe-area-inset-right, 0px))',
        }}
        aria-label="Close walkthrough"
        title="Close walkthrough"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
