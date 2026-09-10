/**
 * Jazz North classroom files hosted on DreamHost (rhythmstix.co.uk).
 *
 * Exact filenames match the user’s File Manager listing. Change ONE string
 * (`JN_DREAMHOST_BASE` or env `VITE_JN_DREAMHOST_BASE`) if the folder path differs.
 *
 * Live files sit under `/ccdesignerdocs/Organisations/Jazz North/` (apex host;
 * www redirects from rhythmstix.co.uk). Flat `/ccdesignerdocs/{file}` returns 404.
 */

/** Override with VITE_JN_DREAMHOST_BASE when the live folder path is confirmed. */
export const JN_DREAMHOST_BASE = normalizeBase(
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env
      ?.VITE_JN_DREAMHOST_BASE) ||
    'https://rhythmstix.co.uk/ccdesignerdocs/Organisations/Jazz North/',
);

function normalizeBase(raw: string): string {
  const trimmed = String(raw || '').trim();
  const fallback = 'https://rhythmstix.co.uk/ccdesignerdocs/Organisations/Jazz North/';
  if (!trimmed) return encodeBasePath(fallback);
  return encodeBasePath(trimmed.endsWith('/') ? trimmed : `${trimmed}/`);
}

/** Encode path segments (spaces etc.) while leaving scheme/host untouched. */
function encodeBasePath(base: string): string {
  try {
    const url = new URL(base);
    url.pathname = url.pathname
      .split('/')
      .map((segment) => (segment ? encodeURIComponent(decodeURIComponent(segment)) : ''))
      .join('/');
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    return url.toString();
  } catch {
    return base.endsWith('/') ? base : `${base}/`;
  }
}

/** Exact DreamHost filenames (spaces and spelling preserved). */
export const JN_DREAMHOST_FILES = {
  chantActivities: '2-and 4-chant-activities.pdf',
  chantAudio: '2-and-4-audio-files.zip',
  chantScore: '2-and-4-chant-score-both-versions.pdf',
  canYouSingActivities: 'Can-you-sing-your-song-activites.pdf',
  canYouSingAudio: 'Can-you-sing-your-song-audio-files.zip',
  canYouSingPiano: 'Can-you-sing-your-song-piano-accomp.pdf',
  helloScore: 'Hello song score.pdf',
  helloActivities: 'Hello-song-activities.pdf',
  helloAudio: 'Hello-song-audio-files.zip',
  improvGames: 'Not-quite-jazz-improvisation-games.pdf',
  waysIntoImprov: 'Ways-into-Improvisation.pdf',
  /** Upload these overview PDFs to the same DreamHost folder when ready. */
  mrBigOverview: 'Mr-Big-scheme-overview.pdf',
  playlistMilestonesOverview: 'Playlist-Project-Milestones-overview.pdf',
} as const;

export type JnDreamHostFileKey = keyof typeof JN_DREAMHOST_FILES;

/** Build a direct download URL; encodes spaces and special characters. */
export function jnDreamHostUrl(filename: string): string {
  const encoded = filename
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${JN_DREAMHOST_BASE}${encoded}`;
}

export function jnDreamHostFileUrl(key: JnDreamHostFileKey): string {
  return jnDreamHostUrl(JN_DREAMHOST_FILES[key]);
}
