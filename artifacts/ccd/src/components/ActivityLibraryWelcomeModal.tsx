import { useEffect } from 'react';
import { X } from 'lucide-react';
import {
  ACTIVITY_LIBRARY_WELCOME_BODY,
  ACTIVITY_LIBRARY_WELCOME_TITLE,
} from './login/prototypeCopy';

interface ActivityLibraryWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityLibraryWelcomeModal({
  isOpen,
  onClose,
}: ActivityLibraryWelcomeModalProps) {
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
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-library-welcome-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2
            id="activity-library-welcome-title"
            className="text-xl font-semibold tracking-tight text-[#002D24]"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {ACTIVITY_LIBRARY_WELCOME_TITLE}
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

        <p className="text-sm leading-relaxed text-gray-600">
          {ACTIVITY_LIBRARY_WELCOME_BODY}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
          style={{ backgroundColor: '#002D24' }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
