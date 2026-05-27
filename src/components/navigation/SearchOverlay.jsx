import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../../api/endpoints';
import { hasTmdbKey, searchTmdbMovies } from '../../api/tmdb';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useDebounce } from '../../hooks/useDebounce';
import { formatYear } from '../../utils/formatters';
import { getMediumImage, getTmdbPosterUrl } from '../../utils/imageUrl';
import { overlayFade, searchPanel } from '../../utils/motion';
import RatingBadge from '../ui/RatingBadge';

export default function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [movieSuggestions, setMovieSuggestions] = useState([]);

  const { data: results } = useApiQuery(
    debouncedQuery.length >= 2 ? endpoints.searchShows(debouncedQuery) : null,
    { enabled: debouncedQuery.length >= 2 }
  );

  useEffect(() => {
    async function fetchMovies() {
      if (debouncedQuery.length < 2 || !hasTmdbKey()) {
        setMovieSuggestions([]);
        return;
      }
      try {
        const data = await searchTmdbMovies(debouncedQuery);
        setMovieSuggestions(data.slice(0, 4));
      } catch {
        setMovieSuggestions([]);
      }
    }
    fetchMovies();
  }, [debouncedQuery]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setMovieSuggestions([]);
    }
  }, [isOpen]);

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  }

  function goToShow(id) {
    navigate(`/show/${id}`);
    onClose();
  }

  function goToMovie(id) {
    navigate(`/movie/${id}`);
    onClose();
  }

  const showSuggestions = results?.slice(0, 4) || [];
  const hasShows = showSuggestions.length > 0;
  const hasMovies = movieSuggestions.length > 0;
  const hasAnySuggestions = hasShows || hasMovies;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            {...overlayFade}
            className="fixed inset-0 z-50 bg-black/80 sm:bg-black/50 sm:backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            {...searchPanel}
            className="fixed inset-0 z-50 bg-bg-primary sm:bg-bg-primary/95 sm:backdrop-blur-2xl noise-overlay pointer-events-none"
          >
          <div className="pointer-events-auto h-full">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-accent-red/20 flex items-center justify-center transition-colors"
            aria-label="Close search"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 md:pt-24">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <svg className="absolute left-0 top-1/2 -translate-y-1/2 -mt-1 sm:-mt-1.5 text-text-muted w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search shows, series, movies..."
                  className="w-full bg-transparent border-0 border-b border-white/10 outline-none text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-white placeholder-text-muted pl-8 sm:pl-10 md:pl-12 pb-3 sm:pb-4 focus:border-accent-peach/50 transition-colors"
                />
              </div>
            </form>

            {hasAnySuggestions && (
              <div className="mt-8 space-y-1">
                {hasShows && (
                  <>
                    {hasMovies && (
                      <p className="text-xs text-text-muted uppercase tracking-wider px-3 pt-2 pb-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-peach" />
                        TV Shows
                      </p>
                    )}
                    {showSuggestions.map(({ show }) => (
                      <button
                        key={`show-${show.id}`}
                        type="button"
                        onClick={() => goToShow(show.id)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                      >
                        <img
                          src={getMediumImage(show.image)}
                          alt={show.name}
                          className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white group-hover:text-accent-peach transition-colors break-words min-w-0">
                            {show.name}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {formatYear(show.premiered)}
                            {show.network && ` · ${show.network.name}`}
                            {show.genres?.length > 0 && ` · ${show.genres.slice(0, 2).join(', ')}`}
                          </p>
                        </div>
                        {show.rating?.average && (
                          <RatingBadge rating={show.rating.average} size="sm" />
                        )}
                      </button>
                    ))}
                  </>
                )}

                {hasMovies && (
                  <>
                    {hasShows && (
                      <p className="text-xs text-text-muted uppercase tracking-wider px-3 pt-3 pb-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                        Movies
                      </p>
                    )}
                    {movieSuggestions.map((movie) => (
                      <button
                        key={`movie-${movie.id}`}
                        type="button"
                        onClick={() => goToMovie(movie.id)}
                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                      >
                        <img
                          src={getTmdbPosterUrl(movie.poster_path)}
                          alt={movie.title}
                          className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white group-hover:text-accent-peach transition-colors break-words min-w-0">
                            {movie.title}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {movie.release_date?.slice(0, 4)}
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-accent-gold/20 text-accent-gold">Movie</span>
                          </p>
                        </div>
                        {movie.vote_average > 0 && (
                          <RatingBadge rating={movie.vote_average} size="sm" />
                        )}
                      </button>
                    ))}
                  </>
                )}

                {query.trim() && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full text-center py-3 text-accent-peach hover:text-white transition-all text-sm font-medium btn-glow-violet rounded-lg"
                  >
                    View all results for "{query}" &rarr;
                  </button>
                )}
              </div>
            )}

            {debouncedQuery.length >= 2 && !hasAnySuggestions && (
              <p className="mt-12 text-center text-text-secondary">No results found for "{debouncedQuery}"</p>
            )}
          </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
