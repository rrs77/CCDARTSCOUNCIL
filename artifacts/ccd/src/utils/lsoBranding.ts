/** LSO partner branding helpers for Activity Library / Lesson Builder. */

export const LSO_LOGO_SRC = '/partners/lso.svg';
export const LSO_FOLDER_NAME = 'LSO';
export const HTBAO_PROJECT_PREFIX = 'How to Build an Orchestra';

/** True when a category belongs under the LSO brand area (any LSO project). */
export function isLsoLibraryCategory(categoryName: string | undefined | null): boolean {
  const n = String(categoryName || '').trim();
  if (!n) return false;
  if (n === 'LSO' || n.startsWith('LSO ') || n.startsWith('LSO —') || n.startsWith('LSO -')) return true;
  if (n.startsWith(HTBAO_PROJECT_PREFIX)) return true;
  if (n.toLowerCase().includes('how to build an orchestra')) return true;
  return false;
}
