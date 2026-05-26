import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMovieDetails, hasTmdbKey } from '../../api/tmdb';
import { SITE_ORIGIN, usePageHead } from '../../hooks/usePageHead';
import PageLayout from '../../layouts/PageLayout';
import { formatYear } from '../../utils/formatters';
import { getTmdbPosterUrl } from '../../utils/imageUrl';
import Container from '../ui/Container';
import EmptyState from '../ui/EmptyState';
import PosterTile from '../ui/PosterTile';

export default function CuratedMoodDetail({ mood }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasTmdbKey()) return undefined;
    let cancelled = false;
    setLoading(true);
    Promise.all(mood.tmdbIds.map((id) => getMovieDetails(id).catch(() => null))).then((results) => {
      if (cancelled) return;
      setMovies(results.filter(Boolean));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [mood]);

  usePageHead({
    title: `${mood.name} Movies — ${mood.tagline} — Bynge`,
    description: `${mood.description} ${mood.tmdbIds.length} hand-picked ${mood.name.toLowerCase()} movies to match the mood.`,
    canonical: `${SITE_ORIGIN}/discover/mood/${mood.slug}`,
    ogImage: `${SITE_ORIGIN}/api/og?type=default`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Discover', item: `${SITE_ORIGIN}/discover` },
          {
            '@type': 'ListItem',
            position: 3,
            name: `${mood.name} movies`,
            item: `${SITE_ORIGIN}/discover/mood/${mood.slug}`,
          },
        ],
      },
    ],
  });

  return (
    <PageLayout
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-[60vh] pointer-events-none opacity-50"
        style={{
          background: `radial-gradient(ellipse at top, ${mood.accent}33 0%, ${mood.accent}0a 30%, transparent 60%)`,
        }}
      />

      <Container className="relative">
        <Link
          to="/discover#curated-movies"
          className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-white transition-colors mb-6"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All curated lists
        </Link>

        <header className="mb-section">
          <p
            className="text-meta uppercase font-semibold tracking-widest"
            style={{ color: mood.accent }}
          >
            {mood.name} · {mood.tmdbIds.length} picks
          </p>
          <h1 className="mt-2 text-h1 sm:text-display font-extrabold tracking-tight text-white leading-[0.95]">
            {mood.name}
          </h1>
          <p
            className="mt-4 text-body sm:text-h3 italic font-normal leading-relaxed max-w-3xl"
            style={{ color: mood.accent, opacity: 0.85 }}
          >
            &ldquo;{mood.tagline}&rdquo;
          </p>
          <p className="mt-3 text-body-sm text-text-secondary max-w-2xl leading-relaxed">
            {mood.description}
          </p>
          <p className="mt-4 text-body-sm">
            <Link to="/discover" className="text-accent-peach font-semibold hover:text-accent-gold transition-colors">
              Want TV instead? Use the mood picker →
            </Link>
          </p>
        </header>

        {loading ? (
          <GridSkeleton />
        ) : movies.length === 0 ? (
          <EmptyState
            title="No picks loaded yet"
            description="Check back soon — TMDB might be sleeping."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
            {movies.map((m) => (
              <PosterTile
                key={m.id}
                to={`/movie/${m.id}`}
                title={m.title}
                posterUrl={m.poster_path ? getTmdbPosterUrl(m.poster_path, 'w342') : null}
                subtitle={formatYear(m.release_date)}
                rating={m.vote_average}
                kindLabel="Movie"
              />
            ))}
          </div>
        )}
      </Container>
    </PageLayout>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-5">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-shimmer bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]"
        />
      ))}
    </div>
  );
}
