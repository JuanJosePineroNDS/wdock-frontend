import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authStorage } from '@app/api-client';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

import { AcceptInvitationPage } from '@/routes/auth/AcceptInvitationPage';
import { useAuthStore } from '@/stores/authStore';

const mockApi = {
  GET: vi.fn(),
  POST: vi.fn(),
};

function renderWith(token: string) {
  return render(
    <MemoryRouter initialEntries={[`/invitations/${token}`]}>
      <Routes>
        <Route path="/invitations/:token" element={<AcceptInvitationPage />} />
        <Route path="/login" element={<div>Login screen</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AcceptInvitationPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.setState({ user: null, isAuthenticated: false });
    mockApi.GET.mockReset();
    mockApi.POST.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows invitation details and accepts on submit', async () => {
    mockApi.GET.mockResolvedValue({
      data: {
        email: 'invited@example.com',
        role: 'OPERATOR',
        tenant_name: 'Default Tenant',
        expires_at: '2030-01-01T00:00:00Z',
        status: 'PENDING',
      },
      error: undefined,
      response: { status: 200 } as Response,
    });
    mockApi.POST.mockResolvedValue({
      data: {
        access: 'access-1',
        refresh: 'refresh-1',
        user: {
          id: 'u1',
          email: 'invited@example.com',
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
    renderWith('the-token');

    await waitFor(() => expect(screen.getByText('invited@example.com')).toBeInTheDocument());
    expect(mockApi.GET).toHaveBeenCalledWith('/api/v1/auth/invitations/{token}', {
      params: { path: { token: 'the-token' } },
    });

    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.type(screen.getByLabelText(/confirm password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /accept invitation/i }));

    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
    expect(mockApi.POST).toHaveBeenCalledWith('/api/v1/auth/invitations/{token}/accept', {
      params: { path: { token: 'the-token' } },
      body: { password: 'secret123' },
    });
    expect(authStorage.getAccess()).toBe('access-1');
    expect(useAuthStore.getState().user?.email).toBe('invited@example.com');
  });

  it('shows a friendly message when the invitation is no longer valid', async () => {
    mockApi.GET.mockResolvedValue({
      data: undefined,
      error: { detail: 'gone' },
      response: { status: 410 } as Response,
    });

    renderWith('expired-token');

    expect(await screen.findByTestId('invitation-load-error')).toHaveTextContent(
      /no longer valid/i,
    );
    expect(screen.queryByRole('button', { name: /accept invitation/i })).toBeNull();
  });
});
