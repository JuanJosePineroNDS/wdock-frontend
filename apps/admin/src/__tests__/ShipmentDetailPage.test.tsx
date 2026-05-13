import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ShipmentDetailPage } from '@/routes/shipments/ShipmentDetailPage';
import { renderWithProviders } from './testUtils';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

const mockApi = {
  GET: vi.fn(),
};

describe('ShipmentDetailPage', () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders shipment fields and the F3 placeholder notice', async () => {
    mockApi.GET.mockResolvedValue({
      data: {
        id: 's1',
        tenant: 't',
        campa: null,
        crm_external_id: 'ALB-9001',
        scheduled_date: '2026-05-20',
        expected_carrier_name: 'Camionero Uno',
        expected_carrier_phone: '+34666555111',
        cargo_description: 'Carga frágil',
        status: 'PROGRAMMED' as const,
        document: null,
        crm_metadata: null,
        created_at: '2026-05-13T10:00:00Z',
        updated_at: '2026-05-13T10:00:00Z',
      },
      error: undefined,
      response: { status: 200 } as Response,
    });

    renderWithProviders(<ShipmentDetailPage />, {
      initialPath: '/shipments/s1',
      path: '/shipments/:id',
    });

    expect(await screen.findByTestId('shipment-id')).toHaveTextContent('ALB-9001');
    expect(screen.getByText('Camionero Uno')).toBeInTheDocument();
    expect(screen.getByText('+34666555111')).toBeInTheDocument();
    expect(screen.getByText('Carga frágil')).toBeInTheDocument();
    expect(screen.getByText(/Acciones del operador disponibles próximamente/i)).toBeInTheDocument();
  });
});
