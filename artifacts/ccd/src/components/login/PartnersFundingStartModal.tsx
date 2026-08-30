import { useEffect } from 'react';
import { PlayCircle, X } from 'lucide-react';
import {
  PARTNER_DISCLAIMER_FRAMING,
  PARTNERS_FUNDING_CONTINUE_CTA,
  PARTNERS_FUNDING_START_TITLE,
  PARTNERS_FUNDING_VIDEO_CTA,
  PARTNERS_FUNDING_VIDEO_INTRO,
  PARTNERS_FUNDING_VIDEO_NOTICE,
} from './prototypeCopy';

interface PartnersFundingStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Primary CTA: open the animated Feature Walkthrough (ccd-pitch). */
  onStartWalkthrough: () => void;
}

export function PartnersFundingStartModal({
  isOpen,
  onClose,
  onStartWalkthrough,
}: PartnersFundingStartModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="partners-funding-start-title"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#002D24]/15 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative px-6 pb-5 pt-6 sm:px-8 sm:pt-7"
          style={{
            background:
              'linear-gradient(165deg, #002D24 0%, #0a3d32 55%, #123f35 100%)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B6FF7E]/90">
            {PARTNER_DISCLAIMER_FRAMING}
          </p>
          <h2
            id="partners-funding-start-title"
            className="mt-2 max-w-[22rem] text-2xl font-semibold tracking-tight text-white"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {PARTNERS_FUNDING_START_TITLE}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
            {PARTNERS_FUNDING_VIDEO_INTRO}
          </p>
        </div>

        <div className="space-y-4 px-6 py-6 sm:px-8 sm:py-7">
          <p className="text-xs leading-relaxed text-gray-500">
            {PARTNERS_FUNDING_VIDEO_NOTICE}
          </p>

          <button
            type="button"
            onClick={onStartWalkthrough}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#B6FF7E] px-4 py-3.5 text-sm font-semibold text-[#002D24] transition-opacity hover:opacity-90"
          >
            <PlayCircle className="h-5 w-5 shrink-0" aria-hidden />
            <span>{PARTNERS_FUNDING_VIDEO_CTA}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
            style={{ backgroundColor: '#002D24' }}
          >
            {PARTNERS_FUNDING_CONTINUE_CTA}
          </button>
        </div>
      </div>
    </div>
  );
}
