import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityLogPage } from '@/routes/activity-log/ActivityLogPage';
import { renderWithProviders } from './testUtils';

vi.mock('@/hooks/useApiClient', () => ({
  useApiClient: () => mockApi,
}));

const mockApi = {
  GET: vi.fn(),
};

const KNOWN_ENTRY = {
  id: 'a1',
  tenant: 't',
  user: 'u1',
  user_email: 'admin@wdock.local',
  external_actor: '',
  action: 'carrier.created',
  resource_type: 'Carrier',
  resource_id: 'c1',
  ip_origin: '127.0.0.1',
  user_agent: 'Mozilla/5.0',
  metadata: { dni: '12345678Z' },
  timestamp: new Date(Date.now() - 60_000).toISOString(),
  hash_previous: '',
  hash_current: 'h1',
};

const UNKNOWN_ENTRY = {
  ...KNOWN_ENTRY,
  id: 'a2',
  action: 'mystery.action',
  metadata: null,
  timestamp: new Date(Date.now() - 3_600_000).toISOString(),
};

describe('ActivityLogPage', () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders entries with human action labels and a "raw" tag for unknown codes', async () => {
    mockApi.GET.mockResolvedValue({
      data: { count: 2, next: null, previous: null, results: [KNOWN_ENTRY, UNKNOWN_ENTRY] },
      error: undefined,
      response: { status: 200 } as Response,
    });

    renderWithProviders(<ActivityLogPage />);

    const labels = await screen.findAllByTestId('activity-action-label');
    expect(labels.map((n) => n.textContent)).toContain('Transportista creado');
    expect(labels.map((n) => n.textContent)).toContain('mystery.action');
    expect(screen.getByText(/raw/i, { selector: 'span' })).toBeInTheDocument();
  });

  it('forwards the action filter to the API', async () => {
    mockApi.GET.mockResolvedValue({
      data: { count: 0, next: null, previous: null, results: [] },
      error: undefined,
      response: { status: 200 } as Response,
    });
    const user = userEvent.setup();
    renderWithProviders(<ActivityLogPage />);

    await waitFor(() => expect(mockApi.GET).toHaveBeenCalled());
    await user.selectOptions(screen.getByLabelText(/Acción/i), 'carrier.created');

    await waitFor(() => {
      const lastCall = mockApi.GET.mock.calls.at(-1);
      expect(lastCall?.[1]?.params?.query?.action).toBe('carrier.created');
    });
  });
});
