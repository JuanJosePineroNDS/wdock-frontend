import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from './auth/LoginPage';
import { DashboardPage } from './dashboard/DashboardPage';
import { ImportsListPage } from './imports/ImportsListPage';
import { ImportUploadPage } from './imports/ImportUploadPage';
import { ImportDetailPage } from './imports/ImportDetailPage';
import { ShipmentsListPage } from './shipments/ShipmentsListPage';
import { ShipmentDetailPage } from './shipments/ShipmentDetailPage';
import { CarriersListPage } from './carriers/CarriersListPage';
import { CarrierDetailPage } from './carriers/CarrierDetailPage';
import { ActivityLogPage } from './activity-log/ActivityLogPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/imports" element={<ImportsListPage />} />
          <Route path="/imports/new" element={<ImportUploadPage />} />
          <Route path="/imports/:id" element={<ImportDetailPage />} />
          <Route path="/shipments" element={<ShipmentsListPage />} />
          <Route path="/shipments/:id" element={<ShipmentDetailPage />} />
          <Route path="/carriers" element={<CarriersListPage />} />
          <Route path="/carriers/:id" element={<CarrierDetailPage />} />
          <Route path="/activity-log" element={<ActivityLogPage />} />
          <Route path="/documents" element={<DocumentsPlaceholder />} />
          <Route path="/users" element={<UsersPlaceholder />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function DocumentsPlaceholder() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Documentos</h1>
      <p className="text-sm text-muted-foreground">Funcionalidad en migración a WDock v2.</p>
    </div>
  );
}

function UsersPlaceholder() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Usuarios</h1>
      <p className="text-sm text-muted-foreground">Funcionalidad en migración a WDock v2.</p>
    </div>
  );
}
