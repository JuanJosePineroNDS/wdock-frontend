import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UsersPage } from '@/routes/users/UsersPage';
import { useAuthStore } from '@/stores/authStore';
import { renderWithProviders } from './testUtils';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
}));

const mockApi = {
  GET: vi.fn(),
  POST: vi.fn(),
  PATCH: vi.fn(),
};

function setSuperadmin() {
  useAuthStore.setState({
    user: {
      id: 'me',
      email: 'super@wdock.local',
      full_name: 'Super',
      role: 'SUPERADMIN' as const,
      is_active_in_tenant: true,
      is_staff: true,
      tenant_id: 't',
      tenant_name: 'Demo',
      last_login_at: null,
    },
    isAuthenticated: true,
  });
}

function setAdmin() {
  useAuthStore.setState({
    user: {
      id: 'me',
      email: 'admin@wdock.local',
      full_name: 'Admin',
      role: 'ADMIN' as const,
      is_active_in_tenant: true,
      is_staff: true,
      tenant_id: 't',
      tenant_name: 'Demo',
      last_login_at: null,
    },
    isAuthenticated: true,
  });
}

function userRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'u-other',
    email: 'operador1@wdock.local',
    full_name: 'Operador Uno',
    role: 'OPERADOR' as const,
    is_active_in_tenant: true,
    is_active: true,
    is_staff: false,
    last_login_at: '2026-05-13T10:00:00Z',
    created_at: '2026-01-01T10:00:00Z',
    ...overrides,
  };
}

function listResponse(results: ReturnType<typeof userRow>[]) {
  return {
    data: { count: results.length, next: null, previous: null, results },
    error: undefined,
    response: { status: 200 } as Response,
  };
}

