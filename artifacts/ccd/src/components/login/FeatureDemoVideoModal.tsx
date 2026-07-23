import { useEffect, useRef } from 'react';
import { ExternalLink, X } from 'lucide-react';
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

export function FeatureDemoVideoModal({ isOpen, onClose }: FeatureDemoVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const video = videoRef.current;
    if (!isOpen || !video) return;

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
            >
              <source src={mp4Src} type="video/mp4" />
              <source src={webmSrc} type="video/webm" />
              Your browser does not support embedded video.
            </video>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5">
          <a
            href={fullPlayerHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[#B6FF7E] underline-offset-2 transition-opacity hover:underline hover:opacity-90"
          >
            Open full feature-demo page
            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          </a>
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
