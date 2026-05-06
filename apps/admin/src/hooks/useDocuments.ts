import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { components } from '@wdock/api-client';

import { useApiClient } from './useApiClient';

export type DocumentOutput = components['schemas']['DocumentOutput'];
export type PaginatedDocumentList = components['schemas']['PaginatedDocumentList'];

export interface DocumentsListParams {
  page: number;
  pageSize: number;
}

export function useDocumentsList(params: DocumentsListParams) {
  const api = useApiClient();
  return useQuery<PaginatedDocumentList>({
    queryKey: ['documents', 'list', params],
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/v1/documents', {
        params: {
          query: { page: params.page, page_size: params.pageSize },
        },
      });
      if (!data) {
        throw new Error(
          (error as { detail?: string } | undefined)?.detail ??
            `HTTP ${response.status} al cargar documentos`,
        );
      }
      // BACKEND-OPENAPI-BUG: drf-spectacular currently types this list endpoint
      // as PaginatedDocumentList[] (array of pages) instead of a single
      // PaginatedDocumentList. The runtime response is the object shape, so we
      // narrow here. Remove the cast once the backend fixes the @extend_schema.
      return data as unknown as PaginatedDocumentList;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useDocument(id: string | undefined) {
  const api = useApiClient();
  return useQuery({
    queryKey: ['documents', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/v1/documents/{id}', {
        params: { path: { id: id as string } },
      });
      if (!data) {
        throw new Error(
          (error as { detail?: string } | undefined)?.detail ??
            `HTTP ${response.status} al cargar el documento`,
        );
      }
      return data;
    },
    staleTime: 30_000,
  });
}
