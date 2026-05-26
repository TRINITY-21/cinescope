import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { endpoints } from '../api/endpoints';
import { fetchApi } from '../api/tvmaze';
import ShowCard from '../components/show/ShowCard';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import HorizontalScroll from '../components/ui/HorizontalScroll';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { GENRES, GENRE_COLORS } from '../utils/constants';

const SORTS = [
  { id: 'name', label: 'A–Z' },
  { id: 'rating', label: 'Top rated' },
  { id: 'year', label: 'Newest' },
  { id: 'year-asc', label: 'Oldest' },
];

const STATUSES = [
  { id: 'all', label: 'Any status' },
  { id: 'Running', label: 'Running' },
  { id: 'Ended', label: 'Ended' },
  { id: 'To Be Determined', label: 'TBD' },
  { id: 'In Development', label: 'In dev' },
];

export default function BrowsePage() {
  const { genre: urlGenre } = useParams();
  const genreLabel = urlGenre ? decodeURIComponent(urlGenre) : null;

  usePageHead({
    title: genreLabel ? `${genreLabel} TV Shows — Bynge` : 'Browse TV Shows — Bynge',
    description: genreLabel
      ? `Browse ${genreLabel} TV series — filter by rating, status, and year on Bynge.`
      : 'Browse thousands of TV shows by genre, rating, and status. Find your next series to binge.',
    canonical: genreLabel
      ? `${SITE_ORIGIN}/browse/${encodeURIComponent(genreLabel)}`
      : `${SITE_ORIGIN}/browse`,
  });

  const navigate = useNavigate();
  const [selectedGenre, setSelectedGenre] = useState(urlGenre ? decodeURIComponent(urlGenre) : 'All');
  const [shows, setShows] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const [sortBy, setSortBy] = useState('name');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minRating, setMinRating] = useState(0);

  const [loadMoreRef, isLoadMoreVisible] = useIntersectionObserver({ triggerOnce: false, rootMargin: '500px' });

  const loadPage = useCallback(async (pageNum) => {
    try {
      setIsLoading(true);
      const data = await fetchApi(endpoints.showIndex(pageNum));
      if (!data || data.length === 0) { setHasMore(false); return; }
      setShows((prev) => pageNum === 0 ? data : [...prev, ...data]);
    } catch {
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadPage(0); }, [loadPage]);

  useEffect(() => {
    if (isLoadMoreVisible && hasMore && !isLoading && page < 5) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPage(nextPage);
    }
  }, [isLoadMoreVisible, hasMore, isLoading, page, loadPage]);

  useEffect(() => {
    document.title = selectedGenre !== 'All' ? `${selectedGenre} Shows — Bynge` : 'Browse Shows — Bynge';
    return () => { document.title = 'Bynge'; };
  }, [selectedGenre]);

  function handleGenreChange(genre) {
    setSelectedGenre(genre);
    navigate(genre === 'All' ? '/browse' : `/browse/${encodeURIComponent(genre)}`, { replace: true });
  }

  const filtered = useMemo(() => {
    let result = selectedGenre === 'All' ? shows : shows.filter((s) => s.genres?.includes(selectedGenre));
    if (statusFilter !== 'all') result = result.filter((s) => s.status === statusFilter);
    if (minRating > 0) result = result.filter((s) => (s.rating?.average || 0) >= minRating);
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'rating': return (b.rating?.average || 0) - (a.rating?.average || 0);
        case 'year': return (b.premiered || '').localeCompare(a.premiered || '');
        case 'year-asc': return (a.premiered || '').localeCompare(b.premiered || '');
        default: return (a.name || '').localeCompare(b.name || '');
      }
    });
    return result;
  }, [shows, selectedGenre, sortBy, statusFilter, minRating]);

  // The single best show in the current view — the "Today's pick" card
  const spotlight = useMemo(() => {
    const candidates = filtered.filter((s) => (s.rating?.average || 0) >= 8 && s.image?.original);
    if (!candidates.length) return null;
    return candidates[0];
  }, [filtered]);

  const activeGenreColor = selectedGenre !== 'All' ? GENRE_COLORS[selectedGenre] : null;
  const filtersActive = sortBy !== 'name' || statusFilter !== 'all' || minRating > 0;

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
                style={{ color: activeGenreColor || 'var(--tw-prose-counters, #9a8a7a)' }}
              >
                {selectedGenre === 'All' ? 'The catalog' : `${selectedGenre} · The shortlist`}
              </p>
              <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
                {selectedGenre === 'All' ? (
                  <>Every show, <span className="text-text-secondary">filtered your way.</span></>
                ) : (
                  <>
                    <span style={{ color: activeGenreColor }}>{selectedGenre}</span>
                    <span className="text-text-secondary"> shows we love.</span>
                  </>
                )}
              </h1>
            </div>
            <CountBadge count={filtered.length} loading={isLoading && shows.length === 0} />
          </div>
        </header>

        {/* Genre rail — sticky, full-bleed visual */}
        <GenreRail selected={selectedGenre} onChange={handleGenreChange} />

        {/* Spotlight */}
        {spotlight && shows.length > 0 && (
          <Spotlight show={spotlight} accent={activeGenreColor} />
        )}

        {/* Filter row — inline, not a collapse */}
        <FilterRow
          sortBy={sortBy}
          onSort={setSortBy}
          statusFilter={statusFilter}
          onStatus={setStatusFilter}
          minRating={minRating}
          onMinRating={setMinRating}
          active={filtersActive}
          onClear={() => { setSortBy('name'); setStatusFilter('all'); setMinRating(0); }}
        />

        {/* Grid */}
        {filtered.length === 0 && !isLoading ? (
          <EmptyState
            icon={
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            }
            title="Nothing matches all those filters"
            description="Loosen the status or rating filter, or pick a different genre."
            action={filtersActive ? { label: 'Clear filters', onClick: () => { setSortBy('name'); setStatusFilter('all'); setMinRating(0); } } : undefined}
          />
        ) : (
          <div className="card-grid">
            {filtered.map((show) => <ShowCard key={show.id} show={show} />)}
            {isLoading && Array.from({ length: 12 }).map((_, i) => (
              <div key={`skel-${i}`} className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
            ))}
          </div>
        )}

        {hasMore && <div ref={loadMoreRef} className="h-10" />}
      </Container>
    </PageLayout>
  );
}

