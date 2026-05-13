import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ImportUploadPage } from '@/routes/imports/ImportUploadPage';
import { renderWithProviders } from './testUtils';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

const mockApi = {
  POST: vi.fn(),
};

function makeFile(name: string, sizeBytes: number, type: string): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type });
  return new File([blob], name, { type });
}

function renderUpload() {
  return renderWithProviders(<ImportUploadPage />, {
    initialPath: '/imports/new',
    path: '/imports/new',
    extraRoutes: <Route path="/imports/:id" element={<div data-testid="detail-page" />} />,
  });
}

describe('ImportUploadPage', () => {
  beforeEach(() => {
    mockApi.POST.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rejects files that are not .xlsx/.xlsm', async () => {
    renderUpload();
    const input = screen.getByTestId('excel-input') as HTMLInputElement;
    const txt = makeFile('notes.txt', 100, 'text/plain');
    fireEvent.change(input, { target: { files: [txt] } });

    expect(await screen.findByText(/Formato no soportado/i)).toBeInTheDocument();
    expect(mockApi.POST).not.toHaveBeenCalled();
  });

  it('rejects files larger than 10 MB', async () => {
    renderUpload();
    const input = screen.getByTestId('excel-input') as HTMLInputElement;
    const big = makeFile(
      'big.xlsx',
      11 * 1024 * 1024,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    fireEvent.change(input, { target: { files: [big] } });

    expect(await screen.findByText(/supera el límite/i)).toBeInTheDocument();
    expect(mockApi.POST).not.toHaveBeenCalled();
  });

  it('uploads a valid Excel and navigates to the detail page', async () => {
    const user = userEvent.setup();
    mockApi.POST.mockResolvedValue({
      data: {
        id: 'imp-99',
        original_filename: 'ok.xlsx',
        size_bytes: 1024,
        status: 'PENDING',
        carriers_created: 0,
        carriers_updated: 0,
        shipments_created: 0,
        shipments_updated: 0,
        rows_processed: 0,
        rows_failed: 0,
        errors: [],
        created_at: '2026-05-13T10:00:00Z',
        started_at: null,
        completed_at: null,
        error_message: '',
      },
      error: undefined,
      response: { status: 202 } as Response,
    });

    renderUpload();
    const input = screen.getByTestId('excel-input') as HTMLInputElement;
    const file = makeFile(
      'ok.xlsx',
      2 * 1024,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText('ok.xlsx')).toBeInTheDocument();
    const submit = screen.getByTestId('excel-submit');
    await user.click(submit);

    await waitFor(() => expect(mockApi.POST).toHaveBeenCalledTimes(1));
    expect(mockApi.POST).toHaveBeenCalledWith(
      '/api/v1/imports/excel/',
      expect.objectContaining({
        body: expect.any(FormData),
        bodySerializer: expect.any(Function),
      }),
    );
    await waitFor(() => expect(screen.getByTestId('detail-page')).toBeInTheDocument());
  });
});
