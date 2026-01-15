/**
 * Lazy loading utilities for non-critical data
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Options for lazy loading
 */
interface LazyLoadOptions<T> {
  /** Function to fetch data */
  fetcher: () => Promise<T>;
  /** Initial data value */
  initialData?: T;
  /** Delay before fetching (ms) */
  delay?: number;
  /** Whether to fetch on mount */
  fetchOnMount?: boolean;
  /** Enable for non-critical data */
  isLowPriority?: boolean;
}

/**
 * Result of lazy loading hook
 */
interface LazyLoadResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for lazy loading non-critical data
 * Uses requestIdleCallback when available for low-priority fetches
 */
export function useLazyLoad<T>({
  fetcher,
  initialData,
  delay = 0,
  fetchOnMount = true,
  isLowPriority = false,
}: LazyLoadOptions<T>): LazyLoadResult<T> {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetcher]);

  const scheduleFetch = useCallback(() => {
    const doFetch = () => {
      if (delay > 0) {
        setTimeout(fetchData, delay);
      } else {
        fetchData();
      }
    };

    // Use requestIdleCallback for low-priority fetches when available
    if (isLowPriority && 'requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: IdleRequestCallback) => number }).requestIdleCallback(doFetch);
    } else {
      doFetch();
    }
  }, [fetchData, delay, isLowPriority]);

  useEffect(() => {
    mountedRef.current = true;

    if (fetchOnMount) {
      scheduleFetch();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [fetchOnMount, scheduleFetch]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}

/**
 * Hook for intersection observer based lazy loading
 * Only fetches data when element is visible
 */
export function useVisibilityLazyLoad<T>(
  fetcher: () => Promise<T>,
  options?: { threshold?: number; rootMargin?: string }
): [React.RefObject<HTMLDivElement>, LazyLoadResult<T>] {
  const [data, setData] = useState<T | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const ref = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current || hasLoaded) return;
    
    setIsLoading(true);
    setError(null);
    setHasLoaded(true);

    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetcher, hasLoaded]);

  useEffect(() => {
    mountedRef.current = true;
    
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          fetchData();
        }
      },
      {
        threshold: options?.threshold ?? 0.1,
        rootMargin: options?.rootMargin ?? '50px',
      }
    );

    observer.observe(element);

    return () => {
      mountedRef.current = false;
      observer.disconnect();
    };
  }, [fetchData, hasLoaded, options?.threshold, options?.rootMargin]);

  const refetch = useCallback(async () => {
    setHasLoaded(false);
    await fetchData();
  }, [fetchData]);

  return [ref, { data, isLoading, error, refetch }];
}

/**
 * Prefetch data in the background
 * Useful for data that will likely be needed soon
 */
const prefetchCache = new Map<string, { data: unknown; timestamp: number }>();
const PREFETCH_TTL = 5 * 60 * 1000; // 5 minutes

export async function prefetchData<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<void> {
  // Check if already cached and fresh
  const cached = prefetchCache.get(key);
  if (cached && Date.now() - cached.timestamp < PREFETCH_TTL) {
    return;
  }

  try {
    const data = await fetcher();
    prefetchCache.set(key, { data, timestamp: Date.now() });
  } catch {
    // Silently fail for prefetch
  }
}

export function getPrefetchedData<T>(key: string): T | undefined {
  const cached = prefetchCache.get(key);
  if (cached && Date.now() - cached.timestamp < PREFETCH_TTL) {
    return cached.data as T;
  }
  prefetchCache.delete(key);
  return undefined;
}

export function clearPrefetchCache(): void {
  prefetchCache.clear();
}

/**
 * Debounced fetch hook for search inputs
 */
export function useDebouncedFetch<T>(
  fetcher: (query: string) => Promise<T>,
  delay = 300
): {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  search: (query: string) => void;
} {
  const [data, setData] = useState<T | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const search = useCallback(
    (query: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setIsLoading(true);
      setError(null);

      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await fetcher(query);
          if (mountedRef.current) {
            setData(result);
          }
        } catch (err) {
          if (mountedRef.current) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
        } finally {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        }
      }, delay);
    },
    [fetcher, delay]
  );

  return { data, isLoading, error, search };
}
