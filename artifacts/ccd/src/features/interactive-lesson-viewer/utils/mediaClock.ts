/**
 * Pure helpers for media-driven playback (video/audio scenes that advance on media end).
 * Kept dependency-free so they can be unit-tested directly.
 */

/** HTMLMediaElement.HAVE_FUTURE_DATA — enough buffered to play without stalling. */
export const MEDIA_READY_STATE = 3;
/** Re-sync threshold for clock-driven media (seconds). */
export const MEDIA_SEEK_TOLERANCE_SEC = 0.35;
/** Safety net: advance a media-end scene only if its media makes no progress for this long. */
export const MEDIA_STALL_FALLBACK_MS = 10_000;

export interface MediaDrivenSceneLike {
  type: string;
  mediaUrl?: string;
}

/**
 * Media-end video/audio scenes are timed by the media element itself,
 * never by the player's wall clock.
 */
export function isMediaDrivenScene(
  scene: MediaDrivenSceneLike | null | undefined,
  advanceMode: string,
  mediaUrlOverride?: string | null,
): boolean {
  if (!scene || advanceMode !== 'media-end') return false;
  if (!(mediaUrlOverride || scene.mediaUrl)) return false;
  return scene.type === 'video' || scene.type === 'audio' || scene.type === 'lyrics';
}

export interface SeekCheck {
  mediaDriven: boolean;
  readyState: number;
  seeking: boolean;
  currentTimeSec: number;
  targetSec: number;
}

/** Only re-seek clock-driven media that is ready and not already seeking. */
export function shouldSeekMedia(c: SeekCheck): boolean {
  if (c.mediaDriven) return false;
  if (c.seeking) return false;
  if (c.readyState < MEDIA_READY_STATE) return false;
  return Math.abs(c.currentTimeSec - c.targetSec) > MEDIA_SEEK_TOLERANCE_SEC;
}

/** True when the browser refused unmuted autoplay. */
export function isAutoplayBlocked(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && (err as { name?: string }).name === 'NotAllowedError');
}

/** Media-end safety net: no media progress for MEDIA_STALL_FALLBACK_MS. */
export function mediaStalled(nowMs: number, lastProgressAtMs: number): boolean {
  return nowMs - lastProgressAtMs >= MEDIA_STALL_FALLBACK_MS;
}
