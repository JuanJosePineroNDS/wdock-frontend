import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GeolocationCapture } from '../GeolocationCapture';

const originalGeolocation = navigator.geolocation;

afterEach(() => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: originalGeolocation,
  });
});

function mockGeolocation(impl: Geolocation['getCurrentPosition']) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: impl, watchPosition: vi.fn(), clearWatch: vi.fn() },
  });
}

describe('GeolocationCapture', () => {
  it('renders the share-location button by default', () => {
    render(<GeolocationCapture onCapture={vi.fn()} />);
    expect(screen.getByRole('button', { name: /compartir mi ubicación/i })).toBeInTheDocument();
  });

  it('calls onCapture with coordinates on success', async () => {
    const onCapture = vi.fn();
    mockGeolocation((success) => {
      success({
        coords: { latitude: 40.4168, longitude: -3.7038, accuracy: 20.5 },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });
    render(<GeolocationCapture onCapture={onCapture} />);
    await userEvent.click(screen.getByRole('button', { name: /compartir mi ubicación/i }));
    expect(onCapture).toHaveBeenCalledWith({ lat: 40.4168, lng: -3.7038, accuracy: 20.5 });
    expect(screen.getByText(/ubicación capturada/i)).toBeInTheDocument();
  });

  it('calls onCapture(null) and shows the optional notice on denial', async () => {
    const onCapture = vi.fn();
    mockGeolocation((_success, error) => {
      error?.({ code: 1, message: 'Denied' } as GeolocationPositionError);
    });
    render(<GeolocationCapture onCapture={onCapture} />);
    await userEvent.click(screen.getByRole('button', { name: /compartir mi ubicación/i }));
    expect(onCapture).toHaveBeenCalledWith(null);
    expect(screen.getByText(/ubicación no compartida/i)).toBeInTheDocument();
  });

  it('shows the optional notice when geolocation is unavailable', async () => {
    const onCapture = vi.fn();
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
    render(<GeolocationCapture onCapture={onCapture} />);
    await userEvent.click(screen.getByRole('button', { name: /compartir mi ubicación/i }));
    expect(onCapture).toHaveBeenCalledWith(null);
    expect(screen.getByText(/ubicación no compartida/i)).toBeInTheDocument();
  });
});
