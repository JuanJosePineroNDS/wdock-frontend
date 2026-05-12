import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authStorage } from '@app/api-client';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

vi.mock('@/config/registration', () => ({
  isPublicRegistrationEnabled: () => mode === 'PUBLIC',
  isInvitationRegistrationEnabled: () => mode === 'INVITATION',
}));

import { RegisterPage } from '@/routes/auth/RegisterPage';
import { useAuthStore } from '@/stores/authStore';

const mockApi = { POST: vi.fn() };
let mode: 'PUBLIC' | 'INVITATION' | 'CLOSED' = 'PUBLIC';

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<div>Login screen</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.setState({ user: null, isAuthenticated: false });
    mockApi.POST.mockReset();
    mode = 'PUBLIC';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when public registration is disabled', () => {
    mode = 'CLOSED';
    renderRegister();
    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create account/i })).toBeNull();
  });

  it('registers the user and signs them in', async () => {
    mockApi.POST.mockResolvedValue({
      data: {
        access: 'access-1',
        refresh: 'refresh-1',
        user: {
          id: 'u1',
          email: 'new@example.com',
          role: 'OPERATOR',
          is_active: true,
          is_staff: false,
          tenant_id: 't1',
          tenant_name: 'Default Tenant',
          last_login_at: null,
        },
      },
      error: undefined,
      response: { status: 201 } as Response,
    });

    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.type(screen.getByLabelText(/confirm password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mockApi.POST).toHaveBeenCalledTimes(1));
    expect(mockApi.POST).toHaveBeenCalledWith('/api/v1/auth/register/public', {
      body: { email: 'new@example.com', password: 'secret123' },
    });
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
    expect(authStorage.getAccess()).toBe('access-1');
    expect(useAuthStore.getState().user?.email).toBe('new@example.com');
  });

  it('reports a friendly error on 409 (duplicate email)', async () => {
    mockApi.POST.mockResolvedValue({
      data: undefined,
      error: { detail: 'duplicate' },
      response: { status: 409 } as Response,
    });

    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByLabelText('Email'), 'dup@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.type(screen.getByLabelText(/confirm password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByTestId('register-error')).toHaveTextContent(/already exists/i);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('validates that passwords match', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockApi.POST).not.toHaveBeenCalled();
  });
});
