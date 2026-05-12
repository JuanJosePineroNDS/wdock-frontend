import { useEffect, useState, type ReactNode } from 'react';
import { authStorage } from '@app/api-client';

import { apiClient } from '@/lib/apiClient';
import { isJwtExpired } from '@/lib/jwt';
import { useAuthStore } from '@/stores/authStore';

/**
 * Resolves the auth state from localStorage before the router renders.
 *
 * Why: the Zustand store rehydrates `user` synchronously via the persist
 * middleware, but tokens live in their own keys (`app.auth.access`,
 * `app.auth.refresh`). On reload we must reconcile both: if the access
 * token is missing/expired, the persisted user is stale and the
 * `ProtectedRoute` redirect would briefly flash /login before the
 * interceptor can fix it.
 *
 * Decision tree on mount:
 *   - no tokens                       → force clean state, ready
 *   - access valid                    → trust persisted user, ready
 *   - access expired, refresh valid   → POST /auth/refresh, refetch user
 *                                       if missing, ready
 *   - both invalid                    → clear everything, ready
 *
 * A loader is rendered while resolving so the protected router never
 * sees a transient `isAuthenticated=false`.
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function reset() {
      authStorage.clear();
      useAuthStore.getState().clearSession();
    }

    async function bootstrap() {
      const access = authStorage.getAccess();
      const refresh = authStorage.getRefresh();

      if (!access && !refresh) {
        await reset();
        if (!cancelled) setReady(true);
        return;
      }

      if (access && !isJwtExpired(access)) {
        // Persisted user (zustand persist) already rehydrated; nothing to do
        // unless storage is in a weird mixed state (token but no user).
        if (!useAuthStore.getState().user) {
          await fetchAndStoreMe();
        }
        if (!cancelled) setReady(true);
        return;
      }

      if (refresh && !isJwtExpired(refresh)) {
        const refreshed = await tryRefresh(refresh);
        if (cancelled) return;
        if (!refreshed) {
          await reset();
        } else if (!useAuthStore.getState().user) {
          await fetchAndStoreMe();
        }
        if (!cancelled) setReady(true);
        return;
      }

      await reset();
      if (!cancelled) setReady(true);
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <FullScreenLoader />;
  }
  return <>{children}</>;
}

async function tryRefresh(refresh: string): Promise<boolean> {
  try {
    const { data, error } = await apiClient.POST('/api/v1/auth/refresh', {
      body: { refresh },
    });
    if (error || !data?.access) {
      return false;
    }
    if (data.refresh) {
      authStorage.setTokens(data.access, data.refresh);
    } else {
      authStorage.setAccess(data.access);
    }
    return true;
  } catch {
    return false;
  }
}

async function fetchAndStoreMe(): Promise<void> {
  try {
    const { data } = await apiClient.GET('/api/v1/auth/me');
    if (data) {
      useAuthStore.getState().setSession(data);
      return;
    }
  } catch {
    /* fall through */
  }
  authStorage.clear();
  useAuthStore.getState().clearSession();
}

function FullScreenLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Restoring session"
      className="flex min-h-screen items-center justify-center bg-slate-50"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
    </div>
  );
}
