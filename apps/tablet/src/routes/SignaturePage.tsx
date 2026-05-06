import { Loader2 } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sha256 } from '@wdock/shared/utils';
import type { WdockApiClient } from '@wdock/api-client';

import { OnlineIndicator } from '@/components/OnlineIndicator';
import { PdfViewer } from '@/components/PdfViewer';
import { SignaturePad, type SignaturePadHandle } from '@/components/SignaturePad';
import { Button } from '@/components/ui/Button';
import {
  type SessionState,
  useSignatureSession,
  type UseSignatureSessionOptions,
} from '@/hooks/useSignatureSession';
import { apiClient as defaultApiClient } from '@/lib/apiClient';
import type { SignaturePoint } from '@/types/signature';
import { ExpiredPage } from './ExpiredPage';
import { NotFoundPage } from './NotFoundPage';

interface SignaturePageProps {
  /** Allows tests to inject the API client (production passes nothing). */
  apiClient?: WdockApiClient;
}

const MIN_TRACE_POINTS = 30;

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'preparing' }
  | { kind: 'submitting' }
  | { kind: 'rejecting' }
  | { kind: 'success' }
  | { kind: 'hash-mismatch' }
  | { kind: 'error'; message: string };

export function SignaturePage({ apiClient }: SignaturePageProps = {}) {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const client = apiClient ?? defaultApiClient;
  const sessionOptions = useMemo<UseSignatureSessionOptions>(() => ({ client }), [client]);
  const session = useSignatureSession(token, sessionOptions);
  const padRef = useRef<SignaturePadHandle | null>(null);
  const [numPoints, setNumPoints] = useState(0);
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });

  if (session.state === 'loading') return <LoadingScreen />;
  if (session.state === 'expired') return <ExpiredPage />;
  if (session.state === 'not-found') return <NotFoundPage />;
  if (session.state === 'error') return <ErrorScreen message={session.message} />;

  return (
    <ActiveScreen
      session={session}
      token={token!}
      client={client}
      navigate={navigate}
      padRef={padRef}
      numPoints={numPoints}
      onPadChange={({ numPoints: n }) => setNumPoints(n)}
      submitState={submitState}
      setSubmitState={setSubmitState}
    />
  );
}

function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center text-lg text-slate-600">
      <Loader2 className="mr-3 h-6 w-6 animate-spin" aria-hidden />
      Cargando documento...
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-100 p-8">
      <div role="alert" className="max-w-xl rounded-2xl border border-rose-300 bg-white p-10 text-center shadow-lg">
        <h1 className="text-2xl font-semibold text-rose-700">No se ha podido cargar la sesion</h1>
        <p className="mt-3 text-slate-600">{message}</p>
      </div>
    </div>
  );
}

interface ActiveScreenProps {
  session: Extract<SessionState, { state: 'ok' }>;
  token: string;
  client: WdockApiClient;
  navigate: ReturnType<typeof useNavigate>;
  padRef: React.MutableRefObject<SignaturePadHandle | null>;
  numPoints: number;
  onPadChange: (state: { isEmpty: boolean; numPoints: number }) => void;
  submitState: SubmitState;
  setSubmitState: React.Dispatch<React.SetStateAction<SubmitState>>;
}

