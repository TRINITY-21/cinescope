import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getMovieDetails,
  getMovieWatchProviders,
  hasTmdbKey,
  searchTmdbMovies,
  searchTmdbShow,
  TMDB_IMAGE_BASE,
  getWatchProviders,
} from '../api/tmdb';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import { DetailPageSkeleton } from '../components/ui/PageSkeletons';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { formatYear } from '../utils/formatters';
import { getTmdbBackdropUrl, getTmdbPosterUrl } from '../utils/imageUrl';

async function resolveSlug(slug) {
  if (!slug || !hasTmdbKey()) return null;
  const query = slug.replace(/-/g, ' ');
  const [movieResults, showResult] = await Promise.all([
    searchTmdbMovies(query),
    searchTmdbShow(query),
  ]);
  const bestMovie = movieResults?.[0];
  // Prefer the one with higher popularity
  if (bestMovie && showResult) {
    return (showResult.popularity || 0) > (bestMovie.popularity || 0) * 1.2
      ? { kind: 'tv', id: showResult.id, payload: showResult }
      : { kind: 'movie', id: bestMovie.id, payload: bestMovie };
  }
  if (bestMovie) return { kind: 'movie', id: bestMovie.id, payload: bestMovie };
  if (showResult) return { kind: 'tv', id: showResult.id, payload: showResult };
  return null;
}

function logoUrl(path) {
  return path ? `${TMDB_IMAGE_BASE}/w92${path}` : null;
}

