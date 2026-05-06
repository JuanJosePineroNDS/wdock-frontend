import { useEffect, useState } from 'react';

export interface SignatureSession {
  status: 'active' | 'expired' | 'completed';
  document: {
    id: string;
    pdf_url: string;
    title: string;
  };
  carrier: {
    name: string;
    plate?: string;
  } | null;
  expires_at: string;
}

export type SessionState =
  | { state: 'loading' }
  | { state: 'ok'; data: SignatureSession }
  | { state: 'expired' }
  | { state: 'not-found' }
  | { state: 'error'; message: string };

export interface UseSignatureSessionOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export function useSignatureSession(
  token: string | undefined,
  options: UseSignatureSessionOptions = {},
): SessionState {
  const [state, setState] = useState<SessionState>({ state: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ state: 'not-found' });
      return;
    }
    const controller = new AbortController();
    const fetchImpl = options.fetchImpl ?? fetch;
    const baseUrl = (options.baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
    const url = `${baseUrl}/api/sign/${encodeURIComponent(token)}/`;

    (async () => {
      try {
        const response = await fetchImpl(url, { signal: controller.signal });
        if (response.status === 404) {
          setState({ state: 'not-found' });
          return;
        }
        if (response.status === 410) {
          setState({ state: 'expired' });
          return;
        }
        if (!response.ok) {
          setState({ state: 'error', message: `HTTP ${response.status}` });
          return;
        }
        const data = (await response.json()) as SignatureSession;
        if (data.status === 'expired') {
          setState({ state: 'expired' });
          return;
        }
        setState({ state: 'ok', data });
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'unknown error';
        setState({ state: 'error', message });
      }
    })();

    return () => controller.abort();
  }, [token, options.baseUrl, options.fetchImpl]);

  return state;
}
