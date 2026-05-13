import { useQuery } from '@tanstack/react-query';

import { unwrapError, type components } from '@wdock/api-client';

import { useApiClient } from '@/hooks/useApiClient';

export type Shipment = components['schemas']['Shipment'];
export type PaginatedShipmentList = components['schemas']['PaginatedShipmentList'];
export type ShipmentStatus = components['schemas']['ShipmentStatusEnum'];

export interface UseShipmentsParams {
  page?: number;
  search?: string;
  ordering?: string;
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
