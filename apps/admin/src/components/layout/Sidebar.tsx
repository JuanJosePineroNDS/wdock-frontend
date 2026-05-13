import { NavLink } from 'react-router-dom';
import { FileText, LayoutDashboard, Package, Truck, Upload, Users } from 'lucide-react';
import { cn } from '@wdock/shared/utils';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/imports', label: 'Imports', icon: Upload },
  { to: '/shipments', label: 'Albaranes', icon: Package },
  { to: '/carriers', label: 'Transportistas', icon: Truck },
  { to: '/documents', label: 'Documentos', icon: FileText },
  { to: '/users', label: 'Usuarios', icon: Users },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-slate-200 bg-white">
      <div className="px-6 py-5 text-lg font-semibold tracking-tight text-slate-900">WDock</div>
      <nav className="flex-1 px-3 pb-4">
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100',
                  )
                }
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
