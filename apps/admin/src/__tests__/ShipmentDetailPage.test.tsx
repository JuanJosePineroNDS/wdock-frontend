import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ShipmentDetailPage } from '@/routes/shipments/ShipmentDetailPage';
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

function shipment() {
  return {
    id: 's1',
    tenant: 't',
    campa: null,
    crm_external_id: 'ALB-9001',
    scheduled_date: '2026-05-20',
    expected_carrier_name: 'Camionero Uno',
    expected_carrier_phone: '+34666555111',
    expected_license_plate: '1234ABC',
    cargo_description: 'Carga frágil',
    notes: 'Manejar con cuidado',
    status: 'PROGRAMMED' as const,
    document: null,
    crm_metadata: null,
    cancelled_at: null,
    created_at: '2026-05-13T10:00:00Z',
    updated_at: '2026-05-13T10:00:00Z',
  };
}

describe('ShipmentDetailPage', () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
    mockApi.POST.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders shipment fields and the action buttons for PROGRAMMED state', async () => {
    mockApi.GET.mockImplementation((path: string) => {
      if (path === '/api/v1/shipments/{id}/') {
        return Promise.resolve({
          data: shipment(),
          error: undefined,
          response: { status: 200 } as Response,
        });
      }
      // sms-dispatches list
      return Promise.resolve({
        data: { count: 0, next: null, previous: null, results: [] },
        error: undefined,
        response: { status: 200 } as Response,
      });
    });

    renderWithProviders(<ShipmentDetailPage />, {
      initialPath: '/shipments/s1',
      path: '/shipments/:id',
    });

    expect(await screen.findByTestId('shipment-id')).toHaveTextContent('ALB-9001');
    expect(screen.getByText('Camionero Uno')).toBeInTheDocument();
    expect(screen.getByText('Carga frágil')).toBeInTheDocument();
    expect(screen.getByTestId('shipment-action-dispatch')).toBeInTheDocument();
    expect(screen.getByTestId('shipment-action-edit')).toBeInTheDocument();
    expect(screen.getByTestId('shipment-action-cancel')).toBeInTheDocument();
  });

  it('renders the SMS dispatch history when there are dispatches', async () => {
    mockApi.GET.mockImplementation((path: string) => {
      if (path === '/api/v1/shipments/{id}/') {
        return Promise.resolve({
          data: shipment(),
          error: undefined,
          response: { status: 200 } as Response,
        });
      }
      return Promise.resolve({
        data: {
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 'd1',
              tenant: 't',
              shipment: 's1',
              carrier: 'c1',
              initiated_by: 'u1',
              phone_snapshot: '+34666555111',
              status: 'SENT' as const,
              token: 'token-aaaa',
              initiated_at: '2026-05-13T10:00:00Z',
              expires_at: '2026-05-15T10:00:00Z',
              sent_at: '2026-05-13T10:00:05Z',
              delivered_at: null,
              failed_at: null,
              signed_at: null,
              failure_reason: '',
              retry_count: 0,
              provider_message_id: 'mock-1',
              idempotency_key: 'idem-1',
              delivery_callbacks: [],
            },
          ],
        },
        error: undefined,
        response: { status: 200 } as Response,
      });
    });

    renderWithProviders(<ShipmentDetailPage />, {
      initialPath: '/shipments/s1',
      path: '/shipments/:id',
    });

    await screen.findByTestId('shipment-id');
    await waitFor(() => expect(screen.getByTestId('dispatch-item')).toBeInTheDocument());
    expect(screen.getByTestId('sms-status-badge')).toHaveTextContent('Enviado');
  });
});
