import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components } from '@app/api-client';

import { useApiClient } from '@/hooks/useApiClient';

export type Note = components['schemas']['Note'];
export type NoteRequest = components['schemas']['NoteRequest'];
export type PatchedNoteRequest = components['schemas']['PatchedNoteRequest'];

export interface NotesQuery {
  search?: string;
  pinned?: boolean;
  page?: number;
  ordering?: string;
}

const notesKey = {
  all: ['notes'] as const,
  list: (params: NotesQuery) => ['notes', 'list', params] as const,
  detail: (id: string) => ['notes', 'detail', id] as const,
};

export function useNotes(params: NotesQuery = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: notesKey.list(params),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/notes/', {
        params: { query: params },
      });
      if (error || !data) throw new Error('Failed to load notes');
      return data;
    },
  });
}

export function useNote(id: string | undefined) {
  const api = useApiClient();
  return useQuery({
    queryKey: notesKey.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/notes/{id}/', {
        params: { path: { id: id! } },
      });
      if (error || !data) throw new Error('Failed to load note');
      return data;
    },
  });
}

export function useCreateNote() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: NoteRequest) => {
      const { data, error } = await api.POST('/api/v1/notes/', { body });
      if (error || !data) throw new Error('Failed to create note');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKey.all });
    },
  });
}

export function useUpdateNote() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: PatchedNoteRequest }) => {
      const { data, error } = await api.PATCH('/api/v1/notes/{id}/', {
        params: { path: { id } },
        body,
      });
      if (error || !data) throw new Error('Failed to update note');
      return data;
    },
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: notesKey.all });
      queryClient.setQueryData(notesKey.detail(note.id), note);
    },
  });
}

export function useDeleteNote() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error, response } = await api.DELETE('/api/v1/notes/{id}/', {
        params: { path: { id } },
      });
      if (error || (response.status !== 204 && response.status !== 200)) {
        throw new Error('Failed to delete note');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKey.all });
    },
  });
}
