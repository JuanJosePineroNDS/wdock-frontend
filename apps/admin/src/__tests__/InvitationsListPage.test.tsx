import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

import { InvitationsListPage } from '@/routes/admin/InvitationsListPage';
import { useAuthStore } from '@/stores/authStore';

const mockApi = {
  GET: vi.fn(),
  POST: vi.fn(),
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <InvitationsListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function setAdmin() {
  useAuthStore.setState({
    user: {
      id: 'u1',
      email: 'admin@example.com',
      role: 'ADMIN',
      is_active: true,
      is_staff: true,
      tenant_id: 't1',
      tenant_name: 'Default Tenant',
      last_login_at: null,
    },
    isAuthenticated: true,
  });
}

describe('InvitationsListPage', () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
    mockApi.POST.mockReset();
    setAdmin();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists invitations returned by the API', async () => {
    mockApi.GET.mockResolvedValue({
      data: [
        {
          id: 'i1',
          tenant: 't1',
          tenant_name: 'Default Tenant',
          email: 'one@example.com',
          role: 'OPERATOR',
          token: 'tok-1',
          status: 'PENDING',
          invited_by: 'u1',
          invited_by_email: 'admin@example.com',
          expires_at: '2030-01-01T00:00:00Z',
          accepted_at: null,
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      error: undefined,
    });

    renderPage();
    await waitFor(() => expect(screen.getByText('one@example.com')).toBeInTheDocument());
    expect(mockApi.GET).toHaveBeenCalledWith('/api/v1/auth/invitations');
  });

  it('creates a new invitation and surfaces the plaintext token', async () => {
    mockApi.GET.mockResolvedValue({ data: [], error: undefined });
    mockApi.POST.mockResolvedValue({
      data: {
        id: 'i2',
        tenant: 't1',
        tenant_name: 'Default Tenant',
        email: 'new@example.com',
        role: 'AUDITOR',
        token: 'plain-token-abc',
        status: 'PENDING',
        invited_by: 'u1',
        invited_by_email: 'admin@example.com',
        expires_at: '2030-01-01T00:00:00Z',
        accepted_at: null,
        created_at: '2026-01-01T00:00:00Z',
      },
      error: undefined,
      response: { status: 201 } as Response,
    });

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(mockApi.GET).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /new invitation/i }));
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.selectOptions(screen.getByLabelText('Role'), 'AUDITOR');
    await user.click(screen.getByRole('button', { name: /create invitation/i }));

    const callout = await screen.findByTestId('created-token');
    expect(within(callout).getByTestId('created-token-value')).toHaveTextContent(
      'plain-token-abc',
    );
    expect(mockApi.POST).toHaveBeenCalledWith('/api/v1/auth/invitations', {
      body: { email: 'new@example.com', role: 'AUDITOR' },
    });
  });
});
