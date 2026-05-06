import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { SignaturePage } from '@/routes/SignaturePage';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderAt(token: string, fetchImpl: typeof fetch) {
  return render(
    <MemoryRouter initialEntries={[`/sign/${token}`]}>
      <Routes>
        <Route path="/sign/:token" element={<SignaturePage sessionOptions={{ fetchImpl, baseUrl: 'http://test.local' }} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SignaturePage', () => {
  it('shows the document title and disables the sign button when session is active', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        status: 'active',
        document: { id: 'd1', pdf_url: 'https://files/example.pdf', title: 'Albaran 12345' },
        carrier: { name: 'Transportes Acme', plate: '1234-ABC' },
        expires_at: '2030-01-01T00:00:00Z',
      }),
    ) as unknown as typeof fetch;

    renderAt('abc123', fetchImpl);

    await waitFor(() => expect(screen.getByTestId('document-title')).toHaveTextContent('Albaran 12345'));
    expect(screen.getByText(/Transportes Acme/)).toBeInTheDocument();
    expect(screen.getByTestId('sign-button')).toBeDisabled();
    expect(screen.getByTestId('online-indicator')).toBeInTheDocument();
  });

  it('renders ExpiredPage when the backend returns 410', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 410)) as unknown as typeof fetch;
    renderAt('abc123', fetchImpl);
    await waitFor(() => expect(screen.getByText(/sesion de firma caducada/i)).toBeInTheDocument());
  });

  it('renders NotFoundPage when the backend returns 404', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 404)) as unknown as typeof fetch;
    renderAt('abc123', fetchImpl);
    await waitFor(() => expect(screen.getByText(/pagina no encontrada/i)).toBeInTheDocument());
  });

  it('renders ExpiredPage when the payload status is expired even with 200', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        status: 'expired',
        document: { id: 'd1', pdf_url: '', title: '' },
        carrier: null,
        expires_at: '2020-01-01',
      }),
    ) as unknown as typeof fetch;
    renderAt('abc123', fetchImpl);
    await waitFor(() => expect(screen.getByText(/sesion de firma caducada/i)).toBeInTheDocument());
  });
});
