import { X } from 'lucide-react';
import { ABOUT_PROTOTYPE_BODY, ABOUT_PROTOTYPE_TITLE } from './prototypeCopy';

interface AboutPrototypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutPrototypeModal({ isOpen, onClose }: AboutPrototypeModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-prototype-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="about-prototype-title" className="text-xl font-semibold tracking-tight text-[#002D24]">
            {ABOUT_PROTOTYPE_TITLE}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-gray-600">
          {ABOUT_PROTOTYPE_BODY.split('\n\n').map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
          style={{ backgroundColor: '#002D24' }}
        >
          Continue to prototype
        </button>
      </div>
    </div>
  );
}
