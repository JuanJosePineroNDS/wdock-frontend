import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatIsoDate, formatIsoDateTime } from '@wdock/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useShipment } from '@/features/shipments/hooks';
import { ShipmentStatusBadge } from './StatusBadge';

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
    <div className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <Link to="/shipments" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver a albaranes
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="shipment-id">
            Albarán {data.crm_external_id}
          </h1>
          <ShipmentStatusBadge status={data.status} />
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
          <Field label="Mercancía" value={data.cargo_description} />
          <Field label="Albarán PDF" value={data.document ?? 'Pendiente de subida'} />
          <Field label="Creado" value={formatIsoDateTime(data.created_at)} />
          <Field label="Actualizado" value={formatIsoDateTime(data.updated_at)} />
        </CardContent>
      </Card>

      <Alert>
        <AlertTitle>Acciones del operador disponibles próximamente</AlertTitle>
        <AlertDescription>
          Iniciar envío, cancelar y reenviar SMS llegarán en la siguiente fase (F3).
        </AlertDescription>
      </Alert>
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
