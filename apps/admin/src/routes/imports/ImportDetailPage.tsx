import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { formatIsoDateTime } from '@wdock/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useImport } from '@/features/imports/hooks';
import { ImportStatusBadge } from './StatusBadge';

interface ImportErrorRow {
  row: number;
  reason: string;
}

function parseErrorRows(raw: unknown): ImportErrorRow[] {
  if (!Array.isArray(raw)) return [];
  const result: ImportErrorRow[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const obj = entry as Record<string, unknown>;
    const row = typeof obj.row === 'number' ? obj.row : Number(obj.row);
    const reason =
      typeof obj.reason === 'string'
        ? obj.reason
        : typeof obj.error === 'string'
          ? obj.error
          : typeof obj.message === 'string'
            ? obj.message
            : JSON.stringify(obj);
    if (Number.isFinite(row)) {
      result.push({ row, reason });
    }
  }
  return result;
}

export function ImportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useImport(id);

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        {isError && (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar el import</AlertTitle>
            <AlertDescription>{error?.message ?? 'Inténtalo de nuevo.'}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  const isInProgress = data.status === 'PENDING' || data.status === 'PROCESSING';
  const errorRows = parseErrorRows(data.errors);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link to="/imports" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver a imports
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="import-filename">
            {data.original_filename}
          </h1>
          <ImportStatusBadge status={data.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Subido el {formatIsoDateTime(data.created_at)}
          {data.completed_at ? ` · Completado el ${formatIsoDateTime(data.completed_at)}` : ''}
        </p>
      </div>

      {isInProgress && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" aria-hidden />
            <div>
              <p className="text-sm font-medium text-slate-900">Procesando…</p>
              <p className="text-xs text-slate-500">
                El estado se actualiza automáticamente cada dos segundos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {data.status === 'FAILED' && (
        <Alert variant="destructive">
          <AlertTitle>El procesamiento ha fallado</AlertTitle>
          <AlertDescription>
            {data.error_message || 'No se han podido procesar las filas. Revisa el archivo y vuelve a intentarlo.'}
          </AlertDescription>
          <div className="mt-3">
            <Link to="/imports/new">
              <Button size="sm" variant="outline">
                Reintentar subida
              </Button>
            </Link>
          </div>
        </Alert>
      )}

      {data.status === 'COMPLETED' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard label="Transportistas creados" value={data.carriers_created} />
          <SummaryCard label="Transportistas actualizados" value={data.carriers_updated} />
          <SummaryCard label="Albaranes creados" value={data.shipments_created} />
          <SummaryCard label="Albaranes actualizados" value={data.shipments_updated} />
          <SummaryCard label="Filas con error" value={data.rows_failed} tone={data.rows_failed > 0 ? 'warn' : 'ok'} />
        </div>
      )}

      {errorRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Errores por fila</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 pb-2">Fila</th>
                  <th className="px-2 pb-2">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {errorRows.map((row) => (
                  <tr key={`${row.row}-${row.reason}`}>
                    <td className="px-2 py-2 text-slate-700">{row.row}</td>
                    <td className="px-2 py-2 text-slate-900">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {data.status === 'COMPLETED' && (
        <div className="flex flex-wrap gap-2">
          <Link to="/shipments">
            <Button variant="outline">Ver albaranes</Button>
          </Link>
          <Link to="/carriers">
            <Button variant="outline">Ver transportistas</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  tone?: 'ok' | 'warn';
}

function SummaryCard({ label, value, tone = 'ok' }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="space-y-1 py-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p
          className={
            tone === 'warn' && value > 0
              ? 'text-2xl font-semibold text-amber-600'
              : 'text-2xl font-semibold text-slate-900'
          }
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
