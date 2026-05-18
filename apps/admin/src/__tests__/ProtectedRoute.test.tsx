import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';

function setup(initial = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Private dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('redirects to /login when not authenticated', () => {
    setup('/dashboard');
    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(screen.queryByText('Private dashboard')).toBeNull();
  });

  it('renders the child route when authenticated', () => {
    useAuthStore.setState({
      user: {
        id: 'u',
        email: 'a@b.c',
        role: 'ADMIN',
        is_active_in_tenant: true,
        is_staff: true,
        tenant_id: 't',
        tenant_name: 'Demo',
        last_login_at: null,
      },
      isAuthenticated: true,
    });
    setup('/dashboard');
    expect(screen.getByText('Private dashboard')).toBeInTheDocument();
  });
});
