import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/stores/authStore';
import { renderWithProviders } from './testUtils';

const baseUser = {
  id: 'u',
  email: 'admin@wdock.local',
  full_name: 'Admin User',
  role: 'ADMIN' as const,
  is_active_in_tenant: true,
  is_staff: true,
  tenant_id: 't',
  tenant_name: 'Demo Tenant',
  last_login_at: null,
};

describe('Header', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: baseUser, isAuthenticated: true });
  });

  it('exposes the email block as a link to /profile', () => {
    renderWithProviders(<Header />, { initialPath: '/dashboard', path: '/dashboard' });

    const link = screen.getByTestId('header-profile-link');
    expect(link).toHaveAttribute('href', '/profile');
    expect(link).toHaveTextContent('admin@wdock.local');
    expect(link).toHaveTextContent(/Demo Tenant.*ADMIN/);
  });
});
