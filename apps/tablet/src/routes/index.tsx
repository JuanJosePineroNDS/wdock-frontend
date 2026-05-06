import { Navigate, Route, Routes } from 'react-router-dom';

import { ConfirmationPage } from './ConfirmationPage';
import { ExpiredPage } from './ExpiredPage';
import { NotFoundPage } from './NotFoundPage';
import { RejectedPage } from './RejectedPage';
import { SignaturePage } from './SignaturePage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/sign/:token" element={<SignaturePage />} />
      <Route path="/sign/done" element={<ConfirmationPage />} />
      <Route path="/sign/rejected" element={<RejectedPage />} />
      <Route path="/expired" element={<ExpiredPage />} />
      <Route path="/" element={<Navigate to="/expired" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
