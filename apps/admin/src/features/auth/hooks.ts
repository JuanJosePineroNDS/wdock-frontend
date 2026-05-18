import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapError, type components, type User } from '@wdock/api-client';

import { useApiClient } from '@/hooks/useApiClient';
import { useAuthStore } from '@/stores/authStore';

export type ChangePasswordPayload = components['schemas']['ChangePasswordRequest'];
export type UpdateMePayload = components['schemas']['PatchedMeUpdateRequest'];

const ME_QUERY_KEY = ['auth', 'me'] as const;

/**
 * Refetches the current user. The auth bootstrap already populates the store;
 * this hook simply keeps the profile screen in sync with the server after
 * mutations and on reloads.
 */
export function useMe() {
  const client = useApiClient();
  return useQuery<User, Error>({
    queryKey: [...ME_QUERY_KEY],
    queryFn: async () => {
      const { data, error, response } = await client.GET('/api/v1/auth/me');
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
  });
}

export function useUpdateMe() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation<User, Error, UpdateMePayload>({
    mutationFn: async (body) => {
      const { data, error, response } = await client.PATCH('/api/v1/auth/me', { body });
      if (error || !data) {
        throw await unwrapError(response);
      }
      return data;
    },
    onSuccess: (data) => {
      setSession(data);
      queryClient.setQueryData([...ME_QUERY_KEY], data);
    },
  });
}

export function useChangePassword() {
  const client = useApiClient();
  return useMutation<void, Error, ChangePasswordPayload>({
    mutationFn: async (body) => {
      const { error, response } = await client.POST('/api/v1/auth/me/change-password', {
        body,
      });
      if (error) {
        throw await unwrapError(response);
      }
    },
  });
}
