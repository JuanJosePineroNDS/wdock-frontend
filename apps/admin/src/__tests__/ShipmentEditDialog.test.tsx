import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ShipmentEditDialog } from '@/features/shipments/ShipmentEditDialog';
import { renderWithProviders } from './testUtils';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockApi = {
  PATCH: vi.fn(),
};

const SHIPMENT = {
  id: 's1',
  tenant: 't',
  campa: null,
  crm_external_id: 'ALB-1001',
  scheduled_date: '2026-05-14',
  expected_carrier_name: 'Pedro',
  expected_carrier_phone: '+34666111222',
  expected_license_plate: '1234ABC',
  cargo_description: 'Madera',
  notes: '',
  status: 'PROGRAMMED' as const,
  document: null,
  crm_metadata: null,
  cancelled_at: null,
  created_at: '2026-05-13T10:00:00Z',
  updated_at: '2026-05-13T10:00:00Z',
};

describe('ShipmentEditDialog', () => {
  beforeEach(() => {
    mockApi.PATCH.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sends only the changed fields as a partial update', async () => {
    const user = userEvent.setup();
    mockApi.PATCH.mockResolvedValue({
      data: { ...SHIPMENT, cargo_description: 'Metal' },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const onOpenChange = vi.fn();
    renderWithProviders(
      <ShipmentEditDialog open onOpenChange={onOpenChange} shipment={SHIPMENT} />,
    );

    const cargo = screen.getByTestId('edit-cargo');
    await user.clear(cargo);
    await user.type(cargo, 'Metal');
    await user.click(screen.getByTestId('edit-submit'));

    await waitFor(() => expect(mockApi.PATCH).toHaveBeenCalledTimes(1));
    expect(mockApi.PATCH).toHaveBeenCalledWith(
      '/api/v1/shipments/{id}/edit/',
      expect.objectContaining({
        params: { path: { id: 's1' } },
        body: { cargo_description: 'Metal' },
      }),
    );
  });

  it('does not call the API when no changes are made', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <ShipmentEditDialog open onOpenChange={onOpenChange} shipment={SHIPMENT} />,
    );

    await user.click(screen.getByTestId('edit-submit'));

    expect(mockApi.PATCH).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
