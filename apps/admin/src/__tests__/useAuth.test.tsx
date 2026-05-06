import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { authStorage } from '@wdock/api-client';

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';

describe('useAuth', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.setState({
      user: { id: 'u', email: 'a@b.c', first_name: 'A', last_name: 'B', role: 'admin', tenant_id: 't' },
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
