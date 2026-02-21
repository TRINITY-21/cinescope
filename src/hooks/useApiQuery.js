import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchApi } from '../api/tvmaze';

export function useApiQuery(url, options = {}) {
  const { enabled = true, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!!url && enabled);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchApi(url, { signal: controller.signal });
      if (!controller.signal.aborted) {
        setData(result);
        setIsLoading(false);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        if (err.name !== 'AbortError') {
          setError(err);
          setIsLoading(false);
        }
      }
    }
  }, [url, enabled]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
