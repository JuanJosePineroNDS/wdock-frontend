import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from './auth/LoginPage';
import { DashboardPage } from './dashboard/DashboardPage';
import { DocumentDetailPage } from './documents/DocumentDetailPage';
import { DocumentsListPage } from './documents/DocumentsListPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/" element={<Navigate to="/documents" replace />} />
          <Route path="/documents" element={<DocumentsListPage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/users" element={<UsersPlaceholder />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/documents" replace />} />
    </Routes>
  );
}

function UsersPlaceholder() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Usuarios</h1>
      <p className="text-sm text-muted-foreground">Pospuesto al PR de gestion de usuarios.</p>
    </div>
  );
}
