import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

/**
 * @typedef {'show' | 'movie'} Kind
 *
 * @typedef {'watching' | 'watched' | 'watchlist' | 'paused' | 'dropped'} ItemStatus
 *
 * @typedef {Object} Show
 *   Subset of the TVMaze show payload we persist locally. Only the fields
 *   the UI needs to render cards/lists are stored — never the full episode list.
 * @property {number} id
 * @property {string} name
 * @property {{ medium?: string, original?: string }} [image]
 * @property {string[]} [genres]
 * @property {{ average?: number }} [rating]
 *
 * @typedef {Object} Movie
 *   Subset of the TMDB movie payload we persist locally.
 * @property {number} id
 * @property {string} title
 * @property {string} [poster_path]
 * @property {number} [vote_average]
 * @property {string} [release_date]
 *
 * @typedef {Object} Collection
 * @property {string} id
 *   Built-in ids are static slugs (`favorites`, `watching`, …). User-created
 *   ids use the `custom-${timestamp}` prefix so we can tell them apart in
 *   `deleteCollection`.
 * @property {string} name
 * @property {string} icon
 * @property {Array<Show & { type?: Kind }>} shows
 *
 * @typedef {Object} WatchHistoryEntry
 * @property {string} date     ISO date (YYYY-MM-DD)
 * @property {number} showId
 * @property {number} episodeId
 *
 * @typedef {Object} Stats
 * @property {number} totalEpisodesWatched
 * @property {number} totalMinutesWatched
 * @property {Record<string, number>} genresWatched
 * @property {string|null} firstTracked
 *
 * @typedef {Object} ShowProgress
 * @property {number} watched
 * @property {number} total
 * @property {number} percentage   0-100
 *
 * @typedef {Object} AppContextValue
 * @property {Show[]} watchlist
 * @property {(show: Show) => void} addToWatchlist
 * @property {(showId: number) => void} removeFromWatchlist
 * @property {(showId: number) => boolean} isInWatchlist
 * @property {Movie[]} movieWatchlist
 * @property {(movie: Movie) => void} addMovieToWatchlist
 * @property {(movieId: number) => void} removeMovieFromWatchlist
 * @property {(movieId: number) => boolean} isMovieInWatchlist
 * @property {Show[]} recentlyViewed
 * @property {(show: Show) => void} addRecentlyViewed
 * @property {Record<number, number[]>} watchedEpisodes
 * @property {(showId: number, episodeId: number, runtime?: number) => void} markEpisodeWatched
 * @property {(showId: number, episodeId: number, runtime?: number) => void} unmarkEpisodeWatched
 * @property {(showId: number, episodeId: number) => boolean} isEpisodeWatched
 * @property {(showId: number, totalEpisodes: number) => ShowProgress} getShowProgress
 * @property {(showId: number, episodeIds: number[], runtime?: number) => void} markSeasonWatched
 * @property {(showId: number) => void} clearShowProgress
 * @property {WatchHistoryEntry[]} watchHistory
 * @property {() => { current: number, best: number }} getWatchStreak
 * @property {() => number} getTodayEpisodeCount
 * @property {() => Array<{ date: string, day: string, count: number }>} getWeekActivity
 * @property {Collection[]} collections
 * @property {(collectionId: string, item: Show | Movie) => void} addToCollection
 * @property {(collectionId: string, showId: number) => void} removeFromCollection
 * @property {(collectionId: string, showId: number) => boolean} isInCollection
 * @property {(name: string, icon?: string) => string} createCollection
 * @property {(collectionId: string) => void} deleteCollection
 * @property {Stats} stats
 * @property {(genres: string[]) => void} trackGenres
 * @property {Record<string, ItemStatus>} itemStatus
 * @property {(kind: Kind, id: number) => ItemStatus | null} getItemStatus
 * @property {(kind: Kind, id: number, status: ItemStatus | null) => void} updateItemStatus
 * @property {(status: ItemStatus) => { shows: Show[], movies: Movie[] }} itemsByStatus
 * @property {Record<string, number>} userRatings
 * @property {(kind: Kind, id: number) => number | null} getUserRating
 * @property {(kind: Kind, id: number, rating: number | null) => void} setUserRating
 */

/** @type {React.Context<AppContextValue | undefined>} */
const AppContext = createContext();

