import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

const mockApi = { GET: vi.fn() };

import { DocumentsListPage } from '@/routes/documents/DocumentsListPage';

function makePage(opts: {
  page: number;
  total: number;
  pageSize?: number;
}): {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<Record<string, unknown>>;
} {
  const pageSize = opts.pageSize ?? 25;
  const lastPage = Math.max(1, Math.ceil(opts.total / pageSize));
  const offset = (opts.page - 1) * pageSize;
  const onThisPage = Math.max(0, Math.min(pageSize, opts.total - offset));
  const results = Array.from({ length: onThisPage }, (_, i) => ({
    id: `doc-${offset + i + 1}`,
    tenant: 't1',
    erp_integration: null,
    numero_origen: `ORD-${String(offset + i + 1).padStart(4, '0')}`,
    tipo: 'ALBARAN_RECEPCION',
    estado: 'PROCESADO',
    hash_sha256: 'abc'.repeat(20),
    size_bytes: 12345,
    mime_type: 'application/pdf',
    metadatos: {},
    creado_en: '2026-05-06T10:00:00Z',
    actualizado_en: '2026-05-06T10:05:00Z',
    vehiculos: [],
  }));
  return {
    count: opts.total,
    next: opts.page < lastPage ? `https://api/?page=${opts.page + 1}` : null,
    previous: opts.page > 1 ? `https://api/?page=${opts.page - 1}` : null,
    results,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/documents']}>
        <DocumentsListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DocumentsListPage', () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the table when documents come back from the API', async () => {
    mockApi.GET.mockResolvedValueOnce({
      data: makePage({ page: 1, total: 3 }),
      error: undefined,
      response: { status: 200 },
    });
    renderPage();
    await waitFor(() => expect(screen.getByTestId('documents-table')).toBeInTheDocument());
    expect(screen.getByTestId('documents-total')).toHaveTextContent('3 en total');
    expect(screen.getByText('ORD-0001')).toBeInTheDocument();
    expect(screen.getByText('ORD-0003')).toBeInTheDocument();
  });

  it('shows the empty state when the API returns zero documents', async () => {
    mockApi.GET.mockResolvedValueOnce({
      data: makePage({ page: 1, total: 0 }),
      error: undefined,
      response: { status: 200 },
    });
    renderPage();
    await waitFor(() => expect(screen.getByTestId('documents-empty')).toBeInTheDocument());
    expect(screen.queryByTestId('documents-table')).toBeNull();
  });

  it('paginates: clicking next requests page 2 with the right query params', async () => {
    mockApi.GET
      .mockResolvedValueOnce({
        data: makePage({ page: 1, total: 30 }),
        error: undefined,
        response: { status: 200 },
      })
      .mockResolvedValueOnce({
        data: makePage({ page: 2, total: 30 }),
        error: undefined,
        response: { status: 200 },
      });
    renderPage();
    await waitFor(() => expect(screen.getByTestId('documents-table')).toBeInTheDocument());
    await userEvent.setup().click(screen.getByLabelText('Pagina siguiente'));
    await waitFor(() => expect(mockApi.GET).toHaveBeenCalledTimes(2));
    expect(mockApi.GET).toHaveBeenLastCalledWith('/api/v1/documents', {
      params: { query: { page: 2, page_size: 25 } },
    });
  });

  it('shows an error alert when the API call fails', async () => {
    mockApi.GET.mockResolvedValueOnce({
      data: undefined,
      error: { detail: 'token invalid' },
      response: { status: 401 },
    });
    renderPage();
    await waitFor(() => expect(screen.getByTestId('documents-error')).toBeInTheDocument());
    expect(screen.getByTestId('documents-error')).toHaveTextContent(/token invalid/i);
  });
});
