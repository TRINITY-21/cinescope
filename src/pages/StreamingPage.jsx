import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { discoverByProvider, hasTmdbKey } from '../api/tmdb';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import PosterTile from '../components/ui/PosterTile';
import { STREAMING_PROVIDERS, findProvider, providerLogoUrl } from '../data/streamingProviders';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { formatYear } from '../utils/formatters';
import { getTmdbBackdropUrl, getTmdbPosterUrl } from '../utils/imageUrl';

export default function StreamingPage() {
  const { provider: slug } = useParams();
  const provider = useMemo(() => findProvider(slug), [slug]);

  if (!provider) return <ServicesIndex />;
  return <ProviderDetail provider={provider} />;
}

/* ─────────────────────────  INDEX  ───────────────────────── */

function ServicesIndex() {
  usePageHead({
    title: 'Streaming Service Hubs — Bynge',
    description: 'Browse the best movies on Netflix, Hulu, Disney+, Max, Prime Video, and more — all in one place.',
    canonical: `${SITE_ORIGIN}/streaming`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Streaming', item: `${SITE_ORIGIN}/streaming` },
        ],
      },
    ],
  });

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}>
      <Container>
        <header className="mb-section">
          <p className="text-meta uppercase text-text-muted font-semibold tracking-widest">
            Streaming hubs
          </p>
          <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
            Where's it streaming? <span className="text-text-secondary">Pick a service.</span>
          </h1>
          <p className="mt-3 text-body-sm text-text-secondary max-w-xl">
            Live from TMDB. Each list is sorted by what's getting the most traction on that platform right now.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {STREAMING_PROVIDERS.map((p, i) => (
            <ProviderTile key={p.slug} provider={p} index={i} />
          ))}
        </div>
      </Container>
    </PageLayout>
  );
}

