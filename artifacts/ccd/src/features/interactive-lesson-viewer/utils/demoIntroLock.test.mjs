/**
 * Built-in demo intro lock + media-driven playback helpers.
 * Run: node --test artifacts/ccd/src/features/interactive-lesson-viewer/utils/demoIntroLock.test.mjs
 *
 * Transpiles the real dependency-free TS modules (demoGuard.ts, mediaClock.ts) with the
 * workspace TypeScript, so tests exercise shipped code rather than a mirror.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '../../../../package.json'));
const ts = require('typescript');

async function loadTs(rel) {
  const src = readFileSync(join(here, rel), 'utf8');
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

const guard = await loadTs('../data/demoGuard.ts');
const clock = await loadTs('./mediaClock.ts');
const demoSrc = readFileSync(join(here, '../data/demoLesson.ts'), 'utf8');

const intro = {
  id: guard.DEMO_INTRO_SCENE_ID,
  type: 'video',
  title: 'Intro sting',
  durationMs: guard.DEMO_INTRO_DURATION_MS,
  advanceMode: 'media-end',
  mediaUrl: guard.DEMO_INTRO_VIDEO,
  overlays: [],
};

describe('built-in demo intro lock', () => {
  it('demo source uses the guard constants with the sting as scene 1', () => {
    assert.match(demoSrc, /id: DEMO_LESSON_ID/);
    const scenesAt = demoSrc.indexOf('scenes: [');
    const firstId = demoSrc.slice(scenesAt).match(/id: (\w+)/)[1];
    assert.equal(firstId, 'DEMO_INTRO_SCENE_ID');
    assert.equal(guard.DEMO_INTRO_VIDEO, '/interactive-lessons/ccdesigner-intro-1080.mp4');
    assert.equal(guard.DEMO_INTRO_DURATION_MS, 8067);
  });

  it('re-inserts a missing sting as scene 0', () => {
    const out = guard.ensureDemoIntro({ scenes: [{ id: 'a' }, { id: 'b' }] }, intro);
    assert.deepEqual(out.scenes.map((s) => s.id), [guard.DEMO_INTRO_SCENE_ID, 'a', 'b']);
  });

  it('replaces a stale or moved sting with the canonical one', () => {
    const stale = { ...intro, mediaUrl: '/old.mp4', durationMs: 7000 };
    const out = guard.ensureDemoIntro({ scenes: [{ id: 'a' }, stale] }, intro);
    assert.equal(out.scenes.length, 2);
    assert.equal(out.scenes[0].mediaUrl, guard.DEMO_INTRO_VIDEO);
    assert.equal(out.scenes[0].durationMs, 8067);
    assert.equal(out.scenes[1].id, 'a');
  });

  it('does not share the canonical scene object', () => {
    const out = guard.ensureDemoIntro({ scenes: [] }, intro);
    out.scenes[0].title = 'changed';
    assert.equal(intro.title, 'Intro sting');
  });

  it('identifies the built-in demo by id or flag', () => {
    assert.equal(guard.isBuiltInDemoId('demo-interactive-lesson'), true);
    assert.equal(guard.isBuiltInDemo({ id: 'demo-interactive-lesson' }), true);
    assert.equal(guard.isBuiltInDemo({ id: 'x', isDemo: true }), true);
    assert.equal(guard.isBuiltInDemo({ id: 'ilv-1', isDemo: false }), false);
    assert.equal(guard.isBuiltInDemo(null), false);
  });

  it('keeps intro + lyrics, drops Big Buck Bunny YouTube, and ships Canva/PPT examples', () => {
    assert.match(demoSrc, /id: DEMO_INTRO_SCENE_ID/);
    assert.match(demoSrc, /id: 'demo-scene-karaoke'/);
    assert.doesNotMatch(demoSrc, /demo-scene-youtube/);
    assert.doesNotMatch(demoSrc, /aqz-KE-bpKQ/);
    assert.doesNotMatch(demoSrc, /youtube\.com\/embed/);
    assert.match(demoSrc, /id: 'demo-scene-canva'/);
    assert.match(demoSrc, /embedUrl: DEMO_CANVA_EMBED/);
    assert.match(demoSrc, /id: 'demo-scene-ppt'/);
    assert.match(demoSrc, /EXAMPLE POWERPOINT SLIDE/);
    // Intro + title + lyrics + audio + canva + ppt + image = 7 scenes
    const sceneIds = [...demoSrc.matchAll(/id: (?:DEMO_INTRO_SCENE_ID|'demo-scene-[a-z-]+')/g)];
    assert.equal(sceneIds.length, 7);
    // Lyrics slide must not show a "placeholder audio" caption overlay
    assert.doesNotMatch(demoSrc, /placeholder audio/i);
    assert.doesNotMatch(demoSrc, /ov-kara-label/);
  });
});

describe('media-driven playback', () => {
  it('media-end video/audio scenes are media-driven; timer scenes are not', () => {
    assert.equal(clock.isMediaDrivenScene(intro, 'media-end'), true);
    assert.equal(clock.isMediaDrivenScene({ type: 'audio', mediaUrl: 'a.mp3' }, 'media-end'), true);
    assert.equal(clock.isMediaDrivenScene(intro, 'timer'), false);
    assert.equal(clock.isMediaDrivenScene({ type: 'video' }, 'media-end'), false);
    assert.equal(clock.isMediaDrivenScene({ type: 'title' }, 'media-end', 'x.mp4'), false);
  });

  it('never re-seeks media-driven scenes', () => {
    assert.equal(
      clock.shouldSeekMedia({ mediaDriven: true, readyState: 4, seeking: false, currentTimeSec: 0, targetSec: 7 }),
      false,
    );
  });

  it('does not seek while buffering (readyState < 3) or mid-seek', () => {
    const base = { mediaDriven: false, currentTimeSec: 0, targetSec: 5 };
    assert.equal(clock.shouldSeekMedia({ ...base, readyState: 2, seeking: false }), false);
    assert.equal(clock.shouldSeekMedia({ ...base, readyState: 4, seeking: true }), false);
    assert.equal(clock.shouldSeekMedia({ ...base, readyState: 3, seeking: false }), true);
  });

  it('ignores drift within tolerance', () => {
    assert.equal(
      clock.shouldSeekMedia({ mediaDriven: false, readyState: 4, seeking: false, currentTimeSec: 1, targetSec: 1.2 }),
      false,
    );
  });

  it('detects autoplay refusal only for NotAllowedError', () => {
    assert.equal(clock.isAutoplayBlocked({ name: 'NotAllowedError' }), true);
    assert.equal(clock.isAutoplayBlocked(new Error('AbortError')), false);
    assert.equal(clock.isAutoplayBlocked(undefined), false);
  });

  it('safety net fires only after a real stall', () => {
    assert.equal(clock.mediaStalled(9_000, 0), false);
    assert.equal(clock.mediaStalled(10_000, 0), true);
  });
});
