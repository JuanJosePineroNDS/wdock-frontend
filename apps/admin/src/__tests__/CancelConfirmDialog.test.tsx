import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CancelConfirmDialog } from '@/features/shipments/CancelConfirmDialog';
import { renderWithProviders } from './testUtils';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockApi = {
  POST: vi.fn(),
};

const SHIPMENT = {
  id: 's1',
  tenant: 't',
  campa: null,
  crm_external_id: 'ALB-1001',
  scheduled_date: '2026-05-14',
  expected_carrier_name: 'Pedro',
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

describe('CancelConfirmDialog', () => {
  beforeEach(() => {
    mockApi.POST.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('submits cancel with the reason text when provided', async () => {
    const user = userEvent.setup();
    mockApi.POST.mockResolvedValue({
      data: { ...SHIPMENT, status: 'CANCELLED', cancelled_at: '2026-05-13T11:00:00Z' },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const onOpenChange = vi.fn();
    renderWithProviders(
      <CancelConfirmDialog open onOpenChange={onOpenChange} shipment={SHIPMENT} />,
    );

    await user.type(screen.getByTestId('cancel-reason'), 'Cliente reprogramó');
    await user.click(screen.getByTestId('cancel-submit'));

    await waitFor(() => expect(mockApi.POST).toHaveBeenCalledTimes(1));
    expect(mockApi.POST).toHaveBeenCalledWith(
      '/api/v1/shipments/{id}/cancel/',
      expect.objectContaining({
        params: { path: { id: 's1' } },
        body: { reason: 'Cliente reprogramó' },
      }),
    );
  });

  it('omits the body when no reason is given', async () => {
    const user = userEvent.setup();
    mockApi.POST.mockResolvedValue({
      data: { ...SHIPMENT, status: 'CANCELLED' },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const onOpenChange = vi.fn();
    renderWithProviders(
      <CancelConfirmDialog open onOpenChange={onOpenChange} shipment={SHIPMENT} />,
    );

    await user.click(screen.getByTestId('cancel-submit'));

    await waitFor(() => expect(mockApi.POST).toHaveBeenCalledTimes(1));
    expect(mockApi.POST.mock.calls[0][1].body).toBeUndefined();
  });
});
