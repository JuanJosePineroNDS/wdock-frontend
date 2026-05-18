import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapError, type components } from '@wdock/api-client';

import { useApiClient } from '@/hooks/useApiClient';

export type Shipment = components['schemas']['Shipment'];
export type PaginatedShipmentList = components['schemas']['PaginatedShipmentList'];
export type ShipmentStatus = components['schemas']['ShipmentStatusEnum'];
export type ShipmentEditRequest = components['schemas']['PatchedShipmentEditRequest'];
export type SmsDispatch = components['schemas']['SmsDispatch'];

export interface UseShipmentsParams {
  page?: number;
  search?: string;
  ordering?: string;
  status?: ShipmentStatus;
  scheduled_date?: string;
  scheduled_date_from?: string;
  scheduled_date_to?: string;
}

export function useShipments(params: UseShipmentsParams = {}) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['shipments', params],
    queryFn: async () => {
      const { data, error, response } = await client.GET('/api/v1/shipments/', {
        params: {
          query: {
            page: params.page,
            search: params.search,
            ordering: params.ordering,
            status: params.status,
            scheduled_date: params.scheduled_date,
            scheduled_date_from: params.scheduled_date_from,
            scheduled_date_to: params.scheduled_date_to,
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

export function useShipment(id: string | undefined) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['shipments', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Missing shipment id');
      }
      const { data, error, response } = await client.GET('/api/v1/shipments/{id}/', {
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

export interface CancelShipmentInput {
  reason?: string;
}

export function useCancelShipment(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<Shipment, Error, CancelShipmentInput | void>({
    mutationFn: async (input) => {
      const body =
        input && 'reason' in input && input.reason ? { reason: input.reason } : undefined;
      const { data, error, response } = await client.POST('/api/v1/shipments/{id}/cancel/', {
        params: { path: { id } },
        body,
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['sms-dispatches'] });
    },
  });
}

export function useEditShipment(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<Shipment, Error, ShipmentEditRequest>({
    mutationFn: async (body) => {
      const { data, error, response } = await client.PATCH('/api/v1/shipments/{id}/edit/', {
        params: { path: { id } },
        body,
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });
}

export interface DispatchInput {
  carrier_id: string;
}

export function useDispatchShipment(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<SmsDispatch, Error, DispatchInput>({
    mutationFn: async ({ carrier_id }) => {
      const { data, error, response } = await client.POST('/api/v1/shipments/{id}/dispatch/', {
        params: { path: { id } },
        body: { carrier_id },
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['sms-dispatches'] });
    },
  });
}

export function useResendShipment(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<SmsDispatch, Error, void>({
    mutationFn: async () => {
      const { data, error, response } = await client.POST('/api/v1/shipments/{id}/resend/', {
        params: { path: { id } },
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['sms-dispatches'] });
    },
  });
}
