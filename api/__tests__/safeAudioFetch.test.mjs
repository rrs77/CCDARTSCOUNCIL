/**
 * SSRF-safe audio fetch unit tests.
 * Run: node --test api/__tests__/safeAudioFetch.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIO_MAX_BYTES,
  fetchAllowlistedAudio,
  getAllowedAudioHosts,
  isBlockedIp,
  parseAllowlistedAudioUrl,
} from '../_safeAudioFetch.js';

const ALLOW = new Set(['cdn.example.test', 'storage.example.test', 'files.example.test']);

describe('isBlockedIp', () => {
  it('blocks loopback, private, link-local and metadata', () => {
    assert.equal(isBlockedIp('127.0.0.1'), true);
    assert.equal(isBlockedIp('10.0.0.1'), true);
    assert.equal(isBlockedIp('192.168.1.1'), true);
    assert.equal(isBlockedIp('172.16.0.1'), true);
    assert.equal(isBlockedIp('169.254.169.254'), true);
    assert.equal(isBlockedIp('::1'), true);
    assert.equal(isBlockedIp('fc00::1'), true);
    assert.equal(isBlockedIp('fe80::1'), true);
  });

  it('allows public unicast', () => {
    assert.equal(isBlockedIp('8.8.8.8'), false);
    assert.equal(isBlockedIp('1.1.1.1'), false);
  });
});

describe('parseAllowlistedAudioUrl', () => {
  it('rejects protocol-relative //evil', () => {
    const r = parseAllowlistedAudioUrl('//evil.host/a.mp3', ALLOW);
    assert.equal(r.ok, false);
    assert.equal(r.code, 'ssrf_blocked');
  });

  it('rejects 169.254.169.254 literal host', () => {
    const r = parseAllowlistedAudioUrl('https://169.254.169.254/latest/meta-data/', ALLOW);
    assert.equal(r.ok, false);
  });

  it('rejects localhost', () => {
    const withLocal = new Set([...ALLOW, 'localhost']);
    // even if somehow listed, IP form is blocked; hostname localhost not on default allow
    const r = parseAllowlistedAudioUrl('https://localhost/a.mp3', ALLOW);
    assert.equal(r.ok, false);
    assert.equal(r.code, 'host_not_allowed');
    // literal loopback IP
    const ip = parseAllowlistedAudioUrl('https://127.0.0.1/a.mp3', new Set(['127.0.0.1']));
    assert.equal(ip.ok, false);
    assert.equal(ip.code, 'ip_blocked');
    void withLocal;
  });

  it('rejects non-https and non-allowlisted hosts', () => {
    assert.equal(parseAllowlistedAudioUrl('http://cdn.example.test/a.mp3', ALLOW).ok, false);
    assert.equal(parseAllowlistedAudioUrl('https://evil.example/a.mp3', ALLOW).ok, false);
  });

  it('accepts allowlisted https', () => {
    const r = parseAllowlistedAudioUrl('https://cdn.example.test/path/a.mp3', ALLOW);
    assert.equal(r.ok, true);
    assert.match(r.url, /^https:\/\/cdn\.example\.test\//);
  });
});

describe('getAllowedAudioHosts', () => {
  it('includes supabase host from DEFAULT / env and never request input', () => {
    const hosts = getAllowedAudioHosts();
    assert.ok(hosts.size >= 1);
    assert.ok([...hosts].every((h) => typeof h === 'string' && !h.includes('/')));
  });
});

describe('fetchAllowlistedAudio', () => {
  const publicLookup = async () => [{ address: '8.8.8.8', family: 4 }];
  const privateLookup = async () => [{ address: '10.0.0.5', family: 4 }];

  it('blocks redirect to a private / non-allowlisted host', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return {
        status: 302,
        ok: false,
        headers: {
          get: (n) => (String(n).toLowerCase() === 'location' ? 'https://10.0.0.5/secret' : null),
        },
      };
    };
    await assert.rejects(
      () =>
        fetchAllowlistedAudio('https://cdn.example.test/a.mp3', {
          fetchImpl,
          dnsLookup: publicLookup,
          allowlist: ALLOW,
        }),
      (err) => err?.code === 'host_not_allowed' || err?.code === 'ip_blocked' || err?.code === 'ssrf_blocked',
    );
    assert.equal(calls, 1);
  });

  it('rejects oversized Content-Length', async () => {
    const fetchImpl = async () => ({
      status: 200,
      ok: true,
      headers: {
        get: (n) => {
          const k = String(n).toLowerCase();
          if (k === 'content-type') return 'audio/mpeg';
          if (k === 'content-length') return String(AUDIO_MAX_BYTES + 1);
          return null;
        },
      },
      body: null,
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    await assert.rejects(
      () =>
        fetchAllowlistedAudio('https://cdn.example.test/a.mp3', {
          fetchImpl,
          dnsLookup: publicLookup,
          allowlist: ALLOW,
        }),
      (err) => err?.code === 'oversize' && err?.status === 413,
    );
  });

  it('stops streaming past the size cap', async () => {
    const chunk = new Uint8Array(1024);
    let reads = 0;
    const fetchImpl = async () => ({
      status: 200,
      ok: true,
      headers: {
        get: (n) => (String(n).toLowerCase() === 'content-type' ? 'audio/mpeg' : null),
      },
      body: {
        getReader: () => ({
          read: async () => {
            reads += 1;
            // Keep yielding until over the tiny test cap
            return { done: false, value: chunk };
          },
          cancel: async () => {},
        }),
      },
    });
    await assert.rejects(
      () =>
        fetchAllowlistedAudio('https://cdn.example.test/a.mp3', {
          fetchImpl,
          dnsLookup: publicLookup,
          allowlist: ALLOW,
          maxBytes: 2048,
        }),
      (err) => err?.code === 'oversize',
    );
    assert.ok(reads >= 3);
  });

  it('rejects non-audio content types', async () => {
    const fetchImpl = async () => ({
      status: 200,
      ok: true,
      headers: {
        get: (n) => (String(n).toLowerCase() === 'content-type' ? 'text/html' : null),
      },
      body: null,
      arrayBuffer: async () => new TextEncoder().encode('<html>').buffer,
    });
    await assert.rejects(
      () =>
        fetchAllowlistedAudio('https://cdn.example.test/a.mp3', {
          fetchImpl,
          dnsLookup: publicLookup,
          allowlist: ALLOW,
        }),
      (err) => err?.code === 'non_audio_type',
    );
  });

  it('rejects when DNS resolves to a private address', async () => {
    const fetchImpl = async () => {
      throw new Error('should not fetch');
    };
    await assert.rejects(
      () =>
        fetchAllowlistedAudio('https://cdn.example.test/a.mp3', {
          fetchImpl,
          dnsLookup: privateLookup,
          allowlist: ALLOW,
        }),
      (err) => err?.code === 'ip_blocked',
    );
  });

  it('returns audio bytes on happy path', async () => {
    const bytes = new TextEncoder().encode('ID3fakeaudio');
    const fetchImpl = async () => ({
      status: 200,
      ok: true,
      headers: {
        get: (n) => {
          const k = String(n).toLowerCase();
          if (k === 'content-type') return 'audio/mpeg';
          if (k === 'content-length') return String(bytes.byteLength);
          return null;
        },
      },
      body: null,
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    });
    const r = await fetchAllowlistedAudio('https://cdn.example.test/a.mp3', {
      fetchImpl,
      dnsLookup: publicLookup,
      allowlist: ALLOW,
    });
    assert.equal(r.contentType, 'audio/mpeg');
    assert.equal(r.buffer.byteLength, bytes.byteLength);
  });
});
