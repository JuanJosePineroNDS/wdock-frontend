import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenido a WDock Admin</h1>
        <p className="text-sm text-muted-foreground">
          Panel de control para administradores y operadores internos.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tu sesion</CardTitle>
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
              <span className="text-slate-500">No hay sesion activa.</span>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
