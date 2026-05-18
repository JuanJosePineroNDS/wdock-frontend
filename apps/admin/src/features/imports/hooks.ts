import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';

import { unwrapError, type components } from '@wdock/api-client';

import { useApiClient } from '@/hooks/useApiClient';

export type ExcelImport = components['schemas']['ExcelImport'];
export type PaginatedExcelImportList = components['schemas']['PaginatedExcelImportList'];
export type ExcelImportStatus = components['schemas']['ExcelImportStatusEnum'];

const TERMINAL_STATUSES: ReadonlySet<ExcelImportStatus> = new Set(['COMPLETED', 'FAILED']);

export function isTerminalStatus(status: ExcelImportStatus | undefined): boolean {
  return status !== undefined && TERMINAL_STATUSES.has(status);
}

export interface UseImportsParams {
  page?: number;
}

export function useImports(params: UseImportsParams = {}) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['imports', params],
    queryFn: async () => {
      const { data, error, response } = await client.GET('/api/v1/imports/', {
        params: { query: { page: params.page } },
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
  });
}

export interface UseImportOptions {
  /** Polling interval in ms while the import is in a non-terminal state. */
  pollingIntervalMs?: number;
  enabled?: boolean;
}

export function useImport(id: string | undefined, options: UseImportOptions = {}) {
  const client = useApiClient();
  const pollingIntervalMs = options.pollingIntervalMs ?? 2000;

  const queryOptions: UseQueryOptions<
    ExcelImport,
    Error,
    ExcelImport,
    ['imports', string | undefined]
  > = {
    queryKey: ['imports', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Missing import id');
      }
      const { data, error, response } = await client.GET('/api/v1/imports/{id}/', {
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
      return isTerminalStatus(current.status) ? false : pollingIntervalMs;
    },
  };

  return useQuery(queryOptions);
}

export interface UploadExcelInput {
  file: File;
}

export function useUploadExcel() {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation<ExcelImport, Error, UploadExcelInput>({
    mutationFn: async ({ file }) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data, error, response } = await client.POST('/api/v1/imports/excel/', {
        body: formData as unknown as { file: string },
        bodySerializer: () => formData,
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imports'] });
    },
  });
}
