import { useCallback, useEffect, useState } from 'react';

type Setter<T> = (value: T | ((prev: T) => T)) => void;

function readValue<T>(key: string, initial: T): T {
  if (typeof window === 'undefined') return initial;
  try {
    const raw = window.localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : initial;
  } catch {
    return initial;
  }
}

export function useLocalStorage<T>(key: string, initial: T): [T, Setter<T>] {
  const [value, setValue] = useState<T>(() => readValue(key, initial));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota errors and serialization issues are ignored on purpose.
    }
  }, [key, value]);

  const set = useCallback<Setter<T>>(
    (next) => {
      setValue((prev) =>
        typeof next === 'function' ? (next as (p: T) => T)(prev) : next,
      );
    },
    [],
  );

  return [value, set];
}
