/** Tri-Borough Music Hub (TBMH) branding helpers. */

export const TBMH_LOGO_SRC = '/partners/tri-borough-music-hub.png';
export const TBMH_SITE = 'https://www.triboroughmusichub.org/';
export const TBMH_SCHOOLS = 'https://www.triboroughmusichub.org/schools';
export const TBMH_ABOUT = 'https://www.triboroughmusichub.org/about-us/';
export const TBMH_VIRTUAL_MUSIC_SCHOOL =
  'https://www.triboroughmusichub.org/tbmh-virtual-music-school';
export const TBMH_CURRICULUM_GUIDANCE =
  'https://www.triboroughmusichub.org/school-services/curriculum-guidance-for-schools/';
export const TBMH_SERVICES_2026 =
  'https://www.triboroughmusichub.org/school-services/music-hub-services-for-schools-2026-2027-academic-year/';

/** Prototype course-note PDFs (generated; not official TBMH packs). */
export const TBMH_GNP_COURSE_NOTES_PDF =
  '/partners/triborough/tbmh-groove-n-play-course-notes.pdf';
export const TBMH_MUSIC_MAKES_ME_COURSE_NOTES_PDF =
  '/partners/triborough/tbmh-music-makes-me-course-notes.pdf';

export function isTbmhLibraryCategory(categoryName: string | undefined | null): boolean {
  const n = String(categoryName || '').trim();
  if (!n) return false;
  if (n.startsWith('TBMH') || n.startsWith('Tri-Borough') || n.startsWith('Groove')) return true;
  return false;
}