function ProviderTile({ provider, index }) {
  const tall = index === 0; // First card is hero-sized
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className={tall ? 'sm:col-span-2 lg:col-span-1 lg:row-span-2' : ''}
    >
      <Link
        to={`/streaming/${provider.slug}`}
        className="group relative block rounded-2xl overflow-hidden border h-full transition-colors"
        style={{
          borderColor: `${provider.brand}44`,
          background: `linear-gradient(135deg, ${provider.brand}1c 0%, rgba(20,18,14,0.95) 100%)`,
          minHeight: tall ? 380 : 220,
        }}
      >
        {/* Brand-color radial wash that wakes up on hover */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-50 group-hover:opacity-100 transition-opacity"
          style={{
            background: `radial-gradient(circle at 100% 0%, ${provider.brand}44 0%, transparent 55%)`,
          }}
        />
        {/* Subtle bottom vignette so type stays legible */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg-primary/85 to-transparent" />

        <div className="relative h-full flex flex-col justify-between p-5 sm:p-7">
          {/* Logo + chip */}
          <div className="flex items-start justify-between gap-3">
            <div className={`${tall ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-14 h-14'} rounded-xl overflow-hidden border border-white/[0.10] shadow-elevation-2 flex-shrink-0 bg-black/80 p-1.5`}>
              <img
                src={providerLogoUrl(provider.logo, 'w154')}
                alt={`${provider.name} logo`}
                loading={index < 2 ? 'eager' : 'lazy'}
                className="w-full h-full object-contain"
              />
            </div>
            <span
              className="text-meta uppercase font-semibold tracking-widest"
              style={{ color: provider.brand }}
            >
              Top picks
            </span>
          </div>

          {/* Name + CTA */}
          <div className="mt-6">
            <h2 className={`${tall ? 'text-display-sm sm:text-display' : 'text-h1 sm:text-display-sm'} font-extrabold tracking-tight text-white leading-none`}>
              {provider.name}
            </h2>
            <p className="mt-3 text-body-sm text-text-secondary">
              The best movies streaming on {provider.name} right now.
            </p>
            <div
              className="mt-4 inline-flex items-center gap-1.5 text-body-sm font-semibold group-hover:translate-x-1 transition-transform"
              style={{ color: provider.brand }}
            >
              Browse {provider.name.toLowerCase()}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────  DETAIL  ───────────────────────── */

function ProviderDetail({ provider }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasTmdbKey()) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const results = await discoverByProvider(provider.tmdbId, 'movie');
      if (cancelled) return;
      setMovies((results || []).filter((m) => m.poster_path).slice(0, 36));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [provider]);

  usePageHead({
    title: `Best ${provider.name} Movies — Bynge`,
    description: `The best movies streaming on ${provider.name} right now. Hand-ranked, with ratings, runtime, and direct links to watch.`,
    canonical: `${SITE_ORIGIN}/streaming/${provider.slug}`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Streaming', item: `${SITE_ORIGIN}/streaming` },
          {
            '@type': 'ListItem',
            position: 3,
            name: provider.name,
            item: `${SITE_ORIGIN}/streaming/${provider.slug}`,
          },
        ],
      },
    ],
  });

  const featured = movies[0] || null;
  const rest = movies.slice(1);

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }} className="relative">
      {/* Brand-tinted ambient wash */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-[60vh] pointer-events-none opacity-50"
        style={{
          background: `radial-gradient(ellipse at top, ${provider.brand}3a 0%, ${provider.brand}0a 30%, transparent 60%)`,
        }}
      />

      <Container className="relative">
        <Link
          to="/streaming"
          className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-white transition-colors mb-6"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All streaming services
        </Link>

        {/* Branded header */}
        <header className="flex flex-col sm:flex-row sm:items-end gap-6 mb-section">
          <div
            className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-white/10 shadow-elevation-3 flex-shrink-0 bg-black/80 p-2"
            style={{ boxShadow: `0 8px 40px ${provider.brand}30, inset 0 1px 0 rgba(255,255,255,0.05)` }}
          >
            <img
              src={providerLogoUrl(provider.logo, 'w185')}
              alt={`${provider.name} logo`}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-meta uppercase font-semibold tracking-widest"
              style={{ color: provider.brand }}
            >
              Streaming on {provider.name} · Top picks
            </p>
            <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-none">
              The best of {provider.name}.
            </h1>
            <p className="mt-3 text-body-sm text-text-secondary max-w-2xl">
              Live from TMDB watch providers. Sorted by what's getting the most attention in your region right now.
            </p>
          </div>
        </header>

        {loading ? (
          <DetailSkeleton />
        ) : movies.length === 0 ? (
          <EmptyState
            icon={
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            }
            title={`No ${provider.name} titles in your region`}
            description="TMDB didn't return anything for this provider here. Try a different service."
            action={{ label: 'See all services', to: '/streaming' }}
          />
        ) : (
          <>
            {featured && <FeaturedOnProvider movie={featured} provider={provider} />}
            {rest.length > 0 && (
              <section className="mt-section">
                <div className="flex items-center gap-3 mb-5">
                  <h3 className="text-h3 font-semibold text-white">More on {provider.name}</h3>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-caption text-text-muted font-mono">
                    {String(rest.length).padStart(2, '0')}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
                  {rest.map((m) => (
                    <PosterTile
                      key={m.id}
                      to={`/movie/${m.id}`}
                      title={m.title}
                      posterUrl={getTmdbPosterUrl(m.poster_path, 'w342')}
                      subtitle={formatYear(m.release_date)}
                      rating={m.vote_average}
                      kindLabel="Movie"
                    />
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

function FeaturedOnProvider({ movie, provider }) {
  const backdrop = movie.backdrop_path ? getTmdbBackdropUrl(movie.backdrop_path, 'w1280') : null;
  const poster = getTmdbPosterUrl(movie.poster_path, 'w500');

  return (
    <Link
      to={`/movie/${movie.id}`}
      className="relative block group overflow-hidden rounded-2xl border border-white/[0.06] hover:border-white/[0.18] transition-colors aspect-[16/9] sm:aspect-[21/9]"
    >
      {backdrop && (
        <img
          src={backdrop}
          alt=""
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent" />

      <div className="relative h-full flex items-end p-6 sm:p-8 lg:p-10">
        <div className="flex gap-5 sm:gap-7 items-end max-w-3xl">
          <img
            src={poster}
            alt=""
            loading="eager"
            className="hidden sm:block flex-shrink-0 w-28 lg:w-36 aspect-[2/3] rounded-lg object-cover border border-white/10 shadow-elevation-3"
          />
          <div className="min-w-0 flex-1">
            <p
              className="text-meta uppercase font-semibold tracking-widest"
              style={{ color: provider.brand }}
            >
              Most-watched · {provider.name}
            </p>
            <h2 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-tight break-words group-hover:text-accent-peach transition-colors">
              {movie.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
              <span>{formatYear(movie.release_date)}</span>
              {movie.vote_average > 0 && (
                <>
                  <span className="text-text-muted">·</span>
                  <span>★ {movie.vote_average.toFixed(1)}</span>
                </>
              )}
            </div>
            {movie.overview && (
              <p className="mt-3 text-body-sm text-text-secondary line-clamp-4 max-w-xl">
                {movie.overview}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-section">
      <div className="aspect-[16/9] sm:aspect-[21/9] rounded-2xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]" />
        ))}
      </div>
    </div>
  );
}
