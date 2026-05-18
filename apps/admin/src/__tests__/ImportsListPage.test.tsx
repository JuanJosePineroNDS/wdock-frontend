import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ImportsListPage } from '@/routes/imports/ImportsListPage';
import { renderWithProviders } from './testUtils';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

const mockApi = {
  GET: vi.fn(),
};

describe('ImportsListPage', () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty state when there are no imports', async () => {
    mockApi.GET.mockResolvedValue({
      data: { count: 0, next: null, previous: null, results: [] },
      error: undefined,
      response: { status: 200 } as Response,
    });

    renderWithProviders(<ImportsListPage />);

    expect(await screen.findByText(/Aún no hay imports/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sube tu primer Excel/i })).toBeInTheDocument();
  });

  it('lists existing imports with their status badge', async () => {
    mockApi.GET.mockResolvedValue({
      data: {
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: 'imp-1',
            original_filename: 'ixnet-2026-05-13.xlsx',
            size_bytes: 12345,
            status: 'COMPLETED',
            carriers_created: 3,
            carriers_updated: 1,
            shipments_created: 5,
            shipments_updated: 2,
            rows_processed: 7,
            rows_failed: 0,
            errors: [],
            created_at: '2026-05-13T10:00:00Z',
            started_at: '2026-05-13T10:00:01Z',
            completed_at: '2026-05-13T10:00:05Z',
            error_message: '',
          },
          {
            id: 'imp-2',
            original_filename: 'ixnet-2026-05-12.xlsx',
            size_bytes: 5432,
            status: 'PROCESSING',
            carriers_created: 0,
            carriers_updated: 0,
            shipments_created: 0,
            shipments_updated: 0,
            rows_processed: 0,
            rows_failed: 0,
            errors: [],
            created_at: '2026-05-12T09:00:00Z',
            started_at: '2026-05-12T09:00:01Z',
            completed_at: null,
            error_message: '',
          },
        ],
      },
      error: undefined,
      response: { status: 200 } as Response,
    });

    renderWithProviders(<ImportsListPage />);

    const rows = await screen.findAllByTestId('imports-row');
    expect(rows).toHaveLength(2);
    expect(screen.getByText('ixnet-2026-05-13.xlsx')).toBeInTheDocument();
    expect(screen.getByText('ixnet-2026-05-12.xlsx')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toBeInTheDocument();
    expect(screen.getByText('Procesando')).toBeInTheDocument();
  });

  it('shows an error alert when the request fails', async () => {
    mockApi.GET.mockResolvedValue({
      data: undefined,
      error: { detail: 'boom' },
      response: {
        status: 500,
        statusText: 'Server Error',
        clone: () => ({ json: async () => null }),
      } as unknown as Response,
    });

    renderWithProviders(<ImportsListPage />);

    await waitFor(() =>
      expect(screen.getByText(/No se pudo cargar el listado/i)).toBeInTheDocument(),
    );
  });
});
