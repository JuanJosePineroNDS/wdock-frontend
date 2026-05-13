import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  MessageSquare,
  Package,
  RefreshCw,
  Truck,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivityLog, type ActivityLog } from '@/features/activity-log/hooks';
import {
  ACTION_LABELS,
  humanAction,
  humanResource,
} from '@/lib/audit-translations';

const ACTION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label })),
];

const RESOURCE_OPTIONS = [
  { value: '', label: 'Todos los recursos' },
  { value: 'Carrier', label: 'Transportistas' },
  { value: 'Shipment', label: 'Salidas' },
  { value: 'SmsDispatch', label: 'Envíos SMS' },
  { value: 'ExcelImport', label: 'Importaciones Excel' },
  { value: 'Document', label: 'Documentos' },
];

function resourceIcon(recurso: string) {
  switch (recurso) {
    case 'Carrier':
    case 'carrier':
      return <Truck className="h-4 w-4" aria-hidden />;
    case 'Shipment':
    case 'shipment':
      return <Package className="h-4 w-4" aria-hidden />;
    case 'SmsDispatch':
    case 'sms_dispatch':
      return <MessageSquare className="h-4 w-4" aria-hidden />;
    case 'ExcelImport':
    case 'excel_import':
      return <FileSpreadsheet className="h-4 w-4" aria-hidden />;
    default:
      return <Activity className="h-4 w-4" aria-hidden />;
  }
}

function relativeTime(iso: string): string {
  const target = new Date(iso).getTime();
  const diff = Date.now() - target;
  if (Number.isNaN(diff)) return iso;
  const seconds = Math.round(diff / 1000);
  if (seconds < 60) return seconds <= 1 ? 'hace un instante' : `hace ${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `hace ${days} d`;
  const months = Math.round(days / 30);
  if (months < 12) return `hace ${months} m`;
  const years = Math.round(days / 365);
  return `hace ${years} a`;
}

export function ActivityLogPage() {
  const [accion, setAccion] = useState('');
  const [recurso, setRecurso] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');

  const params = useMemo(
    () => ({
      accion: accion || undefined,
      recurso_tipo: recurso || undefined,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      search: search || undefined,
      ordering: '-timestamp',
    }),
    [accion, recurso, fromDate, toDate, search],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useActivityLog(params);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Historial de actividad</h1>
          <p className="text-sm text-muted-foreground">
            Eventos de auditoría más recientes. Filtra por acción, recurso o fechas.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void refetch()}
          disabled={isFetching}
          data-testid="activity-refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
          Recargar
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3 lg:grid-cols-5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="activity-action">
            Acción
          </label>
          <select
            id="activity-action"
            value={accion}
            onChange={(e) => setAccion(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="activity-resource">
            Recurso
          </label>
          <select
            id="activity-resource"
            value={recurso}
            onChange={(e) => setRecurso(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {RESOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="activity-from">
            Desde
          </label>
          <Input
            id="activity-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="activity-to">
            Hasta
          </label>
          <Input
            id="activity-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="activity-search">
            Búsqueda
          </label>
          <Input
            id="activity-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Email, acción…"
          />
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el historial</AlertTitle>
          <AlertDescription>{error?.message ?? 'Inténtalo de nuevo.'}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : data && data.results.length > 0 ? (
        <ul className="space-y-3">
          {data.results.map((entry) => (
            <ActivityCard key={entry.id} entry={entry} />
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-700">No hay entradas que coincidan con los filtros.</p>
        </div>
      )}
    </div>
  );
}

function ActivityCard({ entry }: { entry: ActivityLog }) {
  const [expanded, setExpanded] = useState(false);
  const metadata = entry.metadata as Record<string, unknown> | null | undefined;
  const hasMetadata = metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0;
  const isUnknownAction = !(entry.accion in ACTION_LABELS);

  return (
    <li>
      <Card>
        <CardContent className="flex gap-4 py-4">
          <div className="mt-1 rounded-md bg-slate-100 p-2 text-slate-600">
            {resourceIcon(entry.recurso_tipo)}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-medium text-slate-900" data-testid="activity-action-label">
                {humanAction(entry.accion)}
              </span>
              {isUnknownAction && (
                <span
                  className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-700"
                  title="Acción no mapeada en la traducción"
                >
                  <AlertTriangle className="h-3 w-3" aria-hidden />
                  raw
                </span>
              )}
              <span className="text-xs text-slate-500">
                {humanResource(entry.recurso_tipo)}
                {entry.recurso_id ? ` · ${entry.recurso_id.slice(0, 8)}` : ''}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{entry.user_email || entry.actor_externo || 'Sistema'}</span>
              <span>·</span>
              <span title={entry.timestamp}>{relativeTime(entry.timestamp)}</span>
              {entry.ip_origen && (
                <>
                  <span>·</span>
                  <span>{entry.ip_origen}</span>
                </>
              )}
            </div>
            {hasMetadata && (
              <details
                className="mt-1 text-xs text-slate-600"
                open={expanded}
                onToggle={(e) => setExpanded((e.target as HTMLDetailsElement).open)}
              >
                <summary className="cursor-pointer">Metadatos</summary>
                <pre className="mt-1 max-h-48 overflow-auto rounded bg-slate-50 p-2 text-[11px] leading-tight text-slate-700">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
