import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '@app/api-client';

import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { user, isAuthenticated, setSession, clearSession } = useAuthStore();
  const navigate = useNavigate();

  const logout = useCallback(() => {
    authStorage.clear();
    clearSession();
    // Remove the persisted store entry so localStorage has no stale session
    // after logout (the in-memory state is already cleared by clearSession).
    void useAuthStore.persist.clearStorage();
    navigate('/login', { replace: true });
  }, [clearSession, navigate]);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [logout]);

  return { user, isAuthenticated, setSession, logout };
}
