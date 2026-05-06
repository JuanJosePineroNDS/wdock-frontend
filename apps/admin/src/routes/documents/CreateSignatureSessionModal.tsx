import { useMutation } from '@tanstack/react-query';
import { Check, Copy, Loader2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useId, useState } from 'react';
import type { components } from '@wdock/api-client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiClient } from '@/hooks/useApiClient';

type Modalidad = components['schemas']['SignatureModalidad'];
type SessionResp = components['schemas']['SessionCreateResponse'];

interface CreateSignatureSessionModalProps {
  documentId: string;
  documentName: string;
  onClose: () => void;
}

const TTL_OPTIONS: { value: number; label: string }[] = [
  { value: 60, label: '1 hora' },
  { value: 240, label: '4 horas' },
  { value: 480, label: '8 horas' },
  { value: 1440, label: '24 horas' },
  { value: 4320, label: '72 horas' },
];

export function CreateSignatureSessionModal({
  documentId,
  documentName,
  onClose,
}: CreateSignatureSessionModalProps) {
  const api = useApiClient();
  const titleId = useId();
  const [modalidad, setModalidad] = useState<Modalidad>('BIOMETRICA');
  const [firmanteNombre, setFirmanteNombre] = useState('');
  const [firmanteDni, setFirmanteDni] = useState('');
  const [ttlMinutes, setTtlMinutes] = useState(240);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error, response } = await api.POST(
        '/api/v1/documents/{document_id}/signature/sessions',
        {
          params: { path: { document_id: documentId } },
          body: {
            modalidad,
            firmante_nombre: firmanteNombre || undefined,
            firmante_dni: firmanteDni || undefined,
            ttl_minutes: ttlMinutes,
          },
        },
      );
      if (!data) {
        throw new Error(
          (error as { detail?: string } | undefined)?.detail ??
            `HTTP ${response.status} al crear la sesion`,
        );
      }
      return data as SessionResp;
    },
  });

  const isCreated = mutation.data !== undefined;

  // Close modal on Escape key.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      data-testid="create-signature-modal"
    >
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 rounded-md p-1 text-slate-500 hover:bg-slate-100"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        <h2 id={titleId} className="text-xl font-semibold tracking-tight">
          {isCreated ? 'Sesion creada' : 'Nueva sesion de firma'}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{documentName}</p>

        {isCreated ? (
          <CreatedView session={mutation.data!} onClose={onClose} />
        ) : (
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            {mutation.isError && (
              <Alert variant="destructive" data-testid="modal-error">
                <AlertTitle>No se ha podido crear la sesion</AlertTitle>
                <AlertDescription>
                  {mutation.error instanceof Error ? mutation.error.message : 'Error desconocido'}
                </AlertDescription>
              </Alert>
            )}
            <div>
              <Label>Modalidad</Label>
              <div className="mt-1 flex gap-3">
                {(['BIOMETRICA', 'SIMPLE', 'OTP'] as Modalidad[]).map((option) => (
                  <label
                    key={option}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
                  >
                    <input
                      type="radio"
                      name="modalidad"
                      value={option}
                      checked={modalidad === option}
                      onChange={() => setModalidad(option)}
                      className="sr-only"
                    />
                    {option === 'BIOMETRICA' ? 'Biometrica' : option === 'SIMPLE' ? 'Simple' : 'OTP'}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="firmante-nombre">Firmante (nombre completo)</Label>
              <Input
                id="firmante-nombre"
                value={firmanteNombre}
                onChange={(e) => setFirmanteNombre(e.target.value)}
                placeholder="Opcional, se mostrara en la tablet"
              />
            </div>
            <div>
              <Label htmlFor="firmante-dni">DNI / NIE (opcional)</Label>
              <Input
                id="firmante-dni"
                value={firmanteDni}
                onChange={(e) => setFirmanteDni(e.target.value)}
                placeholder="12345678Z"
              />
            </div>
            <div>
              <Label htmlFor="ttl">Tiempo de validez</Label>
              <select
                id="ttl"
                value={ttlMinutes}
                onChange={(e) => setTtlMinutes(Number(e.target.value))}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TTL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="confirm-create">
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Crear sesion'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CreatedView({ session, onClose }: { session: SessionResp; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = session.signing_url;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No-op: copying may be blocked on some browsers / iframes.
    }
  };

  return (
    <div className="mt-4 space-y-4" data-testid="signature-created">
      <p className="text-sm text-slate-600">
        Comparte este enlace con el firmante o escanea el QR desde la tablet.
      </p>
      <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <QRCodeSVG value={url} size={200} aria-label="QR con la URL de firma" data-testid="signature-qr" />
        <code className="break-all text-xs text-slate-700">{url}</code>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={copy} data-testid="copy-url">
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden /> Copiado
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden /> Copiar URL
            </>
          )}
        </Button>
        <Button onClick={onClose}>Hecho</Button>
      </div>
    </div>
  );
}
