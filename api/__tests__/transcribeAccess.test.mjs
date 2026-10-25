/**
 * Transcribe storagePath access (IDOR) + ticket rejection.
 * Run: node --test api/__tests__/transcribeAccess.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { mayAccessLessonAttachment } from '../_attachmentAccess.js';
import { resolveAudioBuffer } from '../_transcribeAudio.js';

const root = fileURLToPath(new URL('../..', import.meta.url));

const USER_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const PATH_A = `${USER_A}/lesson-demo/cccccccc-cccc-cccc-cccc-cccccccccccc.mp3`;

function emptyServiceClient() {
  const empty = { data: null, error: null };
  const emptyList = { data: [], error: null };
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                eq() {
                  return {
                    eq() {
                      return Promise.resolve(emptyList);
                    },
                    maybeSingle() {
                      return Promise.resolve(empty);
                    },
                    in() {
                      return Promise.resolve(emptyList);
                    },
                  };
                },
                maybeSingle() {
                  return Promise.resolve(empty);
                },
                in() {
                  return Promise.resolve(emptyList);
                },
              };
            },
            in() {
              return Promise.resolve(emptyList);
            },
          };
        },
      };
    },
  };
}

describe('mayAccessLessonAttachment', () => {
  it('owner can access own storagePath (path prefix)', async () => {
    const ok = await mayAccessLessonAttachment(USER_A, PATH_A, {
      serviceClient: emptyServiceClient(),
    });
    assert.equal(ok, true);
  });

  it('user B cannot access user A path (403 / false) without share', async () => {
    const ok = await mayAccessLessonAttachment(USER_B, PATH_A, {
      serviceClient: emptyServiceClient(),
    });
    assert.equal(ok, false);
  });
});

describe('resolveAudioBuffer IDOR', () => {
  it('owner can resolve storagePath', async () => {
    const fakeBuf = Buffer.from('ID3audio');
    const result = await resolveAudioBuffer(
      { storagePath: PATH_A },
      USER_A,
      {
        mayAccess: async (uid, path) => uid === USER_A && path.startsWith(USER_A),
        fetchAttachment: async () => fakeBuf,
      },
    );
    assert.equal(result.ext, 'mp3');
    assert.equal(result.buffer.byteLength, fakeBuf.byteLength);
  });

  it('user B cannot transcribe user A path (403)', async () => {
    await assert.rejects(
      () =>
        resolveAudioBuffer(
          { storagePath: PATH_A },
          USER_B,
          {
            mayAccess: async () => false,
            fetchAttachment: async () => {
              throw new Error('should not fetch');
            },
          },
        ),
      (err) => err?.status === 403 && err?.code === 'forbidden',
    );
  });

  it('rejects attachmentTicket (not a read grant)', async () => {
    await assert.rejects(
      () => resolveAudioBuffer({ attachmentTicket: 'x.y' }, USER_A),
      (err) => err?.status === 400 && err?.code === 'ticket_not_allowed',
    );
  });
});

describe('transcribe + file proxy share mayAccess', () => {
  it('both call shared mayAccessLessonAttachment; ticket branch removed', () => {
    const transcribe = readFileSync(
      join(root, 'server/api/interactive-lessons/transcribe.js'),
      'utf8',
    );
    const fileProxy = readFileSync(
      join(root, 'server/api/lesson-attachments/file/[...path].js'),
      'utf8',
    );
    const helper = readFileSync(join(root, 'api/_transcribeAudio.js'), 'utf8');
    assert.match(fileProxy, /mayAccessLessonAttachment/);
    assert.match(helper, /mayAccessLessonAttachment/);
    assert.match(helper, /ticket_not_allowed/);
    assert.doesNotMatch(helper, /verifyDirectUploadTicket/);
    assert.match(transcribe, /resolveAudioBuffer\(body,\s*auth\.userId\)/);
  });

  it('fetchAttachmentFromDreamHost streams with maxBytes', () => {
    const src = readFileSync(join(root, 'api/_lessonAttachmentStorage.js'), 'utf8');
    assert.match(src, /getReader/);
    assert.match(src, /maxBytes/);
    assert.match(src, /code: 'oversize'/);
  });
});
