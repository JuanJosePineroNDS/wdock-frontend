import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

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
    </QueryClientProvider>
  );
}

export default App;
