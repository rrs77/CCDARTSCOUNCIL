/** Read-only classroom player deep links (signed-in share; optional planner return). */

export type PlayerLinkOpts = {
  /** 1-based scene number for teachers. */
  scene?: number;
  /**
   * Same-origin relative path back to the planner, e.g.
   * `/?tab=unit-viewer&view=week&date=2026-11-03&lesson=<planId>`.
   * Must start with `/?tab=` or it is ignored (open-redirect guard).
   */
  returnTo?: string;
};

/** Validate a return path: same-origin relative, planner-safe. */
export function sanitizePlayerReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const trimmed = decoded.trim();
  if (!trimmed.startsWith('/?tab=')) return null;
  if (trimmed.includes('://') || trimmed.startsWith('//')) return null;
  if (trimmed.includes('\\') || /\s/.test(trimmed)) return null;
  // Reject javascript: and other schemes smuggled after ?
  if (/[<>"']/.test(trimmed)) return null;
  return trimmed;
}

export function buildPlayerPath(lessonId: string, opts?: PlayerLinkOpts): string {
  const scene =
    opts?.scene != null && opts.scene > 0 ? `&scene=${encodeURIComponent(String(opts.scene))}` : '';
  const safeReturn = sanitizePlayerReturnTo(opts?.returnTo);
  const ret = safeReturn ? `&return=${encodeURIComponent(safeReturn)}` : '';
  return `/?tab=lesson-viewer&play=${encodeURIComponent(lessonId)}&mode=player${scene}${ret}`;
}

export function buildPlayerUrl(
  lessonId: string,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
  opts?: PlayerLinkOpts,
): string {
  return `${origin}${buildPlayerPath(lessonId, opts)}`;
}

export function buildPlayerEmbedSnippet(
  lessonId: string,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
): string {
  // Share/embed links never include return= (pupil-safe).
  const src = buildPlayerUrl(lessonId, origin);
  return `<iframe src="${src}" title="Slides" width="960" height="540" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="border:0;border-radius:12px;max-width:100%;aspect-ratio:16/9;"></iframe>`;
}

/** Build a planner return path for Present full screen. */
export function buildPlannerReturnPath(opts: {
  view?: string;
  date?: string;
  lessonPlanId?: string;
  tab?: string;
}): string {
  const tab = opts.tab || 'unit-viewer';
  const params = new URLSearchParams();
  params.set('tab', tab);
  if (opts.view) params.set('view', opts.view);
  if (opts.date) params.set('date', opts.date);
  if (opts.lessonPlanId) params.set('lesson', opts.lessonPlanId);
  return `/?${params.toString()}`;
}

export function readPlayerLaunchFromLocation(search = typeof window !== 'undefined' ? window.location.search : ''): {
  playId: string | null;
  playerOnly: boolean;
  sceneIndex: number;
  returnTo: string | null;
} {
  try {
    const params = new URLSearchParams(search);
    const play = params.get('play');
    const mode = params.get('mode');
    const sceneRaw = params.get('scene');
    const sceneNum = sceneRaw != null ? Number(sceneRaw) : 0;
    // scene query is 1-based for teachers; convert to 0-based index
    const sceneIndex =
      Number.isFinite(sceneNum) && sceneNum >= 1 ? Math.floor(sceneNum) - 1 : 0;
    return {
      playId: play,
      playerOnly: mode === 'player' || Boolean(play && mode !== 'edit'),
      sceneIndex,
      returnTo: sanitizePlayerReturnTo(params.get('return')),
    };
  } catch {
    return { playId: null, playerOnly: false, sceneIndex: 0, returnTo: null };
  }
}
