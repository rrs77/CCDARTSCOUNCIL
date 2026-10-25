/**
 * Lesson attachments — path allowlist, signed ILV media, migration hygiene.
 * Run: node --test api/__tests__/lessonAttachmentsSecurity.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseAttachmentStoragePath } from '../_lessonAttachmentStorage.js';

const root = fileURLToPath(new URL('../..', import.meta.url));

function listApiEntrypoints(dir = join(root, 'api'), prefix = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (!prefix && (name.startsWith('_') || name === '__tests__')) continue;
    if (name.startsWith('_')) continue;
    const full = join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (statSync(full).isDirectory()) {
      out.push(...listApiEntrypoints(full, rel));
    } else if (name.endsWith('.js')) {
      out.push(rel);
    }
  }
  return out;
}

describe('parseAttachmentStoragePath', () => {
  it('accepts uuid/lessonSeg/file.ext', () => {
    const p = parseAttachmentStoragePath(
      '11111111-1111-1111-1111-111111111111/lesson-a1b2/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg',
    );
    assert.ok(p);
    assert.match(p, /\.jpg$/);
  });

  it('rejects path traversal', () => {
    assert.equal(
      parseAttachmentStoragePath('11111111-1111-1111-1111-111111111111/../etc/passwd'),
      null,
    );
    assert.equal(parseAttachmentStoragePath('../../etc/passwd'), null);
  });
});

describe('ILV mediaUpload uses createSignedUrl', () => {
  it('does not call getPublicUrl', () => {
    const src = readFileSync(
      join(root, 'artifacts/ccd/src/features/interactive-lesson-viewer/utils/mediaUpload.ts'),
      'utf8',
    );
    assert.match(src, /createSignedUrl\([^,]+,\s*3600\)/);
    assert.doesNotMatch(src, /\.getPublicUrl\(/);
  });
});

describe('shareLesson / pdf share path', () => {
  it('shareLesson does not use getPublicUrl', () => {
    const src = readFileSync(join(root, 'artifacts/ccd/src/utils/shareLesson.ts'), 'utf8');
    assert.doesNotMatch(src, /\.getPublicUrl\(/);
    assert.match(src, /generateAndUploadSharePdf/);
  });
});

describe('migrations', () => {
  it('keeps lesson_attachments and no duplicate planning_shares / profiles_admin names', () => {
    const names = readdirSync(join(root, 'supabase/migrations'));
    assert.ok(names.includes('20261025120000_lesson_attachments.sql'));
    assert.ok(!names.includes('20261019_profiles_admin_read_scope.sql'));
    assert.ok(names.includes('20261019120100_profiles_admin_read_scope.sql'));
    assert.ok(!names.includes('20261024130000_planning_shares.sql'));
    assert.ok(names.includes('20261024180000_planning_shares.sql'));
  });
});

describe('Hobby function budget', () => {
  it('stays at ≤12 api entrypoints and routes lesson-attachments via router', () => {
    const entries = listApiEntrypoints();
    assert.ok(entries.length <= 12, `expected ≤12 entrypoints, got ${entries.length}: ${entries.join(', ')}`);
    const router = readFileSync(join(root, 'api/router.js'), 'utf8');
    assert.match(router, /lesson-attachments/);
    const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
    assert.match(vercel, /lesson-attachments/);
  });
});
