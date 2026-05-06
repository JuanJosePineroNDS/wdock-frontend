import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OnlineIndicator } from '@/components/OnlineIndicator';

describe('OnlineIndicator', () => {
  it('reflects online state initially', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    render(<OnlineIndicator />);
    const indicator = screen.getByTestId('online-indicator');
    expect(indicator).toHaveAttribute('data-online', 'true');
    expect(indicator).toHaveTextContent(/en linea/i);
  });

  it('reacts to offline events', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    render(<OnlineIndicator />);

    await act(async () => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('online-indicator')).toHaveAttribute('data-online', 'false');
    });
    expect(screen.getByTestId('online-indicator')).toHaveTextContent(/sin conexion/i);
  });
});
