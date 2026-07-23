/** Drama Resource (David Farmer) partner branding helpers. */

export const DR_LOGO_SRC = '/partners/drama-resource.svg';
export const DR_SITE = 'https://dramaresource.com/';
export const DR_LESSON_PLANS = 'https://dramaresource.com/lesson-plans/';
export const DR_DRAMA_GAMES = 'https://dramaresource.com/drama-games/';
export const DR_STRATEGIES = 'https://dramaresource.com/drama-strategies/';
export const DR_JUST_ADD_DRAMA = 'https://dramaresource.com/just-add-drama/';
export const DR_CPD = 'https://dramaresource.com/drama-cpd-courses-inset/';
export const DR_TEN_SECOND_OBJECTS = 'https://dramaresource.com/ten-second-objects/';
export const DR_FOLDER_NAME = 'Drama Resource';

export function isDramaResourceLibraryCategory(
  categoryName: string | undefined | null,
): boolean {
  const n = String(categoryName || '').trim();
  if (!n) return false;
  if (n.startsWith('Drama Resource') || n.startsWith('DR ')) return true;
  return false;
}
