import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

function shipment(overrides: { status?: 'PROGRAMMED' | 'SIGNED' | 'IN_PROCESS' | 'CANCELLED' } = {}) {
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
    status: overrides.status ?? ('PROGRAMMED' as const),
    document: null,
    crm_metadata: null,
    cancelled_at: null,
    created_at: '2026-05-13T10:00:00Z',
    updated_at: '2026-05-13T10:00:00Z',
  };
}

function signedDispatchListResponse() {
  return {
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
          status: 'SIGNED' as const,
          token: 'token-signed',
          initiated_at: '2026-05-13T10:00:00Z',
          expires_at: '2026-05-15T10:00:00Z',
          sent_at: '2026-05-13T10:00:05Z',
          delivered_at: '2026-05-13T10:00:10Z',
          failed_at: null,
          signed_at: '2026-05-13T11:00:00Z',
          failure_reason: '',
          retry_count: 0,
          provider_message_id: 'mock-2',
          idempotency_key: 'idem-2',
          delivery_callbacks: [],
        },
      ],
    },
    error: undefined,
    response: { status: 200 } as Response,
  };
}

function signaturesListResponse(status: 'RECEIVED' | 'PDF_GENERATED' | 'NOTIFIED' = 'PDF_GENERATED') {
  return {
    data: {
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 'sig-1',
          sms_dispatch: 'd1',
          tenant: 't',
          signer_dni: '12345678Z',
          signature_image_s3_key: 'key/sig.png',
          signed_pdf_s3_key: 'key/signed.pdf',
          ip_address: '127.0.0.1',
          user_agent: 'jsdom',
          geolocation: null,
          status,
          evidence_hash: 'abc',
          signed_at: '2026-05-13T11:00:00Z',
          pdf_generated_at: '2026-05-13T11:00:05Z',
          notification_sent_at: null,
          created_at: '2026-05-13T11:00:00Z',
          shipment_external_id: 'ALB-9001',
          carrier_name: 'Camionero Uno',
        },
      ],
    },
    error: undefined,
    response: { status: 200 } as Response,
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

  it('does not render the download PDF button when the shipment is not SIGNED', async () => {
    mockApi.GET.mockImplementation((path: string) => {
      if (path === '/api/v1/shipments/{id}/') {
        return Promise.resolve({
          data: shipment({ status: 'PROGRAMMED' }),
          error: undefined,
          response: { status: 200 } as Response,
        });
      }
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

    await screen.findByTestId('shipment-id');
    expect(screen.queryByTestId('download-signed-pdf')).not.toBeInTheDocument();
  });

  it('shows the download PDF button when SIGNED and the signature has a PDF ready', async () => {
    mockApi.GET.mockImplementation((path: string, opts?: { params?: { query?: { status?: string } } }) => {
      if (path === '/api/v1/shipments/{id}/') {
        return Promise.resolve({
          data: shipment({ status: 'SIGNED' }),
          error: undefined,
          response: { status: 200 } as Response,
        });
      }
      if (path === '/api/v1/sms-dispatches/' && opts?.params?.query?.status === 'SIGNED') {
        return Promise.resolve(signedDispatchListResponse());
      }
      if (path === '/api/v1/signatures/') {
        return Promise.resolve(signaturesListResponse('PDF_GENERATED'));
      }
      // Default empty list (dispatch history without status filter)
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

    expect(await screen.findByTestId('download-signed-pdf')).toBeInTheDocument();
    expect(screen.getByTestId('download-signed-pdf')).toHaveTextContent(/descargar pdf firmado/i);
  });

  it('hides the download button when the signature exists but PDF is not generated yet', async () => {
    mockApi.GET.mockImplementation((path: string, opts?: { params?: { query?: { status?: string } } }) => {
      if (path === '/api/v1/shipments/{id}/') {
        return Promise.resolve({
          data: shipment({ status: 'SIGNED' }),
          error: undefined,
          response: { status: 200 } as Response,
        });
      }
      if (path === '/api/v1/sms-dispatches/' && opts?.params?.query?.status === 'SIGNED') {
        return Promise.resolve(signedDispatchListResponse());
      }
      if (path === '/api/v1/signatures/') {
        return Promise.resolve(signaturesListResponse('RECEIVED'));
      }
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

    await screen.findByTestId('shipment-id');
    // Wait long enough for the signature query to resolve before asserting absence.
    await waitFor(() =>
      expect(mockApi.GET).toHaveBeenCalledWith(
        '/api/v1/signatures/',
        expect.objectContaining({ params: { query: { sms_dispatch: 'd1' } } }),
      ),
    );
    expect(screen.queryByTestId('download-signed-pdf')).not.toBeInTheDocument();
  });

  it('opens the presigned URL in a new tab when the download button is clicked', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    mockApi.GET.mockImplementation((path: string, opts?: { params?: { query?: { status?: string }; path?: { id?: string } } }) => {
      if (path === '/api/v1/shipments/{id}/') {
        return Promise.resolve({
          data: shipment({ status: 'SIGNED' }),
          error: undefined,
          response: { status: 200 } as Response,
        });
      }
      if (path === '/api/v1/sms-dispatches/' && opts?.params?.query?.status === 'SIGNED') {
        return Promise.resolve(signedDispatchListResponse());
      }
      if (path === '/api/v1/signatures/') {
        return Promise.resolve(signaturesListResponse('PDF_GENERATED'));
      }
      if (path === '/api/v1/signatures/{id}/download/' && opts?.params?.path?.id === 'sig-1') {
        return Promise.resolve({
          data: { download_url: 'https://s3.example.com/signed.pdf?sig=xyz' },
          error: undefined,
          response: { status: 200 } as Response,
        });
      }
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

    const button = await screen.findByTestId('download-signed-pdf');
    await user.click(button);

    await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
    expect(openSpy).toHaveBeenCalledWith(
      'https://s3.example.com/signed.pdf?sig=xyz',
      '_blank',
      'noopener,noreferrer',
    );
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
