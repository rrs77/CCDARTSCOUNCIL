/** Royal Opera House / Royal Ballet & Opera partner branding helpers. */

export const ROH_LOGO_SRC = '/partners/royal-opera-house.svg';
export const ROH_FOLDER_NAME = 'ROH';
export const ROH_SITE = 'https://www.rbo.org.uk/schools/';
export const RJ_PROJECT_PREFIX = 'Romeo and Juliet';

/** True when a category belongs under the ROH Romeo and Juliet project. */
export function isRohLibraryCategory(categoryName: string | undefined | null): boolean {
  const n = String(categoryName || '').trim();
  if (!n) return false;
  if (n === 'ROH' || n.startsWith('ROH ') || n.startsWith('ROH —') || n.startsWith('ROH -')) return true;
  if (n.startsWith(RJ_PROJECT_PREFIX)) return true;
  if (n.toLowerCase().includes('romeo and juliet')) return true;
  return false;
}
