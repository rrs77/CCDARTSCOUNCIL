/**
 * Legacy Help modal entry — redirects to the full-page Help centre at `/help`.
 * Prefer `navigateToHelp()` from `./help` for new call sites.
 */
import { useEffect } from 'react';
import { navigateToHelp, type HelpTopicId, isHelpTopicId } from './help';

export type HelpGuideSection = HelpTopicId;

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: HelpGuideSection;
}

export function HelpGuide({ isOpen, onClose, initialSection }: HelpGuideProps) {
  useEffect(() => {
    if (!isOpen) return;
    const topic =
      initialSection && isHelpTopicId(initialSection) ? initialSection : null;
    navigateToHelp(topic);
    onClose();
  }, [isOpen, initialSection, onClose]);

  return null;
}
