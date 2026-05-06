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
      user: { id: 'u', email: 'a@b.c', first_name: 'A', last_name: 'B', role: 'admin', tenant_id: 't' },
      isAuthenticated: true,
    });
    setup('/dashboard');
    expect(screen.getByText('Private dashboard')).toBeInTheDocument();
  });
});
