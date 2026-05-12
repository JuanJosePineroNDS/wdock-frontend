import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to App Admin</h1>
        <p className="text-sm text-muted-foreground">
          Admin panel template — start customizing from here.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Your session</CardTitle>
            <CardDescription>Currently authenticated user.</CardDescription>
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
                  <span className="text-slate-500">Role:</span>{' '}
                  <span className="font-medium uppercase">{user.rol}</span>
                </div>
              </>
            ) : (
              <span className="text-slate-500">No active session.</span>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
