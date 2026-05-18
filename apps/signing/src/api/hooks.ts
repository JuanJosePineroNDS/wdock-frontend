import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';

import { fetchSigningSession, SigningApiError, submitSignature } from './client';
import type {
  SigningSession,
  SigningSessionState,
  SubmitSignaturePayload,
  SubmitSignatureResponse,
} from './types';

export interface UseSigningSessionResult {
  state: SigningSessionState;
  data: SigningSession | null;
  query: UseQueryResult<SigningSession, SigningApiError>;
}

function mapStatusToState(error: SigningApiError | null, hasData: boolean): SigningSessionState {
  if (!error) {
    return hasData ? 'signable' : 'loading';
  }
  if (error.status === 404) return 'invalid';
  if (error.status === 409) return 'already_signed';
  if (error.status === 410) return 'expired';
  return 'error';
}

export function useSigningSession(token: string | undefined): UseSigningSessionResult {
  const query = useQuery<SigningSession, SigningApiError>({
    queryKey: ['signing-session', token],
    queryFn: () => {
      if (!token) {
        throw new SigningApiError('Token requerido', 404, null);
      }
      return fetchSigningSession(token);
    },
    enabled: Boolean(token),
    retry: false,
  });

  let state: SigningSessionState;
  if (!token) {
    state = 'invalid';
  } else if (query.isLoading) {
    state = 'loading';
  } else {
    state = mapStatusToState(query.error ?? null, Boolean(query.data));
  }

  return {
    state,
    data: query.data ?? null,
    query,
  };
}

export type UseSubmitSignatureResult = UseMutationResult<
  SubmitSignatureResponse,
  SigningApiError,
  SubmitSignaturePayload
>;

export function useSubmitSignature(token: string | undefined): UseSubmitSignatureResult {
  return useMutation<SubmitSignatureResponse, SigningApiError, SubmitSignaturePayload>({
    mutationFn: (payload) => {
      if (!token) {
        throw new SigningApiError('Token requerido', 404, null);
      }
      return submitSignature(token, payload);
    },
  });
}
