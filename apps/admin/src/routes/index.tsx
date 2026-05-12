import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from './auth/LoginPage';
import { RegisterPage } from './auth/RegisterPage';
import { AcceptInvitationPage } from './auth/AcceptInvitationPage';
import { DashboardPage } from './dashboard/DashboardPage';
import { InvitationsListPage } from './admin/InvitationsListPage';
import { NotesListPage } from './notes/NotesListPage';
import { NoteFormPage } from './notes/NoteFormPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/invitations/:token" element={<AcceptInvitationPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/notes" element={<NotesListPage />} />
          <Route path="/notes/new" element={<NoteFormPage />} />
          <Route path="/notes/:id/edit" element={<NoteFormPage />} />
          <Route path="/admin/invitations" element={<InvitationsListPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
