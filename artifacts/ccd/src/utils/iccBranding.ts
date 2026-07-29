/** iCompose partner branding helpers. */

export const ICC_LOGO_SRC = '/partners/icompose-logo.svg';
export const ICC_SITE = 'https://www.icancompose.com/';
export const ICC_KS3_TRACK = 'https://www.icancompose.com/course-track/ks3/';
export const ICC_COURSES = 'https://www.icancompose.com/courses/';
export const ICC_TEACHER_RESOURCES =
  'https://www.icancompose.com/product-category/teachers-resources/';
export const ICC_FOLDER_NAME = 'iCompose';

/** Prototype overview PDFs (generated; not official course packs). */
export const ICC_GETTING_STARTED_PDF =
  '/partners/icompose/icc-getting-started-lesson-overview.pdf';
export const ICC_FANFARE_PDF = '/partners/icompose/icc-fanfare-lesson-overview.pdf';

export function isIccLibraryCategory(categoryName: string | undefined | null): boolean {
  const n = String(categoryName || '').trim();
  if (!n) return false;
  if (n.startsWith('ICC') || n.startsWith('iCompose') || n.startsWith('I Can Compose')) return true;
  if (n.toLowerCase().includes('getting started with composition')) return true;
  return false;
}
