import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authStorage } from '@app/api-client';

import { AuthBootstrap } from '@/components/auth/AuthBootstrap';
import { AUTH_SESSION_STORAGE_KEY, useAuthStore } from '@/stores/authStore';

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    POST: vi.fn(),
    GET: vi.fn(),
  },
}));

// Import after the mock so the AuthBootstrap module receives the stub.
import { apiClient } from '@/lib/apiClient';

const mockApi = apiClient as unknown as {
  POST: ReturnType<typeof vi.fn>;
  GET: ReturnType<typeof vi.fn>;
};

function encodeBase64Url(value: string): string {
  return btoa(value).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function makeJwt(expSeconds: number): string {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify({ exp: expSeconds }));
  return `${header}.${body}.sig`;
}

function freshTokens() {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    validAccess: makeJwt(nowSeconds + 3600),
    expiredAccess: makeJwt(nowSeconds - 60),
    validRefresh: makeJwt(nowSeconds + 7 * 24 * 3600),
    expiredRefresh: makeJwt(nowSeconds - 7 * 24 * 3600),
  };
}

const fakeUser = {
  id: 'u1',
  email: 'admin@example.com',
  role: 'ADMIN' as const,
  is_active: true,
  is_staff: true,
  tenant_id: 't1',
  tenant_name: 'Default Tenant',
  last_login_at: null,
};

function renderBootstrap() {
  return render(
    <AuthBootstrap>
      <div data-testid="protected">App ready</div>
    </AuthBootstrap>,
  );
}

describe('AuthBootstrap', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.setState({ user: null, isAuthenticated: false });
    mockApi.POST.mockReset();
    mockApi.GET.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children unauthenticated when there are no tokens', async () => {
    renderBootstrap();

    expect(screen.getByRole('status')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('protected')).toBeInTheDocument());

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockApi.POST).not.toHaveBeenCalled();
    expect(mockApi.GET).not.toHaveBeenCalled();
  });

  it('keeps the persisted user authenticated when the access token is valid', async () => {
    const { validAccess, validRefresh } = freshTokens();
    authStorage.setTokens(validAccess, validRefresh);
    useAuthStore.setState({ user: fakeUser, isAuthenticated: true });

    renderBootstrap();
    await waitFor(() => expect(screen.getByTestId('protected')).toBeInTheDocument());

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('admin@example.com');
    expect(mockApi.POST).not.toHaveBeenCalled();
  });

  it('refreshes the access token when it is expired but the refresh is valid', async () => {
    const { validAccess, expiredAccess, validRefresh } = freshTokens();
    authStorage.setTokens(expiredAccess, validRefresh);
    useAuthStore.setState({ user: fakeUser, isAuthenticated: true });

    mockApi.POST.mockResolvedValue({
      data: { access: validAccess, refresh: validRefresh },
      error: undefined,
    });

    renderBootstrap();
    await waitFor(() => expect(screen.getByTestId('protected')).toBeInTheDocument());

    expect(mockApi.POST).toHaveBeenCalledWith('/api/v1/auth/refresh', {
      body: { refresh: validRefresh },
    });
    expect(authStorage.getAccess()).toBe(validAccess);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('fetches /auth/me after a refresh when no persisted user is available', async () => {
    const { validAccess, expiredAccess, validRefresh } = freshTokens();
    authStorage.setTokens(expiredAccess, validRefresh);

    mockApi.POST.mockResolvedValue({
      data: { access: validAccess },
      error: undefined,
    });
    mockApi.GET.mockResolvedValue({ data: fakeUser, error: undefined });

    renderBootstrap();
    await waitFor(() => expect(screen.getByTestId('protected')).toBeInTheDocument());

    expect(mockApi.POST).toHaveBeenCalledTimes(1);
    expect(mockApi.GET).toHaveBeenCalledWith('/api/v1/auth/me');
    expect(useAuthStore.getState().user?.email).toBe('admin@example.com');
  });

  it('clears storage and stays unauthenticated when both tokens are expired', async () => {
    const { expiredAccess, expiredRefresh } = freshTokens();
    authStorage.setTokens(expiredAccess, expiredRefresh);
    useAuthStore.setState({ user: fakeUser, isAuthenticated: true });

    renderBootstrap();
    await waitFor(() => expect(screen.getByTestId('protected')).toBeInTheDocument());

    expect(authStorage.getAccess()).toBeNull();
    expect(authStorage.getRefresh()).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(mockApi.POST).not.toHaveBeenCalled();
  });

  it('clears storage when the refresh call fails', async () => {
    const { expiredAccess, validRefresh } = freshTokens();
    authStorage.setTokens(expiredAccess, validRefresh);

    mockApi.POST.mockResolvedValue({
      data: undefined,
      error: { detail: 'token invalid' },
    });

    renderBootstrap();
    await waitFor(() => expect(screen.getByTestId('protected')).toBeInTheDocument());

    expect(authStorage.getAccess()).toBeNull();
    expect(authStorage.getRefresh()).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('removes the persisted store entry on a clean bootstrap', async () => {
    // Simulate a stale persisted user with no tokens (e.g. user wiped tokens in DevTools).
    window.localStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({ state: { user: fakeUser, isAuthenticated: true }, version: 0 }),
    );

    renderBootstrap();
    await waitFor(() => expect(screen.getByTestId('protected')).toBeInTheDocument());

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
