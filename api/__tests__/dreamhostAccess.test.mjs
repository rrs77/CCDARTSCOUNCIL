/**
 * DreamHost stored-file visibility (org / private / licensed) unit tests.
 * Run: node --test api/__tests__/dreamhostAccess.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canChangeFileVisibility,
  canPushResourceToSchool,
  evaluateStoredFileAccess,
  FILE_VISIBILITY,
  normalizeVisibility,
  parseOwnedStoragePath,
  sameOrganisationIds,
} from '../_dreamhost.js';

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PEER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OTHER = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const FILE = `${OWNER}/dddddddd-dddd-4ddd-8ddd-dddddddddddd.pdf`;

const active = (org) => ({ organisation_id: org, status: 'active' });

describe('parseOwnedStoragePath', () => {
  it('accepts strict userId/uuid.pdf paths', () => {
    assert.equal(parseOwnedStoragePath(FILE), FILE);
  });

  it('rejects traversal and malformed paths', () => {
    assert.equal(parseOwnedStoragePath('../etc/passwd'), null);
    assert.equal(parseOwnedStoragePath(`${OWNER}/not-a-uuid.pdf`), null);
    assert.equal(parseOwnedStoragePath('nope'), null);
  });
});

describe('normalizeVisibility', () => {
  it('keeps org / private / licensed', () => {
    assert.equal(normalizeVisibility('org'), FILE_VISIBILITY.ORG);
    assert.equal(normalizeVisibility('private'), FILE_VISIBILITY.PRIVATE);
    assert.equal(normalizeVisibility('licensed'), FILE_VISIBILITY.LICENSED);
  });

  it('fails closed to private on unknown/missing', () => {
    assert.equal(normalizeVisibility(null), FILE_VISIBILITY.PRIVATE);
    assert.equal(normalizeVisibility(undefined), FILE_VISIBILITY.PRIVATE);
    assert.equal(normalizeVisibility('public'), FILE_VISIBILITY.PRIVATE);
    assert.equal(normalizeVisibility(''), FILE_VISIBILITY.PRIVATE);
  });

  it('forces purchased resources to licensed', () => {
    assert.equal(
      normalizeVisibility('org', { isPurchasedResource: true }),
      FILE_VISIBILITY.LICENSED,
    );
    assert.equal(
      normalizeVisibility(null, { isPurchasedResource: true }),
      FILE_VISIBILITY.LICENSED,
    );
  });
});

describe('sameOrganisationIds', () => {
  it('allows matching non-null org ids', () => {
    assert.equal(sameOrganisationIds('ems', 'ems'), true);
  });

  it('denies cross-org', () => {
    assert.equal(sameOrganisationIds('ems', 'jazznorth'), false);
  });

  it('denies when either side is null or empty (no null=null)', () => {
    assert.equal(sameOrganisationIds(null, null), false);
    assert.equal(sameOrganisationIds(undefined, undefined), false);
    assert.equal(sameOrganisationIds(null, 'ems'), false);
    assert.equal(sameOrganisationIds('ems', null), false);
    assert.equal(sameOrganisationIds('', ''), false);
    assert.equal(sameOrganisationIds('  ', 'ems'), false);
  });
});

describe('evaluateStoredFileAccess — owner', () => {
  it('allows the file owner regardless of visibility', () => {
    for (const visibility of [null, 'org', 'private', 'licensed', 'weird']) {
      assert.equal(
        evaluateStoredFileAccess({
          userId: OWNER,
          storagePath: FILE,
          viewerProfile: active(null),
          ownerProfile: active(null),
          visibility,
        }),
        true,
        `owner should pass for visibility=${visibility}`,
      );
    }
  });
});

describe('evaluateStoredFileAccess — org', () => {
  it('allows same-org peers when visibility is org', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: active('ems'),
        ownerProfile: active('ems'),
        visibility: FILE_VISIBILITY.ORG,
      }),
      true,
    );
  });

  it('denies cross-org peers', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: OTHER,
        storagePath: FILE,
        viewerProfile: active('jazznorth'),
        ownerProfile: active('ems'),
        visibility: FILE_VISIBILITY.ORG,
      }),
      false,
    );
  });

  it('denies when either organisation_id is null', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: active(null),
        ownerProfile: active('ems'),
        visibility: FILE_VISIBILITY.ORG,
      }),
      false,
    );
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: active('ems'),
        ownerProfile: active(null),
        visibility: FILE_VISIBILITY.ORG,
      }),
      false,
    );
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: active(null),
        ownerProfile: active(null),
        visibility: FILE_VISIBILITY.ORG,
      }),
      false,
    );
  });

  it('denies suspended viewers even in the same org', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: { organisation_id: 'ems', status: 'suspended' },
        ownerProfile: active('ems'),
        visibility: FILE_VISIBILITY.ORG,
      }),
      false,
    );
  });

  it('fails closed to private when visibility is missing/unknown (no org access)', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: active('ems'),
        ownerProfile: active('ems'),
        visibility: null,
      }),
      false,
    );
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: active('ems'),
        ownerProfile: active('ems'),
        visibility: 'public',
      }),
      false,
    );
  });
});

describe('evaluateStoredFileAccess — private', () => {
  it('allows explicit file_shares grantee', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: active('ems'),
        ownerProfile: active('ems'),
        visibility: FILE_VISIBILITY.PRIVATE,
        hasShareGrant: true,
      }),
      true,
    );
  });

  it('denies same-org peer without a share grant', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: active('ems'),
        ownerProfile: active('ems'),
        visibility: FILE_VISIBILITY.PRIVATE,
        hasShareGrant: false,
      }),
      false,
    );
  });

  it('denies private access by non-grantee (cross-org)', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: OTHER,
        storagePath: FILE,
        viewerProfile: active('jazznorth'),
        ownerProfile: active('ems'),
        visibility: FILE_VISIBILITY.PRIVATE,
        hasShareGrant: false,
      }),
      false,
    );
  });
});

describe('evaluateStoredFileAccess — licensed', () => {
  it('allows licence holder', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: active('ems'),
        ownerProfile: active('ems'),
        visibility: FILE_VISIBILITY.LICENSED,
        hasLicence: true,
      }),
      true,
    );
  });

  it('denies licensed access by non-holder (even same org)', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: active('ems'),
        ownerProfile: active('ems'),
        visibility: FILE_VISIBILITY.LICENSED,
        hasLicence: false,
        hasShareGrant: true,
      }),
      false,
    );
  });

  it('never grants org-wide access for purchased resources', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: active('ems'),
        ownerProfile: active('ems'),
        visibility: FILE_VISIBILITY.ORG,
        isPurchasedResource: true,
        hasLicence: false,
      }),
      false,
    );
  });

  it('allows purchaser when isPurchasedResource even if visibility says org', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: active('ems'),
        ownerProfile: active('ems'),
        visibility: FILE_VISIBILITY.ORG,
        isPurchasedResource: true,
        hasLicence: true,
      }),
      true,
    );
  });

  it('allows same-org member after school push (hasOrgGrant)', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: active('ems'),
        ownerProfile: active('ems'),
        visibility: FILE_VISIBILITY.LICENSED,
        isPurchasedResource: true,
        hasLicence: false,
        hasOrgGrant: true,
      }),
      true,
    );
  });

  it('denies other-org member even when a school grant exists for another org', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: OTHER,
        storagePath: FILE,
        viewerProfile: active('jazznorth'),
        ownerProfile: active('ems'),
        visibility: FILE_VISIBILITY.LICENSED,
        isPurchasedResource: true,
        hasLicence: false,
        // hasOrgGrant is computed for the viewer's org only — other org → false
        hasOrgGrant: false,
      }),
      false,
    );
  });

  it('denies access after revoke (no licence, no org grant)', () => {
    assert.equal(
      evaluateStoredFileAccess({
        userId: PEER,
        storagePath: FILE,
        viewerProfile: active('ems'),
        ownerProfile: active('ems'),
        visibility: FILE_VISIBILITY.LICENSED,
        isPurchasedResource: true,
        hasLicence: false,
        hasOrgGrant: false,
      }),
      false,
    );
  });
});

describe('canPushResourceToSchool', () => {
  const base = {
    resourceOrganisationId: 'ems',
    targetOrganisationId: 'ems',
    hasCallerLicence: true,
    orgHasSchoolLicence: false,
  };

  it('allows purchaser in the same org with a personal licence', () => {
    assert.equal(
      canPushResourceToSchool({
        ...base,
        actorProfile: { organisation_id: 'ems', status: 'active', role: 'teacher' },
        isPurchaser: true,
      }),
      true,
    );
  });

  it('allows org admin (can_manage_users) in the same org with a licence', () => {
    assert.equal(
      canPushResourceToSchool({
        ...base,
        actorProfile: {
          organisation_id: 'ems',
          status: 'active',
          role: 'teacher',
          can_manage_users: true,
        },
        isPurchaser: false,
      }),
      true,
    );
  });

  it('allows org admin with role admin when org already has school licence', () => {
    assert.equal(
      canPushResourceToSchool({
        ...base,
        actorProfile: { organisation_id: 'ems', status: 'active', role: 'admin' },
        isPurchaser: false,
        hasCallerLicence: false,
        orgHasSchoolLicence: true,
      }),
      true,
    );
  });

  it('denies non-admin non-purchaser', () => {
    assert.equal(
      canPushResourceToSchool({
        ...base,
        actorProfile: { organisation_id: 'ems', status: 'active', role: 'teacher' },
        isPurchaser: false,
        hasCallerLicence: true,
      }),
      false,
    );
  });

  it('denies push targeting another org', () => {
    assert.equal(
      canPushResourceToSchool({
        ...base,
        actorProfile: { organisation_id: 'ems', status: 'active', role: 'admin' },
        isPurchaser: true,
        targetOrganisationId: 'jazznorth',
      }),
      false,
    );
    assert.equal(
      canPushResourceToSchool({
        ...base,
        actorProfile: {
          organisation_id: 'jazznorth',
          status: 'active',
          role: 'admin',
        },
        isPurchaser: true,
        resourceOrganisationId: 'ems',
        targetOrganisationId: 'jazznorth',
      }),
      false,
    );
  });

  it('denies when actor or resource org is null', () => {
    assert.equal(
      canPushResourceToSchool({
        ...base,
        actorProfile: { organisation_id: null, status: 'active', role: 'admin' },
        isPurchaser: true,
      }),
      false,
    );
    assert.equal(
      canPushResourceToSchool({
        ...base,
        actorProfile: { organisation_id: 'ems', status: 'active', role: 'admin' },
        isPurchaser: true,
        resourceOrganisationId: null,
      }),
      false,
    );
  });

  it('denies without personal licence and without school licence', () => {
    assert.equal(
      canPushResourceToSchool({
        ...base,
        actorProfile: { organisation_id: 'ems', status: 'active', role: 'admin' },
        isPurchaser: true,
        hasCallerLicence: false,
        orgHasSchoolLicence: false,
      }),
      false,
    );
  });
});

describe('canChangeFileVisibility', () => {
  it('allows owner to switch between org and private', () => {
    assert.equal(
      canChangeFileVisibility({
        actorId: OWNER,
        ownerId: OWNER,
        currentVisibility: 'org',
        nextVisibility: 'private',
      }),
      true,
    );
    assert.equal(
      canChangeFileVisibility({
        actorId: OWNER,
        ownerId: OWNER,
        currentVisibility: 'private',
        nextVisibility: 'org',
      }),
      true,
    );
  });

  it('denies visibility change by non-owner', () => {
    assert.equal(
      canChangeFileVisibility({
        actorId: PEER,
        ownerId: OWNER,
        currentVisibility: 'org',
        nextVisibility: 'private',
      }),
      false,
    );
  });

  it('denies self-upgrade to licensed', () => {
    assert.equal(
      canChangeFileVisibility({
        actorId: OWNER,
        ownerId: OWNER,
        currentVisibility: 'org',
        nextVisibility: 'licensed',
      }),
      false,
    );
    assert.equal(
      canChangeFileVisibility({
        actorId: OWNER,
        ownerId: OWNER,
        currentVisibility: 'private',
        nextVisibility: 'licensed',
      }),
      false,
    );
  });

  it('denies opening licensed/purchased to org', () => {
    assert.equal(
      canChangeFileVisibility({
        actorId: OWNER,
        ownerId: OWNER,
        currentVisibility: 'licensed',
        nextVisibility: 'org',
      }),
      false,
    );
    assert.equal(
      canChangeFileVisibility({
        actorId: OWNER,
        ownerId: OWNER,
        currentVisibility: 'licensed',
        nextVisibility: 'org',
        isPurchasedResource: true,
      }),
      false,
    );
  });

  it('keeps purchased resources locked to licensed', () => {
    assert.equal(
      canChangeFileVisibility({
        actorId: OWNER,
        ownerId: OWNER,
        currentVisibility: 'licensed',
        nextVisibility: 'private',
        isPurchasedResource: true,
      }),
      false,
    );
    assert.equal(
      canChangeFileVisibility({
        actorId: OWNER,
        ownerId: OWNER,
        currentVisibility: 'licensed',
        nextVisibility: 'licensed',
        isPurchasedResource: true,
      }),
      true,
    );
  });
});
