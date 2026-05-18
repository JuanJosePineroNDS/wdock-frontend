import createClient, { type Client, type Middleware } from 'openapi-fetch';

import { type AuthStorage, authStorage as defaultStorage } from './auth-storage';
import { ApiError, AuthError, ValidationError } from './errors';
import type { WdockPaths } from './schema-overrides';

export interface CreateApiClientOptions {
  baseUrl: string;
  storage?: AuthStorage;
  /**
   * Override fetch (used in tests). Defaults to globalThis.fetch.
   */
  fetch?: typeof fetch;
  /**
   * Path to the refresh endpoint relative to baseUrl. Defaults to '/api/v1/auth/refresh'.
   */
  refreshPath?: string;
  /**
   * Dispatched when the refresh flow fails and the user must log in again.
   * Defaults to dispatching a CustomEvent('auth:logout') on window.
   */
  onAuthLogout?: () => void;
}

export type WdockApiClient = Client<WdockPaths>;

const PUBLIC_PATH_FRAGMENTS = ['/auth/login', '/auth/refresh', '/sign/'];

function isPublicRequest(url: string): boolean {
  return PUBLIC_PATH_FRAGMENTS.some((fragment) => url.includes(fragment));
}

function defaultLogout(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

function buildAuthMiddleware(
  storage: AuthStorage,
  refreshUrl: string,
  onLogout: () => void,
  fetchImpl: typeof fetch,
): Middleware {
  let inflightRefresh: Promise<string | null> | null = null;

  async function refreshAccessToken(): Promise<string | null> {
    if (inflightRefresh) {
      return inflightRefresh;
    }
    const refresh = storage.getRefresh();
    if (!refresh) {
      return null;
    }

    inflightRefresh = (async () => {
      try {
        const response = await fetchImpl(refreshUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
        if (!response.ok) {
          storage.clear();
          onLogout();
          return null;
        }
        const data = (await response.json()) as { access?: string; refresh?: string };
        if (!data.access) {
          storage.clear();
          onLogout();
          return null;
        }
        if (data.refresh) {
          storage.setTokens(data.access, data.refresh);
        } else {
          storage.setAccess(data.access);
        }
        return data.access;
      } catch {
        storage.clear();
        onLogout();
        return null;
      } finally {
        inflightRefresh = null;
      }
    })();

    return inflightRefresh;
  }

  return {
    async onRequest({ request }) {
      if (isPublicRequest(request.url)) {
        return request;
      }
      const access = storage.getAccess();
      if (access) {
        request.headers.set('Authorization', `Bearer ${access}`);
      }
      return request;
    },
    async onResponse({ request, response }) {
      if (response.status !== 401 || isPublicRequest(request.url)) {
        return response;
      }
      // Avoid retrying a request that we already retried.
      if (request.headers.get('x-wdock-retried') === '1') {
        storage.clear();
        onLogout();
        return response;
      }
      const newAccess = await refreshAccessToken();
      if (!newAccess) {
        return response;
      }
      const retryHeaders = new Headers(request.headers);
      retryHeaders.set('Authorization', `Bearer ${newAccess}`);
      retryHeaders.set('x-wdock-retried', '1');
      const retried = await fetchImpl(request.url, {
        method: request.method,
        headers: retryHeaders,
        body: request.body,
        // openapi-fetch sets duplex internally when body is a stream; safe default for plain bodies.
      } as RequestInit);
      return retried;
    },
  };
}

export function createApiClient(options: CreateApiClientOptions): WdockApiClient {
  const storage = options.storage ?? defaultStorage;
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  const refreshUrl = `${options.baseUrl.replace(/\/$/, '')}${options.refreshPath ?? '/api/v1/auth/refresh'}`;
  const onLogout = options.onAuthLogout ?? defaultLogout;

  const client = createClient<WdockPaths>({
    baseUrl: options.baseUrl,
    fetch: fetchImpl,
  });

  client.use(buildAuthMiddleware(storage, refreshUrl, onLogout, fetchImpl));

  return client;
}

export async function unwrapError(response: Response): Promise<ApiError> {
  const body = await safeJson(response);
  if (response.status === 401) {
    return new AuthError('Authentication required', body);
  }
  if (response.status === 400 && body && typeof body === 'object') {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        fieldErrors[key] = value.map(String);
      }
    }
    return new ValidationError('Validation failed', body, fieldErrors);
  }
  return new ApiError(response.statusText || 'Request failed', response.status, body);
}
