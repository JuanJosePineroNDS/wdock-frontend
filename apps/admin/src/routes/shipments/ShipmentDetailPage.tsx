import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatIsoDate, formatIsoDateTime } from '@wdock/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useShipment } from '@/features/shipments/hooks';
import {
  useDownloadSignedPdf,
  useShipmentSignature,
  type Signature,
} from '@/features/signatures/hooks';
import { ShipmentStatusBadge } from './StatusBadge';
import { ShipmentActions } from './ShipmentActions';
import { ShipmentDispatchHistory } from './ShipmentDispatchHistory';

export function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useShipment(id);

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 w-full" />
        {isError && (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar el albarán</AlertTitle>
            <AlertDescription>{error?.message ?? 'Inténtalo de nuevo.'}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-1">
        <Link
          to="/shipments"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver a albaranes
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight" data-testid="shipment-id">
              Albarán {data.crm_external_id}
            </h1>
            <ShipmentStatusBadge status={data.status} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data.status === 'SIGNED' && <DownloadSignedPdfButton shipmentId={data.id} />}
            <ShipmentActions shipment={data} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha programada" value={formatIsoDate(data.scheduled_date)} />
          <Field label="Transportista esperado" value={data.expected_carrier_name} />
          <Field label="Teléfono esperado" value={data.expected_carrier_phone} />
          <Field label="Matrícula esperada" value={data.expected_license_plate} />
          <Field label="Mercancía" value={data.cargo_description} />
          <Field label="Albarán PDF" value={data.document ?? 'Pendiente de subida'} />
          <Field label="Notas" value={data.notes} />
          <Field label="Creado" value={formatIsoDateTime(data.created_at)} />
          <Field label="Actualizado" value={formatIsoDateTime(data.updated_at)} />
          {data.cancelled_at && (
            <Field label="Cancelado" value={formatIsoDateTime(data.cancelled_at)} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial de envíos</CardTitle>
        </CardHeader>
        <CardContent>
          <ShipmentDispatchHistory shipmentId={data.id} />
        </CardContent>
      </Card>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
}

function Field({ label, value }: FieldProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-900 break-words">{value || '—'}</p>
    </div>
  );
}

function isPdfReady(signature: Signature | null | undefined): signature is Signature {
  if (!signature) return false;
  return signature.status === 'PDF_GENERATED' || signature.status === 'NOTIFIED';
}

interface DownloadSignedPdfButtonProps {
  shipmentId: string;
}

function DownloadSignedPdfButton({ shipmentId }: DownloadSignedPdfButtonProps) {
  const { data: signature, isLoading } = useShipmentSignature(shipmentId);
  const download = useDownloadSignedPdf();

  if (isLoading || !isPdfReady(signature)) {
    return null;
  }

  const handleClick = async () => {
    try {
      const url = await download.mutateAsync(signature.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo descargar el PDF.';
      toast.error(message);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={download.isPending}
      data-testid="download-signed-pdf"
    >
      <Download className="h-4 w-4" aria-hidden />
      {download.isPending ? 'Generando enlace…' : 'Descargar PDF firmado'}
    </Button>
  );
}
