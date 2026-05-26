import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getMovieVideos,
    getPopularMovies,
    getUpcomingMovies,
    hasTmdbKey,
    pickBestTrailer,
} from '../api/tmdb';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { formatYear } from '../utils/formatters';

function thumbUrl(key) {
  return `https://i.ytimg.com/vi/${key}/hqdefault.jpg`;
}

export default function TrailersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState(null);
  const [activeTitle, setActiveTitle] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!hasTmdbKey()) { setLoading(false); return; }
      const [pop1, pop2, upcoming] = await Promise.all([
        getPopularMovies(1),
        getPopularMovies(2),
        getUpcomingMovies(),
      ]);
      if (cancelled) return;
      const merged = [...pop1, ...pop2, ...upcoming]
        .filter((m) => m.poster_path)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 40);

      const resolved = await Promise.all(
        merged.map(async (m) => {
          const vids = await getMovieVideos(m.id).catch(() => []);
          const trailer = pickBestTrailer(vids);
          return trailer ? { movie: m, trailer } : null;
        }),
      );
      if (cancelled) return;
      setItems(resolved.filter(Boolean));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  usePageHead({
    title: 'Movie Trailers — Most-Watched on Bynge',
    description: 'The most-watched movie trailers right now, ranked by popularity. Watch the latest official trailers before they hit theaters.',
    canonical: `${SITE_ORIGIN}/trailers`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Trailers', item: `${SITE_ORIGIN}/trailers` },
        ],
      },
    ],
  });

  const featured = items[0] || null;
  const nextUp = useMemo(() => items.slice(1, 5), [items]);
  const rest = useMemo(() => items.slice(5), [items]);

  function play(item) {
    setActiveKey(item.trailer.key);
    setActiveTitle(item.movie.title);
  }
  function closePlayer() {
    setActiveKey(null);
    setActiveTitle(null);
  }

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}>
      <Container>
        {/* Editorial header */}
        <header className="mb-section">
          <p className="text-meta uppercase text-accent-red font-semibold tracking-widest">
            Now Playing · Most-watched trailers
          </p>
          <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
            Watch the hype <span className="text-text-secondary">before everyone else.</span>
          </h1>
          <p className="mt-3 text-body-sm text-text-secondary max-w-xl">
            Official trailers, ranked by movie popularity. Tap any thumbnail to play in-page.
          </p>
        </header>

        {loading ? (
          <TrailersSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            icon={
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
            }
            title="No trailers available"
            description="TMDB didn't return any videos right now. Try again in a few minutes."
          />
        ) : (
          <>
            {featured && (
              <Featured trailer={featured} nextUp={nextUp} onPlay={play} />
            )}

            {rest.length > 0 && (
              <section className="mt-section-lg">
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-h3 font-semibold text-white">More trailers</h2>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-caption text-text-muted font-mono">
                    {String(rest.length).padStart(2, '0')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {rest.map(({ movie, trailer }, i) => (
                    <TrailerCard
                      key={trailer.key}
                      movie={movie}
                      trailer={trailer}
                      rank={i + 6}
                      onPlay={() => play({ movie, trailer })}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </Container>

      <AnimatePresence>
        {activeKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={closePlayer}
          >
            <button
              type="button"
              onClick={closePlayer}
              aria-label="Close trailer"
              className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
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
              {activeTitle && (
                <p className="text-caption text-white/70 mb-3 px-1">
                  Now playing — <span className="text-white font-semibold">{activeTitle}</span>
                </p>
              )}
              <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_72px_rgba(0,0,0,0.6)]">
                <iframe
                  src={`https://www.youtube.com/embed/${activeKey}?autoplay=1&rel=0`}
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
    </PageLayout>
  );
}

/* ─────────────────────────  FEATURED HERO  ───────────────────────── */

function Featured({ trailer: item, nextUp, onPlay }) {
  const { movie, trailer } = item;
  const thumb = thumbUrl(trailer.key);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      {/* Main 16:9 featured */}
      <button
        type="button"
        onClick={() => onPlay(item)}
        className="
          group relative aspect-video rounded-2xl overflow-hidden
          border border-white/[0.06] hover:border-accent-red/40
          text-left w-full
          transition-colors
        "
      >
        <img
          src={thumb}
          alt={`${movie.title} trailer`}
          loading="eager"
          fetchpriority="high"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

        {/* #1 chip */}
        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-gold text-bg-primary font-extrabold text-meta tracking-widest tabular-nums shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-bg-primary animate-pulse" />
          #1 TRAILER
        </span>

        {/* Center play */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="
              w-20 h-20 sm:w-24 sm:h-24 rounded-full
              bg-accent-red/95 backdrop-blur
              flex items-center justify-center
              shadow-[0_8px_40px_rgba(196,85,58,0.55)]
              group-hover:scale-110 group-hover:bg-accent-red transition-all
            "
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" className="ml-1.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Title bottom */}
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
          <p className="text-caption text-text-secondary mb-1.5 font-mono">
            {formatYear(movie.release_date)}{movie.vote_average > 0 ? ` · ★ ${movie.vote_average.toFixed(1)}` : ''}
          </p>
          <h2 className="text-h2 sm:text-display-sm font-extrabold tracking-tight text-white leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
            {movie.title}
          </h2>
          {movie.overview && (
            <p className="mt-3 text-body-sm text-text-secondary line-clamp-4 max-w-2xl">
              {movie.overview}
            </p>
          )}
        </div>
      </button>

      {/* Up next column */}
      {nextUp.length > 0 && (
        <aside className="flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-meta uppercase text-text-muted font-semibold tracking-widest">Up next</h3>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <ul className="space-y-2 flex-1">
            {nextUp.map((entry, i) => (
              <li key={entry.trailer.key}>
                <button
                  type="button"
                  onClick={() => onPlay(entry)}
                  className="
                    group w-full flex items-center gap-3 p-2 rounded-xl
                    border border-white/[0.05] hover:border-white/[0.14]
                    bg-white/[0.02] hover:bg-white/[0.05]
                    transition-colors text-left
                  "
                >
                  <div className="relative flex-shrink-0 w-24 aspect-video rounded-md overflow-hidden bg-bg-elevated">
                    <img
                      src={thumbUrl(entry.trailer.key)}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                    <span className="absolute top-1 left-1 font-mono text-[9px] font-bold bg-bg-primary/85 backdrop-blur text-white px-1 rounded">
                      #{i + 2}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-semibold text-white break-words min-w-0 group-hover:text-accent-red transition-colors">
                      {entry.movie.title}
                    </p>
                    <p className="text-caption text-text-muted break-words min-w-0">
                      {formatYear(entry.movie.release_date)}{entry.movie.vote_average > 0 ? ` · ★ ${entry.movie.vote_average.toFixed(1)}` : ''}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </section>
  );
}

/* ─────────────────────────  TRAILER CARD  ───────────────────────── */

function TrailerCard({ movie, trailer, rank, onPlay }) {
  return (
    <div className="group">
      <button
        type="button"
        onClick={onPlay}
        className="
          block w-full text-left relative aspect-video rounded-2xl overflow-hidden
          bg-bg-elevated border border-white/[0.06]
          group-hover:border-accent-red/40
          transition-colors
        "
      >
        <img
          src={thumbUrl(trailer.key)}
          alt={`${movie.title} trailer`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-accent-red/90 backdrop-blur flex items-center justify-center shadow-[0_6px_24px_rgba(196,85,58,0.45)] group-hover:scale-110 transition-transform">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" className="ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        <span className="absolute top-2.5 left-2.5 font-mono text-meta font-bold text-text-primary bg-bg-primary/85 backdrop-blur px-1.5 py-0.5 rounded border border-white/10 tabular-nums">
          #{rank}
        </span>

        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-body font-bold text-white leading-tight break-words">{movie.title}</p>
          <p className="text-caption text-white/70 mt-0.5">{formatYear(movie.release_date)}</p>
        </div>
      </button>
      <div className="mt-2 flex items-center justify-between text-caption px-1">
        <Link
          to={`/movie/${movie.id}`}
          className="text-accent-peach hover:text-accent-gold transition-colors font-medium inline-flex items-center gap-1"
        >
          View movie
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
        {movie.vote_average > 0 && (
          <span className="text-accent-gold font-semibold">★ {movie.vote_average.toFixed(1)}</span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────  SKELETON  ───────────────────────── */

function TrailersSkeleton() {
  return (
    <div className="space-y-section-lg">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="aspect-video rounded-2xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-video rounded-2xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
        ))}
      </div>
    </div>
  );
}
