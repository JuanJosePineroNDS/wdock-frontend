import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapError, type components } from '@wdock/api-client';

import { useApiClient } from '@/hooks/useApiClient';

export type Carrier = components['schemas']['Carrier'];
export type CarrierWrite = components['schemas']['CarrierWrite'];
export type CarrierWriteRequest = components['schemas']['CarrierWriteRequest'];
export type PatchedCarrierWriteRequest = components['schemas']['PatchedCarrierWriteRequest'];
export type PaginatedCarrierList = components['schemas']['PaginatedCarrierList'];

export interface UseCarriersParams {
  page?: number;
  search?: string;
  ordering?: string;
  active?: boolean;
  show_inactive?: boolean;
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
            active: params.active,
            show_inactive: params.show_inactive,
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

export interface CreateCarrierResult {
  carrier: CarrierWrite;
  /** True when the backend reactivated an existing carrier instead of creating a new one (HTTP 200 vs 201). */
  reactivated: boolean;
}

export function useCreateCarrier() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<CreateCarrierResult, Error, CarrierWriteRequest>({
    mutationFn: async (body) => {
      const { data, error, response } = await client.POST('/api/v1/carriers/', { body });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return { carrier: data, reactivated: response.status === 200 };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
    },
  });
}

export function useUpdateCarrier(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<CarrierWrite, Error, PatchedCarrierWriteRequest>({
    mutationFn: async (body) => {
      const { data, error, response } = await client.PATCH('/api/v1/carriers/{id}/', {
        params: { path: { id } },
        body,
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
    },
  });
}

export function useDeactivateCarrier(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<Carrier, Error, void>({
    mutationFn: async () => {
      const { data, error, response } = await client.POST('/api/v1/carriers/{id}/deactivate/', {
        params: { path: { id } },
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
    },
  });
}

export function useActivateCarrier(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<Carrier, Error, void>({
    mutationFn: async () => {
      const { data, error, response } = await client.POST('/api/v1/carriers/{id}/activate/', {
        params: { path: { id } },
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
    },
  });
}
