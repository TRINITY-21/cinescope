import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProvider, useApp } from './AppContext';

const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;

function makeShow(id, name = `Show ${id}`) {
  return { id, name, image: { medium: '/m.jpg' }, genres: ['Drama'], rating: { average: 8.0 } };
}

function makeMovie(id, title = `Movie ${id}`) {
  return { id, title, poster_path: '/p.jpg', vote_average: 7.5, release_date: '2024-01-01' };
}

describe('AppContext — watchlist (shows)', () => {
  beforeEach(() => localStorage.clear());

  it('adds a show to the watchlist', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.addToWatchlist(makeShow(1)));
    expect(result.current.watchlist).toHaveLength(1);
    expect(result.current.watchlist[0].id).toBe(1);
  });

  it('does not add duplicates', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.addToWatchlist(makeShow(1)));
    act(() => result.current.addToWatchlist(makeShow(1)));
    expect(result.current.watchlist).toHaveLength(1);
  });

  it('removes a show', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.addToWatchlist(makeShow(1)));
    act(() => result.current.addToWatchlist(makeShow(2)));
    act(() => result.current.removeFromWatchlist(1));
    expect(result.current.watchlist.map((s) => s.id)).toEqual([2]);
  });

  it('reports correct membership via isInWatchlist', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.addToWatchlist(makeShow(42)));
    expect(result.current.isInWatchlist(42)).toBe(true);
    expect(result.current.isInWatchlist(99)).toBe(false);
  });

  it('persists across hook unmount/remount via localStorage', () => {
    const first = renderHook(() => useApp(), { wrapper });
    act(() => first.result.current.addToWatchlist(makeShow(7)));
    first.unmount();

    const second = renderHook(() => useApp(), { wrapper });
    expect(second.result.current.isInWatchlist(7)).toBe(true);
  });
});

describe('AppContext — watchlist (movies)', () => {
  beforeEach(() => localStorage.clear());

  it('adds and removes movies separately from shows', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.addMovieToWatchlist(makeMovie(100)));
    expect(result.current.movieWatchlist).toHaveLength(1);
    expect(result.current.isMovieInWatchlist(100)).toBe(true);

    act(() => result.current.removeMovieFromWatchlist(100));
    expect(result.current.movieWatchlist).toHaveLength(0);
  });

  it('dedupes movie additions', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.addMovieToWatchlist(makeMovie(100)));
    act(() => result.current.addMovieToWatchlist(makeMovie(100)));
    expect(result.current.movieWatchlist).toHaveLength(1);
  });
});

describe('AppContext — recently viewed', () => {
  beforeEach(() => localStorage.clear());

  it('inserts at the front of the list', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.addRecentlyViewed(makeShow(1)));
    act(() => result.current.addRecentlyViewed(makeShow(2)));
    expect(result.current.recentlyViewed[0].id).toBe(2);
  });

  it('moves an already-present show to the front (no duplicates)', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.addRecentlyViewed(makeShow(1)));
    act(() => result.current.addRecentlyViewed(makeShow(2)));
    act(() => result.current.addRecentlyViewed(makeShow(1)));
    expect(result.current.recentlyViewed.map((s) => s.id)).toEqual([1, 2]);
  });

  it('caps the recently-viewed list at 20 entries', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    for (let i = 0; i < 30; i++) {
      act(() => result.current.addRecentlyViewed(makeShow(i)));
    }
    expect(result.current.recentlyViewed).toHaveLength(20);
    // Most recent is at the front
    expect(result.current.recentlyViewed[0].id).toBe(29);
  });
});

describe('AppContext — episode tracking', () => {
  beforeEach(() => localStorage.clear());

  it('marks an episode watched and increments stats', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.markEpisodeWatched(1, 101, 42));
    expect(result.current.isEpisodeWatched(1, 101)).toBe(true);
    expect(result.current.stats.totalEpisodesWatched).toBe(1);
    expect(result.current.stats.totalMinutesWatched).toBe(42);
    expect(result.current.stats.firstTracked).toBeTruthy();
  });

  it('unmark reverses both the watched set and stats', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.markEpisodeWatched(1, 101, 42));
    act(() => result.current.unmarkEpisodeWatched(1, 101, 42));
    expect(result.current.isEpisodeWatched(1, 101)).toBe(false);
    expect(result.current.stats.totalEpisodesWatched).toBe(0);
    expect(result.current.stats.totalMinutesWatched).toBe(0);
  });

  it('stats can never go below zero on unmark', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    // Unmark with nothing watched
    act(() => result.current.unmarkEpisodeWatched(1, 101, 42));
    expect(result.current.stats.totalEpisodesWatched).toBe(0);
    expect(result.current.stats.totalMinutesWatched).toBe(0);
  });

  it('marks a full season at once', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.markSeasonWatched(1, [101, 102, 103], 30));
    expect(result.current.stats.totalEpisodesWatched).toBe(3);
    expect(result.current.stats.totalMinutesWatched).toBe(90);
    expect(result.current.isEpisodeWatched(1, 102)).toBe(true);
  });

  it('markSeasonWatched skips episodes already watched (no double-count)', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.markEpisodeWatched(1, 101, 30));
    act(() => result.current.markSeasonWatched(1, [101, 102, 103], 30));
    // 101 was already counted; only 102 + 103 added
    expect(result.current.stats.totalEpisodesWatched).toBe(3);
  });

  it('getShowProgress returns watched, total, and percentage', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.markEpisodeWatched(1, 101, 0));
    act(() => result.current.markEpisodeWatched(1, 102, 0));
    expect(result.current.getShowProgress(1, 4)).toEqual({ watched: 2, total: 4, percentage: 50 });
  });

  it('getShowProgress returns 0% when total is 0 (avoid divide-by-zero)', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.getShowProgress(99, 0).percentage).toBe(0);
  });

  it('clearShowProgress wipes a show and updates stats', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.markEpisodeWatched(1, 101, 0));
    act(() => result.current.markEpisodeWatched(1, 102, 0));
    act(() => result.current.clearShowProgress(1));
    expect(result.current.isEpisodeWatched(1, 101)).toBe(false);
    expect(result.current.stats.totalEpisodesWatched).toBe(0);
  });
});

