import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, ShieldOff, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { formatIsoDateTime } from '@wdock/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useActivateCarrier,
  useCarriers,
  useDeactivateCarrier,
  type Carrier,
} from '@/features/carriers/hooks';
import { CarrierFormDialog } from '@/features/carriers/CarrierFormDialog';

function asPlateList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

export function CarriersListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | undefined>(undefined);
  const [confirmTarget, setConfirmTarget] = useState<Carrier | null>(null);

  const { data, isLoading, isError, error } = useCarriers({
    search: search || undefined,
    ordering: 'full_name',
    show_inactive: showInactive || undefined,
  });

  const onCreate = () => {
    setEditingCarrier(undefined);
    setFormOpen(true);
  };
  const onEdit = (carrier: Carrier) => {
    setEditingCarrier(carrier);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transportistas</h1>
          <p className="text-sm text-muted-foreground">Listado de transportistas registrados.</p>
        </div>
        <Button onClick={onCreate} data-testid="carriers-new">
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo transportista
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="grow space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="carriers-search">
            Búsqueda
          </label>
          <Input
            id="carriers-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="DNI, nombre o móvil"
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
            data-testid="carriers-show-inactive"
          />
          Mostrar inactivos
        </label>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el listado</AlertTitle>
          <AlertDescription>{error?.message ?? 'Inténtalo de nuevo.'}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : data && data.results.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">DNI</th>
                <th className="px-4 py-3">Móvil</th>
                <th className="px-4 py-3">Matrículas</th>
                <th className="px-4 py-3">Activo</th>
                <th className="px-4 py-3">Actualizado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.results.map((row) => {
                const plates = asPlateList(row.license_plates);
                return (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-slate-50"
                    data-testid="carriers-row"
                  >
                    <td
                      className="cursor-pointer px-4 py-3 font-medium text-slate-900"
                      onClick={() => navigate(`/carriers/${row.id}`)}
                    >
                      {row.full_name}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.dni}</td>
                    <td className="px-4 py-3 text-slate-700">{row.mobile_phone}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex flex-wrap gap-1">
                        {plates.length > 0 ? (
                          plates.map((plate) => (
                            <span
                              key={plate}
                              className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs"
                            >
                              {plate}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          row.active
                            ? 'inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700'
                            : 'inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500'
                        }
                      >
                        {row.active ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {formatIsoDateTime(row.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <CarrierActionButtons
                        carrier={row}
                        onEdit={() => onEdit(row)}
                        onToggleActive={() => setConfirmTarget(row)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-700">No hay transportistas que coincidan con los filtros.</p>
        </div>
      )}

      <CarrierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={editingCarrier ? 'edit' : 'create'}
        carrier={editingCarrier}
      />

      <ToggleActiveConfirm
        carrier={confirmTarget}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  );
}

interface CarrierActionButtonsProps {
  carrier: Carrier;
  onEdit: () => void;
  onToggleActive: () => void;
}

function CarrierActionButtons({ carrier, onEdit, onToggleActive }: CarrierActionButtonsProps) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={onEdit}
        aria-label="Editar"
        data-testid="carriers-row-edit"
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onToggleActive}
        aria-label={carrier.active ? 'Desactivar' : 'Activar'}
        data-testid="carriers-row-toggle"
      >
        {carrier.active ? (
          <ShieldOff className="h-4 w-4 text-red-600" aria-hidden />
        ) : (
          <Shield className="h-4 w-4 text-emerald-600" aria-hidden />
        )}
      </Button>
    </div>
  );
}

interface ToggleActiveConfirmProps {
  carrier: Carrier | null;
  onClose: () => void;
}

function ToggleActiveConfirm({ carrier, onClose }: ToggleActiveConfirmProps) {
  const deactivate = useDeactivateCarrier(carrier?.id ?? '');
  const activate = useActivateCarrier(carrier?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  if (!carrier) return null;

  const willDeactivate = carrier.active;
  const pending = willDeactivate ? deactivate.isPending : activate.isPending;

  const onConfirm = () => {
    setError(null);
    const onSuccess = () => {
      toast.success(
        willDeactivate
          ? `Transportista ${carrier.full_name} desactivado`
          : `Transportista ${carrier.full_name} activado`,
      );
      onClose();
    };
    const onError = (err: Error) => {
      setError(err.message || 'No se pudo completar la acción.');
    };

    if (willDeactivate) {
      deactivate.mutate(undefined, { onSuccess, onError });
    } else {
      activate.mutate(undefined, { onSuccess, onError });
    }
  };

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={willDeactivate ? `¿Desactivar ${carrier.full_name}?` : `¿Activar ${carrier.full_name}?`}
      description={
        willDeactivate
          ? 'El transportista se ocultará de la lista por defecto. Sus envíos previos se conservan.'
          : 'El transportista volverá a aparecer en la lista y podrá recibir nuevos envíos.'
      }
      confirmLabel={willDeactivate ? 'Desactivar' : 'Activar'}
      destructive={willDeactivate}
      pending={pending}
      error={error}
      onConfirm={onConfirm}
    />
  );
}
