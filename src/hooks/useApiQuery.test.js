import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useApiQuery } from './useApiQuery';

vi.mock('../api/tvmaze', () => ({
  fetchApi: vi.fn(),
}));

import { fetchApi } from '../api/tvmaze';

describe('useApiQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads data for the current URL', async () => {
    fetchApi.mockResolvedValueOnce({ name: 'Jane' });

    const { result } = renderHook(() => useApiQuery('https://api.tvmaze.com/people/1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ name: 'Jane' });
    expect(result.current.error).toBeNull();
  });

  it('ignores stale results after the URL changes', async () => {
    let resolveFirst;
    const first = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    fetchApi
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce({ name: 'B' });

    const { result, rerender } = renderHook(({ url }) => useApiQuery(url), {
      initialProps: { url: 'https://api.tvmaze.com/people/1' },
    });

    rerender({ url: 'https://api.tvmaze.com/people/2' });

    await waitFor(() => {
      expect(result.current.data).toEqual({ name: 'B' });
    });

    resolveFirst({ name: 'A' });

    await waitFor(() => {
      expect(result.current.data).toEqual({ name: 'B' });
    });
  });

  it('clears loading when unmounted before fetch resolves', async () => {
    let resolveFetch;
    fetchApi.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { result, unmount } = renderHook(() => useApiQuery('https://api.tvmaze.com/people/9'));

    expect(result.current.isLoading).toBe(true);
    unmount();

    resolveFetch({ name: 'Late' });

    fetchApi.mockResolvedValueOnce({ name: 'New mount' });

    const { result: mounted } = renderHook(() => useApiQuery('https://api.tvmaze.com/people/9'));

    await waitFor(() => {
      expect(mounted.current.isLoading).toBe(false);
    });

    expect(mounted.current.data).toEqual({ name: 'New mount' });
  });
});
