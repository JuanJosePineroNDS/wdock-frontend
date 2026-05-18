import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SignPage } from '@/pages/SignPage';
import { InvalidTokenState } from '@/components/states/InvalidTokenState';

function createSigningQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        refetchOnWindowFocus: false,
        staleTime: 60_000,
      },
    },
  });
}

const queryClient = createSigningQueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/sign/:token" element={<SignPage />} />
          <Route path="/" element={<Navigate to="/sign/" replace />} />
          <Route path="*" element={<InvalidTokenState />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
