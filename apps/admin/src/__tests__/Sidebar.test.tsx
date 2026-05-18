import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/stores/authStore';
import { renderWithProviders } from './testUtils';

function userWithRole(role: 'SUPERADMIN' | 'ADMIN' | 'OPERADOR') {
  return {
    id: 'u',
    email: 'user@wdock.local',
    full_name: 'User',
    role,
    is_active_in_tenant: true,
    is_staff: false,
    tenant_id: 't',
    tenant_name: 'Demo',
    last_login_at: null,
  };
}

describe('Sidebar', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('does not render the "Documentos" entry (commented out for v2)', () => {
    useAuthStore.setState({ user: userWithRole('SUPERADMIN'), isAuthenticated: true });
    renderWithProviders(<Sidebar />, { initialPath: '/dashboard', path: '/dashboard' });

    expect(screen.queryByText('Documentos')).not.toBeInTheDocument();
  });

  it('renders the "Usuarios" entry for SUPERADMIN', () => {
    useAuthStore.setState({ user: userWithRole('SUPERADMIN'), isAuthenticated: true });
    renderWithProviders(<Sidebar />, { initialPath: '/dashboard', path: '/dashboard' });

    expect(screen.getByText('Usuarios')).toBeInTheDocument();
  });

  it('hides the "Usuarios" entry for non-SUPERADMIN users', () => {
    useAuthStore.setState({ user: userWithRole('ADMIN'), isAuthenticated: true });
    renderWithProviders(<Sidebar />, { initialPath: '/dashboard', path: '/dashboard' });

    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    // Other entries still render.
    expect(screen.getByText('Albaranes')).toBeInTheDocument();
    expect(screen.getByText('Historial')).toBeInTheDocument();
  });
});
