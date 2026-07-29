/** Essex Music Service / Greater Essex Music Hub branding. */

export const EMS_LOGO_SRC = '/partners/essex-music-service.svg';
export const EMS_SITE = 'https://www.essexmusicservice.org.uk/';
export const EMS_CURRICULUM_PAGE =
  'https://www.essexmusicservice.org.uk/site/school-provision/music-curriculum-and-cpd-resources/';
export const EMS_CONTACT_PAGE = 'https://www.essexmusicservice.org.uk/site/contact/';
export const EMS_YOUTUBE = 'https://www.youtube.com/channel/UC5vBOfpSBQb4iUaLpHGEgwg';
/** Featured schools digital brochure (official host). */
export const EMS_SCHOOLS_BROCHURE_PDF =
  'https://www.essexmusicservice.org.uk/files/2024/06/DS24_8347-Music-Service-Schools-Digitalv2.pdf';
export const EMS_SCHOOLS_BROCHURE_LOCAL = '/demo-resources/ems-schools-brochure.pdf';
export const EMS_SCHOOLS_BROCHURE_TITLE = 'Music Service Schools digital brochure';
export const EMS_FOLDER_NAME = 'Essex Music Service';

/** Curriculum enhancement workshops (official page). */
export const EMS_WORKSHOPS_PAGE =
  'https://www.essexmusicservice.org.uk/site/making-music-in-school/curriculum-enhancement-workshops/';
export const EMS_DJ_WORKSHOP_PAGE = `${EMS_WORKSHOPS_PAGE}#dj-workshops`;
export const EMS_RAP_IT_WORKSHOP_PAGE = `${EMS_WORKSHOPS_PAGE}#rap-it`;

/** Prototype course-note PDFs (generated; not official EMS packs). */
export const EMS_DJ_COURSE_NOTES_PDF = '/partners/ems/ems-dj-workshop-course-notes.pdf';
export const EMS_RAP_IT_COURSE_NOTES_PDF = '/partners/ems/ems-rap-it-workshop-course-notes.pdf';

export function isEmsLibraryCategory(categoryName: string | undefined | null): boolean {
  const n = String(categoryName || '').trim();
  if (!n) return false;
  if (n.startsWith('EMS') || n.startsWith('Essex Music')) return true;
  return false;
}
