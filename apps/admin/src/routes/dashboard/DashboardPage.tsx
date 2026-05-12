import { Link } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotes } from '@/features/notes/hooks';
import { useAuthStore } from '@/stores/authStore';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const notesQuery = useNotes();

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
                  <span className="font-medium">{user.tenant_name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Role:</span>{' '}
                  <span className="font-medium uppercase">{user.role}</span>
                </div>
              </>
            ) : (
              <span className="text-slate-500">No active session.</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Quick example feature.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {notesQuery.isLoading && <span className="text-slate-500">Loading…</span>}
            {notesQuery.isError && <span className="text-slate-500">—</span>}
            {notesQuery.data && (
              <p>
                You have{' '}
                <span className="font-semibold" data-testid="notes-count">
                  {notesQuery.data.count}
                </span>{' '}
                {notesQuery.data.count === 1 ? 'note' : 'notes'}.
              </p>
            )}
            <Link to="/notes" className="text-primary underline-offset-4 hover:underline">
              Manage notes →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
