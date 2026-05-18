import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-sm text-slate-500">Plataforma documental WDock</div>
      <div className="flex items-center gap-4 text-sm">
        {user && (
          <Link
            to="/profile"
            className="text-right leading-tight rounded-md px-2 py-1 -mx-2 -my-1 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            data-testid="header-profile-link"
            aria-label="Abrir mi perfil"
          >
            <div className="font-medium text-slate-900">{user.email}</div>
            <div className="text-xs text-slate-500">
              {user.tenant_name} · {user.role}
            </div>
          </Link>
        )}
        <Button variant="ghost" size="sm" onClick={logout} aria-label="Cerrar sesion">
          <LogOut className="h-4 w-4" aria-hidden />
          Salir
        </Button>
      </div>
    </header>
  );
}
