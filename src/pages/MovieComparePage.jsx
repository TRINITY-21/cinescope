import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getMovieDetails,
  getMovieVideos,
  hasTmdbKey,
  pickBestTrailer,
  searchTmdbMovies,
} from '../api/tmdb';
import { useDebounce } from '../hooks/useDebounce';
import ByngeScoreBadge from '../components/ui/ByngeScoreBadge';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import PageHero from '../components/ui/PageHero';
import RatingBadge from '../components/ui/RatingBadge';
import { computeByngeScore } from '../utils/byngeScore';
import { formatRuntime, formatYear } from '../utils/formatters';
import { getTmdbPosterUrl } from '../utils/imageUrl';
import { slugify } from '../utils/slug';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { seoBreadcrumb } from '../utils/seoSchema';

/**
 * /compare/movies/:slug — movie-vs-movie permalink page.
 *
 * Mirrors the TV ComparePage structure but uses TMDB movie search + details.
 * Slug format: "movie-a-vs-movie-b". Picks the top TMDB search result for
 * each side (popularity-sorted by default).
 */

const ACCENT_A = '#c4835b';
const ACCENT_B = '#d4a056';

function parseSlug(slug) {
  if (!slug) return null;
  const parts = slug.split('-vs-');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { a: parts[0], b: parts[1] };
}

function comparisonSlug(a, b) {
  if (!a || !b) return null;
  return `${slugify(a.title)}-vs-${slugify(b.title)}`;
}

async function searchOne(query) {
  const results = await searchTmdbMovies(query);
  return results?.[0] || null;
}

async function fetchTrailerKey(movieId) {
  const vids = await getMovieVideos(movieId).catch(() => []);
  return pickBestTrailer(vids)?.key || null;
}

