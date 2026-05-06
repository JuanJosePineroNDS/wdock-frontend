import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebounce } from '../hooks/useDebounce';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces value updates', () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebounce(value, 200), {
      initialProps: { value: 'a' },
    });
    expect(result.current).toBe('a');
    rerender({ value: 'b' });
    expect(result.current).toBe('a');
    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(result.current).toBe('a');
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(result.current).toBe('b');
  });
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reads initial value when storage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('k', 42));
    expect(result.current[0]).toBe(42);
  });

  it('persists updates to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage<number>('counter', 0));
    act(() => result.current[1](7));
    expect(result.current[0]).toBe(7);
    expect(window.localStorage.getItem('counter')).toBe('7');
  });

  it('reads back persisted value on next mount', () => {
    window.localStorage.setItem('greeting', JSON.stringify('hola'));
    const { result } = renderHook(() => useLocalStorage('greeting', 'hello'));
    expect(result.current[0]).toBe('hola');
  });
});

describe('useOnlineStatus', () => {
  it('reflects navigator.onLine and reacts to online/offline events', async () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    await act(async () => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
      window.dispatchEvent(new Event('offline'));
    });
    await waitFor(() => expect(result.current).toBe(false));

    await act(async () => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
      window.dispatchEvent(new Event('online'));
    });
    await waitFor(() => expect(result.current).toBe(true));
  });
});
