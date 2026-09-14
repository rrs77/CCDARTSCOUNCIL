/**
 * Invitation status helpers.
 * Run: node --test api/__tests__/inviteShared.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CREATE_USER_ROLES,
  canResendInvitation,
  defaultPermissionsForRole,
  invitationStatus,
  inviteTimestamps,
  isAlreadyRegisteredError,
  payloadContainsSecrets,
} from '../_inviteShared.js';

const NOW = new Date('2026-09-14T12:00:00.000Z');

describe('invitationStatus', () => {
  it('marks active users without forced password change as complete', () => {
    assert.equal(
      invitationStatus({ status: 'active', must_change_password: false }, NOW),
      'complete',
    );
    assert.equal(invitationStatus({ status: 'active' }, NOW), 'complete');
  });

  it('marks invited users as pending before expiry', () => {
    assert.equal(
      invitationStatus(
        {
          status: 'invited',
          must_change_password: true,
          invite_expires_at: '2026-09-15T12:00:00.000Z',
        },
        NOW,
      ),
      'pending',
    );
  });

  it('marks invited users as expired after invite_expires_at', () => {
    assert.equal(
      invitationStatus(
        {
          status: 'invited',
          must_change_password: true,
          invite_expires_at: '2026-09-13T12:00:00.000Z',
        },
        NOW,
      ),
      'expired',
    );
  });

  it('treats suspended and anonymised users as suspended', () => {
    assert.equal(invitationStatus({ status: 'suspended' }, NOW), 'suspended');
    assert.equal(
      invitationStatus({ status: 'active', anonymised_at: '2026-01-01T00:00:00.000Z' }, NOW),
      'suspended',
    );
  });

  it('treats active + must_change_password as pending setup', () => {
    assert.equal(
      invitationStatus({ status: 'active', must_change_password: true }, NOW),
      'pending',
    );
  });
});

describe('canResendInvitation', () => {
  it('allows pending and expired only', () => {
    assert.equal(
      canResendInvitation({ status: 'invited', invite_expires_at: '2026-09-15T00:00:00.000Z' }, NOW),
      true,
    );
    assert.equal(
      canResendInvitation({ status: 'invited', invite_expires_at: '2026-09-01T00:00:00.000Z' }, NOW),
      true,
    );
    assert.equal(canResendInvitation({ status: 'active', must_change_password: false }, NOW), false);
    assert.equal(canResendInvitation({ status: 'suspended' }, NOW), false);
  });
});

describe('isAlreadyRegisteredError', () => {
  it('detects duplicate-email messages from Auth', () => {
    assert.equal(
      isAlreadyRegisteredError('A user with this email address has already been registered'),
      true,
    );
    assert.equal(isAlreadyRegisteredError({ message: 'User already registered' }), true);
    assert.equal(isAlreadyRegisteredError('Invalid email'), false);
  });
});

describe('payloadContainsSecrets', () => {
  it('flags passwords and one-time links', () => {
    assert.equal(payloadContainsSecrets({ password: 'secret' }), true);
    assert.equal(payloadContainsSecrets({ action_link: 'https://example/invite' }), true);
    assert.equal(payloadContainsSecrets({ hashed_token: 'abc' }), true);
    assert.equal(
      payloadContainsSecrets({
        success: true,
        user: { id: '1', email: 'a@b.c', role: 'teacher' },
        invited: true,
        invitation_status: 'pending',
      }),
      false,
    );
    assert.equal(
      payloadContainsSecrets({ must_change_password: true, status: 'invited' }),
      false,
    );
  });
});

describe('inviteTimestamps', () => {
  it('sets expiry 24 hours after sent', () => {
    const ts = inviteTimestamps(NOW);
    assert.equal(ts.invite_sent_at, NOW.toISOString());
    assert.equal(ts.invite_expires_at, '2026-09-15T12:00:00.000Z');
  });
});

describe('roles and permissions', () => {
  it('includes teacher and super_admin', () => {
    assert.ok(CREATE_USER_ROLES.includes('teacher'));
    assert.ok(CREATE_USER_ROLES.includes('super_admin'));
  });

  it('grants lesson edit to teachers', () => {
    assert.deepEqual(defaultPermissionsForRole('teacher'), {
      can_edit_lessons: true,
      can_edit_activities: true,
    });
    assert.equal(defaultPermissionsForRole('viewer').can_edit_lessons, false);
  });
});

describe('create-user source', () => {
  it('does not create users with an admin-chosen password', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../create-user.js', import.meta.url), 'utf8');
    assert.equal(src.includes('accountCreatedEmail'), false);
    assert.equal(src.includes('temporaryPassword'), false);
    assert.equal(src.includes('auth.admin.createUser'), false);
  });

  it('resend uses recovery links rather than inviteUserByEmail', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../resend-invite.js', import.meta.url), 'utf8');
    assert.equal(src.includes('inviteUserByEmail'), false);
    assert.ok(src.includes("type: 'recovery'") || src.includes('resetPasswordForEmail'));
  });
});
