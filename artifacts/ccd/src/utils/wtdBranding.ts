/** We Teach Drama partner branding helpers. */

export const WTD_LOGO_SRC = '/partners/we-teach-drama.svg';
export const WTD_SITE = 'https://www.weteachdrama.com/';
export const WTD_FOLDER_NAME = 'We Teach Drama';
export const WTD_BB_PREFIX = 'Blood Brothers';

const WTD_CATEGORY_PREFIXES = [
  'WTD Cover',
  'WTD Designer',
  'WTD Challenge Mats',
  'WTD Katie Mitchell',
  'WTD Complicite',
  'WTD Practitioners',
  'Blood Brothers',
  'We Teach Drama',
  'WTD',
];

export function isWtdLibraryCategory(categoryName: string | undefined | null): boolean {
  const n = String(categoryName || '').trim();
  if (!n) return false;
  if (WTD_CATEGORY_PREFIXES.some((p) => n === p || n.startsWith(`${p} —`) || n.startsWith(p))) {
    return true;
  }
  if (n.toLowerCase().includes('blood brothers')) return true;
  return false;
}
