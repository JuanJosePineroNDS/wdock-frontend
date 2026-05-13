import { Link, useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { formatIsoDateTime } from '@wdock/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useImports } from '@/features/imports/hooks';
import { ImportStatusBadge } from './StatusBadge';

export function ImportsListPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useImports();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Imports</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de cargas de Excel y estado de procesamiento.
          </p>
        </div>
        <Link to="/imports/new">
          <Button>
            <Upload className="h-4 w-4" aria-hidden />
            Subir Excel
          </Button>
        </Link>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el listado</AlertTitle>
          <AlertDescription>{error?.message ?? 'Inténtalo de nuevo en unos segundos.'}</AlertDescription>
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
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Archivo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Transportistas</th>
                <th className="px-4 py-3 text-right">Albaranes</th>
                <th className="px-4 py-3 text-right">Errores</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.results.map((item) => (
                <tr
                  key={item.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => navigate(`/imports/${item.id}`)}
                  data-testid="imports-row"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {formatIsoDateTime(item.created_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.original_filename}</td>
                  <td className="px-4 py-3">
                    <ImportStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {item.carriers_created} / {item.carriers_updated}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {item.shipments_created} / {item.shipments_updated}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{item.rows_failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-700">Aún no hay imports.</p>
          <p className="mt-1 text-xs text-slate-500">
            Sube tu primer Excel para empezar a alimentar transportistas y albaranes.
          </p>
          <Link to="/imports/new" className="mt-4 inline-block">
            <Button>
              <Upload className="h-4 w-4" aria-hidden />
              Sube tu primer Excel
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
