const ACCESS_KEY = 'wdock.auth.access';
const REFRESH_KEY = 'wdock.auth.refresh';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getStorage(): StorageLike | null {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }
  return window.localStorage;
}

export interface AuthStorage {
  getAccess(): string | null;
  getRefresh(): string | null;
  setTokens(access: string, refresh: string): void;
  setAccess(access: string): void;
  clear(): void;
}

export function createAuthStorage(storage: StorageLike | null = getStorage()): AuthStorage {
  return {
    getAccess() {
      return storage?.getItem(ACCESS_KEY) ?? null;
    },
    getRefresh() {
      return storage?.getItem(REFRESH_KEY) ?? null;
    },
    setTokens(access, refresh) {
      storage?.setItem(ACCESS_KEY, access);
      storage?.setItem(REFRESH_KEY, refresh);
    },
    setAccess(access) {
      storage?.setItem(ACCESS_KEY, access);
    },
    clear() {
      storage?.removeItem(ACCESS_KEY);
      storage?.removeItem(REFRESH_KEY);
    },
  };
}

export const authStorage: AuthStorage = createAuthStorage();
