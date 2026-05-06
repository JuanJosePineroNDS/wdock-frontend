import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

const mockApi = {
  GET: vi.fn(),
  POST: vi.fn(),
};

import { DocumentDetailPage } from '@/routes/documents/DocumentDetailPage';

function aDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 'doc-1',
    tenant: 't1',
    erp_integration: null,
    numero_origen: 'ORD-0001',
    tipo: 'ALBARAN_RECEPCION',
    estado: 'PROCESADO',
    hash_sha256: 'abc'.repeat(20),
    size_bytes: 12345,
    mime_type: 'application/pdf',
    metadatos: {},
    creado_en: '2026-05-06T10:00:00Z',
    actualizado_en: '2026-05-06T10:05:00Z',
    vehiculos: [],
    ...overrides,
  };
}

function renderAt(id: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/documents/${id}`]}>
        <Routes>
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DocumentDetailPage', () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
    mockApi.POST.mockReset();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header, state badge and create-signature button when state is PROCESADO', async () => {
    mockApi.GET.mockResolvedValueOnce({
      data: aDocument(),
      error: undefined,
      response: { status: 200 },
    });
    renderAt('doc-1');
    await waitFor(() => expect(screen.getByText('ORD-0001')).toBeInTheDocument());
    expect(screen.getByTestId('document-state-badge')).toHaveTextContent('Procesado');
    expect(screen.getByTestId('create-signature-button')).toBeInTheDocument();
    expect(screen.getByTestId('download-pdf')).toHaveAttribute(
      'href',
      expect.stringContaining('/api/v1/documents/doc-1/pdf'),
    );
  });

  it('hides the create-signature button when the document is FIRMADO', async () => {
    mockApi.GET.mockResolvedValueOnce({
      data: aDocument({ estado: 'FIRMADO' }),
      error: undefined,
      response: { status: 200 },
    });
    renderAt('doc-1');
    await waitFor(() => expect(screen.getByText('ORD-0001')).toBeInTheDocument());
    expect(screen.queryByTestId('create-signature-button')).toBeNull();
  });

  it('opens the create-signature modal and POSTs to the right endpoint', async () => {
    mockApi.GET.mockResolvedValueOnce({
      data: aDocument(),
      error: undefined,
      response: { status: 200 },
    });
    mockApi.POST.mockResolvedValueOnce({
      data: {
        session_id: 'sess-1',
        token: 'tok-1',
        signing_url: 'http://localhost:5174/sign/tok-1',
      },
      error: undefined,
      response: { status: 201 },
    });
    renderAt('doc-1');
    await waitFor(() => expect(screen.getByTestId('create-signature-button')).toBeInTheDocument());
    const user = userEvent.setup();
    await user.click(screen.getByTestId('create-signature-button'));
    expect(screen.getByTestId('create-signature-modal')).toBeInTheDocument();
    await user.click(screen.getByTestId('confirm-create'));
    await waitFor(() => expect(mockApi.POST).toHaveBeenCalledTimes(1));
    expect(mockApi.POST).toHaveBeenCalledWith(
      '/api/v1/documents/{document_id}/signature/sessions',
      {
        params: { path: { document_id: 'doc-1' } },
        body: {
          modalidad: 'BIOMETRICA',
          firmante_nombre: undefined,
          firmante_dni: undefined,
          ttl_minutes: 240,
        },
      },
    );
    expect(await screen.findByTestId('signature-created')).toBeInTheDocument();
    expect(screen.getByTestId('signature-qr')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:5174/sign/tok-1')).toBeInTheDocument();
  });
});
