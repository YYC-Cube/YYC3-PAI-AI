/**
 * file: useDebounce.ts
 * description: useDebounce Hook
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-04-01
 * updated: 2026-04-01
 * status: active
 * tags: [hook],hook
 */

import { useState, useEffect, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number,
  options?: { leading?: boolean }
): T & { cancel: () => void } {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const argsRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = ((...args: Parameters<T>) => {
    argsRef.current = args;

    if (options?.leading && !timeoutRef.current) {
      callback(...args);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (!options?.leading && argsRef.current) {
        callback(...argsRef.current);
      }
      timeoutRef.current = null;
    }, delay);
  }) as T & { cancel: () => void };

  debouncedCallback.cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return debouncedCallback;
}
