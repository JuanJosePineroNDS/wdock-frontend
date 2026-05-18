import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DispatchDialog } from '@/features/shipments/DispatchDialog';
import { renderWithProviders } from './testUtils';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

const toastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: vi.fn(),
  },
}));

const mockApi = {
  GET: vi.fn(),
  POST: vi.fn(),
};

const SHIPMENT = {
  id: 's1',
  tenant: 't',
  campa: null,
  crm_external_id: 'ALB-1001',
  scheduled_date: '2026-05-14',
  expected_carrier_name: 'Pedro Pérez',
  expected_carrier_phone: '+34666111222',
  expected_license_plate: '',
  cargo_description: 'Madera',
  notes: '',
  status: 'PROGRAMMED' as const,
  document: null,
  crm_metadata: null,
  cancelled_at: null,
  created_at: '2026-05-13T10:00:00Z',
  updated_at: '2026-05-13T10:00:00Z',
};

const CARRIERS_RESPONSE = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
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
    },
  ],
};

describe('DispatchDialog', () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
    mockApi.POST.mockReset();
    toastSuccess.mockReset();
    mockApi.GET.mockResolvedValue({
      data: CARRIERS_RESPONSE,
      error: undefined,
      response: { status: 200 } as Response,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('submits dispatch with the selected carrier_id', async () => {
    const user = userEvent.setup();
    mockApi.POST.mockResolvedValue({
      data: { id: 'd1', status: 'PENDING' },
      error: undefined,
      response: { status: 202 } as Response,
    });

    const onOpenChange = vi.fn();
    renderWithProviders(<DispatchDialog open onOpenChange={onOpenChange} shipment={SHIPMENT} />);

    const option = await screen.findByTestId('dispatch-carrier-option');
    await user.click(option);
    await user.click(screen.getByTestId('dispatch-submit'));

    await waitFor(() => expect(mockApi.POST).toHaveBeenCalledTimes(1));
    expect(mockApi.POST).toHaveBeenCalledWith(
      '/api/v1/shipments/{id}/dispatch/',
      expect.objectContaining({
        params: { path: { id: 's1' } },
        body: { carrier_id: 'c1' },
      }),
    );
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('shows the friendly 409 error when the SMS was already sent today', async () => {
    const user = userEvent.setup();
    mockApi.POST.mockResolvedValue({
      data: undefined,
      error: { detail: 'duplicate' },
      response: {
        status: 409,
        statusText: 'Conflict',
        clone: () => ({ json: async () => null }),
      } as unknown as Response,
    });

    const onOpenChange = vi.fn();
    renderWithProviders(<DispatchDialog open onOpenChange={onOpenChange} shipment={SHIPMENT} />);

    const option = await screen.findByTestId('dispatch-carrier-option');
    await user.click(option);
    await user.click(screen.getByTestId('dispatch-submit'));

    expect(await screen.findByText(/Ya se envió un SMS hoy/i)).toBeInTheDocument();
  });
});
