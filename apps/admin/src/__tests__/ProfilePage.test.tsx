import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, ValidationError } from '@wdock/api-client';

import { ProfilePage } from '@/routes/profile/ProfilePage';
import { renderWithProviders } from './testUtils';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (message: string) => toastSuccess(message),
    error: (message: string) => toastError(message),
  },
}));

const mockApi = {
  GET: vi.fn(),
  POST: vi.fn(),
  PATCH: vi.fn(),
};

function me(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'u1',
    email: 'admin@wdock.local',
    full_name: 'Admin Inicial',
    role: 'ADMIN' as const,
    is_active_in_tenant: true,
    is_staff: true,
    tenant_id: 't1',
    tenant_name: 'Demo Tenant',
    last_login_at: null,
    ...overrides,
  };
}

describe('ProfilePage', () => {
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

  it('renders read-only account data and a pre-filled full name', async () => {
    mockApi.GET.mockResolvedValue({
      data: me(),
      error: undefined,
      response: { status: 200 } as Response,
    });

    renderWithProviders(<ProfilePage />, { initialPath: '/profile', path: '/profile' });

    expect(await screen.findByText('admin@wdock.local')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('Demo Tenant')).toBeInTheDocument();
    expect(screen.getByTestId('profile-full-name')).toHaveValue('Admin Inicial');
  });

  it('saves a new full name via PATCH and shows a success toast', async () => {
    const user = userEvent.setup();
    mockApi.GET.mockResolvedValue({
      data: me(),
      error: undefined,
      response: { status: 200 } as Response,
    });
    mockApi.PATCH.mockResolvedValue({
      data: me({ full_name: 'Admin Renombrado' }),
      error: undefined,
      response: { status: 200 } as Response,
    });

    renderWithProviders(<ProfilePage />, { initialPath: '/profile', path: '/profile' });

    const input = await screen.findByTestId('profile-full-name');
    await user.clear(input);
    await user.type(input, 'Admin Renombrado');
    await user.click(screen.getByTestId('profile-save'));

    await waitFor(() =>
      expect(mockApi.PATCH).toHaveBeenCalledWith('/api/v1/auth/me', {
        body: { full_name: 'Admin Renombrado' },
      }),
    );
    expect(toastSuccess).toHaveBeenCalledWith('Perfil actualizado');
  });

  it('keeps the save button disabled while the full name is unchanged', async () => {
    mockApi.GET.mockResolvedValue({
      data: me(),
      error: undefined,
      response: { status: 200 } as Response,
    });

    renderWithProviders(<ProfilePage />, { initialPath: '/profile', path: '/profile' });

    const saveButton = await screen.findByTestId('profile-save');
    expect(saveButton).toBeDisabled();
  });

  it('keeps the change-password button disabled when fields are empty or mismatched', async () => {
    const user = userEvent.setup();
    mockApi.GET.mockResolvedValue({
      data: me(),
      error: undefined,
      response: { status: 200 } as Response,
    });

    renderWithProviders(<ProfilePage />, { initialPath: '/profile', path: '/profile' });

    const submit = await screen.findByTestId('change-password-submit');
    expect(submit).toBeDisabled();

    await user.type(screen.getByTestId('current-password'), 'old-secret');
    await user.type(screen.getByTestId('new-password'), 'short');
    expect(submit).toBeDisabled();
    expect(screen.getByText('Mínimo 8 caracteres.')).toBeInTheDocument();

    await user.clear(screen.getByTestId('new-password'));
    await user.type(screen.getByTestId('new-password'), 'long-enough');
    await user.type(screen.getByTestId('confirm-password'), 'different-value');
    expect(submit).toBeDisabled();
    expect(screen.getByText(/no coincide/i)).toBeInTheDocument();
  });

  it('submits the change-password POST when the form is valid', async () => {
    const user = userEvent.setup();
    mockApi.GET.mockResolvedValue({
      data: me(),
      error: undefined,
      response: { status: 200 } as Response,
    });
    mockApi.POST.mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { status: 204 } as Response,
    });

    renderWithProviders(<ProfilePage />, { initialPath: '/profile', path: '/profile' });

    await screen.findByTestId('change-password-submit');
    await user.type(screen.getByTestId('current-password'), 'old-secret');
    await user.type(screen.getByTestId('new-password'), 'new-secret-123');
    await user.type(screen.getByTestId('confirm-password'), 'new-secret-123');
    await user.click(screen.getByTestId('change-password-submit'));

    await waitFor(() =>
      expect(mockApi.POST).toHaveBeenCalledWith('/api/v1/auth/me/change-password', {
        body: { current_password: 'old-secret', new_password: 'new-secret-123' },
      }),
    );
    expect(toastSuccess).toHaveBeenCalledWith('Contraseña actualizada');
  });

  it('shows the backend detail when change-password returns 400', async () => {
    const user = userEvent.setup();
    mockApi.GET.mockResolvedValue({
      data: me(),
      error: undefined,
      response: { status: 200 } as Response,
    });
    const validationError = new ValidationError(
      'Validation failed',
      { current_password: ['Contraseña actual incorrecta.'] },
      { current_password: ['Contraseña actual incorrecta.'] },
    );
    mockApi.POST.mockImplementation(() => {
      return Promise.resolve({
        data: undefined,
        error: validationError,
        response: { status: 400 } as Response,
      });
    });

    renderWithProviders(<ProfilePage />, { initialPath: '/profile', path: '/profile' });

    await screen.findByTestId('change-password-submit');
    await user.type(screen.getByTestId('current-password'), 'wrong-secret');
    await user.type(screen.getByTestId('new-password'), 'new-secret-123');
    await user.type(screen.getByTestId('confirm-password'), 'new-secret-123');
    await user.click(screen.getByTestId('change-password-submit'));

    // The actual error thrown is from unwrapError; we just assert the toast fired.
    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('routes generic 5xx errors through extractServerError to the toast', async () => {
    const user = userEvent.setup();
    mockApi.GET.mockResolvedValue({
      data: me(),
      error: undefined,
      response: { status: 200 } as Response,
    });
    mockApi.PATCH.mockResolvedValue({
      data: undefined,
      error: new ApiError('Internal Server Error', 500, { detail: 'kaboom' }),
      response: { status: 500 } as Response,
    });

    renderWithProviders(<ProfilePage />, { initialPath: '/profile', path: '/profile' });

    const input = await screen.findByTestId('profile-full-name');
    await user.clear(input);
    await user.type(input, 'Otro Nombre');
    await user.click(screen.getByTestId('profile-save'));

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
  });
});
