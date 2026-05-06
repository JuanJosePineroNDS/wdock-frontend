import { describe, expect, it } from 'vitest';

import { createAuthStorage, type StorageLike } from '../auth-storage';

function memoryStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe('authStorage', () => {
  it('returns null when no tokens stored', () => {
    const storage = createAuthStorage(memoryStorage());
    expect(storage.getAccess()).toBeNull();
    expect(storage.getRefresh()).toBeNull();
  });

  it('persists access and refresh tokens', () => {
    const storage = createAuthStorage(memoryStorage());
    storage.setTokens('access-1', 'refresh-1');
    expect(storage.getAccess()).toBe('access-1');
    expect(storage.getRefresh()).toBe('refresh-1');
  });

  it('updates access token without touching refresh', () => {
    const storage = createAuthStorage(memoryStorage());
    storage.setTokens('access-1', 'refresh-1');
    storage.setAccess('access-2');
    expect(storage.getAccess()).toBe('access-2');
    expect(storage.getRefresh()).toBe('refresh-1');
  });

  it('clears both tokens', () => {
    const storage = createAuthStorage(memoryStorage());
    storage.setTokens('access', 'refresh');
    storage.clear();
    expect(storage.getAccess()).toBeNull();
    expect(storage.getRefresh()).toBeNull();
  });

  it('is a no-op when no storage is available', () => {
    const storage = createAuthStorage(null);
    storage.setTokens('a', 'b');
    expect(storage.getAccess()).toBeNull();
    expect(storage.getRefresh()).toBeNull();
    expect(() => storage.clear()).not.toThrow();
  });
});
