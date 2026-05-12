import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { authStorage } from '@app/api-client';

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';

describe('useAuth', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.setState({
      user: {
        id: 'u',
        email: 'a@b.c',
        rol: 'ADMIN',
        activo: true,
        is_staff: true,
        tenant_id: 't',
        tenant_nombre: 'Demo',
        ultimo_login: null,
      },
      isAuthenticated: true,
    });
    authStorage.setTokens('a', 'b');
  });

  it('clears the session when auth:logout is dispatched', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter>{children}</MemoryRouter>
    );
    renderHook(() => useAuth(), { wrapper });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    act(() => {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(authStorage.getAccess()).toBeNull();
    expect(authStorage.getRefresh()).toBeNull();
  });
});
