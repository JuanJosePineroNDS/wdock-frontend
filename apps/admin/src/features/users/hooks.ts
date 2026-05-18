import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapError, type components } from '@wdock/api-client';

import { useApiClient } from '@/hooks/useApiClient';

export type UserListItem = components['schemas']['UserList'];
export type PaginatedUserList = components['schemas']['PaginatedUserListList'];
export type UserCreateRequest = components['schemas']['UserCreateRequest'];
export type UserCreate = components['schemas']['UserCreate'];
export type UserUpdate = components['schemas']['UserUpdate'];
export type PatchedUserUpdateRequest = components['schemas']['PatchedUserUpdateRequest'];
export type ResetPasswordRequest = components['schemas']['ResetPasswordRequest'];
export type AuthRole = components['schemas']['AuthRole'];

/** Human-readable labels for the six AuthRole values from the backend. */
export const ROLE_OPTIONS: ReadonlyArray<{ value: AuthRole; label: string }> = [
  { value: 'SUPERADMIN', label: 'Superadmin' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'OPERADOR', label: 'Operador' },
  { value: 'INTEGRACION_ERP', label: 'Integración ERP' },
  { value: 'AUDITOR', label: 'Auditor' },
  { value: 'SOLO_LECTURA', label: 'Sólo lectura' },
];

export interface UseUsersParams {
  page?: number;
  search?: string;
  ordering?: string;
  /**
   * When true include inactive users in the response. The backend implements
   * this as `?show_inactive=true`; the active-only default is preserved.
   */
  showInactive?: boolean;
  /** When false the query is not fired (e.g. caller is not SUPERADMIN). */
  enabled?: boolean;
}

export function useUsers(params: UseUsersParams = {}) {
  const client = useApiClient();
  return useQuery({
    queryKey: ['users', params],
    enabled: params.enabled ?? true,
    queryFn: async () => {
      const { data, error, response } = await client.GET('/api/v1/users/', {
        params: {
          query: {
            page: params.page,
            search: params.search,
            ordering: params.ordering ?? 'email',
            ...(params.showInactive
              ? ({ show_inactive: true } as Record<string, unknown>)
              : {}),
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

export function useCreateUser() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<UserCreate, Error, UserCreateRequest>({
    mutationFn: async (body) => {
      const { data, error, response } = await client.POST('/api/v1/users/', { body });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<UserUpdate, Error, PatchedUserUpdateRequest>({
    mutationFn: async (body) => {
      const { data, error, response } = await client.PATCH('/api/v1/users/{id}/', {
        params: { path: { id } },
        body,
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeactivateUser(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<UserListItem, Error, void>({
    mutationFn: async () => {
      const { data, error, response } = await client.POST('/api/v1/users/{id}/deactivate/', {
        params: { path: { id } },
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useActivateUser(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<UserListItem, Error, void>({
    mutationFn: async () => {
      const { data, error, response } = await client.POST('/api/v1/users/{id}/activate/', {
        params: { path: { id } },
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResetUserPassword(id: string) {
  const client = useApiClient();
  return useMutation<void, Error, ResetPasswordRequest>({
    mutationFn: async (body) => {
      const { error, response } = await client.POST('/api/v1/users/{id}/reset-password/', {
        params: { path: { id } },
        body,
      });
      if (error) {
        throw await unwrapError(response);
      }
    },
  });
}
