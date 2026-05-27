import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { hasTmdbKey, searchTmdbMovies } from '../api/tmdb';
import MovieCard from '../components/movie/MovieCard';
import ShowCard from '../components/show/ShowCard';
import Badge from '../components/ui/Badge';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import RatingBadge from '../components/ui/RatingBadge';
import { useApiQuery } from '../hooks/useApiQuery';
import { useDebounce } from '../hooks/useDebounce';
import PageLayout from '../layouts/PageLayout';
import { formatYear } from '../utils/formatters';
import { getMediumImage, getTmdbPosterUrl } from '../utils/imageUrl';
import { stripHtml } from '../utils/stripHtml';

const SUGGESTED_QUERIES = [
  'Breaking Bad',
  'Inception',
  'Severance',
  'Wes Anderson',
  'Studio Ghibli',
  'Christopher Nolan',
  'Succession',
  'Dune',
];

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
      if (debouncedQuery.length < 2 || !hasTmdbKey()) { setMovieResults([]); return; }
      setMovieLoading(true);
      try {
        const data = await searchTmdbMovies(debouncedQuery);
        setMovieResults(data || []);
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
    } else if (searchParams.get('q')) {
      setSearchParams({}, { replace: true });
    }
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = query ? `Search: ${query} — Bynge` : 'Search — Bynge';
    return () => { document.title = 'Bynge'; };
  }, [query]);

  const shows = (results || []).map((r) => r.show).filter(Boolean);
  const combinedLoading = isLoading || movieLoading;
  const showCount = shows.length;
  const movieCount = movieResults.length;
  const totalCount = showCount + movieCount;

  const filters = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'shows', label: 'TV Shows', count: showCount },
    { key: 'movies', label: 'Movies', count: movieCount },
  ];

  const hasQuery = debouncedQuery.length >= 2;

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}>
      <Container>
        {/* Editorial header — adapts to the state */}
        <header className="mb-section">
          {!hasQuery ? (
            <>
              <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
                Search the catalog
              </p>
              <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
                Find anything. <span className="text-text-secondary">Movie, show, person.</span>
              </h1>
            </>
          ) : combinedLoading ? (
            <>
              <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
                Searching for
              </p>
              <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none break-words">
                &ldquo;{debouncedQuery}&rdquo;<span className="text-text-secondary">…</span>
              </h1>
            </>
          ) : totalCount > 0 ? (
            <>
              <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
                {totalCount} {totalCount === 1 ? 'result' : 'results'} for
              </p>
              <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none break-words">
                &ldquo;{debouncedQuery}&rdquo;
              </h1>
            </>
          ) : (
            <>
              <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
                No matches for
              </p>
              <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none break-words">
                &ldquo;{debouncedQuery}&rdquo;
              </h1>
            </>
          )}
        </header>

        {/* The input — refined, lower in the page */}
        <label className="block mb-section relative">
          <span className="sr-only">Search</span>
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shows, movies, people…"
            autoFocus
            className="
              w-full h-12 sm:h-14 pl-11 sm:pl-12 pr-12 rounded-2xl
              text-body sm:text-h3 text-white placeholder-text-muted
              bg-white/[0.04] border border-white/[0.10]
              focus:outline-none focus:border-accent-peach/60 focus:bg-white/[0.06]
              focus:shadow-[0_0_0_3px_rgba(196,131,91,0.12)]
              transition-all
            "
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.10] text-text-secondary hover:text-white flex items-center justify-center transition-colors"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </label>

        {/* Empty / suggestions state */}
        {!hasQuery && (
          <section>
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="text-h3 font-semibold text-white">Need a starting point?</h2>
              <span className="text-caption text-text-muted">Try one of these</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setQuery(s)}
                  className="
                    inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                    bg-white/[0.04] border border-white/[0.08]
                    text-body-sm text-text-secondary
                    hover:text-white hover:bg-white/[0.08] hover:border-white/[0.18]
                    transition-colors
                  "
                >
                  {s}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Filters + view toggle */}
        {hasQuery && !combinedLoading && totalCount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-section">
            <div className="inline-flex rounded-lg bg-white/[0.03] border border-white/[0.08] p-0.5">
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setContentFilter(f.key)}
                  className={`
                    px-3 py-1 rounded-md text-body-sm font-medium transition-colors
                    inline-flex items-center gap-2
                    ${contentFilter === f.key
                      ? 'bg-white/[0.10] text-white'
                      : 'text-text-secondary hover:text-white'}
                  `}
                >
                  {f.label}
                  <span className={`font-mono tabular-nums text-meta ${contentFilter === f.key ? 'text-accent-peach' : 'text-text-muted'}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-lg bg-white/[0.03] border border-white/[0.08] p-0.5 self-start sm:self-auto">
              <ViewModeButton
                active={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
                label="Grid view"
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
                </svg>
              </ViewModeButton>
              <ViewModeButton
                active={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                label="List view"
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 4h18v4H3zM3 10h18v4H3zM3 16h18v4H3z" />
                </svg>
              </ViewModeButton>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {hasQuery && combinedLoading && (
          <div className="card-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
            ))}
          </div>
        )}

        {/* Results */}
        {hasQuery && !combinedLoading && (
          <>
            {(contentFilter === 'all' || contentFilter === 'shows') && shows.length > 0 && (
              <ResultsSection
                title={`${shows.length} TV ${shows.length === 1 ? 'show' : 'shows'}`}
                accent="#c4835b"
                showHeader={contentFilter === 'all' && movieCount > 0}
                viewMode={viewMode}
                items={shows}
                renderGrid={(s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.4) }}
                  >
                    <ShowCard show={s} />
                  </motion.div>
                )}
                renderList={(s) => <ShowListRow key={s.id} show={s} />}
              />
            )}

            {(contentFilter === 'all' || contentFilter === 'movies') && movieResults.length > 0 && (
              <ResultsSection
                title={`${movieResults.length} ${movieResults.length === 1 ? 'movie' : 'movies'}`}
                accent="#d4a056"
                showHeader={contentFilter === 'all' && showCount > 0}
                viewMode={viewMode}
                items={movieResults}
                renderGrid={(m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.4) }}
                  >
                    <MovieCard movie={m} />
                  </motion.div>
                )}
                renderList={(m) => <MovieListRow key={m.id} movie={m} />}
              />
            )}

            {totalCount === 0 && (
              <EmptyState
                icon={
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                    <path d="M8 11h6" />
                  </svg>
                }
                title="No matches"
                description="Try a shorter or alternate spelling — or browse the catalog instead."
                action={{ label: 'Browse shows', to: '/browse' }}
                secondaryAction={{ label: 'Browse movies', to: '/movies' }}
              />
            )}
          </>
        )}
      </Container>
    </PageLayout>
  );
}

/* ─────────────────────────  RESULTS SECTION  ───────────────────────── */

function ResultsSection({ title, accent, showHeader, viewMode, items, renderGrid, renderList }) {
  return (
    <section className="mb-section">
      {showHeader && (
        <div className="flex items-center gap-3 mb-5">
          <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: accent }} />
          <h2 className="text-h3 font-semibold text-white">{title}</h2>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>
      )}
      {viewMode === 'grid' ? (
        <div className="card-grid">{items.map((it, i) => renderGrid(it, i))}</div>
      ) : (
        <div className="space-y-2.5">{items.map((it) => renderList(it))}</div>
      )}
    </section>
  );
}

/* ─────────────────────────  LIST ROWS  ───────────────────────── */

function ShowListRow({ show }) {
  return (
    <Link
      to={`/show/${show.id}`}
      className="
        group flex items-center gap-4 p-3 rounded-xl
        border border-white/[0.05] bg-white/[0.02]
        hover:bg-white/[0.05] hover:border-white/[0.14]
        transition-colors
      "
    >
      <img
        src={getMediumImage(show.image)}
        alt=""
        loading="lazy"
        className="flex-shrink-0 w-16 sm:w-20 aspect-[2/3] rounded-md object-cover border border-white/[0.06]"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-body sm:text-h3 font-semibold text-white break-words min-w-0 group-hover:text-accent-peach transition-colors">
              {show.name}
            </h3>
            <p className="text-caption text-text-secondary mt-0.5">
              {formatYear(show.premiered)}
              {show.network?.name && <> · {show.network.name}</>}
            </p>
          </div>
          {show.rating?.average && <RatingBadge rating={show.rating.average} size="sm" />}
        </div>
        {show.genres?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {show.genres.slice(0, 4).map((g) => <Badge key={g}>{g}</Badge>)}
          </div>
        )}
        {show.summary && (
          <p className="hidden sm:block text-caption text-text-secondary mt-2 line-clamp-4">
            {stripHtml(show.summary)}
          </p>
        )}
      </div>
    </Link>
  );
}

function MovieListRow({ movie }) {
  return (
    <Link
      to={`/movie/${movie.id}`}
      className="
        group flex items-center gap-4 p-3 rounded-xl
        border border-white/[0.05] bg-white/[0.02]
        hover:bg-white/[0.05] hover:border-white/[0.14]
        transition-colors
      "
    >
      <img
        src={getTmdbPosterUrl(movie.poster_path)}
        alt=""
        loading="lazy"
        className="flex-shrink-0 w-16 sm:w-20 aspect-[2/3] rounded-md object-cover border border-white/[0.06]"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-body sm:text-h3 font-semibold text-white break-words min-w-0 group-hover:text-accent-peach transition-colors">
              {movie.title}
            </h3>
            <p className="text-caption text-text-secondary mt-0.5">
              {movie.release_date?.slice(0, 4) || 'TBA'} · Movie
            </p>
          </div>
          {movie.vote_average > 0 && <RatingBadge rating={movie.vote_average} size="sm" />}
        </div>
        {movie.overview && (
          <p className="hidden sm:block text-caption text-text-secondary mt-2 line-clamp-4">
            {movie.overview}
          </p>
        )}
      </div>
    </Link>
  );
}

/* ─────────────────────────  VIEW TOGGLE  ───────────────────────── */

function ViewModeButton({ active, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`
        px-2.5 py-1.5 rounded-md transition-colors
        ${active ? 'bg-white/[0.10] text-white' : 'text-text-secondary hover:text-white'}
      `}
    >
      {children}
    </button>
  );
}
