# Security Considerations — WDock Frontend

This document captures the current security posture of the admin and signing
apps and the open improvements. It complements the backend `SECURITY.md`.

## Authentication Token Storage

### Current state

- Access token: stored in `localStorage` under `wdock.auth.access`.
- Refresh token: stored in `localStorage` under `wdock.auth.refresh`.
- Authenticated user identity (Zustand persisted state): stored in
  `localStorage` under `wdock.auth.session`.

Source of truth: `packages/api-client/src/auth-storage.ts` and
`apps/admin/src/stores/authStore.ts`.

### Risks

- `localStorage` is readable by any script that runs in the document context.
  A successful XSS would allow an attacker to exfiltrate both tokens and
  impersonate the user until the tokens expire / are rotated.
- The refresh token is the higher-value secret: long-lived and usable to mint
  fresh access tokens.

### Current mitigations

- **Strict CSP** (this PR) blocks the most common XSS vectors:
  `script-src 'self'` forbids inline scripts and `eval`, `object-src 'none'`
  forbids legacy plugins, `frame-ancestors 'none'` prevents clickjacking, and
  `connect-src` is restricted to known backend origins.
- **Short access TTL**: 15 minutes (backend PR 1).
- **Refresh rotation + blacklist** on the backend: a previously seen refresh
  cannot be reused, and changing password blacklists all outstanding tokens
  for that user (backend PR 1).
- **Login throttling and lockout** on the backend (PR 1) reduce brute-force
  exposure even if a partial credential leak occurs.
- **Strict CORS** on the backend (PR 2) limits which origins can call the API.

### Future improvement (out of scope for this PR)

Move authentication tokens out of `localStorage`:

1. Backend issues the refresh token as an `HttpOnly`, `Secure`, `SameSite=Lax`
   cookie.
2. Backend adds CSRF protection to refresh / state-changing endpoints that use
   the cookie.
3. Frontend keeps the access token in memory only (Zustand without `persist`).
4. On page load the frontend calls `/auth/refresh/`; the browser sends the
   `HttpOnly` cookie automatically. If it succeeds, the frontend has a fresh
   access token in memory. If it fails, the user is redirected to login.

That refactor needs coordinated backend + frontend changes and is tracked as a
follow-up. It is not part of this PR.

## Content Security Policy

CSP is enforced via a `<meta http-equiv="Content-Security-Policy">` tag in
both `apps/admin/index.html` and `apps/signing/index.html`.

Key directives:

| Directive         | Value                                                                 | Rationale                                                              |
| ----------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `default-src`     | `'self'`                                                              | Deny everything by default; opt in per resource type.                  |
| `script-src`      | `'self'`                                                              | No inline scripts, no `eval`, no third-party scripts.                  |
| `style-src`       | `'self' 'unsafe-inline'`                                              | Tailwind / shadcn require inline styles.                               |
| `img-src`         | `'self' data: blob:`                                                  | App icons + generated previews + object URLs for downloads.            |
| `font-src`        | `'self' data:` (admin) / `'self'` (signing)                           | Only system / locally bundled fonts.                                   |
| `connect-src`     | `'self' http://localhost:8000 http://127.0.0.1:8000 https://api.wdock.es` | Whitelist of API origins for dev and prod.                          |
| `frame-ancestors` | `'none'`                                                              | Reinforces backend's `X-Frame-Options: DENY` (anti-clickjacking).      |
| `form-action`     | `'self'`                                                              | Forms cannot post to third parties.                                    |
| `base-uri`        | `'self'`                                                              | Prevent `<base>` tag hijacking.                                        |
| `object-src`      | `'none'`                                                              | Disable `<object>`, `<embed>`, Flash, etc.                             |

Notes:

- `'unsafe-inline'` is **only** allowed in `style-src` — never in `script-src`.
- `X-Frame-Options: DENY` is added by the backend as a real HTTP header. The
  CSP `frame-ancestors 'none'` is a more modern equivalent and is preferred by
  current browsers.
- The static `<meta>` form of CSP is sufficient for the directives we use. A
  future hardening could move CSP to an HTTP header served by the
  CDN/reverse-proxy in front of the SPAs to also cover `X-Frame-Options`,
  `Strict-Transport-Security`, etc.

### CDN / reverse-proxy headers (production deployment checklist)

The HTML is served by Vite in dev and by the static host (S3/CloudFront,
Vercel, Nginx, …) in prod. The static host must add the following headers to
HTML responses for defence in depth:

- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`

The backend already sets these for API responses (PR 2).

## CORS

The backend (PR 2) accepts requests only from:

- Development: `http://localhost:5173`, `http://localhost:5174`.
- Production: whatever is configured via the `CORS_ALLOWED_ORIGINS` env var.

Requests from unknown origins are rejected by the browser before they reach
application code.

## Login Error Handling

The admin login screen treats all non-2xx login responses as either:

- `401` → "Credenciales incorrectas." (generic — covers wrong password,
  unknown user, and the legacy lockout case which the backend now folds into
  401).
- `5xx` → "No se ha podido conectar con el servidor."
- Anything else → generic "No se ha podido iniciar sesión."

Specific status codes are intentionally **not** surfaced to avoid leaking
account-existence information.

## Reporting Security Issues

Please report suspected vulnerabilities privately to the WDock security
contact rather than opening a public issue. See the parent
`docs/SECURITY-CONTACT.md` (or contact your account manager) for the
appropriate channel.
