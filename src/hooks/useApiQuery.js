import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchApi } from '../api/tvmaze';

/**
 * Fetch JSON with safe cancellation on URL change / unmount.
 * Uses a cancelled flag (not abort-before-fetch) so rate-limiter waits don't strand isLoading.
 */
export function useApiQuery(url, options = {}) {
  const { enabled = true, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(Boolean(url && enabled));
  const [error, setError] = useState(null);
  const [refetchCount, setRefetchCount] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!url || !enabled) {
      setData(initialData);
      setIsLoading(false);
      setError(null);
      return undefined;
    }

    const requestId = ++requestIdRef.current;
    let cancelled = false;

    setIsLoading(true);
    setError(null);
    setData(initialData);

    (async () => {
      try {
        const result = await fetchApi(url);
        if (cancelled || requestId !== requestIdRef.current) return;
        setData(result);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        if (cancelled || requestId !== requestIdRef.current) return;
        setError(err);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, enabled, refetchCount]);

  const refetch = useCallback(() => {
    setRefetchCount((n) => n + 1);
  }, []);

  return { data, isLoading, error, refetch };
}
