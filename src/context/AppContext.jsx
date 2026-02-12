import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

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
  }, [setWatchedEpisodes, setStats]);

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
  }, [setWatchedEpisodes, setStats]);

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
    setWatchedEpisodes((prev) => {
      const showEps = new Set(prev[showId] || []);
      let newCount = 0;
      episodeIds.forEach((id) => {
        if (!showEps.has(id)) {
          showEps.add(id);
          newCount++;
        }
      });
      if (newCount > 0) {
        setStats((p) => ({
          ...p,
          totalEpisodesWatched: (p.totalEpisodesWatched || 0) + newCount,
          totalMinutesWatched: (p.totalMinutesWatched || 0) + (runtime * newCount),
          firstTracked: p.firstTracked || new Date().toISOString(),
        }));
      }
      return { ...prev, [showId]: [...showEps] };
    });
  }, [setWatchedEpisodes, setStats]);

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

  const value = useMemo(() => ({
    watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist,
    movieWatchlist, addMovieToWatchlist, removeMovieFromWatchlist, isMovieInWatchlist,
    recentlyViewed, addRecentlyViewed,
    watchedEpisodes, markEpisodeWatched, unmarkEpisodeWatched, isEpisodeWatched, getShowProgress, markSeasonWatched, clearShowProgress,
    collections, addToCollection, removeFromCollection, isInCollection, createCollection, deleteCollection,
    stats, trackGenres,
  }), [watchlist, movieWatchlist, recentlyViewed, watchedEpisodes, collections, stats,
    addToWatchlist, removeFromWatchlist, isInWatchlist,
    addMovieToWatchlist, removeMovieFromWatchlist, isMovieInWatchlist,
    addRecentlyViewed,
    markEpisodeWatched, unmarkEpisodeWatched, isEpisodeWatched, getShowProgress, markSeasonWatched, clearShowProgress,
    addToCollection, removeFromCollection, isInCollection, createCollection, deleteCollection, trackGenres]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
