import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { unwrapError, type components } from '@wdock/api-client';

import { useApiClient } from '@/hooks/useApiClient';

export type SmsDispatch = components['schemas']['SmsDispatch'];
export type PaginatedSmsDispatchList = components['schemas']['PaginatedSmsDispatchList'];
export type SmsDispatchStatus = components['schemas']['SmsDispatchStatusEnum'];

const TERMINAL_STATUSES: ReadonlySet<SmsDispatchStatus> = new Set([
  'DELIVERED',
  'FAILED',
  'SIGNED',
  'EXPIRED',
  'CANCELLED',
]);

export function isSmsTerminalStatus(status: SmsDispatchStatus | undefined): boolean {
  return status !== undefined && TERMINAL_STATUSES.has(status);
}

export interface UseSmsDispatchesParams {
  page?: number;
  shipment?: string;
  carrier?: string;
  status?: SmsDispatchStatus;
  ordering?: string;
}

export function useSmsDispatches(params: UseSmsDispatchesParams = {}) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['sms-dispatches', params],
    queryFn: async () => {
      const { data, error, response } = await client.GET('/api/v1/sms-dispatches/', {
        params: {
          query: {
            page: params.page,
            shipment: params.shipment,
            carrier: params.carrier,
            status: params.status,
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

export interface UseSmsDispatchOptions {
  /** Polling interval in ms while the dispatch is in a non-terminal state. */
  pollingIntervalMs?: number;
  enabled?: boolean;
}

export function useSmsDispatch(id: string | undefined, options: UseSmsDispatchOptions = {}) {
  const client = useApiClient();
  const pollingIntervalMs = options.pollingIntervalMs ?? 5000;

  const queryOptions: UseQueryOptions<
    SmsDispatch,
    Error,
    SmsDispatch,
    ['sms-dispatches', string | undefined]
  > = {
    queryKey: ['sms-dispatches', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Missing dispatch id');
      }
      const { data, error, response } = await client.GET('/api/v1/sms-dispatches/{id}/', {
        params: { path: { id } },
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    enabled: Boolean(id) && (options.enabled ?? true),
    refetchInterval: (query) => {
      const current = query.state.data;
      if (!current) {
        return pollingIntervalMs;
      }
      return isSmsTerminalStatus(current.status) ? false : pollingIntervalMs;
    },
  };

  return useQuery(queryOptions);
}
