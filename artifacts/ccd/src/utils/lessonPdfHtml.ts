/**
 * Shared lesson PDF HTML template used by PDFBolt export and live print preview.
 * Keep styles/structure aligned with LessonPrintModal / PDFBolt A4 settings.
 */
import { sanitizeHtml, escapeHtmlText, sanitizeUrl } from './sanitize';

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const MM_TO_PX = 3.7795275591;
export const A4_WIDTH_PX = A4_WIDTH_MM * MM_TO_PX;
export const A4_HEIGHT_PX = A4_HEIGHT_MM * MM_TO_PX;

/** Match PDFBolt margin settings used by LessonPrintModal / share export. */
export const PDFBOLT_MARGINS = {
  top: '15px',
  right: '20px',
  left: '20px',
  bottom: '55px',
} as const;

export type LessonPdfActivity = {
  activity: string;
  category: string;
  time?: number;
  description?: string;
  activityText?: string;
  videoLink?: string;
  musicLink?: string;
  backingLink?: string;
  resourceLink?: string;
  link?: string;
  vocalsLink?: string;
  imageLink?: string;
  canvaLink?: string;
};

export type LessonPdfSection = {
  id?: string;
  kind: string;
  title: string;
  bodyHtml?: string;
  activity?: LessonPdfActivity;
  durationMins?: number;
};

export type LessonPdfData = {
  title?: string;
  lessonName?: string;
  totalTime?: number;
  customHeader?: string;
  assessmentObjectives?: string[];
  learningOutcome?: string;
  successCriteria?: string;
  introduction?: string;
  mainActivity?: string;
  plenary?: string;
  vocabulary?: string;
  keyQuestions?: string;
  resources?: string;
  differentiation?: string;
  assessment?: string;
  notes?: string;
  orderedActivities?: LessonPdfActivity[];
  grouped?: Record<string, LessonPdfActivity[]>;
  categoryOrder?: string[];
  lessonStandards?: string[];
  /** Flexible planner sections — when present, rendered in order (activities + free sections). */
  sections?: LessonPdfSection[];
};

export type BuildLessonPdfHtmlOptions = {
  lessonData: LessonPdfData;
  sheetDisplay: string;
  lessonNumber?: string;
  halfTermName?: string;
  unitName?: string;
  printTitle?: string;
  getCategoryColor?: (category: string) => string;
};

function removeBulletPoints(html: string): string {
  return html
    .replace(/<li[^>]*>/gi, '<br/>')
    .replace(/<\/li>/gi, '')
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<\/ul>/gi, '')
    .replace(/\n/g, '<br>');
}

function renderCleanSection(title: string, content: string): string {
  return `
    <div style="margin-bottom: 12px;">
      <div style="display: flex; align-items: center; margin-bottom: 4px;">
        <h3 style="font-size: 13px; font-weight: 600; color: #111827; margin: 0;">${title}</h3>
      </div>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
        <div style="font-size: 10px; color: #374151; line-height: 1.5;">${content}</div>
      </div>
    </div>
  `;
}

function renderActivityCard(
  activity: LessonPdfActivity,
  categoryColor: string,
): string {
  const resources: { label: string; url: string; className: string }[] = [];
  if (activity.videoLink) resources.push({ label: 'Video', url: activity.videoLink, className: 'resource-video' });
  if (activity.musicLink) resources.push({ label: 'Music', url: activity.musicLink, className: 'resource-music' });
  if (activity.backingLink) resources.push({ label: 'Backing', url: activity.backingLink, className: 'resource-backing' });
  if (activity.resourceLink) resources.push({ label: 'Resource', url: activity.resourceLink, className: 'resource-resource' });
  if (activity.link) resources.push({ label: 'Link', url: activity.link, className: 'resource-link' });
  if (activity.vocalsLink) resources.push({ label: 'Vocals', url: activity.vocalsLink, className: 'resource-vocals' });
  if (activity.imageLink) resources.push({ label: 'Image', url: activity.imageLink, className: 'resource-image' });
  if (activity.canvaLink) resources.push({ label: 'Canva', url: activity.canvaLink, className: 'resource-canva' });

  const desc = activity.description || '';
  const descHtml = sanitizeHtml(desc.includes('<') ? desc : desc.replace(/\n/g, '<br>'));

  let html = `
    <div class="activity-card" style="border-left: 3px solid ${categoryColor};">
      <div class="activity-header">
        <span class="activity-title">${escapeHtmlText(activity.activity)}</span>
        ${activity.time && activity.time > 0 ? `<span class="activity-time">${activity.time} min</span>` : ''}
      </div>
      <div class="activity-body">
        ${activity.activityText ? `<p style="font-weight: 500; margin-bottom: 6px;">${sanitizeHtml(activity.activityText)}</p>` : ''}
        <div>${descHtml}</div>
  `;
  if (resources.length > 0) {
    html += `<div class="activity-resources">`;
    resources.forEach((r) => {
      html += `<a href="${sanitizeUrl(r.url)}" target="_blank" rel="noopener noreferrer" class="resource-tag ${r.className}">${escapeHtmlText(r.label)}</a>`;
    });
    html += `</div>`;
  }
  html += `</div></div>`;
  return html;
}

