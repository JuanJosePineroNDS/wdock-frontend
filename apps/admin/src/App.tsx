import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AuthBootstrap } from '@/components/auth/AuthBootstrap';
import { createQueryClient } from '@/lib/queryClient';
import { AppRoutes } from '@/routes';

const queryClient = createQueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthBootstrap>
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  );
}

export default App;
