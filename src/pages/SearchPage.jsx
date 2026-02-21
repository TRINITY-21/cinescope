import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApiQuery } from '../hooks/useApiQuery';
import { useDebounce } from '../hooks/useDebounce';
import { endpoints } from '../api/endpoints';
import { searchTmdbMovies, hasTmdbKey } from '../api/tmdb';
import Container from '../components/ui/Container';
import ShowCard from '../components/show/ShowCard';
import ShowCardSkeleton from '../components/show/ShowCardSkeleton';
import MovieCard from '../components/movie/MovieCard';
import { stripHtml } from '../utils/stripHtml';
import { formatYear } from '../utils/formatters';
import { getMediumImage, getTmdbPosterUrl } from '../utils/imageUrl';
import RatingBadge from '../components/ui/RatingBadge';
import Badge from '../components/ui/Badge';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);
  const [viewMode, setViewMode] = useState('grid');
  const [contentFilter, setContentFilter] = useState('all');
  const [movieResults, setMovieResults] = useState([]);
  const [movieLoading, setMovieLoading] = useState(false);

  const { data: results, isLoading } = useApiQuery(
    debouncedQuery.length >= 2 ? endpoints.searchShows(debouncedQuery) : null,
    { enabled: debouncedQuery.length >= 2 }
  );

  useEffect(() => {
    async function searchMovies() {
      if (debouncedQuery.length < 2 || !hasTmdbKey()) {
        setMovieResults([]);
        return;
      }
      setMovieLoading(true);
      try {
        const data = await searchTmdbMovies(debouncedQuery);
        setMovieResults(data);
      } catch {
        setMovieResults([]);
      } finally {
        setMovieLoading(false);
      }
    }
    searchMovies();
  }, [debouncedQuery]);

  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery }, { replace: true });
    }
  }, [debouncedQuery]);

  useEffect(() => {
    document.title = query ? `Search: ${query} — Bynge` : 'Search — Bynge';
    return () => { document.title = 'Bynge'; };
  }, [query]);

  const shows = results?.map((r) => r.show) || [];
  const combinedLoading = isLoading || movieLoading;
  const showCount = shows.length;
  const movieCount = movieResults.length;
  const totalCount = showCount + movieCount;

  const filters = [
    { key: 'all', label: `All (${totalCount})` },
    { key: 'shows', label: `TV Shows (${showCount})` },
    { key: 'movies', label: `Movies (${movieCount})` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="pt-20 sm:pt-24 pb-8 sm:pb-12"
    >
      <Container>
        <div className="max-w-2xl mx-auto mb-6 sm:mb-10">
          <div className="relative">
            <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-text-muted" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shows and movies..."
              autoFocus
              className="w-full bg-bg-elevated border border-white/10 rounded-xl sm:rounded-2xl pl-10 pr-3 py-2.5 sm:pl-14 sm:pr-6 sm:py-4 text-sm sm:text-lg text-white placeholder-text-muted focus:outline-none focus:border-accent-violet/50 focus:ring-1 focus:ring-accent-violet/30 focus:shadow-glow-violet transition-all"
            />
          </div>
        </div>

        {debouncedQuery.length >= 2 && !combinedLoading && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex gap-2 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setContentFilter(f.key)}
                  className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    contentFilter === f.key
                      ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/30'
                      : 'text-text-muted hover:text-white bg-white/[0.03] border border-white/[0.06]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 glass-subtle rounded-lg sm:rounded-xl p-0.5 sm:p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${viewMode === 'grid' ? 'bg-accent-violet/20 text-accent-violet shadow-sm' : 'text-text-muted hover:text-white'}`}
                aria-label="Grid view"
              >
                <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/></svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${viewMode === 'list' ? 'bg-accent-violet/20 text-accent-violet shadow-sm' : 'text-text-muted hover:text-white'}`}
                aria-label="List view"
              >
                <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M3 4h18v4H3zM3 10h18v4H3zM3 16h18v4H3z"/></svg>
              </button>
            </div>
          </div>
        )}

        {combinedLoading && (
          <div className="card-grid">
            {Array.from({ length: 10 }, (_, i) => <ShowCardSkeleton key={i} />)}
          </div>
        )}

        {!combinedLoading && (
          <>
            {/* TV Shows section */}
            {(contentFilter === 'all' || contentFilter === 'shows') && shows.length > 0 && (
              <div className="mb-10">
                {contentFilter === 'all' && movieCount > 0 && (
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-violet" />
                    TV Shows
                  </h2>
                )}

                {viewMode === 'grid' ? (
                  <div className="card-grid">
                    {shows.map((show, i) => (
                      <motion.div key={show.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}>
                        <ShowCard show={show} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {shows.map((show) => (
                      <Link key={show.id} to={`/show/${show.id}`} className="block">
                        <div className="glass rounded-xl p-3 sm:p-4 flex gap-3 sm:gap-4 hover:border-white/10 transition-all group">
                          <img src={getMediumImage(show.image)} alt={show.name} className="w-14 h-20 sm:w-20 sm:h-28 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base text-white group-hover:text-accent-violet transition-colors truncate">{show.name}</h3>
                                <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                                  {formatYear(show.premiered)}{show.network && ` · ${show.network.name}`}
                                </p>
                              </div>
                              {show.rating?.average && <RatingBadge rating={show.rating.average} size="sm" />}
                            </div>
                            <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
                              {show.genres?.map((g) => <Badge key={g}>{g}</Badge>)}
                            </div>
                            <p className="text-[11px] sm:text-xs text-text-secondary mt-1.5 sm:mt-2 line-clamp-2 hidden sm:block">{stripHtml(show.summary)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Movies section */}
            {(contentFilter === 'all' || contentFilter === 'movies') && movieResults.length > 0 && (
              <div className="mb-10">
                {contentFilter === 'all' && showCount > 0 && (
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                    Movies
                  </h2>
                )}

                {viewMode === 'grid' ? (
                  <div className="card-grid">
                    {movieResults.map((movie, i) => (
                      <motion.div key={movie.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}>
                        <MovieCard movie={movie} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {movieResults.map((movie) => (
                      <Link key={movie.id} to={`/movie/${movie.id}`} className="block">
                        <div className="glass rounded-xl p-3 sm:p-4 flex gap-3 sm:gap-4 hover:border-white/10 transition-all group">
                          <img src={getTmdbPosterUrl(movie.poster_path)} alt={movie.title} className="w-14 h-20 sm:w-20 sm:h-28 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base text-white group-hover:text-accent-violet transition-colors truncate">{movie.title}</h3>
                                <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                                  {movie.release_date?.slice(0, 4)}
                                  <span className="ml-2 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-accent-gold/20 text-accent-gold">Movie</span>
                                </p>
                              </div>
                              {movie.vote_average > 0 && <RatingBadge rating={movie.vote_average} size="sm" />}
                            </div>
                            <p className="text-[11px] sm:text-xs text-text-secondary mt-1.5 sm:mt-2 line-clamp-2 hidden sm:block">{movie.overview}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {debouncedQuery.length >= 2 && totalCount === 0 && (
              <div className="text-center py-20">
                <svg className="mx-auto mb-4 text-text-muted" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M8 11h6" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                <p className="text-text-secondary">Try a different search term</p>
              </div>
            )}
          </>
        )}
      </Container>
    </motion.div>
  );
}
