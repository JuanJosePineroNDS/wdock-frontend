import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatIsoDateTime } from '@wdock/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCarriers } from '@/features/carriers/hooks';

function asPlateList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

export function CarriersListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  const { data, isLoading, isError, error } = useCarriers({
    search: search || undefined,
    ordering: 'full_name',
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.results.filter((row) => (!activeOnly || row.active));
  }, [data, activeOnly]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transportistas</h1>
        <p className="text-sm text-muted-foreground">Listado de transportistas registrados.</p>
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
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
            data-testid="carriers-active-only"
          />
          Solo activos
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
      ) : filtered.length > 0 ? (
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => {
                const plates = asPlateList(row.license_plates);
                return (
                  <tr
                    key={row.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => navigate(`/carriers/${row.id}`)}
                    data-testid="carriers-row"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{row.full_name}</td>
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
    </div>
  );
}
