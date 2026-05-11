import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { decodeJwt, isJwtExpired } from '@/lib/jwt';

function encodeBase64Url(value: string): string {
  return btoa(value).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function makeJwt(payload: Record<string, unknown>): string {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = encodeBase64Url('sig');
  return `${header}.${body}.${signature}`;
}

describe('decodeJwt', () => {
  it('returns the payload for a well-formed token', () => {
    const token = makeJwt({ sub: 'u-123', exp: 1_700_000_000 });
    expect(decodeJwt(token)).toEqual({ sub: 'u-123', exp: 1_700_000_000 });
  });

  it('handles base64url payloads without padding', () => {
    const payload = { foo: 'bar' };
    const header = encodeBase64Url('{"alg":"none"}');
    const unpadded = encodeBase64Url(JSON.stringify(payload));
    const token = `${header}.${unpadded}.x`;
    expect(decodeJwt(token)).toEqual(payload);
  });

  it('returns null for a token with fewer than three segments', () => {
    expect(decodeJwt('only.two')).toBeNull();
    expect(decodeJwt('a.b.c.d')).toBeNull();
  });

  it('returns null when the payload is not valid JSON', () => {
    const token = `${encodeBase64Url('{}')}.${encodeBase64Url('not-json')}.${encodeBase64Url('sig')}`;
    expect(decodeJwt(token)).toBeNull();
  });
});

describe('isJwtExpired', () => {
  const NOW = 1_700_000_000_000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for null, undefined, and empty tokens', () => {
    expect(isJwtExpired(null)).toBe(true);
    expect(isJwtExpired(undefined)).toBe(true);
    expect(isJwtExpired('')).toBe(true);
  });

  it('returns true when the token is malformed', () => {
    expect(isJwtExpired('garbage')).toBe(true);
  });

  it('returns true when exp is missing', () => {
    const token = makeJwt({ sub: 'u' });
    expect(isJwtExpired(token)).toBe(true);
  });

  it('returns true when exp is in the past', () => {
    const past = Math.floor(NOW / 1000) - 60;
    const token = makeJwt({ exp: past });
    expect(isJwtExpired(token)).toBe(true);
  });

  it('returns false when exp is in the future', () => {
    const future = Math.floor(NOW / 1000) + 3600;
    const token = makeJwt({ exp: future });
    expect(isJwtExpired(token)).toBe(false);
  });
});
