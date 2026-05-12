import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authStorage } from '@app/api-client';

import { LoginPage } from '@/routes/auth/LoginPage';
import { useAuthStore } from '@/stores/authStore';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

const mockApi = {
  POST: vi.fn(),
};

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.setState({ user: null, isAuthenticated: false });
    mockApi.POST.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation errors for invalid input', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(mockApi.POST).not.toHaveBeenCalled();
  });

  it('logs in successfully and stores tokens + session', async () => {
    const user = userEvent.setup();
    mockApi.POST.mockResolvedValue({
      data: {
        access: 'access-1',
        refresh: 'refresh-1',
        user: {
          id: 'u1',
          email: 'admin@example.com',
          rol: 'ADMIN',
          activo: true,
          is_staff: true,
          tenant_id: 't1',
          tenant_nombre: 'Default Tenant',
          ultimo_login: null,
        },
      },
      error: undefined,
      response: { status: 200 } as Response,
    });

    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockApi.POST).toHaveBeenCalledTimes(1));
    expect(mockApi.POST).toHaveBeenCalledWith('/api/v1/auth/login', {
      body: { email: 'admin@example.com', password: 'secret123' },
    });
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
    expect(authStorage.getAccess()).toBe('access-1');
    expect(authStorage.getRefresh()).toBe('refresh-1');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('admin@example.com');
  });

  it('shows a friendly error on 401', async () => {
    const user = userEvent.setup();
    mockApi.POST.mockResolvedValue({
      data: undefined,
      error: { detail: 'invalid' },
      response: { status: 401 } as Response,
    });

    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'badpass99');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByTestId('login-error')).toHaveTextContent(/invalid credentials/i);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('shows server error on 500', async () => {
    const user = userEvent.setup();
    mockApi.POST.mockResolvedValue({
      data: undefined,
      error: { detail: 'boom' },
      response: { status: 503 } as Response,
    });

    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByTestId('login-error')).toHaveTextContent(/cannot reach the server/i);
  });
});
