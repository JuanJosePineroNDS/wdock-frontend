import { useQuery } from '@tanstack/react-query';

import { unwrapError, type components } from '@wdock/api-client';

import { useApiClient } from '@/hooks/useApiClient';

export type Carrier = components['schemas']['Carrier'];
export type PaginatedCarrierList = components['schemas']['PaginatedCarrierList'];

export interface UseCarriersParams {
  page?: number;
  search?: string;
  ordering?: string;
}

export function useCarriers(params: UseCarriersParams = {}) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['carriers', params],
    queryFn: async () => {
      const { data, error, response } = await client.GET('/api/v1/carriers/', {
        params: {
          query: {
            page: params.page,
            search: params.search,
            ordering: params.ordering,
          },
        },
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
  });
}

export function useCarrier(id: string | undefined) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['carriers', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Missing carrier id');
      }
      const { data, error, response } = await client.GET('/api/v1/carriers/{id}/', {
        params: { path: { id } },
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    enabled: Boolean(id),
  });
}
