import { createApiClient } from '@wdock/api-client';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

// La pantalla de firma es un endpoint publico (signature session via token):
// no usamos el storage de auth, ya que la firma del conductor no requiere login.
export const apiClient = createApiClient({ baseUrl });