function ProviderGroup({ heading, providers, accent }) {
  if (!providers || providers.length === 0) return null;
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-4">
        <h3 className="text-meta uppercase tracking-widest font-semibold" style={{ color: accent }}>
          {heading}
        </h3>
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-caption text-text-muted font-mono tabular-nums">
          {String(providers.length).padStart(2, '0')}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {providers.map((p) => (
          <div
            key={p.provider_id}
            className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
          >
            {logoUrl(p.logo_path) && (
              <img
                src={logoUrl(p.logo_path)}
                alt={p.provider_name}
                className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
              />
            )}
            <span className="text-body-sm font-medium text-white truncate">
              {p.provider_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WhereToWatchPage() {
  const { slug } = useParams();
  const [resolved, setResolved] = useState(null);
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setResolved(null);
    setProviders(null);

    (async () => {
      try {
        const match = await resolveSlug(slug);
        if (cancelled) return;
        if (!match) { setNotFound(true); setLoading(false); return; }

        const fetchDetails = match.kind === 'movie'
          ? getMovieDetails(match.id)
          : Promise.resolve(match.payload);
        const fetchProviders = match.kind === 'movie'
          ? getMovieWatchProviders(match.id)
          : getWatchProviders(match.id);

        const [details, prov] = await Promise.all([fetchDetails, fetchProviders]);
        if (cancelled) return;
        setResolved({ kind: match.kind, details });
        setProviders(prov);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const sourceTitle = useMemo(() => {
    if (!resolved?.details) return '';
    return resolved.details.title || resolved.details.name || '';
  }, [resolved]);

  const head = useMemo(() => {
    if (!sourceTitle) return {};
    const streamingNames = (providers?.flatrate || providers?.free || []).map((p) => p.provider_name).slice(0, 3);
    const streamingClause = streamingNames.length
      ? `Streaming on ${streamingNames.join(', ')}.`
      : 'Streaming, rental, and purchase options.';
    return {
      title: `Where to watch ${sourceTitle} — Bynge`,
      description: `${streamingClause} Find ${sourceTitle} on every major service, plus direct links to watch.`,
      canonical: `${SITE_ORIGIN}/where-to-watch/${slug}`,
      jsonLd: [{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Where to watch', item: `${SITE_ORIGIN}/where-to-watch` },
          { '@type': 'ListItem', position: 3, name: sourceTitle, item: `${SITE_ORIGIN}/where-to-watch/${slug}` },
        ],
      }],
    };
  }, [sourceTitle, slug, providers]);
  usePageHead(head);

  if (loading) return <DetailPageSkeleton />;

  if (notFound || !resolved) {
    return (
      <Container className="pt-24 pb-12">
        <EmptyState
          icon={
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          }
          title="We couldn't find a match"
          description={`No movie or show matched "${slug?.replace(/-/g, ' ')}". Try a slug like /where-to-watch/inception.`}
          action={{ label: 'Browse movies', to: '/movies' }}
          secondaryAction={{ label: 'Go home', to: '/' }}
        />
      </Container>
    );
  }

  const { kind, details } = resolved;
  const detailHref = `${kind === 'movie' ? '/movie' : '/show'}/${details.id}`;
  const year = formatYear(details.release_date || details.first_air_date);
  const backdrop = details.backdrop_path ? getTmdbBackdropUrl(details.backdrop_path, 'w1280') : null;
  const poster = details.poster_path ? getTmdbPosterUrl(details.poster_path, 'w342') : null;

  const streaming = providers?.flatrate || [];
  const rent = providers?.rent || [];
  const buy = providers?.buy || [];
  const free = providers?.free || [];
  const ads = providers?.ads || [];
  const justWatchLink = providers?.link || null;
  const hasAnything = streaming.length + rent.length + buy.length + free.length + ads.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cinematic backdrop */}
      <div className="relative h-[35vh] sm:h-[42vh] min-h-[280px]">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-bg-primary/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/70 via-transparent to-transparent" />
      </div>

      <Container className="-mt-32 sm:-mt-40 relative z-10 pb-section-lg">
        <Link
          to={detailHref}
          className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-white transition-colors mb-6"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to {sourceTitle}
        </Link>

        <header className="mb-section-lg flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
          {poster && (
            <img
              src={poster}
              alt={sourceTitle}
              className="w-32 sm:w-40 rounded-xl object-cover ring-1 ring-white/[0.06] shadow-2xl flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-meta uppercase text-accent-peach font-semibold tracking-widest">
              Where to watch
              {year && <><span className="text-text-muted mx-2">·</span><span className="font-mono tabular-nums">{year}</span></>}
            </p>
            <h1 className="mt-2 text-h1 sm:text-display-sm font-extrabold tracking-tight text-white leading-[1.02]">
              {sourceTitle}
            </h1>
            <p className="mt-3 text-body-sm sm:text-body text-text-secondary max-w-2xl">
              Every streaming service, rental store, and purchase option for{' '}
              <Link to={detailHref} className="text-white hover:text-accent-peach transition-colors font-semibold">
                {sourceTitle}
              </Link>
              {' '}— ranked by popularity and refreshed daily via TMDB.
            </p>
          </div>
        </header>

        {hasAnything ? (
          <div className="space-y-section-lg">
            <ProviderGroup heading="Stream included" providers={streaming} accent="#c4835b" />
            <ProviderGroup heading="Free" providers={free} accent="#22c55e" />
            <ProviderGroup heading="With ads" providers={ads} accent="#d4a056" />
            <ProviderGroup heading="Rent" providers={rent} accent="#9a8a7a" />
            <ProviderGroup heading="Buy" providers={buy} accent="#9a8a7a" />

            {justWatchLink && (
              <p className="text-caption text-text-muted mt-6">
                Provider data via{' '}
                <a href={justWatchLink} target="_blank" rel="noopener noreferrer" className="text-accent-peach hover:text-accent-gold transition-colors">
                  JustWatch
                </a>
                . Coverage shown is for US. International availability varies.
              </p>
            )}
          </div>
        ) : (
          <EmptyState
            title={`Not currently streaming in the US`}
            description={`We don't have any active US streaming, rental, or purchase data for ${sourceTitle}. This usually means it's between release windows.`}
            action={{ label: `View ${sourceTitle} on Bynge`, to: detailHref }}
          />
        )}
      </Container>
    </motion.div>
  );
}
