import { Link } from 'react-router-dom';
import { formatIsoDateTime } from '@wdock/shared/utils';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useImports } from '@/features/imports/hooks';
import { ImportStatusBadge } from '@/routes/imports/StatusBadge';
import { useShipments } from '@/features/shipments/hooks';
import { useCarriers } from '@/features/carriers/hooks';
import { useSmsDispatches } from '@/features/sms-dispatches/hooks';
import { useActivityLog } from '@/features/activity-log/hooks';
import { humanAction, humanResource } from '@/lib/audit-translations';
import { useAuthStore } from '@/stores/authStore';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const today = todayIso();

  const todayShipments = useShipments({
    scheduled_date: today,
    status: 'PROGRAMMED',
  });
  const inProcessSms = useSmsDispatches({ status: 'SENT' });
  const failedSms = useSmsDispatches({ status: 'FAILED' });
  const activeCarriers = useCarriers({ active: true });
  const importsQuery = useImports();
  const recentActivity = useActivityLog({ ordering: '-timestamp' });

  const pendingToday = todayShipments.data?.count ?? todayShipments.data?.results.length ?? 0;
  const inProcessCount = inProcessSms.data?.count ?? inProcessSms.data?.results.length ?? 0;
  const failedCount = failedSms.data?.count ?? failedSms.data?.results.length ?? 0;
  const activeCarriersTotal = activeCarriers.data?.count ?? activeCarriers.data?.results.length ?? 0;
  const latestImport = importsQuery.data?.results[0];
  const latestActivity = recentActivity.data?.results.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenido a WDock Admin</h1>
        <p className="text-sm text-muted-foreground">
          Panel operacional del día. Salidas, envíos y actividad del tenant.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          to="/shipments"
          title="Salidas programadas hoy"
          description={`Estado PROGRAMMED para ${today}.`}
          value={pendingToday}
          loading={todayShipments.isLoading}
          testid="stat-pending-today"
        />
        <StatCard
          to="/shipments"
          title="Envíos SMS en curso"
          description="Estado SENT esperando confirmación."
          value={inProcessCount}
          loading={inProcessSms.isLoading}
          tone="warn"
          testid="stat-sms-in-process"
        />
        <StatCard
          to="/activity-log"
          title="Envíos SMS fallidos"
          description="Requieren revisión manual."
          value={failedCount}
          loading={failedSms.isLoading}
          tone="error"
          testid="stat-sms-failed"
        />
        <StatCard
          to="/carriers"
          title="Transportistas activos"
          description="Total en el tenant."
          value={activeCarriersTotal}
          loading={activeCarriers.isLoading}
          testid="stat-carriers-active"
        />
        <Link to="/imports" className="block">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Último import</CardTitle>
              <CardDescription>Estado de la carga más reciente.</CardDescription>
            </CardHeader>
            <CardContent>
              {importsQuery.isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : latestImport ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-900">
                      {latestImport.original_filename}
                    </span>
                    <ImportStatusBadge status={latestImport.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatIsoDateTime(latestImport.created_at)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Sin imports todavía.</p>
              )}
            </CardContent>
          </Card>
        </Link>
        <Card className="md:col-span-2 xl:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Actividad reciente</CardTitle>
                <CardDescription>Las 3 últimas acciones del tenant.</CardDescription>
              </div>
              <Link to="/activity-log" className="text-sm text-primary hover:underline">
                Ver historial completo
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : latestActivity.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {latestActivity.map((entry) => (
                  <li key={entry.id} className="py-2 text-sm">
                    <p className="font-medium text-slate-900">{humanAction(entry.action)}</p>
                    <p className="text-xs text-slate-500">
                      {humanResource(entry.resource_type)} ·{' '}
                      {entry.user_email || entry.external_actor || 'Sistema'} ·{' '}
                      {formatIsoDateTime(entry.timestamp)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Sin actividad registrada todavía.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tu sesión</CardTitle>
            <CardDescription>Datos del usuario autenticado actualmente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {user ? (
              <>
                <div>
                  <span className="text-slate-500">Email:</span>{' '}
                  <span className="font-medium" data-testid="user-email">
                    {user.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Tenant:</span>{' '}
                  <span className="font-medium">{user.tenant_name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Rol:</span>{' '}
                  <span className="font-medium uppercase">{user.role}</span>
                </div>
              </>
            ) : (
              <span className="text-slate-500">No hay sesión activa.</span>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  to: string;
  title: string;
  description: string;
  value: number;
  loading: boolean;
  tone?: 'default' | 'warn' | 'error';
  testid?: string;
}

function StatCard({
  to,
  title,
  description,
  value,
  loading,
  tone = 'default',
  testid,
}: StatCardProps) {
  const toneClass =
    tone === 'warn'
      ? 'text-amber-600'
      : tone === 'error'
        ? value > 0
          ? 'text-red-600'
          : 'text-slate-900'
        : 'text-slate-900';

  return (
    <Link to={to} className="block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className={`text-3xl font-semibold ${toneClass}`} data-testid={testid}>
              {value}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
