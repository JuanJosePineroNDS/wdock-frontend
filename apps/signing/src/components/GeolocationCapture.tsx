import { useCallback, useState } from 'react';
import { Loader2, MapPin, MapPinOff } from 'lucide-react';

import type { Geolocation as GeolocationPayload } from '@/api/types';

interface GeolocationCaptureProps {
  onCapture: (geolocation: GeolocationPayload | null) => void;
}

type CaptureStatus = 'idle' | 'requesting' | 'captured' | 'denied' | 'unavailable';

const GEO_TIMEOUT_MS = 10_000;

export function GeolocationCapture({ onCapture }: GeolocationCaptureProps) {
  const [status, setStatus] = useState<CaptureStatus>('idle');

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      onCapture(null);
      return;
    }

    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus('captured');
        onCapture({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => {
        setStatus('denied');
        onCapture(null);
      },
      { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: 60_000 },
    );
  }, [onCapture]);

  if (status === 'captured') {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        <span>Ubicación capturada</span>
      </div>
    );
  }

  if (status === 'denied' || status === 'unavailable') {
    return (
      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        <MapPinOff className="h-4 w-4" aria-hidden="true" />
        <span>Ubicación no compartida (opcional)</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={requestLocation}
      disabled={status === 'requesting'}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
    >
      {status === 'requesting' ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <MapPin className="h-4 w-4" aria-hidden="true" />
      )}
      <span>Compartir mi ubicación (opcional)</span>
    </button>
  );
}
