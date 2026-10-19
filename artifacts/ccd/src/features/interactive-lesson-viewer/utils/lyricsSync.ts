import type { LyricLine } from '../types';
import { createId } from '../types';

/** Split pasted lyrics into non-empty lines. */
export function parseLyricLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * Evenly distribute lines across the track duration (fallback when no STT key).
 * Teachers can then nudge/drag on the lyrics timeline or use tap-to-sync.
 */
export function autoAlignLyrics(texts: string[], durationMs: number): LyricLine[] {
  const n = texts.length;
  if (n === 0) return [];
  const slice = Math.max(800, Math.floor(durationMs / n));
  return texts.map((text, i) => ({
    id: createId('ly'),
    text,
    startMs: i * slice,
    endMs: Math.min(durationMs, (i + 1) * slice),
  }));
}

/** Apply a tap timestamp as the start of the next unsynced / sequential line. */
export function applyTapSync(
  lines: LyricLine[],
  tapMs: number,
  lineIndex: number,
  trackDurationMs: number,
): LyricLine[] {
  if (lineIndex < 0 || lineIndex >= lines.length) return lines;
  const next = lines.map((l) => ({ ...l }));
  next[lineIndex] = {
    ...next[lineIndex],
    startMs: Math.max(0, Math.min(tapMs, trackDurationMs)),
  };
  // Close previous line end at this tap
  if (lineIndex > 0) {
    next[lineIndex - 1] = {
      ...next[lineIndex - 1],
      endMs: Math.max(next[lineIndex - 1].startMs + 200, tapMs),
    };
  }
  // Provisional end for current line
  const provisionalEnd =
    lineIndex + 1 < next.length
      ? Math.max(tapMs + 200, next[lineIndex + 1].startMs)
      : trackDurationMs;
  next[lineIndex].endMs = Math.min(trackDurationMs, provisionalEnd);
  return next;
}

export function activeLyricIndex(lines: LyricLine[], timeMs: number): number {
  return lines.findIndex((l) => timeMs >= l.startMs && timeMs < l.endMs);
}

export function nudgeLyric(
  lines: LyricLine[],
  id: string,
  deltaMs: number,
  trackDurationMs: number,
): LyricLine[] {
  return lines.map((l) => {
    if (l.id !== id) return l;
    const startMs = Math.max(0, Math.min(trackDurationMs - 200, l.startMs + deltaMs));
    const endMs = Math.max(startMs + 200, Math.min(trackDurationMs, l.endMs + deltaMs));
    return { ...l, startMs, endMs };
  });
}

export function resizeLyric(
  lines: LyricLine[],
  id: string,
  startMs: number,
  endMs: number,
  trackDurationMs: number,
): LyricLine[] {
  return lines.map((l) => {
    if (l.id !== id) return l;
    const s = Math.max(0, Math.min(startMs, trackDurationMs - 200));
    const e = Math.max(s + 200, Math.min(endMs, trackDurationMs));
    return { ...l, startMs: s, endMs: e };
  });
}
