import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '@wdock/api-client';

import { useAuthStore } from '@/stores/authStore';

/**
 * Convenience hook around the auth store that also exposes a manual logout.
 * The `auth:logout` event the API client dispatches on refresh failure is
 * handled globally by useAuthLogoutListener mounted at the app root.
 */
export function useAuth() {
  const { user, isAuthenticated, setSession, clearSession } = useAuthStore();
  const navigate = useNavigate();

  const logout = useCallback(() => {
    authStorage.clear();
    clearSession();
    navigate('/login', { replace: true });
  }, [clearSession, navigate]);

  return { user, isAuthenticated, setSession, logout };
}