function ActiveScreen({
  session,
  token,
  client,
  navigate,
  padRef,
  numPoints,
  onPadChange,
  submitState,
  setSubmitState,
}: ActiveScreenProps) {
  const data = session.data;
  const truncatedHash = useMemo(
    () => `${data.hash_documento_esperado.slice(0, 8)}…`,
    [data.hash_documento_esperado],
  );

  // Stable per-tablet device id, persisted in localStorage.
  const deviceId = useDeviceId();

  // The PDF presigned URL the tablet renders.
  const pdfUrl = data.documento_pdf_url ?? null;

  const handleSign = useCallback(async () => {
    if (!padRef.current) return;
    const { points, metadata } = padRef.current.collect();
    if (points.length < MIN_TRACE_POINTS) {
      setSubmitState({
        kind: 'error',
        message: `La firma necesita al menos ${MIN_TRACE_POINTS} puntos. Vuelve a firmar.`,
      });
      return;
    }
    if (!pdfUrl) {
      setSubmitState({ kind: 'error', message: 'No se pudo descargar el documento.' });
      return;
    }

    setSubmitState({ kind: 'preparing' });
    let pdfHash: string;
    try {
      const blob = await fetchPdf(pdfUrl);
      pdfHash = await sha256(blob);
    } catch (err) {
      setSubmitState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'No se pudo calcular el hash del documento',
      });
      return;
    }

    if (pdfHash !== data.hash_documento_esperado) {
      setSubmitState({ kind: 'hash-mismatch' });
      return;
    }

    setSubmitState({ kind: 'submitting' });
    const { error, response } = await client.POST(
      '/api/v1/signature/sessions/{token}/sign',
      {
        params: { path: { token } },
        body: {
          hash_documento: pdfHash,
          trazado: points satisfies SignaturePoint[],
          user_agent: navigator.userAgent,
          device_id: deviceId,
        },
      },
    );

    if (response.status >= 200 && response.status < 300) {
      setSubmitState({ kind: 'success' });
      navigate('/sign/done', { replace: true });
      return;
    }
    setSubmitState({
      kind: 'error',
      message:
        (error as { detail?: string } | undefined)?.detail ??
        `El servidor respondio con ${response.status}.`,
    });
    void metadata; // metadata is captured for future PRs; backend re-derives it from the trace.
  }, [client, data.hash_documento_esperado, deviceId, navigate, padRef, pdfUrl, setSubmitState, token]);

  const handleReject = useCallback(async () => {
    const reason = window.prompt(
      'Indica el motivo del rechazo (obligatorio):',
      '',
    );
    if (!reason || reason.trim() === '') return;
    setSubmitState({ kind: 'rejecting' });
    const { response, error } = await client.POST(
      '/api/v1/signature/sessions/{token}/reject',
      {
        params: { path: { token } },
        body: { razon: reason.trim() },
      },
    );
    if (response.status >= 200 && response.status < 300) {
      navigate('/sign/rejected', { replace: true });
      return;
    }
    setSubmitState({
      kind: 'error',
      message:
        (error as { detail?: string } | undefined)?.detail ??
        `No se pudo registrar el rechazo (${response.status}).`,
    });
  }, [client, navigate, setSubmitState, token]);

  const isBusy =
    submitState.kind === 'preparing' ||
    submitState.kind === 'submitting' ||
    submitState.kind === 'rejecting';
  const canSign = numPoints >= MIN_TRACE_POINTS && !isBusy;

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-100 p-4">
      <header className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-slate-900" data-testid="document-title">
            {data.nombre_fichero}
          </h1>
          <p className="text-sm text-slate-600">
            Firmante: <span className="font-medium">{data.firmante_nombre || '—'}</span>
            <span
              className="ml-3 rounded bg-slate-200 px-2 py-0.5 font-mono text-xs"
              title={data.hash_documento_esperado}
              aria-label={`Hash documento ${data.hash_documento_esperado}`}
            >
              hash {truncatedHash}
            </span>
          </p>
        </div>
        <OnlineIndicator />
      </header>
      <div className="grid flex-1 grid-cols-2 gap-4 overflow-hidden">
        <PdfViewer url={pdfUrl} />
        <SignaturePad innerRef={padRef} onChange={onPadChange} />
      </div>
      <SubmitFeedback state={submitState} />
      <footer className="mt-3 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          {numPoints < MIN_TRACE_POINTS
            ? `Sigue firmando (${numPoints}/${MIN_TRACE_POINTS} puntos minimos)`
            : `Trazado capturado: ${numPoints} puntos`}
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleReject}
            disabled={isBusy}
            data-testid="reject-button"
          >
            Rechazar
          </Button>
          <Button
            onClick={handleSign}
            disabled={!canSign}
            aria-disabled={!canSign}
            data-testid="sign-button"
          >
            {isBusy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : 'Firmar'}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function SubmitFeedback({ state }: { state: SubmitState }) {
  if (state.kind === 'idle' || state.kind === 'success') return null;
  if (state.kind === 'preparing') {
    return (
      <p className="mt-2 text-sm text-slate-600" role="status">
        Calculando hash del documento...
      </p>
    );
  }
  if (state.kind === 'submitting') {
    return (
      <p className="mt-2 text-sm text-slate-600" role="status">
        Enviando firma al servidor...
      </p>
    );
  }
  if (state.kind === 'rejecting') {
    return (
      <p className="mt-2 text-sm text-slate-600" role="status">
        Registrando rechazo...
      </p>
    );
  }
  if (state.kind === 'hash-mismatch') {
    return (
      <p
        className="mt-2 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        role="alert"
        data-testid="hash-mismatch"
      >
        El documento mostrado no coincide con el original. Por seguridad la firma se ha cancelado.
      </p>
    );
  }
  return (
    <p
      className="mt-2 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700"
      role="alert"
      data-testid="submit-error"
    >
      {state.message}
    </p>
  );
}

const DEVICE_ID_KEY = 'wdock.tablet.deviceId';

function useDeviceId() {
  return useMemo(() => {
    try {
      const stored = window.localStorage.getItem(DEVICE_ID_KEY);
      if (stored) return stored;
      const fresh = (crypto.randomUUID?.() ?? `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      window.localStorage.setItem(DEVICE_ID_KEY, fresh);
      return fresh;
    } catch {
      return `dev-${Date.now()}`;
    }
  }, []);
}

async function fetchPdf(url: string): Promise<Blob> {
  const response = await fetch(url, { credentials: 'omit' });
  if (!response.ok) {
    throw new Error(`PDF no disponible (HTTP ${response.status})`);
  }
  return response.blob();
}

