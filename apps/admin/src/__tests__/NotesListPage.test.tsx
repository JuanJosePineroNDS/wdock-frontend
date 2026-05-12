import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

import { NotesListPage } from '@/routes/notes/NotesListPage';

const mockApi = {
  GET: vi.fn(),
  POST: vi.fn(),
  PATCH: vi.fn(),
  DELETE: vi.fn(),
};

function renderList() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <NotesListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function note(
  id: string,
  overrides: Partial<{ title: string; body: string; pinned: boolean }> = {},
) {
  return {
    id,
    title: overrides.title ?? `Note ${id}`,
    body: overrides.body ?? '',
    pinned: overrides.pinned ?? false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  };
}

describe('NotesListPage', () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
    mockApi.DELETE.mockReset();
    mockApi.PATCH.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the notes returned by the API', async () => {
    mockApi.GET.mockResolvedValue({
      data: { count: 1, next: null, previous: null, results: [note('n1', { title: 'Buy milk' })] },
      error: undefined,
    });

    renderList();
    expect(await screen.findByText('Buy milk')).toBeInTheDocument();
    expect(mockApi.GET).toHaveBeenCalledWith('/api/v1/notes/', {
      params: { query: { search: undefined, pinned: undefined, page: 1 } },
    });
  });

  it('shows an empty-state message when there are no notes', async () => {
    mockApi.GET.mockResolvedValue({
      data: { count: 0, next: null, previous: null, results: [] },
      error: undefined,
    });

    renderList();
    expect(await screen.findByText(/no notes yet/i)).toBeInTheDocument();
  });

  it('deletes a note after confirmation', async () => {
    mockApi.GET.mockResolvedValue({
      data: { count: 1, next: null, previous: null, results: [note('n1', { title: 'Old' })] },
      error: undefined,
    });
    mockApi.DELETE.mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { status: 204 } as Response,
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Old');

    await user.click(screen.getByRole('button', { name: /delete old/i }));
    await waitFor(() =>
      expect(mockApi.DELETE).toHaveBeenCalledWith('/api/v1/notes/{id}/', {
        params: { path: { id: 'n1' } },
      }),
    );
    confirmSpy.mockRestore();
  });
});
