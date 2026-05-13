import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ShipmentsListPage } from '@/routes/shipments/ShipmentsListPage';
import { renderWithProviders } from './testUtils';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

const mockApi = {
  GET: vi.fn(),
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
    cargo_description: 'Madera',
    status: 'PROGRAMMED' as const,
    document: null,
    crm_metadata: null,
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
    cargo_description: 'Metal',
    status: 'SIGNED' as const,
    document: 'doc-1',
    crm_metadata: null,
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

  it('filters the list by status client-side', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ShipmentsListPage />);
    await screen.findAllByTestId('shipments-row');

    await user.selectOptions(screen.getByLabelText(/Estado/i), 'SIGNED');

    const rows = screen.getAllByTestId('shipments-row');
    expect(rows).toHaveLength(1);
    expect(screen.getByText('ALB-1002')).toBeInTheDocument();
    expect(screen.queryByText('ALB-1001')).not.toBeInTheDocument();
  });
});
