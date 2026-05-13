import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatIsoDateTime } from '@wdock/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCarrier } from '@/features/carriers/hooks';

function asPlateList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

export function CarrierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useCarrier(id);

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 w-full" />
        {isError && (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar el transportista</AlertTitle>
            <AlertDescription>{error?.message ?? 'Inténtalo de nuevo.'}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  const plates = asPlateList(data.license_plates);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <Link to="/carriers" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver a transportistas
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="carrier-name">
            {data.full_name}
          </h1>
          <span
            className={
              data.active
                ? 'inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700'
                : 'inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500'
            }
          >
            {data.active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del transportista</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="DNI" value={data.dni} />
          <Field label="Móvil" value={data.mobile_phone} />
          <Field label="Notas" value={data.notes} />
          <Field label="Creado" value={formatIsoDateTime(data.created_at)} />
          <Field label="Actualizado" value={formatIsoDateTime(data.updated_at)} />
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Matrículas</p>
            <div className="flex flex-wrap gap-1.5">
              {plates.length > 0 ? (
                plates.map((plate) => (
                  <span
                    key={plate}
                    className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-1 text-sm"
                  >
                    {plate}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400">—</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertTitle>Historial de envíos disponible próximamente</AlertTitle>
        <AlertDescription>
          La vista del historial de envíos llegará en la siguiente fase (F3).
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
