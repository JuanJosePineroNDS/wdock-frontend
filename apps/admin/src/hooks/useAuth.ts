import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '@wdock/api-client';

import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { user, isAuthenticated, setSession, clearSession } = useAuthStore();
  const navigate = useNavigate();

  const logout = useCallback(() => {
    authStorage.clear();
    clearSession();
    navigate('/login', { replace: true });
  }, [clearSession, navigate]);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [logout]);

  return { user, isAuthenticated, setSession, logout };
}