describe('AppContext — collections', () => {
  beforeEach(() => localStorage.clear());

  it('seeds the four default collections', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const ids = result.current.collections.map((c) => c.id);
    expect(ids).toContain('favorites');
    expect(ids).toContain('watching');
    expect(ids).toContain('completed');
    expect(ids).toContain('plan-to-watch');
  });

  it('adds a show to a collection', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const item = { id: 1, name: 'Show 1', image: {}, genres: [], type: 'show' };
    act(() => result.current.addToCollection('favorites', item));
    expect(result.current.isInCollection('favorites', 1)).toBe(true);
  });

  it('does not add the same id twice', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const item = { id: 1, name: 'Show 1', image: {}, genres: [], type: 'show' };
    act(() => result.current.addToCollection('favorites', item));
    act(() => result.current.addToCollection('favorites', item));
    const col = result.current.collections.find((c) => c.id === 'favorites');
    expect(col.shows).toHaveLength(1);
  });

  it('removes from a collection', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.addToCollection('favorites', { id: 1, name: 'a' }));
    act(() => result.current.removeFromCollection('favorites', 1));
    expect(result.current.isInCollection('favorites', 1)).toBe(false);
  });

  it('createCollection appends a custom collection with prefixed id', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    let newId;
    act(() => { newId = result.current.createCollection('My Mix', '🎵'); });
    expect(newId).toMatch(/^custom-/);
    const created = result.current.collections.find((c) => c.id === newId);
    expect(created.name).toBe('My Mix');
    expect(created.shows).toEqual([]);
  });
});

describe('AppContext — item status (5-state tracker)', () => {
  beforeEach(() => localStorage.clear());

  it('getItemStatus defaults to null when nothing is set', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.getItemStatus('show', 1)).toBeNull();
  });

  it('updateItemStatus stores the status under a kind-prefixed key', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.updateItemStatus('show', 1, 'watching'));
    expect(result.current.getItemStatus('show', 1)).toBe('watching');
    expect(result.current.getItemStatus('movie', 1)).toBeNull(); // namespaced
  });

  it('setting status to null clears it from storage', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.updateItemStatus('show', 1, 'watching'));
    act(() => result.current.updateItemStatus('show', 1, null));
    expect(result.current.getItemStatus('show', 1)).toBeNull();
  });

  it('implicit watchlist default applies when item is in legacy watchlist', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.addToWatchlist(makeShow(5)));
    // No explicit status set — should fall back to 'watchlist'
    expect(result.current.getItemStatus('show', 5)).toBe('watchlist');
  });

  it('itemsByStatus filters across both shows and movies', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.addToWatchlist(makeShow(1)));
    act(() => result.current.addMovieToWatchlist(makeMovie(10)));
    act(() => result.current.updateItemStatus('show', 1, 'watching'));
    act(() => result.current.updateItemStatus('movie', 10, 'watching'));
    const watching = result.current.itemsByStatus('watching');
    expect(watching.shows.map((s) => s.id)).toEqual([1]);
    expect(watching.movies.map((m) => m.id)).toEqual([10]);
  });
});

describe('AppContext — user ratings', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when no rating exists', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.getUserRating('movie', 1)).toBeNull();
  });

  it('stores and retrieves a rating', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.setUserRating('movie', 1, 4.5));
    expect(result.current.getUserRating('movie', 1)).toBe(4.5);
  });

  it('clears a rating when set to null', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.setUserRating('movie', 1, 3));
    act(() => result.current.setUserRating('movie', 1, null));
    expect(result.current.getUserRating('movie', 1)).toBeNull();
  });

  it('keeps show and movie ratings separate', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.setUserRating('show', 1, 5));
    expect(result.current.getUserRating('show', 1)).toBe(5);
    expect(result.current.getUserRating('movie', 1)).toBeNull();
  });
});

describe('AppContext — genre stats', () => {
  beforeEach(() => localStorage.clear());

  it('accumulates view counts per genre', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.trackGenres(['Drama', 'Crime']));
    act(() => result.current.trackGenres(['Drama']));
    expect(result.current.stats.genresWatched).toEqual({ Drama: 2, Crime: 1 });
  });

  it('does nothing for null / empty genres array', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.trackGenres(null));
    act(() => result.current.trackGenres([]));
    expect(result.current.stats.genresWatched).toEqual({});
  });
});

describe('AppContext — watch history helpers', () => {
  beforeEach(() => localStorage.clear());

  it('counts today\'s episode views', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.markEpisodeWatched(1, 101, 0));
    act(() => result.current.markEpisodeWatched(1, 102, 0));
    expect(result.current.getTodayEpisodeCount()).toBe(2);
  });

  it('getWeekActivity returns 7 days with day labels', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const week = result.current.getWeekActivity();
    expect(week).toHaveLength(7);
    expect(week[0]).toHaveProperty('day');
    expect(week[0]).toHaveProperty('count');
    expect(week[0]).toHaveProperty('date');
  });
});
