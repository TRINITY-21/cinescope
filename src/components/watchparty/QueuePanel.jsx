import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { searchTmdbMovies } from '../../api/tmdb';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w92';

export default function QueuePanel({ queue, onAdd, onVote, onRemove, role }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);
  const panelRef = useRef(null);

  const doSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    try {
      const movies = await searchTmdbMovies(query);
      setResults((movies || []).slice(0, 8));
      setShowResults(true);
    } catch {
      setResults([]);
    }
    setSearching(false);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!search.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, doSearch]);

  // Close results on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleAdd(movie) {
    onAdd({
      tmdbId: movie.id,
      title: movie.title,
      poster: movie.poster_path,
      mediaType: 'movie',
      year: movie.release_date?.slice(0, 4) || '',
    });
    setSearch('');
    setResults([]);
    setShowResults(false);
  }

  function getTotalVotes(item) {
    return Object.values(item.votes || {}).reduce((sum, v) => sum + v, 0);
  }

  const sortedQueue = [...queue].sort((a, b) => getTotalVotes(b) - getTotalVotes(a));

  return (
    <div className="flex flex-col h-full" ref={panelRef}>
      {/* Search */}
      <div className="relative px-3 pt-3 pb-2">
        <div className="relative">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Search movies to add..."
            className="w-full bg-bg-elevated border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-violet/50 transition-colors"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-accent-violet/30 border-t-accent-violet rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Search results dropdown */}
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-3 right-3 top-full mt-1 bg-bg-elevated border border-white/10 rounded-xl shadow-elevation-3 z-10 max-h-64 overflow-y-auto"
          >
            {results.map((movie) => {
              const alreadyAdded = queue.some((q) => q.tmdbId === movie.id && q.mediaType === 'movie');
              return (
                <button
                  key={movie.id}
                  onClick={() => !alreadyAdded && handleAdd(movie)}
                  disabled={alreadyAdded}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {movie.poster_path ? (
                    <img
                      src={`${TMDB_IMG}${movie.poster_path}`}
                      alt=""
                      className="w-8 h-12 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-12 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-text-muted">
                        <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{movie.title}</p>
                    <p className="text-[11px] text-text-muted">
                      {movie.release_date?.slice(0, 4) || 'Unknown year'}
                      {alreadyAdded && ' · Already in queue'}
                    </p>
                  </div>
                  {!alreadyAdded && (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-violet flex-shrink-0">
                      <path d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {sortedQueue.length === 0 && (
          <div className="flex flex-col items-center gap-3 mt-8 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-text-muted">
                <path d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125M3.375 19.5c-.621 0-1.125-.504-1.125-1.125m0 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375" />
              </svg>
            </div>
            <p className="text-xs text-text-muted">
              Search and add movies to vote<br />on what to watch next
            </p>
          </div>
        )}

        {sortedQueue.map((item) => {
          const totalVotes = getTotalVotes(item);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-2 rounded-xl bg-bg-elevated/50 border border-white/5 group"
            >
              {/* Poster */}
              {item.poster ? (
                <img
                  src={`${TMDB_IMG}${item.poster}`}
                  alt=""
                  className="w-9 h-14 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-14 rounded bg-white/5 flex-shrink-0" />
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white font-medium truncate">{item.title}</p>
                <p className="text-[10px] text-text-muted">
                  {item.year} · Added by {item.addedBy}
                </p>
              </div>

              {/* Voting */}
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => onVote(item.id, 1)}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-text-secondary hover:text-accent-gold">
                    <path d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                </button>
                <span className={`text-xs font-bold ${totalVotes > 0 ? 'text-accent-gold' : totalVotes < 0 ? 'text-accent-red' : 'text-text-muted'}`}>
                  {totalVotes}
                </span>
                <button
                  onClick={() => onVote(item.id, -1)}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="text-text-secondary hover:text-accent-red">
                    <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>

              {/* Host remove button */}
              {role === 'host' && (
                <button
                  onClick={() => onRemove(item.id)}
                  className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent-red/20 transition-all flex-shrink-0"
                  title="Remove from queue"
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-red">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
