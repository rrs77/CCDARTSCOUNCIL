import { useEffect } from 'react';
import { X } from 'lucide-react';
import {
  WELCOME_PROTOTYPE_BODY,
  WELCOME_PROTOTYPE_CONTACT_EMAIL,
  WELCOME_PROTOTYPE_TITLE,
} from './prototypeCopy';
import { buildQueryMailto } from '../../utils/mailto';

interface PrototypeWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function renderWelcomeParagraph(paragraph: string) {
  const email = WELCOME_PROTOTYPE_CONTACT_EMAIL;
  if (!paragraph.includes(email)) {
    return paragraph;
  }

  const parts = paragraph.split(email);
  return (
    <>
      {parts[0]}
      <a
        href={buildQueryMailto(email)}
        className="font-semibold text-[#002D24] underline underline-offset-2 hover:opacity-80"
      >
        {email}
      </a>
      {parts[1]}
    </>
  );
}

export function PrototypeWelcomeModal({ isOpen, onClose }: PrototypeWelcomeModalProps) {
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
      aria-labelledby="prototype-welcome-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2
            id="prototype-welcome-title"
            className="text-xl font-semibold tracking-tight text-[#002D24]"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {WELCOME_PROTOTYPE_TITLE}
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
          {WELCOME_PROTOTYPE_BODY.split('\n\n').map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{renderWelcomeParagraph(paragraph)}</p>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
          style={{ backgroundColor: '#002D24' }}
        >
          I understand — continue
        </button>
      </div>
    </div>
  );
}
