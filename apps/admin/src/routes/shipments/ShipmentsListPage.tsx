import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatIsoDate } from '@wdock/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useShipments, type ShipmentStatus } from '@/features/shipments/hooks';
import { SHIPMENT_STATUS_LABELS, ShipmentStatusBadge } from './StatusBadge';
import { ShipmentActions } from './ShipmentActions';

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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading, isError, error } = useShipments({
    search: search || undefined,
    status: statusFilter || undefined,
    scheduled_date_from: fromDate || undefined,
    scheduled_date_to: toDate || undefined,
    ordering: '-scheduled_date',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Albaranes</h1>
        <p className="text-sm text-muted-foreground">
          Listado de salidas. Inicia, reenvía, edita o cancela envíos desde las acciones por fila.
        </p>
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
        <div className="w-44 space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="shipments-from">
            Desde
          </label>
          <Input
            id="shipments-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="w-44 space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="shipments-to">
            Hasta
          </label>
          <Input
            id="shipments-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
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
      ) : data && data.results.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Albarán</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Transportista</th>
                <th className="px-4 py-3">Mercancía</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.results.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-slate-50"
                  data-testid="shipments-row"
                >
                  <td
                    className="cursor-pointer px-4 py-3 font-medium text-slate-900"
                    onClick={() => navigate(`/shipments/${row.id}`)}
                  >
                    {row.crm_external_id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {formatIsoDate(row.scheduled_date)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.expected_carrier_name}</td>
                  <td className="px-4 py-3 text-slate-700">{row.cargo_description}</td>
                  <td className="px-4 py-3">
                    <ShipmentStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ShipmentActions shipment={row} compact />
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
