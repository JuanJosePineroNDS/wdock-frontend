# Authentication

The template uses JWT (Simple JWT from Django REST Framework). Tokens are stored in `localStorage` and the React store is persisted alongside them so the session survives reloads.

## Tokens and storage keys

| Key                | Set by                       | Purpose                                                        |
| ------------------ | ---------------------------- | -------------------------------------------------------------- |
| `app.auth.access`  | `authStorage.setTokens`      | Short-lived access JWT (~minutes).                             |
| `app.auth.refresh` | `authStorage.setTokens`      | Refresh JWT (~days). Used to obtain a new access token.        |
| `app.auth.session` | Zustand `persist` middleware | Persisted snapshot of the authenticated user (`useAuthStore`). |

The constants live in `packages/api-client/src/auth-storage.ts` and `apps/admin/src/stores/authStore.ts`. Rename them together if you rebrand the storage namespace.

## Sign-in flow

1. `LoginPage` posts `{ email, password }` to `POST /api/v1/auth/login`.
2. On success, `authStorage.setTokens(access, refresh)` writes the JWTs and `useAuthStore.setSession(user)` writes the user. Zustand's `persist` middleware mirrors the user to `localStorage`.
3. The user is redirected to `/dashboard`. `ProtectedRoute` reads `isAuthenticated` from the store and allows the navigation.

## Reload behaviour

`AuthBootstrap` (rendered above `BrowserRouter`) decides what the session should look like before the router mounts:

- **No tokens** → clear any stale persisted user and render the children.
- **Access token still valid** → trust the persisted user. If the persisted user is missing (mixed state), fetch `GET /api/v1/auth/me` to repopulate it.
- **Access expired, refresh still valid** → call `POST /api/v1/auth/refresh`; on success, optionally refetch the user.
- **Both invalid** → clear everything.

A full-screen loader (`role="status"`) is shown while resolving, so `ProtectedRoute` never sees a transient `isAuthenticated=false`.

## Silent refresh

The interceptor in `packages/api-client/src/client.ts` retries any authenticated request that gets a `401` by calling `/api/v1/auth/refresh` once. It dedupes concurrent refreshes via an in-flight promise and falls back to dispatching a `auth:logout` window event when the refresh fails. `useAuth` listens for that event and clears the session.

## Sign-out

`useAuth().logout()`:

1. `authStorage.clear()` removes both tokens.
2. `useAuthStore.getState().clearSession()` resets the in-memory state.
3. `useAuthStore.persist.clearStorage()` removes the persisted snapshot.
4. Navigates to `/login`.

## Registration paths

Public routes (no auth header):

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/register/public` (only honored when the backend is in `PUBLIC` mode)
- `GET /api/v1/auth/invitations/{token}` and `POST /api/v1/auth/invitations/{token}/accept`

These are listed in `PUBLIC_PATH_FRAGMENTS`/`PUBLIC_PATH_REGEXES` inside the api-client, so the auth middleware never adds an `Authorization` header to them.

## What the template does NOT include

- **No email integration.** Invitation tokens are shown once to the admin who creates them, with a copy button, and must be delivered manually.
- **No password-reset UI.** Without email, there's no reset flow worth shipping. Add one as a follow-up when an email provider is wired in.
