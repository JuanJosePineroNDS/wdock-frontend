import { authStorage, createApiClient, type WdockApiClient } from '@wdock/api-client';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export const apiClient: WdockApiClient = createApiClient({
  baseUrl,
  storage: authStorage,
});
