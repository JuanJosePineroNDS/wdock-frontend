import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-sm text-slate-500">App admin panel</div>
      <div className="flex items-center gap-4 text-sm">
        {user && (
          <div className="text-right leading-tight">
            <div className="font-medium text-slate-900">{user.email}</div>
            <div className="text-xs text-slate-500">
              {user.tenant_nombre} · {user.rol}
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={logout} aria-label="Sign out">
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </header>
  );
}
