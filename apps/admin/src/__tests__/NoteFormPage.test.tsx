import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

import { NoteFormPage } from '@/routes/notes/NoteFormPage';

const mockApi = {
  GET: vi.fn(),
  POST: vi.fn(),
  PATCH: vi.fn(),
  DELETE: vi.fn(),
};

function renderForm(initialPath: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/notes" element={<div>Notes list</div>} />
          <Route path="/notes/new" element={<NoteFormPage />} />
          <Route path="/notes/:id/edit" element={<NoteFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('NoteFormPage', () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
    mockApi.POST.mockReset();
    mockApi.PATCH.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new note and navigates back to the list', async () => {
    mockApi.POST.mockResolvedValue({
      data: {
        id: 'n1',
        title: 'First',
        body: 'hello',
        pinned: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: undefined,
    });

    const user = userEvent.setup();
    renderForm('/notes/new');

    await user.type(screen.getByLabelText('Title'), 'First');
    await user.type(screen.getByLabelText('Body'), 'hello');
    await user.click(screen.getByRole('button', { name: /create note/i }));

    await waitFor(() => expect(screen.getByText('Notes list')).toBeInTheDocument());
    expect(mockApi.POST).toHaveBeenCalledWith('/api/v1/notes/', {
      body: { title: 'First', body: 'hello', pinned: false },
    });
  });

  it('prefills the form when editing and saves the changes', async () => {
    mockApi.GET.mockResolvedValue({
      data: {
        id: 'n1',
        title: 'Original',
        body: 'before',
        pinned: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: undefined,
    });
    mockApi.PATCH.mockResolvedValue({
      data: {
        id: 'n1',
        title: 'Edited',
        body: 'after',
        pinned: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
      error: undefined,
    });

    const user = userEvent.setup();
    renderForm('/notes/n1/edit');

    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Original'));
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Edited');
    await user.clear(screen.getByLabelText('Body'));
    await user.type(screen.getByLabelText('Body'), 'after');
    await user.click(screen.getByLabelText('Pinned'));
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(screen.getByText('Notes list')).toBeInTheDocument());
    expect(mockApi.PATCH).toHaveBeenCalledWith('/api/v1/notes/{id}/', {
      params: { path: { id: 'n1' } },
      body: { title: 'Edited', body: 'after', pinned: true },
    });
  });

  it('shows a validation error when the title is empty', async () => {
    const user = userEvent.setup();
    renderForm('/notes/new');
    await user.click(screen.getByRole('button', { name: /create note/i }));
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(mockApi.POST).not.toHaveBeenCalled();
  });
});
