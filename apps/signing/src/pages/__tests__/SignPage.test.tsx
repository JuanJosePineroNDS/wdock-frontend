import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Replace signature_pad with a controllable stub. The real library depends on
// browser pointer + canvas APIs that jsdom does not implement. Tests drive the
// pad with `finishStubStroke()` which fires `endStroke` like real drawing.
type StubListener = () => void;
const stubInstances: Array<{
  listeners: Set<StubListener>;
  empty: boolean;
}> = [];

vi.mock('signature_pad', () => {
  class StubSignaturePad {
    private state = { listeners: new Set<StubListener>(), empty: true };
    constructor(_canvas: HTMLCanvasElement, _options?: unknown) {
      stubInstances.push(this.state);
    }
    addEventListener(_type: string, fn: StubListener) {
      this.state.listeners.add(fn);
    }
    removeEventListener(_type: string, fn: StubListener) {
      this.state.listeners.delete(fn);
    }
    off() {
      this.state.listeners.clear();
    }
    isEmpty() {
      return this.state.empty;
    }
    clear() {
      this.state.empty = true;
    }
    toDataURL() {
      return 'data:image/png;base64,STUB-SIGNATURE';
    }
  }
  return { default: StubSignaturePad };
});

function finishStubStroke() {
  const last = stubInstances[stubInstances.length - 1];
  if (!last) throw new Error('No signature_pad stub instance');
  last.empty = false;
  last.listeners.forEach((fn) => fn());
}

import { SignPage } from '../SignPage';

const SAMPLE_SESSION = {
  shipment_external_id: 'SIGN-TEST-1',
  scheduled_date: '2026-05-15',
  cargo_description: 'Material de prueba',
  carrier_name: 'Juan Garcia Lopez',
  status: 'pending',
  document_url: null,
  expires_at: '2026-05-16T14:59:09Z',
};

type FetchHandler = (url: string, init?: RequestInit) => Response | Promise<Response>;

let fetchMock: ReturnType<typeof vi.fn>;

beforeAll(() => {
  // Stub Canvas2D so signature_pad can mount in jsdom.
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: vi.fn(() => {
      const ctx: Record<string, unknown> = {
        fillStyle: '#000',
        strokeStyle: '#000',
        lineWidth: 1,
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
      };
      const methods = [
        'scale',
        'translate',
        'clearRect',
        'fillRect',
        'beginPath',
        'closePath',
        'moveTo',
        'lineTo',
        'bezierCurveTo',
        'quadraticCurveTo',
        'arc',
        'fill',
        'stroke',
        'save',
        'restore',
        'setTransform',
        'putImageData',
        'drawImage',
        'setLineDash',
      ];
      methods.forEach((m) => {
        ctx[m] = vi.fn();
      });
      ctx.getImageData = vi.fn(() => ({ data: new Uint8ClampedArray(4) }));
      return ctx;
    }),
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
    configurable: true,
    value: vi.fn(() => 'data:image/png;base64,SIGNED'),
  });
});

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
  stubInstances.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function setFetchHandler(handler: FetchHandler) {
  fetchMock.mockImplementation((url: string, init?: RequestInit) =>
    Promise.resolve(handler(url, init)),
  );
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderAtToken(token: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/sign/${token}`]}>
        <Routes>
          <Route path="/sign/:token" element={<SignPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SignPage', () => {
  it('renders the signing form when GET returns 200', async () => {
    setFetchHandler((_url, init) => {
      if (init?.method === 'POST') return jsonResponse(201, { status: 'received' });
      return jsonResponse(200, SAMPLE_SESSION);
    });

    renderAtToken('tok-200');
    expect(await screen.findByText(/firma de albarán/i)).toBeInTheDocument();
    expect(screen.getByText(/SIGN-TEST-1/i)).toBeInTheDocument();
    expect(screen.getByText(/Juan Garcia Lopez/i)).toBeInTheDocument();
  });

  it('shows AlreadySignedState when GET returns 409', async () => {
    setFetchHandler(() => jsonResponse(409, { detail: 'Already signed' }));
    renderAtToken('tok-409');
    expect(await screen.findByText(/albarán ya firmado/i)).toBeInTheDocument();
  });

  it('shows ExpiredState when GET returns 410', async () => {
    setFetchHandler(() => jsonResponse(410, { detail: 'Expired' }));
    renderAtToken('tok-410');
    expect(await screen.findByText(/enlace caducado/i)).toBeInTheDocument();
  });

  it('shows InvalidTokenState when GET returns 404', async () => {
    setFetchHandler(() => jsonResponse(404, { detail: 'Not found' }));
    renderAtToken('tok-404');
    expect(await screen.findByText(/enlace no válido/i)).toBeInTheDocument();
  });

  it('keeps submit disabled until DNI valid + signature drawn + checkbox checked', async () => {
    setFetchHandler(() => jsonResponse(200, SAMPLE_SESSION));
    renderAtToken('tok-form');
    await screen.findByText(/firma de albarán/i);

    const submit = screen.getByTestId('submit-signature') as HTMLButtonElement;
    expect(submit).toBeDisabled();

    const dniInput = screen.getByTestId('signer-dni');
    await userEvent.type(dniInput, '12345678Z');
    expect(submit).toBeDisabled(); // signature still missing

    // Toggle accept terms; still no signature
    await userEvent.click(screen.getByTestId('accept-terms'));
    expect(submit).toBeDisabled();
  });

  it('submits POST with signature, dni and accepted_terms, then shows SuccessState', async () => {
    let submittedBody: unknown = null;
    setFetchHandler((_url, init) => {
      if (init?.method === 'POST') {
        submittedBody = JSON.parse(String(init.body));
        return jsonResponse(201, { status: 'received' });
      }
      return jsonResponse(200, SAMPLE_SESSION);
    });

    renderAtToken('tok-submit');
    await screen.findByText(/firma de albarán/i);

    await userEvent.type(screen.getByTestId('signer-dni'), '12345678Z');
    await userEvent.click(screen.getByTestId('accept-terms'));

    finishStubStroke();

    const submit = screen.getByTestId('submit-signature') as HTMLButtonElement;
    await waitFor(() => expect(submit).not.toBeDisabled());

    await userEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByText(/firma enviada correctamente/i)).toBeInTheDocument();
    });
    expect(submittedBody).toMatchObject({
      signature_image: expect.stringContaining('data:image/png;base64'),
      signer_dni: '12345678Z',
      accepted_terms: true,
    });
  });

  it('shows AlreadySignedState if POST returns 409', async () => {
    setFetchHandler((_url, init) => {
      if (init?.method === 'POST') return jsonResponse(409, { detail: 'Already signed' });
      return jsonResponse(200, SAMPLE_SESSION);
    });

    renderAtToken('tok-conflict');
    await screen.findByText(/firma de albarán/i);

    await userEvent.type(screen.getByTestId('signer-dni'), '12345678Z');
    await userEvent.click(screen.getByTestId('accept-terms'));

    finishStubStroke();
    const submit = screen.getByTestId('submit-signature') as HTMLButtonElement;
    await waitFor(() => expect(submit).not.toBeDisabled());
    await userEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByText(/albarán ya firmado/i)).toBeInTheDocument();
    });
  });
});
