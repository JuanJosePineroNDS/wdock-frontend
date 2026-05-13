import { useQuery } from '@tanstack/react-query';

import { unwrapError, type components } from '@wdock/api-client';

import { useApiClient } from '@/hooks/useApiClient';

export type ActivityLog = components['schemas']['ActivityLog'];
export type PaginatedActivityLogList = components['schemas']['PaginatedActivityLogList'];

export interface UseActivityLogParams {
  page?: number;
  accion?: string;
  recurso_tipo?: string;
  recurso_id?: string;
  user_id?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  ordering?: string;
}

export function useActivityLog(params: UseActivityLogParams = {}) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['activity-log', params],
    queryFn: async () => {
      const { data, error, response } = await client.GET('/api/v1/activity-log/', {
        params: {
          query: {
            page: params.page,
            accion: params.accion,
            recurso_tipo: params.recurso_tipo,
            recurso_id: params.recurso_id,
            user_id: params.user_id,
            from_date: params.from_date,
            to_date: params.to_date,
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
