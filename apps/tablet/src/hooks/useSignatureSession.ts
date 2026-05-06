import { useEffect, useState } from 'react';
import type { components, WdockApiClient } from '@wdock/api-client';

export type PublicSession = components['schemas']['PublicSession'];

export type SessionState =
  | { state: 'loading' }
  | { state: 'ok'; data: PublicSession }
  | { state: 'expired' }
  | { state: 'not-found' }
  | { state: 'error'; message: string };

export interface UseSignatureSessionOptions {
  /**
   * API client used to fetch the session. When omitted, the hook is in
   * loading state forever — pass a real client from the page.
   */
  client?: WdockApiClient;
}

export function useSignatureSession(
  token: string | undefined,
  options: UseSignatureSessionOptions = {},
): SessionState {
  const [state, setState] = useState<SessionState>({ state: 'loading' });
  const { client } = options;

  useEffect(() => {
    if (!token) {
      setState({ state: 'not-found' });
      return;
    }
    if (!client) {
      // No client wired up yet — keep showing loading.
      return;
    }
    let cancelled = false;
    setState({ state: 'loading' });

    client
      .GET('/api/v1/signature/sessions/{token}', {
        params: { path: { token } },
      })
      .then(({ data, error, response }) => {
        if (cancelled) return;
        if (data) {
          if (data.estado === 'EXPIRADA') {
            setState({ state: 'expired' });
          } else if (data.estado === 'CANCELADA' || data.estado === 'ERROR') {
            setState({ state: 'error', message: `Sesion en estado ${data.estado}` });
          } else if (data.estado === 'FIRMADA') {
            setState({ state: 'error', message: 'Esta firma ya se completo' });
          } else {
            setState({ state: 'ok', data });
          }
          return;
        }
        if (response.status === 404) setState({ state: 'not-found' });
        else if (response.status === 410) setState({ state: 'expired' });
        else {
          const detail = (error as { detail?: string } | undefined)?.detail;
          setState({ state: 'error', message: detail ?? `HTTP ${response.status}` });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'unknown error';
        setState({ state: 'error', message });
      });

    return () => {
      cancelled = true;
    };
  }, [token, client]);

  return state;
}
