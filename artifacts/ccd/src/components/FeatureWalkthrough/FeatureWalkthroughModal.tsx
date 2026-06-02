import { X } from 'lucide-react';
import VideoWithControls from './VideoWithControls';

interface FeatureWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureWalkthroughModal({ isOpen, onClose }: FeatureWalkthroughModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Feature walkthrough"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black/80 px-4 py-3">
        <span className="text-sm font-medium text-white">Feature Walkthrough</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close walkthrough"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <VideoWithControls embedded />
      </div>
    </div>
  );
}
