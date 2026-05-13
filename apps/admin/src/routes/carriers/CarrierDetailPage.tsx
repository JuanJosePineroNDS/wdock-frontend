import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Shield, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { formatIsoDate, formatIsoDateTime } from '@wdock/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useActivateCarrier,
  useCarrier,
  useDeactivateCarrier,
} from '@/features/carriers/hooks';
import { CarrierFormDialog } from '@/features/carriers/CarrierFormDialog';
import { useSmsDispatches } from '@/features/sms-dispatches/hooks';
import { SmsStatusBadge } from '@/routes/shipments/SmsStatusBadge';

function asPlateList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

export function CarrierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useCarrier(id);
  const dispatches = useSmsDispatches({ carrier: id, ordering: '-initiated_at' });
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const deactivate = useDeactivateCarrier(id ?? '');
  const activate = useActivateCarrier(id ?? '');

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
  const willDeactivate = data.active;
  const pending = willDeactivate ? deactivate.isPending : activate.isPending;

  const onToggleConfirm = () => {
    setActionError(null);
    const onSuccess = () => {
      toast.success(
        willDeactivate
          ? `Transportista ${data.full_name} desactivado`
          : `Transportista ${data.full_name} activado`,
      );
      setConfirmOpen(false);
    };
    const onError = (err: Error) => setActionError(err.message);
    if (willDeactivate) {
      deactivate.mutate(undefined, { onSuccess, onError });
    } else {
      activate.mutate(undefined, { onSuccess, onError });
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-1">
        <Link to="/carriers" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver a transportistas
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)} data-testid="carrier-edit">
              <Pencil className="h-4 w-4" aria-hidden />
              Editar
            </Button>
            <Button
              variant={willDeactivate ? 'destructive' : 'default'}
              onClick={() => setConfirmOpen(true)}
              data-testid="carrier-toggle"
            >
              {willDeactivate ? (
                <>
                  <ShieldOff className="h-4 w-4" aria-hidden />
                  Desactivar
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" aria-hidden />
                  Activar
                </>
              )}
            </Button>
          </div>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Envíos SMS relacionados</CardTitle>
        </CardHeader>
        <CardContent>
          {dispatches.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : dispatches.data && dispatches.data.results.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {dispatches.data.results.slice(0, 10).map((dispatch) => (
                <li key={dispatch.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <Link
                      to={`/shipments/${dispatch.shipment}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      Salida {dispatch.shipment.slice(0, 8)}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {formatIsoDate(dispatch.initiated_at.slice(0, 10))} ·{' '}
                      {dispatch.phone_snapshot}
                    </p>
                  </div>
                  <SmsStatusBadge status={dispatch.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Sin envíos SMS asociados todavía.</p>
          )}
        </CardContent>
      </Card>

      <CarrierFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        carrier={data}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={willDeactivate ? `¿Desactivar ${data.full_name}?` : `¿Activar ${data.full_name}?`}
        description={
          willDeactivate
            ? 'El transportista se ocultará de la lista por defecto. Sus envíos previos se conservan.'
            : 'El transportista volverá a aparecer en la lista y podrá recibir nuevos envíos.'
        }
        confirmLabel={willDeactivate ? 'Desactivar' : 'Activar'}
        destructive={willDeactivate}
        pending={pending}
        error={actionError}
        onConfirm={onToggleConfirm}
      />
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
