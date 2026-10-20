import React from 'react';
import { ActivityEditorPage } from './ActivityEditorPage';

interface ActivityCreatorProps {
  onClose: () => void;
  onSave: (activity: any) => void;
  categories: string[];
  levels: string[];
}

/**
 * Create-activity entry point. Renders the full-page editor (option A)
 * instead of a modal so teachers get the same workspace as Edit.
 */
export function ActivityCreator({ onClose, onSave }: ActivityCreatorProps) {
  return (
    <ActivityEditorPage
      mode="create"
      onCancel={onClose}
      onSave={onSave}
    />
  );
}
