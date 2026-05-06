/**
 * E2E-ish tests for the tablet signing flow.
 *
 * We mock signature_pad and pdfjs-dist because jsdom can't render either,
 * and we mock global fetch + crypto.subtle.digest so we can drive the
 * hash-compare path deterministically.
 */
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mocks for things jsdom can't run ---------------------------------------
const { FakePad, lastInstance } = vi.hoisted(() => {
  class FakePad {
    isEmptyValue = true;
    data: { points: { x: number; y: number; pressure: number; time: number }[] }[] = [];
    endHandlers: Array<() => void> = [];
    constructor(_canvas: HTMLCanvasElement) {
      lastInstance.current = this;
    }
    isEmpty() {
      return this.isEmptyValue;
    }
    toData() {
      return this.data;
    }
    clear() {
      this.isEmptyValue = true;
      this.data = [];
    }
    addEventListener(name: string, handler: () => void) {
      if (name === 'endStroke') this.endHandlers.push(handler);
    }
    removeEventListener(name: string, handler: () => void) {
      if (name === 'endStroke') {
        this.endHandlers = this.endHandlers.filter((h) => h !== handler);
      }
    }
    off() {}
    emitEnd() {
      for (const h of this.endHandlers) h();
    }
  }
  const lastInstance: { current: null | FakePad } = { current: null };
  return { FakePad, lastInstance };
});
vi.mock('signature_pad', () => ({ default: FakePad }));
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(() => ({
    promise: new Promise(() => {
      /* never resolves: PdfViewer stays in loading state, fine for these tests */
    }),
    destroy: vi.fn(),
  })),
}));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: 'worker-stub' }));

// Mock the SHA-256 helper so the hash-compare branch is deterministic in jsdom,
// which doesn't have a fully-working Blob.arrayBuffer + crypto.subtle.digest
// pipeline. We still exercise everything around it.
const sha256Mock = vi.hoisted(() => ({ value: '' }));
vi.mock('@wdock/shared/utils', async () => {
  const actual = await vi.importActual<typeof import('@wdock/shared/utils')>(
    '@wdock/shared/utils',
  );
  return {
    ...actual,
    sha256: vi.fn(async () => sha256Mock.value),
  };
});

// --- Helpers ----------------------------------------------------------------

function makePoints(n: number): { x: number; y: number; pressure: number; time: number }[] {
  const pts = [] as { x: number; y: number; pressure: number; time: number }[];
  for (let i = 0; i < n; i += 1) {
    pts.push({ x: i, y: i % 5, pressure: 0.4 + (i % 5) * 0.1, time: 1000 + i * 20 });
  }
  return pts;
}

function makeFakeApi(overrides: { GET?: (...args: any[]) => any; POST?: (...args: any[]) => any } = {}) {
  return {
    GET: overrides.GET ?? vi.fn(),
    POST: overrides.POST ?? vi.fn(),
  } as unknown as import('@wdock/api-client').WdockApiClient;
}

