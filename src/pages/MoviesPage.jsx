import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { discoverMovies, getTmdbMovieGenres, hasTmdbKey } from '../api/tmdb';
import MovieCard from '../components/movie/MovieCard';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import HorizontalScroll from '../components/ui/HorizontalScroll';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { TMDB_GENRE_COLORS, TMDB_MOVIE_GENRES } from '../utils/constants';
import { formatYear } from '../utils/formatters';
import { getTmdbBackdropUrl, getTmdbPosterUrl } from '../utils/imageUrl';

const SORTS = [
  { id: 'popularity.desc', label: 'Popular' },
  { id: 'vote_average.desc', label: 'Top rated' },
  { id: 'primary_release_date.desc', label: 'Newest' },
  { id: 'revenue.desc', label: 'Box office' },
];

export default function MoviesPage() {
  usePageHead({
    title: 'Browse Movies — Bynge',
    description:
      'Discover movies by genre and sort — popular, top rated, newest, and box office hits. Powered by TMDB on Bynge.',
    canonical: `${SITE_ORIGIN}/movies`,
  });

  const [genres, setGenres] = useState(TMDB_MOVIE_GENRES);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Refresh genres from TMDB
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
  useEffect(() => { loadMovies(1, false); }, [loadMovies]);

  useEffect(() => {
    const genreName = genres.find((g) => g.id === selectedGenre)?.name;
    document.title = genreName ? `${genreName} Movies — Bynge` : 'Movies — Bynge';
    return () => { document.title = 'Bynge'; };
  }, [selectedGenre, genres]);

  function handleLoadMore() {
    if (page < totalPages) loadMovies(page + 1, true);
  }

  const activeGenre = useMemo(
    () => (selectedGenre ? genres.find((g) => g.id === selectedGenre) : null),
    [selectedGenre, genres],
  );
  const activeGenreColor = activeGenre ? (TMDB_GENRE_COLORS[activeGenre.id] || '#c4835b') : null;

  // The single best title in the current view — the spotlight card
  const spotlight = useMemo(() => {
    const candidates = movies.filter((m) => (m.vote_average || 0) >= 7.5 && (m.vote_count || 0) >= 200 && m.backdrop_path);
    return candidates[0] || null;
  }, [movies]);

  if (!hasTmdbKey()) {
    return (
      <PageLayout as={motion.div} initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}>
        <Container>
          <EmptyState
            icon={
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            }
            title="Movies unavailable"
            description="The TMDB API key isn't configured on the server. Add TMDB_API_KEY to your environment to enable this page."
          />
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}>
      <Container>
        {/* Editorial header */}
        <header className="mb-section">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p
                className="text-meta uppercase font-semibold tracking-widest"
                style={{ color: activeGenreColor || undefined }}
              >
                {activeGenre ? `${activeGenre.name} · Curated` : 'The film catalog'}
              </p>
              <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
                {activeGenre ? (
                  <>
                    <span style={{ color: activeGenreColor }}>{activeGenre.name}</span>
                    <span className="text-text-secondary"> movies, ranked.</span>
                  </>
                ) : (
                  <>Every movie, <span className="text-text-secondary">filtered your way.</span></>
                )}
              </h1>
            </div>
            <CountBadge count={movies.length} loading={isLoading && movies.length === 0} />
          </div>
        </header>

        {/* Genre rail — sticky */}
        <GenreRail
          genres={genres}
          selectedGenreId={selectedGenre}
          onSelect={setSelectedGenre}
        />

        {/* Spotlight */}
        {spotlight && movies.length > 0 && (
          <Spotlight movie={spotlight} accent={activeGenreColor} />
        )}

        {/* Filter row — segmented sort */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SegmentedControl label="Sort" options={SORTS} value={sortBy} onChange={setSortBy} />
        </div>

        {/* Grid */}
        {isLoading && movies.length === 0 ? (
          <GridSkeleton count={12} />
        ) : movies.length === 0 ? (
          <EmptyState
            icon={
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            }
            title="Nothing matches those filters"
            description="Try a different genre or sort order."
            action={(selectedGenre || sortBy !== 'popularity.desc') ? { label: 'Reset filters', onClick: () => { setSelectedGenre(null); setSortBy('popularity.desc'); } } : undefined}
          />
        ) : (
          <>
            <div className="card-grid">
              {movies.map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
              {isLoading && Array.from({ length: 12 }, (_, i) => (
                <div key={`skel-${i}`} className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
              ))}
            </div>

            {!isLoading && page < totalPages && (
              <div className="flex justify-center mt-section">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="
                    inline-flex items-center gap-2.5
                    h-11 px-6 rounded-full
                    text-body-sm font-semibold tracking-tight
                    bg-white/[0.05] border border-white/[0.10]
                    text-text-primary hover:text-white
                    hover:bg-white/[0.10] hover:border-white/[0.20]
                    transition-colors
                  "
                >
                  Load more
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </Container>
    </PageLayout>
  );
}

/* ─────────────────────────  GENRE RAIL  ───────────────────────── */

function GenreRail({ genres, selectedGenreId, onSelect }) {
  return (
    <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-section bg-bg-primary/85 backdrop-blur-xl border-b border-white/[0.06]">
      <HorizontalScroll gapClass="gap-2" className="py-3" showButtons={false}>
        <GenrePill
          label="All"
          isActive={selectedGenreId === null}
          onClick={() => onSelect(null)}
          accent="#c4835b"
        />
        {genres.map((g) => (
          <GenrePill
            key={g.id}
            label={g.name}
            isActive={selectedGenreId === g.id}
            onClick={() => onSelect(selectedGenreId === g.id ? null : g.id)}
            accent={TMDB_GENRE_COLORS[g.id] || '#c4835b'}
          />
        ))}
      </HorizontalScroll>
    </div>
  );
}

function GenrePill({ label, isActive, onClick, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        '--accent': accent,
        ...(isActive
          ? { backgroundColor: `${accent}24`, color: accent, borderColor: `${accent}55` }
          : { borderColor: 'rgba(255,255,255,0.08)' }),
      }}
      className={`
        genre-pill flex-shrink-0 px-3.5 py-1.5 rounded-full
        text-body-sm font-medium border
        transition-colors duration-150
        ${isActive ? '' : 'text-text-secondary hover:text-white bg-white/[0.03] hover:bg-white/[0.06]'}
      `}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────  SPOTLIGHT  ───────────────────────── */

function Spotlight({ movie, accent }) {
  const year = formatYear(movie.release_date);
  const backdrop = movie.backdrop_path ? getTmdbBackdropUrl(movie.backdrop_path, 'w1280') : null;
  const poster = movie.poster_path ? getTmdbPosterUrl(movie.poster_path, 'w342') : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="mb-section"
    >
      <Link
        to={`/movie/${movie.id}`}
        className="
          relative block overflow-hidden rounded-2xl
          border border-white/[0.06] hover:border-white/[0.16]
          transition-colors group
        "
      >
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            loading="eager"
            fetchpriority="high"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/85 to-bg-primary/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent" />

        <div className="relative flex flex-col sm:flex-row gap-5 sm:gap-8 p-6 sm:p-8 lg:p-10 min-h-[280px] sm:min-h-[260px]">
          {poster && (
            <img
              src={poster}
              alt=""
              loading="eager"
              className="hidden sm:block w-32 lg:w-40 aspect-[2/3] rounded-lg object-cover border border-white/10 shadow-elevation-3 flex-shrink-0"
            />
          )}
          <div className="flex flex-col justify-end gap-4 max-w-2xl">
            <p
              className="text-meta uppercase font-semibold tracking-widest"
              style={{ color: accent || '#d4a056' }}
            >
              ★ Editor's pick · {movie.vote_average?.toFixed(1)} on TMDB
            </p>
            <h2 className="text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-tight">
              {movie.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
              {year && <span>{year}</span>}
              {movie.vote_count > 0 && (<><span className="text-text-muted">·</span><span>{movie.vote_count.toLocaleString()} reviews</span></>)}
            </div>
            {movie.overview && (
              <p className="text-body-sm text-text-primary/80 leading-relaxed line-clamp-4">
                {movie.overview}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────  FILTER  ───────────────────────── */

function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-meta uppercase text-text-muted font-semibold whitespace-nowrap">{label}</span>
      <div className="inline-flex rounded-lg bg-white/[0.03] border border-white/[0.08] p-0.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`
              px-3 py-1 rounded-md text-body-sm font-medium
              transition-colors
              ${value === opt.id
                ? 'bg-white/[0.10] text-white'
                : 'text-text-secondary hover:text-white'}
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────  COUNT BADGE  ───────────────────────── */

function CountBadge({ count, loading }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-h1 sm:text-display-sm font-extrabold text-text-primary tabular-nums">
        {loading ? '—' : count.toLocaleString()}
      </span>
      <span className="text-meta uppercase text-text-muted font-semibold">
        {count === 1 ? 'movie' : 'movies'}
      </span>
    </div>
  );
}

/* ─────────────────────────  SKELETON  ───────────────────────── */

function GridSkeleton({ count }) {
  return (
    <div className="card-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]"
        />
      ))}
    </div>
  );
}
