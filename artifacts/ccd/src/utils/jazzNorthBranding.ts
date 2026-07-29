/** Jazz North partner branding helpers. */

export const JN_LOGO_SRC = '/partners/jazz-north.png';
export const JN_SITE = 'https://www.jazznorth.org/';
export const JN_LEARNING_RESOURCES = 'https://www.jazznorth.org/learning-resources-area';
export const JN_MR_BIG = 'https://www.jazznorth.org/mr-big-scheme-of-work';
export const JN_PLAYLIST_PROJECT = 'https://www.jazznorth.org/playlist-project';
export const JN_JAZZ_CAMP = 'https://www.jazznorth.org/jazz-camp-for-girls';
export const JN_EDUCATORS_FORUM =
  'https://www.jazznorth.org/news/educators-forum-june-2026';
export const JN_NORTHERN_LINE = 'https://www.jazznorth.org/northern-line';
export const JN_NEW_NORTHERN =
  'https://www.jazznorth.org/news/jazz-north-announces-the-latest-round-of-new-northern-for-2026-27';
export const JN_WHAT_WE_DO = 'https://www.jazznorth.org/what-we-do';
export const JN_CONTACT = 'https://www.jazznorth.org/contact';
export const JN_TEAM = 'https://www.jazznorth.org/meet-the-team';

/** Prototype showcase lesson PDF (generated; not an official pack). */
export const JN_SHOWCASE_LESSON_PDF =
  '/partners/jazznorth/jn-mr-big-lesson-overview.pdf';
export const JN_PLAYLIST_PDF =
  '/partners/jazznorth/jn-playlist-milestones-overview.pdf';
export const JN_FOLDER_NAME = 'Jazz North';

/** Brand pink sampled from official Jazz North logo asset. */
export const JN_PINK = '#FF53B6';
export const JN_DARK = '#1A0A14';

export interface JnLinkedImage {
  title: string;
  href: string;
  imageSrc: string;
  kind?: string;
}

/**
 * Programme / resource highlights — official Jazz North pages.
 * Thumbnails hotlinked from jazznorth.org Squarespace assets where useful.
 */
export const JN_PROGRAMME_GALLERY: JnLinkedImage[] = [
  {
    title: 'Jazz Camp for Girls',
    href: JN_JAZZ_CAMP,
    imageSrc:
      'https://images.squarespace-cdn.com/content/v1/64870b691132e537a90fde8f/73c1f07a-d431-40ca-8643-5d1a5537bf24/JCFG+website+asset+2-3+2026.png?format=500w',
    kind: 'Learning',
  },
  {
    title: 'Playlist Project',
    href: JN_PLAYLIST_PROJECT,
    imageSrc:
      'https://images.squarespace-cdn.com/content/v1/64870b691132e537a90fde8f/37207f46-bba8-4b10-a730-77d59ebbf6c6/JCFG-2023-Hull-1971_Porl.Medlock.jpg?format=500w',
    kind: 'KS2',
  },
  {
    title: 'Northern Line',
    href: JN_NORTHERN_LINE,
    imageSrc:
      'https://images.squarespace-cdn.com/content/v1/64870b691132e537a90fde8f/e5825de7-8506-44f3-9522-3a09a4e80661/_PMP2410_Porl.Medlock.jpg?format=500w',
    kind: 'Artists',
  },
];

export function isJazzNorthLibraryCategory(
  categoryName: string | undefined | null,
): boolean {
  const n = String(categoryName || '').trim();
  if (!n) return false;
  if (n.startsWith('Jazz North') || n.startsWith('JN ')) return true;
  return false;
}