describe('UsersPage', () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
    mockApi.POST.mockReset();
    mockApi.PATCH.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('blocks non-SUPERADMIN users with an inline message', () => {
    setAdmin();
    renderWithProviders(<UsersPage />, { initialPath: '/users', path: '/users' });

    expect(screen.getByText(/sin permisos/i)).toBeInTheDocument();
    expect(mockApi.GET).not.toHaveBeenCalled();
  });

  it('renders the users table with the expected columns', async () => {
    setSuperadmin();
    mockApi.GET.mockResolvedValue(listResponse([userRow()]));

    renderWithProviders(<UsersPage />, { initialPath: '/users', path: '/users' });

    expect(await screen.findByText('operador1@wdock.local')).toBeInTheDocument();
    const row = screen.getByTestId('users-row');
    expect(within(row).getByText('Operador Uno')).toBeInTheDocument();
    expect(within(row).getByText('Operador')).toBeInTheDocument();
    expect(within(row).getByText('Activo')).toBeInTheDocument();
  });

  it('forwards the show_inactive toggle to the API', async () => {
    setSuperadmin();
    mockApi.GET.mockResolvedValue(listResponse([userRow()]));
    const user = userEvent.setup();

    renderWithProviders(<UsersPage />, { initialPath: '/users', path: '/users' });

    await waitFor(() => expect(mockApi.GET).toHaveBeenCalled());
    await user.click(screen.getByTestId('users-show-inactive'));

    await waitFor(() => {
      const last = mockApi.GET.mock.calls.at(-1);
      expect(last?.[1]?.params?.query?.show_inactive).toBe(true);
    });
  });

  it('creates a new user via POST with the form payload', async () => {
    setSuperadmin();
    mockApi.GET.mockResolvedValue(listResponse([]));
    mockApi.POST.mockResolvedValue({
      data: {
        id: 'u-new',
        email: 'nuevo@wdock.local',
        full_name: 'Nuevo Usuario',
        role: 'OPERADOR',
      },
      error: undefined,
      response: { status: 201 } as Response,
    });
    const user = userEvent.setup();

    renderWithProviders(<UsersPage />, { initialPath: '/users', path: '/users' });

    await user.click(await screen.findByTestId('users-new'));
    await user.type(screen.getByTestId('user-email'), 'nuevo@wdock.local');
    await user.type(screen.getByTestId('user-full-name'), 'Nuevo Usuario');
    await user.selectOptions(screen.getByTestId('user-role'), 'OPERADOR');
    await user.type(screen.getByTestId('user-password'), 'changeme12');
    await user.click(screen.getByTestId('user-form-submit'));

    await waitFor(() =>
      expect(mockApi.POST).toHaveBeenCalledWith('/api/v1/users/', {
        body: {
          email: 'nuevo@wdock.local',
          full_name: 'Nuevo Usuario',
          role: 'OPERADOR',
          password: 'changeme12',
        },
      }),
    );
    expect(toastSuccess).toHaveBeenCalledWith('Usuario nuevo@wdock.local creado');
  });

  it('validates email format and password length before submitting', async () => {
    setSuperadmin();
    mockApi.GET.mockResolvedValue(listResponse([]));
    const user = userEvent.setup();

    renderWithProviders(<UsersPage />, { initialPath: '/users', path: '/users' });

    await user.click(await screen.findByTestId('users-new'));
    await user.type(screen.getByTestId('user-email'), 'no-arroba');
    await user.type(screen.getByTestId('user-password'), 'short');
    await user.click(screen.getByTestId('user-form-submit'));

    expect(screen.getByText(/formato de email/i)).toBeInTheDocument();
    expect(screen.getByText(/mínimo 8 caracteres/i)).toBeInTheDocument();
    expect(mockApi.POST).not.toHaveBeenCalled();
  });

  it('patches the user when editing an existing row', async () => {
    setSuperadmin();
    mockApi.GET.mockResolvedValue(listResponse([userRow()]));
    mockApi.PATCH.mockResolvedValue({
      data: { full_name: 'Operador Editado', role: 'ADMIN' },
      error: undefined,
      response: { status: 200 } as Response,
    });
    const user = userEvent.setup();

    renderWithProviders(<UsersPage />, { initialPath: '/users', path: '/users' });

    await user.click(await screen.findByTestId('users-row-edit'));
    const nameInput = await screen.findByTestId('user-full-name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Operador Editado');
    await user.selectOptions(screen.getByTestId('user-role'), 'ADMIN');
    await user.click(screen.getByTestId('user-form-submit'));

    await waitFor(() =>
      expect(mockApi.PATCH).toHaveBeenCalledWith('/api/v1/users/{id}/', {
        params: { path: { id: 'u-other' } },
        body: { full_name: 'Operador Editado', role: 'ADMIN' },
      }),
    );
  });

  it('deactivates a user through the confirm dialog', async () => {
    setSuperadmin();
    mockApi.GET.mockResolvedValue(listResponse([userRow()]));
    mockApi.POST.mockResolvedValue({
      data: userRow({ is_active_in_tenant: false }),
      error: undefined,
      response: { status: 200 } as Response,
    });
    const user = userEvent.setup();

    renderWithProviders(<UsersPage />, { initialPath: '/users', path: '/users' });

    await user.click(await screen.findByTestId('users-row-toggle'));
    await user.click(screen.getByTestId('confirm-dialog-submit'));

    await waitFor(() =>
      expect(mockApi.POST).toHaveBeenCalledWith('/api/v1/users/{id}/deactivate/', {
        params: { path: { id: 'u-other' } },
      }),
    );
    expect(toastSuccess).toHaveBeenCalledWith('Usuario operador1@wdock.local desactivado');
  });

  it('resets a user password via the dedicated dialog', async () => {
    setSuperadmin();
    mockApi.GET.mockResolvedValue(listResponse([userRow()]));
    mockApi.POST.mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { status: 200 } as Response,
    });
    const user = userEvent.setup();

    renderWithProviders(<UsersPage />, { initialPath: '/users', path: '/users' });

    await user.click(await screen.findByTestId('users-row-reset'));
    await user.type(screen.getByTestId('reset-new-password'), 'temporal-2026');
    await user.type(screen.getByTestId('reset-confirm-password'), 'temporal-2026');
    await user.click(screen.getByTestId('reset-submit'));

    await waitFor(() =>
      expect(mockApi.POST).toHaveBeenCalledWith('/api/v1/users/{id}/reset-password/', {
        params: { path: { id: 'u-other' } },
        body: { new_password: 'temporal-2026' },
      }),
    );
    expect(toastSuccess).toHaveBeenCalledWith('Contraseña reseteada para operador1@wdock.local');
  });

  it('does not allow the current superadmin to deactivate themselves', async () => {
    setSuperadmin();
    mockApi.GET.mockResolvedValue(
      listResponse([
        userRow({
          id: 'me',
          email: 'super@wdock.local',
          full_name: 'Super',
          role: 'SUPERADMIN',
        }),
      ]),
    );

    renderWithProviders(<UsersPage />, { initialPath: '/users', path: '/users' });

    const toggle = await screen.findByTestId('users-row-toggle');
    expect(toggle).toBeDisabled();
  });
});
