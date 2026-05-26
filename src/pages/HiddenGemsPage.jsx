import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { discoverMovies, hasTmdbKey } from '../api/tmdb';
import ByngeScoreBadge from '../components/ui/ByngeScoreBadge';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import RatingBadge from '../components/ui/RatingBadge';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { computeByngeScore } from '../utils/byngeScore';
import { formatYear } from '../utils/formatters';
import { getTmdbBackdropUrl, getTmdbPosterUrl } from '../utils/imageUrl';

const VOTE_MIN = 50;
const VOTE_MAX = 800;
const RATING_MIN = 7.5;

/**
 * Hidden Gems — high-rated movies most people haven't seen.
 *
 * Design intent: the editorial framing IS the data. We surface the vote count
 * as a feature ("Only 217 people have rated this") rather than burying it.
 */
export default function HiddenGemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!hasTmdbKey()) { setLoading(false); return; }
      const pages = await Promise.all([
        discoverMovies([], 'vote_average.desc', 1, { voteCountGte: VOTE_MIN }),
        discoverMovies([], 'vote_average.desc', 2, { voteCountGte: VOTE_MIN }),
        discoverMovies([], 'vote_average.desc', 3, { voteCountGte: VOTE_MIN }),
      ]);
      if (cancelled) return;
      const merged = [
        ...(pages[0].results || []),
        ...(pages[1].results || []),
        ...(pages[2].results || []),
      ];
      const filtered = merged.filter((m) =>
        m.vote_average >= RATING_MIN &&
        m.vote_count >= VOTE_MIN &&
        m.vote_count <= VOTE_MAX &&
        m.poster_path
      );
      const scored = filtered.map((m) => ({
        ...m,
        _bynge: computeByngeScore({
          tmdbRating: m.vote_average,
          tmdbVotes: m.vote_count,
          releaseDate: m.release_date,
        }),
      }));
      scored.sort((a, b) => (b._bynge || 0) - (a._bynge || 0));
      setItems(scored.slice(0, 36));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  usePageHead({
    title: 'Hidden Gems — Underrated Movies on Bynge',
    description: 'The best movies you\'ve never heard of. Hand-curated hidden gems with 7.5+ ratings but small audiences — your next favorite is probably here.',
    canonical: `${SITE_ORIGIN}/hidden-gems`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Hidden Gems', item: `${SITE_ORIGIN}/hidden-gems` },
        ],
      },
    ],
  });

  const featured = items.slice(0, 3);
  const rest = items.slice(3);
  const totalReviews = items.reduce((sum, m) => sum + (m.vote_count || 0), 0);
  const avgReviews = items.length ? Math.round(totalReviews / items.length) : 0;

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}>
      <Container>
        {/* Editorial header — leans into the filter as a feature */}
        <header className="mb-section">
          <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
            Underrated · Hand-filtered
          </p>
          <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
            Brilliant movies <span className="text-text-secondary">almost nobody saw.</span>
          </h1>
          <p className="mt-4 text-body-sm sm:text-body text-text-secondary max-w-2xl leading-relaxed">
            Rated <span className="text-white font-semibold">{RATING_MIN}+ on TMDB</span>, but with
            fewer than <span className="text-white font-semibold">{VOTE_MAX} reviews</span> each.
            Ranked by <span className="text-accent-peach font-semibold">Bynge Score</span>, our
            blend of critic consensus, freshness, and cultural relevance.
          </p>

          {/* Editorial stats strip */}
          {!loading && items.length > 0 && (
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
              <Stat value={items.length} label="Picks" />
              <Stat value={avgReviews.toLocaleString()} label="Avg reviews" muted />
              <Stat
                value={items[0]?._bynge ? items[0]._bynge.toFixed(1) : '—'}
                label="Top Bynge Score"
                accent
              />
            </dl>
          )}
        </header>

        {loading ? (
          <GemsSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            icon={
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
            title="No gems surfaced yet"
            description="Check back soon — we refresh this list as new picks roll in."
          />
        ) : (
          <>
            {/* Editor's picks — 3 wide cards with the rarity stat front and center */}
            <section className="mb-section">
              <div className="flex items-center gap-3 mb-5">
                <h3 className="text-h3 font-semibold text-white">Editor's picks</h3>
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-caption text-text-muted font-mono">Top {featured.length}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {featured.map((m, i) => (
                  <FeaturedGem key={m.id} movie={m} rank={i + 1} />
                ))}
              </div>
            </section>

            {/* The rest — dense grid with rarity badge on each */}
            {rest.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <h3 className="text-h3 font-semibold text-white">More to dig up</h3>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-caption text-text-muted font-mono">
                    {String(rest.length).padStart(2, '0')}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
                  {rest.map((m, i) => (
                    <GemTile key={m.id} movie={m} rank={i + 4} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </Container>
    </PageLayout>
  );
}

/* ───────────────────────  STAT  ─────────────────────── */

function Stat({ value, label, accent = false, muted = false }) {
  return (
    <div>
      <dd
        className={`
          font-mono text-h2 sm:text-h1 font-extrabold leading-none tabular-nums
          ${accent ? 'text-accent-peach' : muted ? 'text-text-secondary' : 'text-white'}
        `}
      >
        {value}
      </dd>
      <dt className="mt-1 text-meta uppercase text-text-muted font-semibold tracking-widest">
        {label}
      </dt>
    </div>
  );
}

/* ───────────────────────  FEATURED GEM  ─────────────────────── */

function FeaturedGem({ movie, rank }) {
  const backdropUrl = movie.backdrop_path ? getTmdbBackdropUrl(movie.backdrop_path, 'w1280') : null;
  const posterUrl = getTmdbPosterUrl(movie.poster_path, 'w500');

  return (
    <Link
      to={`/movie/${movie.id}`}
      className="
        group relative block overflow-hidden rounded-2xl
        border border-white/[0.06] hover:border-accent-peach/40
        bg-gradient-to-br from-bg-elevated/60 to-bg-secondary/40
        transition-colors aspect-[4/5] sm:aspect-[3/4]
      "
    >
      {backdropUrl && (
        <img
          src={backdropUrl}
          alt=""
          loading={rank === 1 ? 'eager' : 'lazy'}
          className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-500"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />

      <div className="relative h-full flex flex-col justify-between p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-h1 sm:text-display-sm font-extrabold text-accent-peach/80 tabular-nums leading-none">
            {String(rank).padStart(2, '0')}
          </span>
          {movie._bynge != null && <ByngeScoreBadge score={movie._bynge} size="md" />}
        </div>

        <div className="flex gap-4 items-end">
          <img
            src={posterUrl}
            alt=""
            loading="lazy"
            className="flex-shrink-0 hidden sm:block w-20 lg:w-24 aspect-[2/3] rounded-md object-cover border border-white/[0.10] shadow-elevation-2"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-h3 font-extrabold text-white tracking-tight leading-tight break-words group-hover:text-accent-peach transition-colors">
              {movie.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-text-secondary">
              <span>{formatYear(movie.release_date)}</span>
              <span className="text-text-muted">·</span>
              <span>★ {movie.vote_average.toFixed(1)}</span>
            </div>
            <p className="mt-2 inline-flex items-center gap-1.5 text-caption text-accent-gold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
              Only <span className="font-mono font-bold text-white">{movie.vote_count.toLocaleString()}</span> reviews
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ───────────────────────  GEM TILE (rest of grid)  ─────────────────────── */

function GemTile({ movie, rank }) {
  return (
    <Link to={`/movie/${movie.id}`} className="group block">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/[0.06] group-hover:border-accent-peach/30 transition-colors bg-bg-elevated">
        <img
          src={getTmdbPosterUrl(movie.poster_path, 'w342')}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

        {/* Rank chip top-left */}
        <span className="absolute top-2.5 left-2.5 font-mono text-meta font-bold text-text-primary bg-bg-primary/85 backdrop-blur px-1.5 py-0.5 rounded border border-white/10 tabular-nums">
          #{rank}
        </span>

        {/* Rating top-right */}
        {movie.vote_average > 0 && (
          <div className="absolute top-2.5 right-2.5">
            <RatingBadge rating={movie.vote_average} size="sm" />
          </div>
        )}

        {/* Bottom: title + review-rarity */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-body-sm font-semibold text-white break-words min-w-0 group-hover:text-accent-peach transition-colors">
            {movie.title}
          </p>
          <p className="mt-0.5 text-[10px] text-text-muted font-mono uppercase tracking-wider">
            <span className="text-accent-gold">●</span> {movie.vote_count} reviews · {formatYear(movie.release_date)}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ───────────────────────  SKELETON  ─────────────────────── */

function GemsSkeleton() {
  return (
    <div className="space-y-section">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
        ))}
      </div>
    </div>
  );
}
