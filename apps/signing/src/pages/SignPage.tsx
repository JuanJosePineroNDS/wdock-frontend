import { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Loader2, Send } from 'lucide-react';

import { SigningApiError } from '@/api/client';
import { useSigningSession, useSubmitSignature } from '@/api/hooks';
import type { Geolocation, SigningSession, SubmitSignaturePayload } from '@/api/types';
import { GeolocationCapture } from '@/components/GeolocationCapture';
import { PageShell } from '@/components/PageShell';
import { SignaturePad, type SignaturePadHandle } from '@/components/SignaturePad';
import { AlreadySignedState } from '@/components/states/AlreadySignedState';
import { ErrorState } from '@/components/states/ErrorState';
import { ExpiredState } from '@/components/states/ExpiredState';
import { InvalidTokenState } from '@/components/states/InvalidTokenState';
import { LoadingState } from '@/components/states/LoadingState';
import { SuccessState } from '@/components/states/SuccessState';
import { normalizeDNI, validateSpanishDNI } from '@/lib/validators';
import { formatSpanishDate } from '@/lib/format';

export function SignPage() {
  const { token } = useParams<{ token: string }>();
  const session = useSigningSession(token);
  const submit = useSubmitSignature(token);

  if (!token) return <InvalidTokenState />;

  if (submit.isSuccess) {
    return <SuccessState shipmentExternalId={session.data?.shipment_external_id} />;
  }

  if (submit.error) {
    if (submit.error.status === 409) return <AlreadySignedState />;
    if (submit.error.status === 410) return <ExpiredState />;
  }

  switch (session.state) {
    case 'loading':
      return <LoadingState />;
    case 'invalid':
      return <InvalidTokenState />;
    case 'already_signed':
      return <AlreadySignedState />;
    case 'expired':
      return <ExpiredState />;
    case 'error':
      return <ErrorState onRetry={() => session.query.refetch()} />;
    case 'signable':
      if (!session.data) return <LoadingState />;
      return <SignForm session={session.data} submit={submit} />;
    default:
      return <LoadingState />;
  }
}

interface SignFormProps {
  session: SigningSession;
  submit: ReturnType<typeof useSubmitSignature>;
}

function SignForm({ session, submit }: SignFormProps) {
  const padRef = useRef<SignaturePadHandle | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [dni, setDni] = useState('');
  const [dniTouched, setDniTouched] = useState(false);
  const [geolocation, setGeolocation] = useState<Geolocation | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const dniValidation = useMemo(() => validateSpanishDNI(dni), [dni]);
  const canSubmit =
    dniValidation.valid && Boolean(signatureDataUrl) && acceptedTerms && !submit.isPending;

  const errorMessage = useMemo(() => formatSubmitError(submit.error ?? null), [submit.error]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !signatureDataUrl) return;
    const payload: SubmitSignaturePayload = {
      signature_image: signatureDataUrl,
      signer_dni: normalizeDNI(dni),
      accepted_terms: true,
    };
    if (geolocation) payload.geolocation = geolocation;
    submit.mutate(payload);
  };

  return (
    <PageShell>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Firma de albarán</h1>
      <p className="mb-4 text-sm text-slate-600">
        Revisa los datos y firma para confirmar la recepción de la mercancía.
      </p>

      <section className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <dl className="grid grid-cols-1 gap-2 text-sm">
          <Detail label="Número de albarán" value={session.shipment_external_id} />
          <Detail label="Fecha" value={formatSpanishDate(session.scheduled_date)} />
          <Detail label="Mercancía" value={session.cargo_description} />
          <Detail label="Transportista" value={session.carrier_name} />
        </dl>
        {session.document_url ? (
          <a
            href={session.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            data-testid="document-link"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Ver albarán completo (PDF)
          </a>
        ) : null}
      </section>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label htmlFor="signer-dni" className="mb-1 block text-sm font-medium text-slate-900">
            Tu DNI o NIE
          </label>
          <input
            id="signer-dni"
            data-testid="signer-dni"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={dni}
            onChange={(event) => setDni(event.target.value)}
            onBlur={() => setDniTouched(true)}
            placeholder="12345678Z"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            aria-invalid={dniTouched && !dniValidation.valid}
            aria-describedby="signer-dni-help"
          />
          <p id="signer-dni-help" className="mt-1 text-xs text-slate-500">
            Introduce tu DNI o NIE para identificarte como firmante.
          </p>
          {dniTouched && !dniValidation.valid ? (
            <p className="mt-1 text-xs text-red-600" data-testid="signer-dni-error">
              {dniValidation.reason}
            </p>
          ) : null}
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-900">Tu firma</span>
          <SignaturePad ref={padRef} onChange={setSignatureDataUrl} />
        </div>

        <GeolocationCapture onCapture={setGeolocation} />

        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            data-testid="accept-terms"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-0.5 h-5 w-5 cursor-pointer rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <span>
            Confirmo que he recibido la mercancía descrita y acepto la firma de este albarán.
          </span>
        </label>

        {errorMessage ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          data-testid="submit-signature"
          disabled={!canSubmit}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          {submit.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Enviando…
            </>
          ) : (
            <>
              <Send className="h-5 w-5" aria-hidden="true" />
              Firmar y enviar
            </>
          )}
        </button>
      </form>
    </PageShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function formatSubmitError(error: SigningApiError | null): string | null {
  if (!error) return null;
  if (error.status === 400) {
    const body = error.body as Record<string, unknown> | null;
    if (body && typeof body === 'object') {
      const fieldEntries = Object.entries(body).filter(([key]) => key !== 'detail');
      if (fieldEntries.length > 0) {
        const messages = fieldEntries
          .map(([key, value]) => {
            const text = Array.isArray(value) ? value.join(', ') : String(value);
            return `${key}: ${text}`;
          })
          .join(' · ');
        return messages;
      }
      if (typeof body.detail === 'string') return body.detail;
    }
    return 'Revisa los datos antes de enviar.';
  }
  if (error.status === 429) return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.';
  if (error.status >= 500) return 'Error del servidor. Inténtalo de nuevo en unos segundos.';
  return 'No se ha podido enviar la firma. Comprueba tu conexión y vuelve a intentarlo.';
}