/* ─── Search input ─── */
function MovieSearchInput({ label, onSelect, selected, accent }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!debounced || debounced.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    searchTmdbMovies(debounced).then((r) => {
      if (!cancelled) setResults(r || []);
    });
    return () => { cancelled = true; };
  }, [debounced]);

  if (selected) {
    return (
      <div
        className="flex items-center gap-3 p-3 sm:p-4 glass-subtle rounded-2xl border"
        style={{ borderColor: `${accent}55` }}
      >
        <img
          src={getTmdbPosterUrl(selected.poster_path, 'w92')}
          alt={`${selected.title} poster`}
          className="w-14 h-20 rounded-lg object-cover border border-white/10 shadow-elevation-2"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{selected.title}</p>
          <p className="text-xs text-text-secondary mt-0.5">{formatYear(selected.release_date)}</p>
          {selected.vote_average > 0 && (
            <div className="mt-1.5 inline-block">
              <RatingBadge rating={selected.vote_average} size="sm" />
            </div>
          )}
        </div>
        <button
          onClick={() => onSelect(null)}
          className="text-text-muted hover:text-white text-xs font-medium px-2.5 py-1 rounded-md hover:bg-white/[0.06] transition-colors"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: accent }}>
        {label}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a movie title…"
        className="w-full bg-bg-elevated/70 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent-peach/50 focus:ring-2 focus:ring-accent-peach/20 transition-all"
      />
      {results.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-bg-secondary/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden max-h-72 overflow-y-auto shadow-elevation-3">
          {results.slice(0, 6).map((m) => (
            <button
              key={m.id}
              onClick={() => { onSelect(m); setQuery(''); }}
              className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.06] text-left transition-colors"
            >
              <img
                src={getTmdbPosterUrl(m.poster_path, 'w92')}
                alt={`${m.title} poster`}
                className="w-8 h-12 rounded object-cover border border-white/10"
              />
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{m.title}</p>
                <p className="text-xs text-text-muted">{formatYear(m.release_date)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Stat row with winner highlighting ─── */
function valueComparable(v) {
  if (v == null || v === '' || v === 'N/A') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function StatRow({ label, left, right, higherWins = true }) {
  const ln = valueComparable(left);
  const rn = valueComparable(right);
  const hasWinner = ln != null && rn != null && ln !== rn;
  const leftWins = hasWinner && (higherWins ? ln > rn : ln < rn);
  const rightWins = hasWinner && (higherWins ? rn > ln : rn < ln);
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 py-3 border-b border-white/[0.04] last:border-0 items-center">
      <div className={`text-right text-xs sm:text-sm ${leftWins ? 'text-accent-peach font-bold' : 'text-white/85'}`}>
        {left || 'N/A'}
        {leftWins && <span className="ml-1.5 text-[10px] text-accent-peach">★</span>}
      </div>
      <div className="text-center text-[10px] sm:text-xs text-text-muted uppercase tracking-wider font-semibold">
        {label}
      </div>
      <div className={`text-left text-xs sm:text-sm ${rightWins ? 'text-accent-peach font-bold' : 'text-white/85'}`}>
        {rightWins && <span className="mr-1.5 text-[10px] text-accent-peach">★</span>}
        {right || 'N/A'}
      </div>
    </div>
  );
}

function MoviePanel({ movie, side, onPlayTrailer, hasTrailer }) {
  if (!movie) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-subtle rounded-2xl p-4 sm:p-5 border border-white/[0.05] flex gap-4"
    >
      <img
        src={getTmdbPosterUrl(movie.poster_path, 'w342')}
        alt={`${movie.title} poster`}
        className="w-24 sm:w-28 h-36 sm:h-40 rounded-xl object-cover border border-white/10 shadow-elevation-2 flex-shrink-0"
      />
      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            {side === 'left' ? 'Pick A' : 'Pick B'}
          </span>
          {movie.vote_average > 0 && <RatingBadge rating={movie.vote_average} size="sm" />}
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight line-clamp-2">
          {movie.title}
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-1 line-clamp-2">
          {formatYear(movie.release_date)}
          {movie.runtime > 0 ? ` · ${formatRuntime(movie.runtime)}` : ''}
          {movie.genres?.length > 0 ? ` · ${movie.genres.slice(0, 2).map((g) => g.name).join(', ')}` : ''}
        </p>
        <div className="mt-auto pt-3 flex flex-wrap gap-2">
          <button
            onClick={onPlayTrailer}
            disabled={!hasTrailer}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-accent-red/90 text-white hover:bg-accent-red disabled:bg-white/[0.04] disabled:text-text-muted disabled:cursor-not-allowed"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            {hasTrailer ? 'Watch Trailer' : 'No trailer'}
          </button>
          <Link
            to={`/movie/${movie.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-white bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page ─── */
export default function MovieComparePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [pickA, setPickA] = useState(null);
  const [pickB, setPickB] = useState(null);
  const [detailsA, setDetailsA] = useState(null);
  const [detailsB, setDetailsB] = useState(null);
  const [trailerA, setTrailerA] = useState(null);
  const [trailerB, setTrailerB] = useState(null);
  const [activeTrailer, setActiveTrailer] = useState(null);

  useEffect(() => { setTrailerA(null); }, [pickA?.id]);
  useEffect(() => { setTrailerB(null); }, [pickB?.id]);

  const loadDetails = useCallback(async (movie) => {
    if (!movie?.id) return null;
    return await getMovieDetails(movie.id);
  }, []);

  // Hydrate from slug
  useEffect(() => {
    const parsed = parseSlug(slug);
    if (!parsed || !hasTmdbKey()) return;
    let cancelled = false;
    (async () => {
      const [a, b] = await Promise.all([
        searchOne(parsed.a.replace(/-/g, ' ')),
        searchOne(parsed.b.replace(/-/g, ' ')),
      ]);
      if (cancelled) return;
      if (a) {
        setPickA(a);
        const det = await loadDetails(a);
        if (!cancelled) setDetailsA(det);
      }
      if (b) {
        setPickB(b);
        const det = await loadDetails(b);
        if (!cancelled) setDetailsB(det);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, loadDetails]);

  // Push canonical URL when both picked interactively
  useEffect(() => {
    if (slug) return;
    if (pickA && pickB) {
      const s = comparisonSlug(pickA, pickB);
      if (s) navigate(`/compare/movies/${s}`, { replace: true });
    }
  }, [pickA, pickB, slug, navigate]);

  // Pre-fetch trailers
  useEffect(() => {
    if (!detailsA || trailerA) return;
    let cancelled = false;
    fetchTrailerKey(detailsA.id).then((k) => { if (!cancelled) setTrailerA(k); });
    return () => { cancelled = true; };
  }, [detailsA, trailerA]);
  useEffect(() => {
    if (!detailsB || trailerB) return;
    let cancelled = false;
    fetchTrailerKey(detailsB.id).then((k) => { if (!cancelled) setTrailerB(k); });
    return () => { cancelled = true; };
  }, [detailsB, trailerB]);

  const bothLoaded = detailsA && detailsB;
  const titleA = detailsA?.title || pickA?.title;
  const titleB = detailsB?.title || pickB?.title;

  const byngeA = useMemo(() => detailsA ? computeByngeScore({
    tmdbRating: detailsA.vote_average,
    tmdbVotes: detailsA.vote_count,
    releaseDate: detailsA.release_date,
  }) : null, [detailsA]);
  const byngeB = useMemo(() => detailsB ? computeByngeScore({
    tmdbRating: detailsB.vote_average,
    tmdbVotes: detailsB.vote_count,
    releaseDate: detailsB.release_date,
  }) : null, [detailsB]);

  const jsonLd = useMemo(() => {
    if (!bothLoaded) return null;
    return [
      seoBreadcrumb('Compare', '/compare', `${titleA} vs ${titleB}`, `/compare/movies/${slug || comparisonSlug(detailsA, detailsB)}`),
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${titleA} vs ${titleB}`,
        url: `${SITE_ORIGIN}/compare/movies/${slug || comparisonSlug(detailsA, detailsB)}`,
        about: [
          { '@type': 'Movie', name: titleA, datePublished: (detailsA.release_date || '').slice(0, 4) || undefined },
          { '@type': 'Movie', name: titleB, datePublished: (detailsB.release_date || '').slice(0, 4) || undefined },
        ],
      },
    ];
  }, [bothLoaded, detailsA, detailsB, titleA, titleB, slug]);

  usePageHead(
    bothLoaded
      ? {
          title: `${titleA} vs ${titleB} — Movie Compare — Bynge`,
          description: `${titleA} vs ${titleB}: ratings, runtime, genre, Bynge Score — side by side.`,
          canonical: `${SITE_ORIGIN}/compare/movies/${slug || comparisonSlug(detailsA, detailsB)}`,
          jsonLd,
        }
      : {
          title: 'Compare Movies — Bynge',
          description: 'Pick two movies and compare ratings, runtime, genre and Bynge Score side by side.',
          canonical: `${SITE_ORIGIN}/compare/movies`,
        },
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-section-lg">
      <PageHero
        eyebrow="Versus · Movies"
        title={bothLoaded ? `${titleA} vs ${titleB}` : 'Compare Movies'}
        tagline={bothLoaded ? 'The receipts, side by side.' : 'Pick two movies. See who wins.'}
        description={bothLoaded
          ? 'Stats compared row by row. Each winner highlighted. Trailers play in-page.'
          : 'Search for any two movies and Bynge will line up ratings, runtime, genre and Bynge Score.'}
      >
        <div className="flex flex-wrap gap-2 mt-1">
          <Link
            to="/compare"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-caption font-semibold text-text-secondary hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            ← Compare TV shows instead
          </Link>
        </div>
      </PageHero>

      <Container className="mt-section">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-center mb-section max-w-5xl mx-auto">
          <MovieSearchInput
            label="First movie"
            onSelect={(m) => { setPickA(m); setDetailsA(null); loadDetails(m).then(setDetailsA); }}
            selected={pickA}
            accent={ACCENT_A}
          />
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-accent-red/40 to-accent-gold/40 border border-white/[0.08] text-sm font-extrabold text-white shadow-[0_4px_16px_rgba(196,85,58,0.25)]">
              VS
            </div>
          </div>
          <MovieSearchInput
            label="Second movie"
            onSelect={(m) => { setPickB(m); setDetailsB(null); loadDetails(m).then(setDetailsB); }}
            selected={pickB}
            accent={ACCENT_B}
          />
        </div>

        {bothLoaded ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-section">
              <MoviePanel
                movie={detailsA}
                side="left"
                hasTrailer={!!trailerA}
                onPlayTrailer={() => setActiveTrailer({ key: trailerA, title: titleA })}
              />
              <MoviePanel
                movie={detailsB}
                side="right"
                hasTrailer={!!trailerB}
                onPlayTrailer={() => setActiveTrailer({ key: trailerB, title: titleB })}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-subtle rounded-3xl p-5 sm:p-7 border border-white/[0.06]"
            >
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Head to head</h3>
                <span className="text-[10px] text-text-muted">★ marks the winner</span>
              </div>

              <StatRow label="Bynge Score" left={byngeA?.toFixed(1)} right={byngeB?.toFixed(1)} />
              <StatRow label="TMDB rating" left={detailsA.vote_average?.toFixed(1)} right={detailsB.vote_average?.toFixed(1)} />
              <StatRow label="Vote count" left={detailsA.vote_count?.toLocaleString()} right={detailsB.vote_count?.toLocaleString()} />
              <StatRow label="Released" left={formatYear(detailsA.release_date)} right={formatYear(detailsB.release_date)} higherWins={false} />
              <StatRow label="Runtime" left={formatRuntime(detailsA.runtime)} right={formatRuntime(detailsB.runtime)} higherWins={false} />
              <StatRow label="Genres" left={detailsA.genres?.map((g) => g.name).join(', ')} right={detailsB.genres?.map((g) => g.name).join(', ')} higherWins={false} />
              <StatRow label="Language" left={(detailsA.original_language || '').toUpperCase()} right={(detailsB.original_language || '').toUpperCase()} higherWins={false} />
              <StatRow label="Budget" left={detailsA.budget ? `$${detailsA.budget.toLocaleString()}` : null} right={detailsB.budget ? `$${detailsB.budget.toLocaleString()}` : null} higherWins={false} />
              <StatRow label="Revenue" left={detailsA.revenue ? `$${detailsA.revenue.toLocaleString()}` : null} right={detailsB.revenue ? `$${detailsB.revenue.toLocaleString()}` : null} />
              <StatRow label="Status" left={detailsA.status} right={detailsB.status} higherWins={false} />
            </motion.div>

            {(byngeA != null || byngeB != null) && (
              <div className="mt-section flex justify-center gap-4">
                {byngeA != null && (
                  <div className="text-center">
                    <p className="text-meta uppercase tracking-widest text-text-muted font-semibold mb-2">{titleA}</p>
                    <ByngeScoreBadge score={byngeA} size="md" />
                  </div>
                )}
                {byngeB != null && (
                  <div className="text-center">
                    <p className="text-meta uppercase tracking-widest text-text-muted font-semibold mb-2">{titleB}</p>
                    <ByngeScoreBadge score={byngeB} size="md" />
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 3v18M16 3v18M3 8h18M3 16h18" />
              </svg>
            }
            title="Pick two movies to compare"
            description="Use the inputs above. We'll line up ratings, runtime, genre, budget, revenue and the Bynge Score."
          />
        )}
      </Container>

      <AnimatePresence>
        {activeTrailer?.key && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActiveTrailer(null)}
          >
            <button
              className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              onClick={() => setActiveTrailer(null)}
              aria-label="Close trailer"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm text-white/70 mb-3 px-1">
                Now playing — <span className="text-white font-semibold">{activeTrailer.title}</span>
              </p>
              <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_72px_rgba(0,0,0,0.6)]">
                <iframe
                  src={`https://www.youtube.com/embed/${activeTrailer.key}?autoplay=1&rel=0`}
                  title="Trailer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
