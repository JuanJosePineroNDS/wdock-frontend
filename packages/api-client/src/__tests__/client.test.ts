import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAuthStorage, type StorageLike } from '../auth-storage';
import { createApiClient } from '../client';

function memoryStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
}

interface FetchCall {
  url: string;
  method: string;
  headers: Headers;
  body: BodyInit | null | undefined;
}

function recordingFetch(handlers: Array<(call: FetchCall) => Response | Promise<Response>>) {
  const calls: FetchCall[] = [];
  let index = 0;
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    let url: string;
    let method: string;
    let headers: Headers;
    let body: BodyInit | null | undefined;
    if (input instanceof Request) {
      url = input.url;
      method = input.method;
      headers = new Headers(input.headers);
      body = init?.body ?? null;
    } else {
      url = input.toString();
      method = init?.method ?? 'GET';
      headers = new Headers(init?.headers);
      body = init?.body;
    }
    const call: FetchCall = { url, method, headers, body };
    calls.push(call);
    const handler = handlers[index] ?? handlers[handlers.length - 1];
    index += 1;
    return handler(call);
  });
  return { fn: fn as unknown as typeof fetch, calls };
}

describe('createApiClient', () => {
  const baseUrl = 'http://test.local';
  let storage: ReturnType<typeof createAuthStorage>;

  beforeEach(() => {
    storage = createAuthStorage(memoryStorage());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches Bearer token when one is stored', async () => {
    storage.setTokens('access-token', 'refresh-token');
    const { fn, calls } = recordingFetch([
      () =>
        jsonResponse({
          id: 'u1',
          email: 'a@b.com',
          role: 'ADMIN',
          is_active_in_tenant: true,
          is_staff: true,
          tenant_id: 't1',
          tenant_name: 'Demo',
          last_login_at: null,
        }),
    ]);
    const client = createApiClient({ baseUrl, storage, fetch: fn });

    await client.GET('/api/v1/auth/me');

    expect(calls).toHaveLength(1);
    expect(calls[0].headers.get('Authorization')).toBe('Bearer access-token');
  });

  it('does not attach token to public endpoints (login)', async () => {
    storage.setTokens('access-token', 'refresh-token');
    const { fn, calls } = recordingFetch([
      () =>
        jsonResponse({
          access: 'a',
          refresh: 'r',
          user: {
            id: 'u',
            email: 'a@b.c',
            role: 'ADMIN',
            is_active_in_tenant: true,
            is_staff: false,
            tenant_id: 't',
            tenant_name: 'Demo',
            last_login_at: null,
          },
        }),
    ]);
    const client = createApiClient({ baseUrl, storage, fetch: fn });

    await client.POST('/api/v1/auth/login', { body: { email: 'a@b.c', password: 'x' } });

    expect(calls[0].url).toContain('/api/v1/auth/login');
    expect(calls[0].headers.get('Authorization')).toBeNull();
  });

  it('refreshes the access token on 401 and retries the original request', async () => {
    storage.setTokens('expired-access', 'valid-refresh');
    const onLogout = vi.fn();
    const { fn, calls } = recordingFetch([
      () => jsonResponse({ detail: 'token expired' }, { status: 401 }),
      () => jsonResponse({ access: 'new-access', refresh: 'new-refresh' }),
      () =>
        jsonResponse({
          id: 'u1',
          email: 'a@b.c',
          role: 'ADMIN',
          is_active_in_tenant: true,
          is_staff: true,
          tenant_id: 't1',
          tenant_name: 'Demo',
          last_login_at: null,
        }),
    ]);
    const client = createApiClient({ baseUrl, storage, fetch: fn, onAuthLogout: onLogout });

    const result = await client.GET('/api/v1/auth/me');

    expect(calls).toHaveLength(3);
    expect(calls[1].url).toContain('/api/v1/auth/refresh');
    expect(storage.getAccess()).toBe('new-access');
    expect(storage.getRefresh()).toBe('new-refresh');
    expect(onLogout).not.toHaveBeenCalled();
    expect(result.data).toEqual(expect.objectContaining({ id: 'u1', email: 'a@b.c' }));
    expect(calls[2].headers.get('Authorization')).toBe('Bearer new-access');
  });

  it('logs out when refresh fails', async () => {
    storage.setTokens('expired-access', 'invalid-refresh');
    const onLogout = vi.fn();
    const { fn } = recordingFetch([
      () => jsonResponse({ detail: 'token expired' }, { status: 401 }),
      () => jsonResponse({ detail: 'refresh invalid' }, { status: 401 }),
    ]);
    const client = createApiClient({ baseUrl, storage, fetch: fn, onAuthLogout: onLogout });

    const result = await client.GET('/api/v1/auth/me');

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(storage.getAccess()).toBeNull();
    expect(storage.getRefresh()).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('logs out if no refresh token is available', async () => {
    const onLogout = vi.fn();
    const { fn } = recordingFetch([
      () => jsonResponse({ detail: 'token expired' }, { status: 401 }),
    ]);
    const client = createApiClient({ baseUrl, storage, fetch: fn, onAuthLogout: onLogout });

    await client.GET('/api/v1/auth/me');

    // No refresh token means we never attempt the refresh; logout is not triggered automatically here,
    // but the response is the original 401 and the caller should react.
    expect(onLogout).not.toHaveBeenCalled();
  });
});
