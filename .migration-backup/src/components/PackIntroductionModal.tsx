import React from 'react';
import { X, Save } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

interface PackIntroductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  packName?: string;
}

export function PackIntroductionModal({
  isOpen,
  onClose,
  value,
  onChange,
  onSave,
  packName
}: PackIntroductionModalProps) {
  if (!isOpen) return null;

  const handleSave = () => {
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[90]" role="dialog" aria-modal="true" aria-labelledby="pack-intro-title">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-teal-50">
          <div>
            <h2 id="pack-intro-title" className="text-xl font-bold text-gray-900">
              Introduction to this pack
            </h2>
            {packName && (
              <p className="text-sm text-gray-600 mt-0.5">{packName}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              This text is shown to users when they view the pack. Use it to introduce the content, how to use it, or key information.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/80 rounded-lg"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-[200px]">
          <RichTextEditor
            value={value}
            onChange={onChange}
            placeholder="Write an introduction for this resource pack..."
            minHeight="200px"
            maxHeight="50vh"
            className="bg-white border border-gray-200 rounded-lg"
          />
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save introduction
          </button>
        </div>
      </div>
    </div>
  );
}
