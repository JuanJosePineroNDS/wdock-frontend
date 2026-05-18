import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ShipmentsListPage } from '@/routes/shipments/ShipmentsListPage';
import { renderWithProviders } from './testUtils';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockApi = {
  GET: vi.fn(),
  POST: vi.fn(),
  PATCH: vi.fn(),
};

const SAMPLE_SHIPMENTS = [
  {
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
  },
  {
    id: 's2',
    tenant: 't',
    campa: null,
    crm_external_id: 'ALB-1002',
    scheduled_date: '2026-05-15',
    expected_carrier_name: 'Ana Gómez',
    expected_carrier_phone: '+34666333444',
    expected_license_plate: '',
    cargo_description: 'Metal',
    notes: '',
    status: 'SIGNED' as const,
    document: 'doc-1',
    crm_metadata: null,
    cancelled_at: null,
    created_at: '2026-05-13T11:00:00Z',
    updated_at: '2026-05-13T11:00:00Z',
  },
];

describe('ShipmentsListPage', () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
    mockApi.GET.mockResolvedValue({
      data: { count: 2, next: null, previous: null, results: SAMPLE_SHIPMENTS },
      error: undefined,
      response: { status: 200 } as Response,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists shipments returned by the API', async () => {
    renderWithProviders(<ShipmentsListPage />);
    const rows = await screen.findAllByTestId('shipments-row');
    expect(rows).toHaveLength(2);
    expect(screen.getByText('ALB-1001')).toBeInTheDocument();
    expect(screen.getByText('ALB-1002')).toBeInTheDocument();
    const badges = screen.getAllByTestId('shipment-status-badge');
    expect(badges.map((b) => b.textContent)).toEqual(
      expect.arrayContaining(['Programado', 'Firmado']),
    );
  });

  it('forwards the status filter to the API via the typed query param', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShipmentsListPage />);
    await screen.findAllByTestId('shipments-row');

    await user.selectOptions(screen.getByLabelText(/Estado/i), 'SIGNED');

    await waitFor(() => {
      const lastCall = mockApi.GET.mock.calls.at(-1);
      expect(lastCall?.[1]?.params?.query?.status).toBe('SIGNED');
    });
  });

  it('renders contextual action buttons for shipments in PROGRAMMED', async () => {
    renderWithProviders(<ShipmentsListPage />);
    await screen.findAllByTestId('shipments-row');

    expect(screen.getAllByTestId('shipment-action-dispatch')).toHaveLength(1);
    expect(screen.getAllByTestId('shipment-action-cancel')).toHaveLength(1);
  });
});
