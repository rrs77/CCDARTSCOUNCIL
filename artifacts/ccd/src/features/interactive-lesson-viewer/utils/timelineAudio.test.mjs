/**
 * Run: node --test artifacts/ccd/src/features/interactive-lesson-viewer/utils/timelineAudio.test.mjs
 * Mirrors sceneLayoutMs / snap helpers (avoids TS extensionless imports under strip-types).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

function sceneLayoutMs(scene) {
  if (scene.durationMs > 0) return scene.durationMs;
  return 4000;
}

function sceneLayoutOffsets(scenes) {
  const starts = [];
  let t = 0;
  for (const s of scenes) {
    starts.push(t);
    t += sceneLayoutMs(s);
  }
  return { starts, total: t };
}

function snapToTimelineGuides(ms, scenes, guides = [], thresholdMs = 400) {
  const { starts, total } = sceneLayoutOffsets(scenes);
  const bounds = [...starts, total, ...guides];
  let best = ms;
  let bestDist = Infinity;
  for (const b of bounds) {
    const d = Math.abs(b - ms);
    if (d < bestDist && d <= thresholdMs) {
      bestDist = d;
      best = b;
    }
  }
  return Math.max(0, Math.min(total, best));
}

const scene = (durationMs) => ({ durationMs });

describe('timelineAudio layout (mirrored)', () => {
  it('uses nominal width for zero-duration scenes', () => {
    assert.equal(sceneLayoutMs(scene(0)), 4000);
    assert.equal(sceneLayoutMs(scene(8000)), 8000);
  });

  it('sums layout offsets', () => {
    const { starts, total } = sceneLayoutOffsets([scene(2000), scene(0), scene(3000)]);
    assert.deepEqual(starts, [0, 2000, 6000]);
    assert.equal(total, 9000);
  });

  it('snaps to scene boundaries and extra guides', () => {
    const scenes = [scene(5000), scene(5000)];
    assert.equal(snapToTimelineGuides(4800, scenes, [], 400), 5000);
    assert.equal(snapToTimelineGuides(2500, scenes, [2400], 200), 2400);
  });
});
