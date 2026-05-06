import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { useAuthLogoutListener } from '@/hooks/useAuthLogoutListener';
import { createQueryClient } from '@/lib/queryClient';
import { AppRoutes } from '@/routes';

const queryClient = createQueryClient();

function GlobalListeners() {
  useAuthLogoutListener();
  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <GlobalListeners />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