function renderAt(
  token: string,
  api: import('@wdock/api-client').WdockApiClient,
  onLocation?: (path: string) => void,
) {
  return render(
    <MemoryRouter initialEntries={[`/sign/${token}`]}>
      <Routes>
        <Route
          path="/sign/:token"
          element={
            <SignaturePageHarness onLocation={onLocation}>
              <SignaturePage apiClient={api} />
            </SignaturePageHarness>
          }
        />
        <Route
          path="/sign/done"
          element={
            <LocationReporter onLocation={onLocation}>
              <div>Done</div>
            </LocationReporter>
          }
        />
        <Route
          path="/sign/rejected"
          element={
            <LocationReporter onLocation={onLocation}>
              <div>Rejected</div>
            </LocationReporter>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

import { useLocation } from 'react-router-dom';
function LocationReporter({
  onLocation,
  children,
}: {
  onLocation?: (path: string) => void;
  children: React.ReactNode;
}) {
  const loc = useLocation();
  if (onLocation) onLocation(loc.pathname);
  return <>{children}</>;
}
function SignaturePageHarness({
  onLocation,
  children,
}: {
  onLocation?: (path: string) => void;
  children: React.ReactNode;
}) {
  return <LocationReporter onLocation={onLocation}>{children}</LocationReporter>;
}

import { SignaturePage } from '@/routes/SignaturePage';

// Pre-populate a deterministic hash for the fake PDF so we can flip
// matched / mismatched scenarios per test.
const KNOWN_HASH = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

beforeEach(() => {
  lastInstance.current = null;
  window.localStorage.clear();
  // Stable stub for fetch -> returns a small Blob the helper will hash.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(new Blob([new TextEncoder().encode('hello world')]))),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// --- Tests ------------------------------------------------------------------

describe('SignaturePage flow', () => {
  it('shows the document title and the firmante for an active session', async () => {
    const session = activeSession();
    const api = makeFakeApi({
      GET: vi.fn(async () => ({ data: session, error: undefined, response: { status: 200 } })),
    });
    renderAt(session.token, api);
    await waitFor(() =>
      expect(screen.getByTestId('document-title')).toHaveTextContent('Albaran 12345.pdf'),
    );
    expect(screen.getByText(/Pedro Conductor/)).toBeInTheDocument();
    expect(screen.getByTestId('sign-button')).toBeDisabled();
  });

  it('redirects to expired when the backend says EXPIRADA', async () => {
    const session = { ...activeSession(), estado: 'EXPIRADA' as const };
    const api = makeFakeApi({
      GET: vi.fn(async () => ({ data: session, error: undefined, response: { status: 200 } })),
    });
    renderAt(session.token, api);
    await waitFor(() => expect(screen.getByText(/sesion de firma caducada/i)).toBeInTheDocument());
  });

  it('aborts when the captured trace has fewer than 30 points', async () => {
    const session = activeSession();
    const api = makeFakeApi({
      GET: vi.fn(async () => ({ data: session, error: undefined, response: { status: 200 } })),
      POST: vi.fn(),
    });
    renderAt(session.token, api);
    await waitFor(() => expect(screen.getByTestId('document-title')).toBeInTheDocument());

    // Force the SignaturePad into a ready-but-too-short state (29 points) and try to sign.
    const pad = lastInstance.current!;
    pad.isEmptyValue = false;
    pad.data = [{ points: makePoints(29) }];
    act(() => pad.emitEnd());
    // Sign button should still be disabled at 29 points.
    expect(screen.getByTestId('sign-button')).toBeDisabled();
    expect(api.POST).not.toHaveBeenCalled();
  });

  it('calculates the hash and POSTs the trace when the document hash matches', async () => {
    sha256Mock.value = KNOWN_HASH;
    const session: PublicSessionLike = { ...activeSession(), hash_documento_esperado: KNOWN_HASH };
    const postMock = vi.fn(async () => ({ error: undefined, response: { status: 202 } }));
    const api = makeFakeApi({
      GET: vi.fn(async () => ({ data: session, error: undefined, response: { status: 200 } })),
      POST: postMock,
    });
    let lastPath = '';
    renderAt(session.token, api, (p) => {
      lastPath = p;
    });
    await waitFor(() => expect(screen.getByTestId('document-title')).toBeInTheDocument());

    const pad = lastInstance.current!;
    pad.isEmptyValue = false;
    pad.data = [{ points: makePoints(35) }];
    act(() => pad.emitEnd());
    await waitFor(() => expect(screen.getByTestId('sign-button')).not.toBeDisabled());

    await userEvent.setup().click(screen.getByTestId('sign-button'));
    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    const call = postMock.mock.calls[0] as unknown as [string, { params: { path: { token: string } }; body: { hash_documento: string; trazado: unknown[]; device_id: string; razon?: string } }];
    const [path, options] = call;
    expect(path).toBe('/api/v1/signature/sessions/{token}/sign');
    expect(options.params.path.token).toBe(session.token);
    expect(options.body.hash_documento).toBe(KNOWN_HASH);
    expect(options.body.trazado).toHaveLength(35);
    expect(options.body.device_id).toMatch(/.+/);
    await waitFor(() => expect(lastPath).toBe('/sign/done'));
  });

  it('aborts with a hash-mismatch alert when the document differs', async () => {
    sha256Mock.value = 'cafebabe'.repeat(8);
    const session: PublicSessionLike = {
      ...activeSession(),
      hash_documento_esperado: 'deadbeef'.repeat(8),
    };
    const postMock = vi.fn();
    const api = makeFakeApi({
      GET: vi.fn(async () => ({ data: session, error: undefined, response: { status: 200 } })),
      POST: postMock,
    });
    renderAt(session.token, api);
    await waitFor(() => expect(screen.getByTestId('document-title')).toBeInTheDocument());

    const pad = lastInstance.current!;
    pad.isEmptyValue = false;
    pad.data = [{ points: makePoints(40) }];
    act(() => pad.emitEnd());
    await waitFor(() => expect(screen.getByTestId('sign-button')).not.toBeDisabled());

    await userEvent.setup().click(screen.getByTestId('sign-button'));
    await waitFor(() => expect(screen.getByTestId('hash-mismatch')).toBeInTheDocument());
    expect(postMock).not.toHaveBeenCalled();
  });

  it('rejects the session with a non-empty reason and navigates to /sign/rejected', async () => {
    const session = activeSession();
    const postMock = vi.fn(async () => ({ error: undefined, response: { status: 202 } }));
    const api = makeFakeApi({
      GET: vi.fn(async () => ({ data: session, error: undefined, response: { status: 200 } })),
      POST: postMock,
    });
    let lastPath = '';
    renderAt(session.token, api, (p) => {
      lastPath = p;
    });
    await waitFor(() => expect(screen.getByTestId('document-title')).toBeInTheDocument());
    vi.spyOn(window, 'prompt').mockReturnValue('No coincide con lo cargado');

    await userEvent.setup().click(screen.getByTestId('reject-button'));
    await waitFor(() => expect(postMock).toHaveBeenCalled());
    const call = postMock.mock.calls[0] as unknown as [string, { params: { path: { token: string } }; body: { hash_documento: string; trazado: unknown[]; device_id: string; razon?: string } }];
    const [path, options] = call;
    expect(path).toBe('/api/v1/signature/sessions/{token}/reject');
    expect(options.body.razon).toBe('No coincide con lo cargado');
    await waitFor(() => expect(lastPath).toBe('/sign/rejected'));
  });

  it('does nothing when the user cancels the reject prompt', async () => {
    const session = activeSession();
    const postMock = vi.fn();
    const api = makeFakeApi({
      GET: vi.fn(async () => ({ data: session, error: undefined, response: { status: 200 } })),
      POST: postMock,
    });
    renderAt(session.token, api);
    await waitFor(() => expect(screen.getByTestId('document-title')).toBeInTheDocument());
    vi.spyOn(window, 'prompt').mockReturnValue(null);

    await userEvent.setup().click(screen.getByTestId('reject-button'));
    expect(postMock).not.toHaveBeenCalled();
  });
});

// --- Fixtures ---------------------------------------------------------------

type PublicSessionLike = ReturnType<typeof activeSession>;
function activeSession() {
  return {
    id: 'sess-1',
    token: 'abc123',
    modalidad: 'BIOMETRICA' as const,
    estado: 'PENDIENTE' as const,
    firmante_nombre: 'Pedro Conductor',
    expira_en: '2030-01-01T00:00:00Z',
    documento_pdf_url: 'https://files/example.pdf',
    hash_documento_esperado:
      'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
    nombre_fichero: 'Albaran 12345.pdf',
  };
}

// keep the unused import warning quiet
void within;
