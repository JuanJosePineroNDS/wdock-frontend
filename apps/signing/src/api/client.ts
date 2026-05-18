import type {
  SigningErrorBody,
  SigningSession,
  SubmitSignaturePayload,
  SubmitSignatureResponse,
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class SigningApiError extends Error {
  readonly status: number;
  readonly body: SigningErrorBody | null;

  constructor(message: string, status: number, body: SigningErrorBody | null = null) {
    super(message);
    this.name = 'SigningApiError';
    this.status = status;
    this.body = body;
  }
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

function buildUrl(token: string): string {
  const encoded = encodeURIComponent(token);
  return `${BASE_URL}/api/v1/sign/${encoded}/`;
}

export async function fetchSigningSession(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SigningSession> {
  const response = await fetchImpl(buildUrl(token), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (response.ok) {
    return (await response.json()) as SigningSession;
  }
  const body = (await safeJson(response)) as SigningErrorBody | null;
  throw new SigningApiError(
    body?.detail ?? `GET /sign failed (${response.status})`,
    response.status,
    body,
  );
}

export async function submitSignature(
  token: string,
  payload: SubmitSignaturePayload,
  fetchImpl: typeof fetch = fetch,
): Promise<SubmitSignatureResponse> {
  const response = await fetchImpl(buildUrl(token), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (response.ok) {
    return (await response.json()) as SubmitSignatureResponse;
  }
  const body = (await safeJson(response)) as SigningErrorBody | null;
  throw new SigningApiError(
    body?.detail ?? `POST /sign failed (${response.status})`,
    response.status,
    body,
  );
}
