/**
 * Forum authz + sanitisation boundary tests (pure helpers).
 * Run: node --test api/__tests__/forumShared.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLE_FORUM_CAPS,
  resolveForumCaps,
  hasForumCap,
  isForumSuspended,
  markdownToSafeHtml,
  sanitizeForumHtml,
  slugify,
  isCategoryIndexable,
  canReadCategory,
} from '../_forumShared.js';

describe('forum capability matrix', () => {
  it('gives teachers contribute caps but not moderate', () => {
    const caps = resolveForumCaps({ role: 'teacher', status: 'active' });
    assert.equal(hasForumCap(caps, 'forum.read'), true);
    assert.equal(hasForumCap(caps, 'forum.create_topic'), true);
    assert.equal(hasForumCap(caps, 'forum.reply'), true);
    assert.equal(hasForumCap(caps, 'forum.react'), true);
    assert.equal(hasForumCap(caps, 'forum.report'), true);
    assert.equal(hasForumCap(caps, 'forum.moderate'), false);
    assert.equal(hasForumCap(caps, 'forum.manage_categories'), false);
  });

  it('gives admin and super_admin moderate + manage', () => {
    for (const role of ['admin', 'super_admin', 'superuser']) {
      const caps = resolveForumCaps({ role, status: 'active' });
      assert.equal(hasForumCap(caps, 'forum.moderate'), true, role);
      assert.equal(hasForumCap(caps, 'forum.manage_categories'), true, role);
      assert.equal(hasForumCap(caps, 'forum.manage_settings'), true, role);
    }
  });

  it('organisation gets view_private_categories', () => {
    const caps = resolveForumCaps({ role: 'organisation', status: 'active' });
    assert.equal(hasForumCap(caps, 'forum.view_private_categories'), true);
  });

  it('viewer is read-only by default', () => {
    const caps = resolveForumCaps({ role: 'viewer', status: 'active' });
    assert.equal(hasForumCap(caps, 'forum.read'), true);
    assert.equal(hasForumCap(caps, 'forum.create_topic'), false);
    assert.deepEqual([...ROLE_FORUM_CAPS.viewer], ['forum.read']);
  });

  it('forum suspension blocks contribute caps', () => {
    const caps = resolveForumCaps(
      { role: 'teacher', status: 'active' },
      { is_suspended: true, suspended_until: null },
    );
    assert.equal(hasForumCap(caps, 'forum.create_topic'), false);
    assert.equal(hasForumCap(caps, 'forum.reply'), false);
    assert.equal(hasForumCap(caps, 'forum.react'), false);
    assert.equal(hasForumCap(caps, 'forum.read'), true);
    assert.equal(hasForumCap(caps, 'forum.report'), true);
  });

  it('profile override can grant moderate to teacher', () => {
    const caps = resolveForumCaps({
      role: 'teacher',
      status: 'active',
      forum_can_moderate: true,
    });
    assert.equal(hasForumCap(caps, 'forum.moderate'), true);
  });

  it('suspended account gets no caps', () => {
    const caps = resolveForumCaps({ role: 'admin', status: 'suspended' });
    assert.equal(caps.size, 0);
  });
});

describe('isForumSuspended', () => {
  it('respects suspended_until', () => {
    assert.equal(isForumSuspended({ is_suspended: true }), true);
    assert.equal(
      isForumSuspended({
        is_suspended: true,
        suspended_until: new Date(Date.now() - 60_000).toISOString(),
      }),
      false,
    );
    assert.equal(
      isForumSuspended({
        is_suspended: true,
        suspended_until: new Date(Date.now() + 60_000).toISOString(),
      }),
      true,
    );
  });
});

describe('markdown sanitisation', () => {
  it('strips script and event handlers', () => {
    const html = markdownToSafeHtml('<script>alert(1)</script>**hi**');
    assert.equal(/<script/i.test(html), false);
    assert.equal(html.includes('<strong>hi</strong>'), true);
  });

  it('blocks javascript: links', () => {
    const html = markdownToSafeHtml('[x](javascript:alert(1))');
    assert.equal(html.includes('javascript'), false);
  });

  it('allows https links', () => {
    const html = markdownToSafeHtml('[Jazz](https://www.jazznorth.org/)');
    assert.equal(html.includes('href="https://www.jazznorth.org/"'), true);
    assert.equal(html.includes('rel="noopener'), true);
  });

  it('sanitizeForumHtml removes on* handlers', () => {
    const out = sanitizeForumHtml('<p onclick="x()">Hi</p>');
    assert.equal(out.includes('onclick'), false);
    assert.equal(out.includes('Hi'), true);
  });
});

describe('slugify', () => {
  it('normalises titles', () => {
    assert.equal(slugify('Hello World!'), 'hello-world');
    assert.equal(slugify(''), 'topic');
  });
});

describe('category visibility helpers', () => {
  it('only published public non-hub categories are indexable', () => {
    assert.equal(
      isCategoryIndexable({ status: 'published', scope: 'public', hub_id: null }),
      true,
    );
    assert.equal(
      isCategoryIndexable({ status: 'draft', scope: 'public', hub_id: null }),
      false,
    );
    assert.equal(
      isCategoryIndexable({ status: 'published', scope: 'hub', hub_id: 'jazznorth' }),
      false,
    );
    assert.equal(
      isCategoryIndexable({ status: 'published', scope: 'members', hub_id: null }),
      false,
    );
  });

  it('anonymous can read public published categories only', async () => {
    const anon = { anonymous: true, caps: new Set(['forum.read']), profile: null };
    assert.equal(
      await canReadCategory(
        { status: 'published', scope: 'public', hub_id: null },
        anon,
      ),
      true,
    );
    assert.equal(
      await canReadCategory(
        { status: 'draft', scope: 'public', hub_id: null },
        anon,
      ),
      false,
    );
    assert.equal(
      await canReadCategory(
        { status: 'published', scope: 'members', hub_id: null },
        anon,
      ),
      false,
    );
    assert.equal(
      await canReadCategory(
        { status: 'published', scope: 'hub', hub_id: 'jazznorth' },
        anon,
      ),
      false,
    );
  });

  it('hub categories deny non-members (non-super)', async () => {
    const teacher = {
      anonymous: false,
      caps: ROLE_FORUM_CAPS.teacher,
      profile: { id: 'u1', role: 'teacher', status: 'active' },
    };
    // Without hub membership stub, getEffectiveHubRole returns null → deny
    // (service client may be null in unit tests → loadHubMembership returns null)
    const ok = await canReadCategory(
      { status: 'published', scope: 'hub', hub_id: 'jazznorth' },
      teacher,
    );
    assert.equal(ok, false);
  });
});
