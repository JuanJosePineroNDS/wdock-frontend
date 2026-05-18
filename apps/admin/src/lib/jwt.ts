/**
 * Minimal JWT helpers for the admin session bootstrap.
 *
 * We avoid an extra dependency (jwt-decode) because we only need to read the
 * standard `exp` claim and never verify signatures on the client — the backend
 * is the source of truth for token authenticity.
 */

export interface JwtPayload {
  exp?: number;
  [key: string]: unknown;
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const missing = padded.length % 4;
  const padding = missing === 0 ? '' : '='.repeat(4 - missing);
  return atob(padded + padding);
}

export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = base64UrlDecode(parts[1]);
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Treats a token as expired when:
 *  - it is malformed,
 *  - it has no numeric `exp` claim, or
 *  - `exp * 1000 <= Date.now()`.
 *
 * A small clock skew of 5 s is intentionally NOT applied here; the HTTP
 * interceptor will still refresh on 401 from the server, which is the
 * authoritative clock.
 */
export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return Date.now() >= payload.exp * 1000;
}
