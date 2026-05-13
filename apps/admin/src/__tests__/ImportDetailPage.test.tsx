import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ImportDetailPage } from '@/routes/imports/ImportDetailPage';
import { renderWithProviders } from './testUtils';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

const mockApi = {
  GET: vi.fn(),
};

function processingImport() {
  return {
    id: 'imp-1',
    original_filename: 'pending.xlsx',
    size_bytes: 5000,
    status: 'PROCESSING' as const,
    carriers_created: 0,
    carriers_updated: 0,
    shipments_created: 0,
    shipments_updated: 0,
    rows_processed: 0,
    rows_failed: 0,
    errors: [],
    created_at: '2026-05-13T10:00:00Z',
    started_at: '2026-05-13T10:00:01Z',
    completed_at: null,
    error_message: '',
  };
}

function completedImport() {
  return {
    id: 'imp-1',
    original_filename: 'pending.xlsx',
    size_bytes: 5000,
    status: 'COMPLETED' as const,
    carriers_created: 2,
    carriers_updated: 1,
    shipments_created: 3,
    shipments_updated: 0,
    rows_processed: 6,
    rows_failed: 1,
    errors: [{ row: 4, reason: 'DNI inválido' }],
    created_at: '2026-05-13T10:00:00Z',
    started_at: '2026-05-13T10:00:01Z',
    completed_at: '2026-05-13T10:00:08Z',
    error_message: '',
  };
}

describe('ImportDetailPage', () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('polls while the import is processing and stops once completed', async () => {
    mockApi.GET
      .mockResolvedValueOnce({
        data: processingImport(),
        error: undefined,
        response: { status: 200 } as Response,
      })
      .mockResolvedValueOnce({
        data: processingImport(),
        error: undefined,
        response: { status: 200 } as Response,
      })
      .mockResolvedValue({
        data: completedImport(),
        error: undefined,
        response: { status: 200 } as Response,
      });

    renderWithProviders(<ImportDetailPage />, {
      initialPath: '/imports/imp-1',
      path: '/imports/:id',
    });

    await screen.findByTestId('import-filename');
    expect(screen.getByText(/Procesando…/i)).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByText(/Procesando…/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Transportistas creados/i)).toBeInTheDocument();
      },
      { timeout: 8000 },
    );

    const callCountAtCompletion = mockApi.GET.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 2400));
    expect(mockApi.GET.mock.calls.length).toBe(callCountAtCompletion);
  }, 15000);

  it('shows the error message and a retry link when the import failed', async () => {
    mockApi.GET.mockResolvedValue({
      data: {
        ...completedImport(),
        status: 'FAILED' as const,
        error_message: 'Cabecera inválida',
      },
      error: undefined,
      response: { status: 200 } as Response,
    });

    renderWithProviders(<ImportDetailPage />, {
      initialPath: '/imports/imp-1',
      path: '/imports/:id',
    });

    expect(await screen.findByText(/El procesamiento ha fallado/i)).toBeInTheDocument();
    expect(screen.getByText('Cabecera inválida')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reintentar subida/i })).toBeInTheDocument();
  });
});