/* ───────────────────────  GENRE RAIL  ─────────────────────── */

function GenreRail({ selected, onChange }) {
  return (
    <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-section bg-bg-primary/85 backdrop-blur-xl border-b border-white/[0.06]">
      <HorizontalScroll gapClass="gap-2" className="py-3" showButtons={false}>
        <GenrePill
          label="All"
          isActive={selected === 'All'}
          onClick={() => onChange('All')}
          accent="#c4835b"
        />
        {GENRES.map((g) => (
          <GenrePill
            key={g}
            label={g}
            isActive={selected === g}
            onClick={() => onChange(g)}
            accent={GENRE_COLORS[g] || '#c4835b'}
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

/* ───────────────────────  SPOTLIGHT  ─────────────────────── */

function Spotlight({ show, accent }) {
  const year = show.premiered?.slice(0, 4);
  const ended = show.ended?.slice(0, 4);
  return (
    <motion.a
      key={show.id}
      href={`/show/${show.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="
        relative block overflow-hidden rounded-2xl
        border border-white/[0.06] hover:border-white/[0.16]
        mb-section transition-colors
      "
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${show.image?.original || show.image?.medium})`,
          filter: 'blur(0px)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/85 to-bg-primary/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent" />

      <div className="relative flex flex-col sm:flex-row gap-5 sm:gap-8 p-6 sm:p-8 lg:p-10 min-h-[280px] sm:min-h-[260px]">
        <img
          src={show.image?.medium || show.image?.original}
          alt={show.name}
          loading="eager"
          className="hidden sm:block w-32 lg:w-40 aspect-[2/3] rounded-lg object-cover border border-white/10 shadow-elevation-3 flex-shrink-0"
        />
        <div className="flex flex-col justify-end gap-4 max-w-2xl">
          <p
            className="text-meta uppercase font-semibold tracking-widest"
            style={{ color: accent || '#d4a056' }}
          >
            ★ Editor's pick · {show.rating?.average?.toFixed(1)} on TVmaze
          </p>
          <h2 className="text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-tight">
            {show.name}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
            {year && <span>{year}{ended ? `–${ended}` : show.status === 'Running' ? '–Present' : ''}</span>}
            {show.network?.name && <><span className="text-text-muted">·</span><span>{show.network.name}</span></>}
            {show.status && <><span className="text-text-muted">·</span><span>{show.status}</span></>}
            {show.runtime && <><span className="text-text-muted">·</span><span>{show.runtime}m</span></>}
          </div>
          {show.summary && (
            <p
              className="text-body-sm text-text-primary/80 leading-relaxed line-clamp-4"
              dangerouslySetInnerHTML={{ __html: show.summary.replace(/<[^>]*>/g, '') }}
            />
          )}
        </div>
      </div>
    </motion.a>
  );
}

/* ───────────────────────  FILTER ROW  ─────────────────────── */

function FilterRow({ sortBy, onSort, statusFilter, onStatus, minRating, onMinRating, active, onClear }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 text-caption">
      <SegmentedControl label="Sort" options={SORTS} value={sortBy} onChange={onSort} />
      <SegmentedControl label="Status" options={STATUSES} value={statusFilter} onChange={onStatus} compact />
      <RatingChip value={minRating} onChange={onMinRating} />
      {active && (
        <button
          type="button"
          onClick={onClear}
          className="text-text-muted hover:text-white transition-colors underline underline-offset-4 decoration-text-muted/40 hover:decoration-white"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

function SegmentedControl({ label, options, value, onChange, compact = false }) {
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
              ${compact ? 'px-2.5' : 'px-3'} py-1 rounded-md text-body-sm font-medium
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

function RatingChip({ value, onChange }) {
  const stops = [0, 6, 7, 8, 9];
  return (
    <div className="flex items-center gap-2">
      <span className="text-meta uppercase text-text-muted font-semibold whitespace-nowrap">Min ★</span>
      <div className="inline-flex rounded-lg bg-white/[0.03] border border-white/[0.08] p-0.5">
        {stops.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`
              px-2.5 py-1 rounded-md text-body-sm font-mono
              transition-colors
              ${value === s
                ? 'bg-white/[0.10] text-white'
                : 'text-text-secondary hover:text-white'}
            `}
          >
            {s === 0 ? 'Any' : `${s}+`}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────  COUNT BADGE  ─────────────────────── */

function CountBadge({ count, loading }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-h1 sm:text-display-sm font-extrabold text-text-primary tabular-nums">
        {loading ? '—' : count.toLocaleString()}
      </span>
      <span className="text-meta uppercase text-text-muted font-semibold">
        {count === 1 ? 'show' : 'shows'}
      </span>
    </div>
  );
}
