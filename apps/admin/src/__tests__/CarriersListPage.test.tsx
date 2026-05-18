import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CarriersListPage } from '@/routes/carriers/CarriersListPage';
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

const SAMPLE_CARRIERS = [
  {
    id: 'c1',
    tenant: 't',
    full_name: 'Pedro Pérez',
    dni: '12345678Z',
    mobile_phone: '+34666111222',
    license_plates: ['1234ABC', '4321XYZ'],
    notes: '',
    active: true,
    created_at: '2026-05-13T10:00:00Z',
    updated_at: '2026-05-13T10:00:00Z',
  },
  {
    id: 'c2',
    tenant: 't',
    full_name: 'Ana Gómez',
    dni: '87654321X',
    mobile_phone: '+34666333444',
    license_plates: [],
    notes: 'Inactive carrier',
    active: false,
    created_at: '2026-05-12T10:00:00Z',
    updated_at: '2026-05-12T10:00:00Z',
  },
];

describe('CarriersListPage', () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
    mockApi.POST.mockReset();
    mockApi.PATCH.mockReset();
    mockApi.GET.mockResolvedValue({
      data: { count: 2, next: null, previous: null, results: SAMPLE_CARRIERS },
      error: undefined,
      response: { status: 200 } as Response,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the list and forwards the search term to the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CarriersListPage />);

    const rows = await screen.findAllByTestId('carriers-row');
    expect(rows).toHaveLength(2);
    expect(screen.getByText('Pedro Pérez')).toBeInTheDocument();
    expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
    expect(screen.getByText('1234ABC')).toBeInTheDocument();

    const searchInput = screen.getByLabelText(/Búsqueda/i);
    await user.type(searchInput, 'pedro');

    const lastCall = mockApi.GET.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe('/api/v1/carriers/');
    expect(lastCall?.[1]?.params?.query?.search).toBe('pedro');
  });

  it('forwards show_inactive=true to the API when the toggle is checked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CarriersListPage />);
    await screen.findAllByTestId('carriers-row');

    await user.click(screen.getByTestId('carriers-show-inactive'));

    await waitFor(() => {
      const lastCall = mockApi.GET.mock.calls.at(-1);
      expect(lastCall?.[1]?.params?.query?.show_inactive).toBe(true);
    });
  });

  it('opens the carrier form dialog when "Nuevo transportista" is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CarriersListPage />);
    await screen.findAllByTestId('carriers-row');

    await user.click(screen.getByTestId('carriers-new'));
    expect(screen.getByText(/Nuevo transportista/i, { selector: 'h2' })).toBeInTheDocument();
  });

  it('asks for confirmation before deactivating a carrier', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CarriersListPage />);
    await screen.findAllByTestId('carriers-row');

    const toggleButtons = screen.getAllByTestId('carriers-row-toggle');
    await user.click(toggleButtons[0]);
    expect(screen.getByText(/¿Desactivar Pedro Pérez/i)).toBeInTheDocument();
  });
});
