import { authStorage, createApiClient, type AppApiClient } from '@app/api-client';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export const apiClient: AppApiClient = createApiClient({
  baseUrl,
  storage: authStorage,
});
