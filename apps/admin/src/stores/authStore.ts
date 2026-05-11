import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@wdock/api-client';

export type { User };

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setSession: (user: User) => void;
  clearSession: () => void;
}

export const AUTH_SESSION_STORAGE_KEY = 'wdock.auth.session';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setSession: (user) => set({ user, isAuthenticated: true }),
      clearSession: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: AUTH_SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist the rehydratable identity; the auth flags are derived on bootstrap.
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
