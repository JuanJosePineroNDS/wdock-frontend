import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatIsoDate } from '@wdock/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useShipments, type ShipmentStatus } from '@/features/shipments/hooks';
import { SHIPMENT_STATUS_LABELS, ShipmentStatusBadge } from './StatusBadge';

const STATUS_OPTIONS: { value: ShipmentStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'PROGRAMMED', label: SHIPMENT_STATUS_LABELS.PROGRAMMED },
  { value: 'IN_PROCESS', label: SHIPMENT_STATUS_LABELS.IN_PROCESS },
  { value: 'SIGNED', label: SHIPMENT_STATUS_LABELS.SIGNED },
  { value: 'EXPIRED', label: SHIPMENT_STATUS_LABELS.EXPIRED },
  { value: 'CANCELLED', label: SHIPMENT_STATUS_LABELS.CANCELLED },
];

export function ShipmentsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | ''>('');
  const [dateFilter, setDateFilter] = useState('');

  const { data, isLoading, isError, error } = useShipments({
    search: search || undefined,
    ordering: '-scheduled_date',
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.results.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (dateFilter && row.scheduled_date !== dateFilter) return false;
      return true;
    });
  }, [data, statusFilter, dateFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Albaranes</h1>
        <p className="text-sm text-muted-foreground">Listado de albaranes importados.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="grow space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="shipments-search">
            Búsqueda
          </label>
          <Input
            id="shipments-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Albarán, transportista o mercancía"
          />
        </div>
        <div className="w-48 space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="shipments-status">
            Estado
          </label>
          <select
            id="shipments-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | '')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-48 space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="shipments-date">
            Fecha programada
          </label>
          <Input
            id="shipments-date"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
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
      ) : filtered.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Albarán</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Transportista</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Mercancía</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => navigate(`/shipments/${row.id}`)}
                  data-testid="shipments-row"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{row.crm_external_id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {formatIsoDate(row.scheduled_date)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.expected_carrier_name}</td>
                  <td className="px-4 py-3 text-slate-700">{row.expected_carrier_phone}</td>
                  <td className="px-4 py-3 text-slate-700">{row.cargo_description}</td>
                  <td className="px-4 py-3">
                    <ShipmentStatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-700">No hay albaranes que coincidan con los filtros.</p>
        </div>
      )}
    </div>
  );
}
