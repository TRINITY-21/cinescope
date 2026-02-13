import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Container from '../components/ui/Container';
import MovieCard from '../components/movie/MovieCard';
import ShowCardSkeleton from '../components/show/ShowCardSkeleton';
import Button from '../components/ui/Button';
import { discoverMovies, getTmdbMovieGenres, hasTmdbKey } from '../api/tmdb';
import { TMDB_MOVIE_GENRES, TMDB_GENRE_COLORS } from '../utils/constants';

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popularity' },
  { value: 'vote_average.desc', label: 'Rating (High to Low)' },
  { value: 'primary_release_date.desc', label: 'Release Date (Newest)' },
  { value: 'revenue.desc', label: 'Revenue' },
];

export default function MoviesPage() {
  const [genres, setGenres] = useState(TMDB_MOVIE_GENRES);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Optionally refresh genres from TMDB API
  useEffect(() => {
    if (!hasTmdbKey()) return;
    getTmdbMovieGenres().then((fetched) => {
      if (fetched.length > 0) setGenres(fetched);
    });
  }, []);

  const loadMovies = useCallback(async (pageNum, append = false) => {
    if (!hasTmdbKey()) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const genreIds = selectedGenre ? [selectedGenre] : [];
      const options = sortBy === 'vote_average.desc' ? { voteCountGte: 100 } : {};
      const data = await discoverMovies(genreIds, sortBy, pageNum, options);
      setMovies((prev) => append ? [...prev, ...data.results] : data.results);
      setTotalPages(data.total_pages);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load movies:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGenre, sortBy]);

  // Reset and load when genre or sort changes
  useEffect(() => {
    loadMovies(1, false);
  }, [loadMovies]);

  useEffect(() => {
    const genreName = genres.find((g) => g.id === selectedGenre)?.name;
    document.title = genreName ? `${genreName} Movies — Bynge` : 'Movies — Bynge';
    return () => { document.title = 'Bynge'; };
  }, [selectedGenre, genres]);

  function handleLoadMore() {
    if (page < totalPages) {
      loadMovies(page + 1, true);
    }
  }

  if (!hasTmdbKey()) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-20 sm:pt-24 pb-8 sm:pb-12">
        <Container>
          <div className="text-center py-20">
            <svg className="mx-auto mb-4 text-text-muted" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M7 4v16M17 4v16M3 8h4M17 8h4M3 12h18M3 16h4M17 16h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <h1 className="text-2xl font-bold text-white mb-2">Movies Unavailable</h1>
            <p className="text-text-secondary">TMDB API key is not configured.</p>
          </div>
        </Container>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-20 sm:pt-24 pb-8 sm:pb-12">
      <Container>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Browse Movies</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showFilters ? 'bg-accent-violet/20 text-accent-violet' : 'glass text-text-secondary hover:text-white'
            }`}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 4h18M7 8h10M10 12h4" />
            </svg>
            Filters
          </button>
        </div>
        <p className="text-text-secondary mb-4">Discover movies by genre</p>

        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="glass-subtle rounded-xl gradient-border p-4 mb-4"
          >
            <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto bg-bg-primary border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-violet/50"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </motion.div>
        )}

        {/* Genre pills */}
        <div className="sticky top-16 z-30 bg-bg-primary/90 backdrop-blur-xl py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-white/5 shadow-elevation-2 mb-6">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setSelectedGenre(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedGenre === null ? 'bg-accent-violet text-white' : 'bg-bg-elevated/50 text-text-secondary hover:text-white hover:bg-bg-elevated'
              }`}
            >
              All
            </button>
            {genres.map((genre) => {
              const color = TMDB_GENRE_COLORS[genre.id] || '#c4835b';
              const isActive = selectedGenre === genre.id;
              return (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(isActive ? null : genre.id)}
                  className="genre-pill flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={isActive
                    ? { backgroundColor: `${color}30`, color, border: `1px solid ${color}50`, '--genre-color': color }
                    : { '--genre-color': color }
                  }
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-sm text-text-muted mb-4">{movies.length} movies</p>

        {/* Movie grid */}
        <div className="card-grid">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
          {isLoading && Array.from({ length: 12 }, (_, i) => <ShowCardSkeleton key={`skel-${i}`} />)}
        </div>

        {/* Load More */}
        {!isLoading && page < totalPages && (
          <div className="flex justify-center mt-8">
            <Button onClick={handleLoadMore} variant="secondary" size="lg">
              Load More Movies
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && movies.length === 0 && (
          <div className="text-center py-16">
            <svg className="mx-auto mb-4 text-text-muted" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M7 4v16M17 4v16M3 8h4M17 8h4M3 12h18M3 16h4M17 16h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <p className="text-text-secondary">No movies found. Try a different genre.</p>
          </div>
        )}
      </Container>
    </motion.div>
  );
}