/** CSS shared by PDFBolt HTML and the live A4 print preview. */
export function getLessonPdfStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1a1a1a;
      background: #fff;
    }
    @page { size: A4; margin: 12mm 15mm 25mm 15mm; }
    .lesson-page {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 0;
      position: relative;
      min-height: calc(100vh - 25mm);
    }
    .lesson-header {
      background: #0f766e;
      color: white;
      padding: 20px 24px;
      border-radius: 8px 8px 0 0;
      margin-bottom: 0;
    }
    .lesson-header h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 6px;
      letter-spacing: -0.02em;
      color: white;
    }
    .lesson-header .subtitle {
      font-size: 14px;
      opacity: 0.95;
      font-weight: 500;
      margin-bottom: 10px;
    }
    .lesson-header .meta {
      display: flex;
      gap: 20px;
      margin-top: 8px;
      font-size: 11px;
      opacity: 0.9;
    }
    .lesson-header .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .content-wrapper {
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 8px 8px;
      padding: 16px;
      background: #fff;
    }
    .section-card {
      background: white;
      border-radius: 6px;
      margin-bottom: 10px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      page-break-inside: avoid;
    }
    .section-header {
      padding: 8px 12px;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }
    .section-content {
      padding: 10px 12px;
      font-size: 10px;
      line-height: 1.5;
    }
    .activity-section { margin-top: 16px; }
    .category-group {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 10px;
    }
    .activity-category {
      font-size: 14px;
      font-weight: 700;
      color: #B8860B;
      padding: 8px 0;
      margin-bottom: 10px;
    }
    .activity-card {
      background: white;
      border: 1px solid #d1e7dd;
      border-radius: 6px;
      margin-bottom: 10px;
      overflow: hidden;
      border-left: 4px solid #0f766e;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: #E6F7ED;
      border-bottom: 1px solid #d1e7dd;
    }
    .activity-title { font-weight: 700; font-size: 12px; color: #0f766e; }
    .activity-time {
      background: #0f766e;
      color: white;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 600;
    }
    .activity-body {
      padding: 12px 14px;
      font-size: 11px;
      color: #1f2937;
      line-height: 1.5;
    }
    .activity-resources {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
    }
    .resource-tag {
      font-size: 10px;
      padding: 4px 10px;
      font-weight: 500;
      text-decoration: none;
      border-radius: 50px;
      display: inline-block;
    }
    .resource-tag.resource-video { color: #dc2626; border: 2px solid #dc2626; background: #fef2f2; }
    .resource-tag.resource-music { color: #16a34a; border: 2px solid #16a34a; background: #f0fdf4; }
    .resource-tag.resource-backing { color: #2563eb; border: 2px solid #2563eb; background: #eff6ff; }
    .resource-tag.resource-resource { color: #9333ea; border: 2px solid #9333ea; background: #faf5ff; }
    .resource-tag.resource-link { color: #6b7280; border: 2px solid #6b7280; background: #f9fafb; }
    .resource-tag.resource-vocals { color: #ea580c; border: 2px solid #ea580c; background: #fff7ed; }
    .resource-tag.resource-image { color: #db2777; border: 2px solid #db2777; background: #fdf2f8; }
    .resource-tag.resource-canva { color: #4f46e5; border: 2px solid #4f46e5; background: #eef2ff; }
    .learning-outcome-content ul,
    .learning-outcome-content ol,
    .success-criteria-content ul,
    .success-criteria-content ol {
      list-style: none !important;
      padding-left: 0 !important;
      margin: 0 !important;
    }
    .learning-outcome-content li,
    .success-criteria-content li {
      list-style: none !important;
      padding-left: 0 !important;
      margin-left: 0 !important;
    }
    @media print {
      body { background: white; }
      .lesson-page { box-shadow: none; min-height: auto; }
      .content-wrapper { background: white; }
    }
  `;
}

/** Inner page markup for one lesson (no document chrome). */
export function renderLessonPdfPage(options: BuildLessonPdfHtmlOptions): string {
  const {
    lessonData,
    sheetDisplay,
    lessonNumber = '1',
    halfTermName,
    unitName,
    getCategoryColor = () => '#0f766e',
  } = options;

  const displayNum = String(lessonNumber).replace(/^lesson/i, '').replace(/[^0-9]/g, '') || lessonNumber;
  const lessonTitle = lessonData.title || `Lesson ${displayNum}`;
  const lessonSubtitle =
    lessonData.lessonName || `${halfTermName || unitName || 'Term'} - ${sheetDisplay}`;

  let html = `
    <div class="lesson-header">
      <h1>${escapeHtmlText(lessonData.customHeader || lessonTitle)}</h1>
      <div class="subtitle">${escapeHtmlText(lessonSubtitle)}</div>
      <div class="meta">
        <span class="meta-item">📚 ${escapeHtmlText(sheetDisplay)}</span>
        <span class="meta-item">⏱ ${
          lessonData.totalTime && lessonData.totalTime > 0
            ? lessonData.totalTime
            : (lessonData.orderedActivities || []).reduce((s, a) => s + (a.time || 0), 0) || '—'
        } mins</span>
        ${
          halfTermName || unitName
            ? `<span class="meta-item">📅 ${escapeHtmlText(halfTermName || unitName || '')}</span>`
            : ''
        }
      </div>
    </div>
    <div class="content-wrapper">
  `;

  if (lessonData.learningOutcome || lessonData.successCriteria) {
    html += `
      <div style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0;">Learning Goals</h3>
        </div>
    `;
    if (lessonData.learningOutcome) {
      html += `
        <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px; margin-bottom: 10px; overflow: hidden; box-sizing: border-box;">
          <h4 style="font-size: 12px; font-weight: 600; color: #92400e; margin: 0 0 6px 0;">Lesson Outcomes</h4>
          <div class="learning-outcome-content" style="font-size: 11px; color: #1f2937; line-height: 1.5;">
            ${removeBulletPoints(sanitizeHtml(lessonData.learningOutcome))}
          </div>
        </div>
      `;
    }
    if (lessonData.successCriteria) {
      html += `
        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px; overflow: hidden; box-sizing: border-box;">
          <h4 style="font-size: 12px; font-weight: 600; color: #166534; margin: 0 0 6px 0;">Success Criteria</h4>
          <div class="success-criteria-content" style="font-size: 11px; color: #1f2937; line-height: 1.5;">
            ${removeBulletPoints(sanitizeHtml(lessonData.successCriteria))}
          </div>
        </div>
      `;
    }
    html += `</div>`;
  }

  const standards = lessonData.lessonStandards || [];
  if (standards.length > 0) {
    html += `
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 14px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">Standards (${standards.length})</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; background: #f0fdfa; border: 1px solid #0f766e; border-radius: 8px; padding: 10px;">
    `;
    standards.forEach((standard) => {
      const standardText = standard.includes(':')
        ? standard.split(':').slice(1).join(':').trim()
        : standard;
      html += `
        <span style="display: inline-block; padding: 4px 10px; background: white; border: 1px solid #0f766e; border-radius: 50px; font-size: 10px; color: #0f766e; font-weight: 500;">
          ${escapeHtmlText(standardText.length > 50 ? `${standardText.substring(0, 47)}...` : standardText)}
        </span>
      `;
    });
    html += `</div></div>`;
  }

  const flexibleSections = Array.isArray(lessonData.sections) ? lessonData.sections : [];

  if (flexibleSections.length > 0) {
    html += `
      <div class="activity-section">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #1f2937; margin: 0;">Lesson sequence</h3>
        </div>
    `;
    for (const section of flexibleSections) {
      if (section.kind === 'activity' && section.activity) {
        const cat = section.activity.category || 'Activity';
        html += renderActivityCard(section.activity, getCategoryColor(cat));
      } else if ((section.bodyHtml || '').trim() || section.title) {
        html += renderCleanSection(
          escapeHtmlText(section.title || 'Section'),
          sanitizeHtml(section.bodyHtml || ''),
        );
      }
    }
    html += `</div>`;
  } else {
    const hasPlanDetails =
      (lessonData.assessmentObjectives && lessonData.assessmentObjectives.length > 0) ||
      lessonData.introduction ||
      lessonData.mainActivity ||
      lessonData.plenary ||
      lessonData.vocabulary ||
      lessonData.keyQuestions ||
      lessonData.resources ||
      lessonData.differentiation ||
      lessonData.assessment;

    if (hasPlanDetails) {
      if (lessonData.assessmentObjectives && lessonData.assessmentObjectives.length > 0) {
        const objectivesList = lessonData.assessmentObjectives
          .map(
            (obj, i) =>
              `<div style="margin-bottom: 6px;"><strong style="color: #7c3aed;">${i + 1}.</strong> ${escapeHtmlText(obj)}</div>`,
          )
          .join('');
        html += renderCleanSection('Assessment Objectives', objectivesList);
      }
      if (lessonData.introduction) {
        html += renderCleanSection('Introduction', sanitizeHtml(lessonData.introduction));
      }
      if (lessonData.mainActivity) {
        html += renderCleanSection('Main Activity', sanitizeHtml(lessonData.mainActivity));
      }
      if (lessonData.plenary) {
        html += renderCleanSection('Plenary', sanitizeHtml(lessonData.plenary));
      }
      if (lessonData.vocabulary) {
        const formattedVocab = sanitizeHtml(lessonData.vocabulary).replace(
          /^([^-:]+)(\s*[-:]\s*)/gm,
          '<strong>$1</strong>$2',
        );
        html += renderCleanSection('Vocabulary', formattedVocab);
      }
      if (lessonData.keyQuestions) {
        html += renderCleanSection('Key Questions', sanitizeHtml(lessonData.keyQuestions));
      }
      if (lessonData.resources) {
        html += renderCleanSection('Resources', sanitizeHtml(lessonData.resources));
      }
      if (lessonData.differentiation) {
        const formattedDiff = sanitizeHtml(lessonData.differentiation)
          .replace(/Support:/gi, '<strong>Support:</strong>')
          .replace(/Challenge:/gi, '<strong>Challenge:</strong>');
        html += renderCleanSection('Differentiation', formattedDiff);
      }
      if (lessonData.assessment) {
        html += renderCleanSection('Assessment', sanitizeHtml(lessonData.assessment));
      }
    }

    const activitiesToPrint =
      lessonData.orderedActivities && lessonData.orderedActivities.length > 0
        ? lessonData.orderedActivities
        : (lessonData.categoryOrder || Object.keys(lessonData.grouped || {})).flatMap(
            (category) => lessonData.grouped?.[category] || [],
          );

    const categoriesInOrder: string[] = [];
    const activitiesByCategory: Record<string, LessonPdfActivity[]> = {};
    activitiesToPrint.forEach((activity) => {
      const cat = activity.category || 'Other';
      if (!activitiesByCategory[cat]) {
        activitiesByCategory[cat] = [];
        categoriesInOrder.push(cat);
      }
      activitiesByCategory[cat].push(activity);
    });

    if (categoriesInOrder.length > 0) {
      html += `
        <div class="activity-section">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #1f2937; margin: 0;">Activities from Library</h3>
          </div>
      `;
      categoriesInOrder.forEach((category) => {
        const activities = activitiesByCategory[category] || [];
        if (activities.length === 0) return;
        const categoryColor = getCategoryColor(category);
        html += `<div class="category-group">`;
        html += `<div class="activity-category" style="color: ${categoryColor};">${escapeHtmlText(category)}</div>`;
        activities.forEach((activity) => {
          html += renderActivityCard(activity, categoryColor);
        });
        html += `</div>`;
      });
      html += `</div>`;
    }
  }

  if (lessonData.notes) {
    html += `
      <div class="section-card" style="margin-top: 12px;">
        <div class="section-header" style="background: #f3f4f6; color: #374151; border-left: 4px solid #9ca3af;">
          Teacher Notes
        </div>
        <div class="section-content">${sanitizeHtml(lessonData.notes)}</div>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

/** Full HTML document for PDFBolt / iframe print preview. */
export function buildLessonPdfHtml(options: BuildLessonPdfHtmlOptions): string {
  const title = options.printTitle || options.lessonData.title || 'Lesson Plan';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtmlText(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${getLessonPdfStyles()}</style>
</head>
<body>
  <div class="lesson-page">
    ${renderLessonPdfPage(options)}
  </div>
</body>
</html>`;
}

/** Default PDFBolt footer template (base64-encoded by callers). */
export function buildLessonPdfFooterTemplate(options: {
  sheetDisplay: string;
  footerCompany?: string;
  footerYear?: string | number;
  customFooter?: string;
}): string {
  const company = options.footerCompany || 'CCD';
  const year = options.footerYear || new Date().getFullYear();
  const center =
    options.customFooter ||
    [options.sheetDisplay || '', `© ${company} ${year}`].filter(Boolean).join(' • ');
  return `
    <div style="width:100%; font-size:9px; padding:0 20px; color:#6b7280; display:flex; justify-content:space-between; align-items:center;">
      <span>Creative Curriculum Designer</span>
      <span>${escapeHtmlText(center)}</span>
      <span style="background:#f3f4f6; padding:2px 8px; border-radius:9999px;">Page <span class="pageNumber"></span></span>
    </div>
  `;
}
