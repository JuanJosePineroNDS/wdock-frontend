import { Link } from 'react-router-dom';
import { formatIsoDateTime } from '@wdock/shared/utils';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useImports } from '@/features/imports/hooks';
import { ImportStatusBadge } from '@/routes/imports/StatusBadge';
import { useShipments } from '@/features/shipments/hooks';
import { useCarriers } from '@/features/carriers/hooks';
import { useAuthStore } from '@/stores/authStore';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const today = todayIso();
  const shipmentsQuery = useShipments();
  const carriersQuery = useCarriers();
  const importsQuery = useImports();

  const pendingToday =
    shipmentsQuery.data?.results.filter(
      (s) => s.scheduled_date === today && s.status === 'PROGRAMMED',
    ).length ?? 0;
  const carriersTotal = carriersQuery.data?.count ?? 0;
  const latestImport = importsQuery.data?.results[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenido a WDock Admin</h1>
        <p className="text-sm text-muted-foreground">
          Panel de control para administradores y operadores internos.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/shipments" className="block">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Albaranes pendientes hoy</CardTitle>
              <CardDescription>Programados para {today} sin firmar.</CardDescription>
            </CardHeader>
            <CardContent>
              {shipmentsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-semibold text-slate-900" data-testid="stat-pending-today">
                  {pendingToday}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link to="/carriers" className="block">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Transportistas</CardTitle>
              <CardDescription>Total registrados en el tenant.</CardDescription>
            </CardHeader>
            <CardContent>
              {carriersQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-semibold text-slate-900" data-testid="stat-carriers-total">
                  {carriersTotal}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
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
                  <span className="font-medium">{user.tenant_nombre}</span>
                </div>
                <div>
                  <span className="text-slate-500">Rol:</span>{' '}
                  <span className="font-medium uppercase">{user.rol}</span>
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
