import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Mail, StickyNote } from 'lucide-react';
import { cn } from '@app/shared/utils';

import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const items: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/admin/invitations', label: 'Invitations', icon: Mail, adminOnly: true },
];

export function Sidebar() {
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';

  const visibleItems = items.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="flex w-56 flex-col border-r border-slate-200 bg-white">
      <div className="px-6 py-5 text-lg font-semibold tracking-tight text-slate-900">App</div>
      <nav className="flex-1 px-3 pb-4">
        <ul className="space-y-1">
          {visibleItems.map(({ to, label, icon: Icon }) => (
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
