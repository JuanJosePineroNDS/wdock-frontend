import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CarrierFormDialog } from '@/features/carriers/CarrierFormDialog';
import { renderWithProviders } from './testUtils';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

const successToast = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => successToast(...args),
    error: vi.fn(),
  },
}));

const mockApi = {
  GET: vi.fn(),
  POST: vi.fn(),
  PATCH: vi.fn(),
};

describe('CarrierFormDialog', () => {
  beforeEach(() => {
    mockApi.POST.mockReset();
    mockApi.PATCH.mockReset();
    successToast.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows inline validation errors and does not call the API when the DNI is invalid', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <CarrierFormDialog open mode="create" onOpenChange={onOpenChange} />,
    );

    await user.type(screen.getByTestId('carrier-dni'), '12345678A');
    await user.type(screen.getByTestId('carrier-name'), 'Tester');
    await user.type(screen.getByTestId('carrier-mobile'), '666111222');
    await user.click(screen.getByTestId('carrier-submit'));

    expect(await screen.findByText(/Letra del DNI/i)).toBeInTheDocument();
    expect(mockApi.POST).not.toHaveBeenCalled();
  });

  it('submits a valid form and shows the "creado" toast when status is 201', async () => {
    const user = userEvent.setup();
    mockApi.POST.mockResolvedValue({
      data: {
        dni: '12345678Z',
        full_name: 'Pedro Pérez',
        mobile_phone: '+34666111222',
        license_plates: ['1234ABC'],
        notes: '',
      },
      error: undefined,
      response: { status: 201 } as Response,
    });

    const onOpenChange = vi.fn();
    renderWithProviders(
      <CarrierFormDialog open mode="create" onOpenChange={onOpenChange} />,
    );

    await user.type(screen.getByTestId('carrier-dni'), '12345678Z');
    await user.type(screen.getByTestId('carrier-name'), 'Pedro Pérez');
    await user.type(screen.getByTestId('carrier-mobile'), '+34666111222');
    await user.type(screen.getByTestId('carrier-plates'), '1234ABC');
    await user.click(screen.getByTestId('carrier-submit'));

    await waitFor(() => expect(mockApi.POST).toHaveBeenCalledTimes(1));
    expect(mockApi.POST).toHaveBeenCalledWith(
      '/api/v1/carriers/',
      expect.objectContaining({
        body: expect.objectContaining({
          dni: '12345678Z',
          full_name: 'Pedro Pérez',
          mobile_phone: '+34666111222',
          license_plates: ['1234ABC'],
        }),
      }),
    );
    await waitFor(() => expect(successToast).toHaveBeenCalled());
    expect(successToast.mock.calls[0][0]).toMatch(/creado/i);
  });

  it('shows the "reactivado" toast when the API returns status 200', async () => {
    const user = userEvent.setup();
    mockApi.POST.mockResolvedValue({
      data: {
        dni: '12345678Z',
        full_name: 'Pedro Pérez',
        mobile_phone: '+34666111222',
        license_plates: [],
        notes: '',
      },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const onOpenChange = vi.fn();
    renderWithProviders(
      <CarrierFormDialog open mode="create" onOpenChange={onOpenChange} />,
    );

    await user.type(screen.getByTestId('carrier-dni'), '12345678Z');
    await user.type(screen.getByTestId('carrier-name'), 'Pedro Pérez');
    await user.type(screen.getByTestId('carrier-mobile'), '+34666111222');
    await user.click(screen.getByTestId('carrier-submit'));

    await waitFor(() => expect(mockApi.POST).toHaveBeenCalled());
    await waitFor(() => expect(successToast).toHaveBeenCalled());
    expect(successToast.mock.calls[0][0]).toMatch(/reactivado/i);
  });

  it('submits a PATCH when in edit mode', async () => {
    const user = userEvent.setup();
    mockApi.PATCH.mockResolvedValue({
      data: {
        dni: '12345678Z',
        full_name: 'Pedro Editado',
        mobile_phone: '+34666111222',
        license_plates: [],
        notes: '',
      },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const onOpenChange = vi.fn();
    renderWithProviders(
      <CarrierFormDialog
        open
        mode="edit"
        onOpenChange={onOpenChange}
        carrier={{
          id: 'c1',
          tenant: 't',
          full_name: 'Pedro Pérez',
          dni: '12345678Z',
          mobile_phone: '+34666111222',
          license_plates: [],
          notes: '',
          active: true,
          created_at: '2026-05-13T10:00:00Z',
          updated_at: '2026-05-13T10:00:00Z',
        }}
      />,
    );

    const nameInput = screen.getByTestId('carrier-name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Pedro Editado');
    await user.click(screen.getByTestId('carrier-submit'));

    await waitFor(() => expect(mockApi.PATCH).toHaveBeenCalledTimes(1));
    expect(mockApi.PATCH).toHaveBeenCalledWith(
      '/api/v1/carriers/{id}/',
      expect.objectContaining({
        params: { path: { id: 'c1' } },
        body: expect.objectContaining({ full_name: 'Pedro Editado' }),
      }),
    );
  });
});
