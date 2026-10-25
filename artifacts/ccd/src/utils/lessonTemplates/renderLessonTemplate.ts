import { sanitizeHtml } from '../sanitize';
import { planLogoImg } from '../planLogo';
import {
  buildRhythmstixDoc,
  renderRhythmstixHtml,
  type RhythmstixTemplate,
  type RhythmstixTemplateId,
} from './rhythmstixTemplates';

/** App wrapper: lesson → sanitised Rhythmstix A4 HTML for preview and print. */
export function renderLessonTemplateHtml(
  lesson: Record<string, any>,
  opts: { templateId: RhythmstixTemplateId; template?: RhythmstixTemplate; yearGroup?: string; subject?: string; lessonNumber?: string },
): string {
  const baseUrl = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : undefined;
  const doc = buildRhythmstixDoc(lesson, { ...opts, baseUrl });
  return renderRhythmstixHtml(doc, { sanitizeHtml, logoHtml: planLogoImg() });
}
