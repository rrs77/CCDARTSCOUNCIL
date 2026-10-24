import { sanitizeHtml } from '../sanitize';
import { planLogoHtml } from '../planLogo';
import {
  buildRhythmstixDoc,
  renderRhythmstixHtml,
  type RhythmstixTemplate,
  type RhythmstixTemplateId,
} from './rhythmstixTemplates';

/** App wrapper: lesson → sanitised Rhythmstix A4 HTML for preview and print. */
export function renderLessonTemplateHtml(
  lesson: Record<string, any>,
  opts: { templateId: RhythmstixTemplateId; template?: RhythmstixTemplate; yearGroup?: string; lessonNumber?: string },
): string {
  const doc = buildRhythmstixDoc(lesson, opts);
  return renderRhythmstixHtml(doc, { sanitizeHtml, logoHtml: planLogoHtml(40) });
}