export function AppProvider({ children }) {
  const [watchlist, setWatchlist] = useLocalStorage('cinescope-watchlist', []);
  const [recentlyViewed, setRecent] = useLocalStorage('cinescope-recent', []);
  const [watchedEpisodes, setWatchedEpisodes] = useLocalStorage('cinescope-watched', {});
  const [collections, setCollections] = useLocalStorage('cinescope-collections', [
    { id: 'favorites', name: 'Favorites', icon: '⭐', shows: [] },
    { id: 'watching', name: 'Currently Watching', icon: '▶️', shows: [] },
    { id: 'completed', name: 'Completed', icon: '✅', shows: [] },
    { id: 'plan-to-watch', name: 'Plan to Watch', icon: '📋', shows: [] },
  ]);
  const [movieWatchlist, setMovieWatchlist] = useLocalStorage('cinescope-movie-watchlist', []);
  // 5-state per-item tracking layered on top of the existing watchlists.
  //   key = `${kind}-${id}`   where kind ∈ 'show' | 'movie'
  //   value = 'watching' | 'watched' | 'watchlist' | 'paused' | 'dropped'
  // Anything in `watchlist`/`movieWatchlist` defaults to 'watchlist' when absent here.
  const [itemStatus, setItemStatus] = useLocalStorage('bynge-item-status', {});
  // User ratings, half-star precision (0.5 - 5.0 scale).
  //   key = `${kind}-${id}`, value = number with 0.5 steps
  const [userRatings, setUserRatings] = useLocalStorage('bynge-user-ratings', {});
  const [watchHistory, setWatchHistory] = useLocalStorage('cinescope-watch-history', []);
  const [stats, setStats] = useLocalStorage('cinescope-stats', {
    totalEpisodesWatched: 0,
    totalMinutesWatched: 0,
    genresWatched: {},
    firstTracked: null,
  });

  // Watchlist
  const addToWatchlist = useCallback((show) => {
    setWatchlist((prev) => {
      if (prev.some((s) => s.id === show.id)) return prev;
      return [{ id: show.id, name: show.name, image: show.image, genres: show.genres, rating: show.rating }, ...prev];
    });
  }, [setWatchlist]);

  const removeFromWatchlist = useCallback((showId) => {
    setWatchlist((prev) => prev.filter((s) => s.id !== showId));
  }, [setWatchlist]);

  const isInWatchlist = useCallback((showId) => {
    return watchlist.some((s) => s.id === showId);
  }, [watchlist]);

  // Movie watchlist
  const addMovieToWatchlist = useCallback((movie) => {
    setMovieWatchlist((prev) => {
      if (prev.some((m) => m.id === movie.id)) return prev;
      return [{ id: movie.id, title: movie.title, poster_path: movie.poster_path, vote_average: movie.vote_average, release_date: movie.release_date }, ...prev];
    });
  }, [setMovieWatchlist]);

  const removeMovieFromWatchlist = useCallback((movieId) => {
    setMovieWatchlist((prev) => prev.filter((m) => m.id !== movieId));
  }, [setMovieWatchlist]);

  const isMovieInWatchlist = useCallback((movieId) => {
    return movieWatchlist.some((m) => m.id === movieId);
  }, [movieWatchlist]);

  // Recently viewed
  const addRecentlyViewed = useCallback((show) => {
    setRecent((prev) => {
      const filtered = prev.filter((s) => s.id !== show.id);
      return [{ id: show.id, name: show.name, image: show.image, genres: show.genres, rating: show.rating }, ...filtered].slice(0, 20);
    });
  }, [setRecent]);

  // Episode tracking
  const markEpisodeWatched = useCallback((showId, episodeId, runtime = 0) => {
    setWatchedEpisodes((prev) => {
      const showEps = new Set(prev[showId] || []);
      showEps.add(episodeId);
      return { ...prev, [showId]: [...showEps] };
    });
    setStats((prev) => ({
      ...prev,
      totalEpisodesWatched: (prev.totalEpisodesWatched || 0) + 1,
      totalMinutesWatched: (prev.totalMinutesWatched || 0) + (runtime || 0),
      firstTracked: prev.firstTracked || new Date().toISOString(),
    }));
    const today = new Date().toISOString().slice(0, 10);
    setWatchHistory((prev) => [...prev, { date: today, showId, episodeId }]);
  }, [setWatchedEpisodes, setStats, setWatchHistory]);

  const unmarkEpisodeWatched = useCallback((showId, episodeId, runtime = 0) => {
    setWatchedEpisodes((prev) => {
      const showEps = new Set(prev[showId] || []);
      showEps.delete(episodeId);
      return { ...prev, [showId]: [...showEps] };
    });
    setStats((prev) => ({
      ...prev,
      totalEpisodesWatched: Math.max(0, (prev.totalEpisodesWatched || 0) - 1),
      totalMinutesWatched: Math.max(0, (prev.totalMinutesWatched || 0) - (runtime || 0)),
    }));
    setWatchHistory((prev) => {
      const idx = prev.findLastIndex((e) => e.showId === showId && e.episodeId === episodeId);
      if (idx === -1) return prev;
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  }, [setWatchedEpisodes, setStats, setWatchHistory]);

  const isEpisodeWatched = useCallback((showId, episodeId) => {
    return (watchedEpisodes[showId] || []).includes(episodeId);
  }, [watchedEpisodes]);

  const getShowProgress = useCallback((showId, totalEpisodes) => {
    const watched = (watchedEpisodes[showId] || []).length;
    return {
      watched,
      total: totalEpisodes,
      percentage: totalEpisodes > 0 ? Math.round((watched / totalEpisodes) * 100) : 0,
    };
  }, [watchedEpisodes]);

  const markSeasonWatched = useCallback((showId, episodeIds, runtime = 0) => {
    const today = new Date().toISOString().slice(0, 10);
    setWatchedEpisodes((prev) => {
      const showEps = new Set(prev[showId] || []);
      const newIds = [];
      episodeIds.forEach((id) => {
        if (!showEps.has(id)) {
          showEps.add(id);
          newIds.push(id);
        }
      });
      if (newIds.length > 0) {
        setStats((p) => ({
          ...p,
          totalEpisodesWatched: (p.totalEpisodesWatched || 0) + newIds.length,
          totalMinutesWatched: (p.totalMinutesWatched || 0) + (runtime * newIds.length),
          firstTracked: p.firstTracked || new Date().toISOString(),
        }));
        setWatchHistory((h) => [...h, ...newIds.map((id) => ({ date: today, showId, episodeId: id }))]);
      }
      return { ...prev, [showId]: [...showEps] };
    });
  }, [setWatchedEpisodes, setStats, setWatchHistory]);

  // Collections
  const addToCollection = useCallback((collectionId, item) => {
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id !== collectionId) return c;
        if (c.shows.some((s) => s.id === item.id)) return c;
        const entry = { id: item.id, name: item.name, image: item.image, genres: item.genres, type: item.type || 'show' };
        return { ...c, shows: [entry, ...c.shows] };
      })
    );
  }, [setCollections]);

  const removeFromCollection = useCallback((collectionId, showId) => {
    setCollections((prev) =>
      prev.map((c) => c.id === collectionId ? { ...c, shows: c.shows.filter((s) => s.id !== showId) } : c)
    );
  }, [setCollections]);

  const isInCollection = useCallback((collectionId, showId) => {
    const col = collections.find((c) => c.id === collectionId);
    return col?.shows.some((s) => s.id === showId) || false;
  }, [collections]);

  const createCollection = useCallback((name, icon = '📁') => {
    const id = `custom-${Date.now()}`;
    setCollections((prev) => [...prev, { id, name, icon, shows: [] }]);
    return id;
  }, [setCollections]);

  const deleteCollection = useCallback((collectionId) => {
    setCollections((prev) => prev.filter((c) => !c.id.startsWith('custom-') || c.id !== collectionId));
  }, [setCollections]);

  // Genre stats tracking
  const trackGenres = useCallback((genres) => {
    if (!genres || genres.length === 0) return;
    setStats((prev) => {
      const genresWatched = { ...prev.genresWatched };
      genres.forEach((g) => { genresWatched[g] = (genresWatched[g] || 0) + 1; });
      return { ...prev, genresWatched };
    });
  }, [setStats]);

  const clearShowProgress = useCallback((showId) => {
    setWatchedEpisodes((prev) => {
      const removedCount = (prev[showId] || []).length;
      if (removedCount > 0) {
        setStats((p) => ({
          ...p,
          totalEpisodesWatched: Math.max(0, (p.totalEpisodesWatched || 0) - removedCount),
        }));
      }
      const next = { ...prev };
      delete next[showId];
      return next;
    });
  }, [setWatchedEpisodes, setStats]);

  // Watch streak helpers
  const getWatchStreak = useCallback(() => {
    if (watchHistory.length === 0) return { current: 0, best: 0 };
    const days = new Set(watchHistory.map((e) => e.date));
    const sortedDays = [...days].sort().reverse();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // Current streak — must include today or yesterday
    let current = 0;
    if (days.has(today) || days.has(yesterday)) {
      let checkDate = new Date(days.has(today) ? today : yesterday);
      while (days.has(checkDate.toISOString().slice(0, 10))) {
        current++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      }
    }

    // Best streak
    let best = 0;
    let run = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diff = (prev - curr) / 86400000;
      if (diff === 1) { run++; } else { best = Math.max(best, run); run = 1; }
    }
    best = Math.max(best, run, current);

    return { current, best };
  }, [watchHistory]);

  /* ---------------- 5-state status helpers ---------------- */

  const statusKey = (kind, id) => `${kind}-${id}`;

  const getItemStatus = useCallback((kind, id) => {
    const key = statusKey(kind, id);
    if (itemStatus[key]) return itemStatus[key];
    // Implicit default for items already in legacy watchlist arrays.
    if (kind === 'show' && watchlist.some((s) => s.id === id)) return 'watchlist';
    if (kind === 'movie' && movieWatchlist.some((m) => m.id === id)) return 'watchlist';
    return null;
  }, [itemStatus, watchlist, movieWatchlist]);

  const updateItemStatus = useCallback((kind, id, status) => {
    setItemStatus((prev) => {
      const key = statusKey(kind, id);
      if (!status) {
        const { [key]: _drop, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: status };
    });
  }, [setItemStatus]);

  const getUserRating = useCallback((kind, id) => {
    return userRatings[`${kind}-${id}`] || null;
  }, [userRatings]);

  const setUserRating = useCallback((kind, id, rating) => {
    setUserRatings((prev) => {
      const key = `${kind}-${id}`;
      if (rating == null) {
        const { [key]: _drop, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: rating };
    });
  }, [setUserRatings]);

  const itemsByStatus = useCallback((status) => {
    const shows = watchlist.filter((s) => getItemStatus('show', s.id) === status);
    const movies = movieWatchlist.filter((m) => getItemStatus('movie', m.id) === status);
    return { shows, movies };
  }, [watchlist, movieWatchlist, getItemStatus]);

  const getTodayEpisodeCount = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    return watchHistory.filter((e) => e.date === today).length;
  }, [watchHistory]);

  const getWeekActivity = useCallback(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const count = watchHistory.filter((e) => e.date === dateStr).length;
      result.push({ date: dateStr, day: d.toLocaleDateString('en', { weekday: 'short' }), count });
    }
    return result;
  }, [watchHistory]);

  const value = useMemo(() => ({
    watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist,
    movieWatchlist, addMovieToWatchlist, removeMovieFromWatchlist, isMovieInWatchlist,
    recentlyViewed, addRecentlyViewed,
    watchedEpisodes, markEpisodeWatched, unmarkEpisodeWatched, isEpisodeWatched, getShowProgress, markSeasonWatched, clearShowProgress,
    watchHistory, getWatchStreak, getTodayEpisodeCount, getWeekActivity,
    collections, addToCollection, removeFromCollection, isInCollection, createCollection, deleteCollection,
    stats, trackGenres,
    itemStatus, getItemStatus, updateItemStatus, itemsByStatus,
    userRatings, getUserRating, setUserRating,
  }), [watchlist, movieWatchlist, recentlyViewed, watchedEpisodes, watchHistory, collections, stats,
    addToWatchlist, removeFromWatchlist, isInWatchlist,
    addMovieToWatchlist, removeMovieFromWatchlist, isMovieInWatchlist,
    addRecentlyViewed,
    markEpisodeWatched, unmarkEpisodeWatched, isEpisodeWatched, getShowProgress, markSeasonWatched, clearShowProgress,
    getWatchStreak, getTodayEpisodeCount, getWeekActivity,
    addToCollection, removeFromCollection, isInCollection, createCollection, deleteCollection, trackGenres,
    itemStatus, getItemStatus, updateItemStatus, itemsByStatus,
    userRatings, getUserRating, setUserRating]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
