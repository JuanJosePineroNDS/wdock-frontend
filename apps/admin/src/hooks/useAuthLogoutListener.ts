import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '@wdock/api-client';

import { useAuthStore } from '@/stores/authStore';

/**
 * Subscribes to the `auth:logout` event the API client dispatches when the
 * refresh flow gives up. Mount this once at the app root so the handler is
 * always active, regardless of which screen the user is on.
 */
export function useAuthLogoutListener(): void {
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      authStorage.clear();
      clearSession();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [clearSession, navigate]);
}
