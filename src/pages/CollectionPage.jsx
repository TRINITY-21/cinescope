import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMovieCollection, hasTmdbKey } from '../api/tmdb';
import MovieCard from '../components/movie/MovieCard';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import Loader from '../components/ui/Loader';
import DetailPageLayout from '../layouts/DetailPageLayout';
import PageLayout from '../layouts/PageLayout';
import { getTmdbBackdropUrl } from '../utils/imageUrl';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';

function StatBlock({ value, label, suffix }) {
  return (
    <div>
      <p className="text-display-sm sm:text-display font-extrabold font-mono tabular-nums text-white leading-none">
        {value}
        {suffix && <span className="text-h3 font-normal text-text-muted ml-1">{suffix}</span>}
      </p>
      <p className="text-meta uppercase tracking-widest text-text-muted mt-2 font-semibold">
        {label}
      </p>
    </div>
  );
}

export default function CollectionPage() {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!hasTmdbKey()) { setLoading(false); return; }
      try {
        const data = await getMovieCollection(id);
        if (data) setCollection(data);
      } catch (err) {
        console.error('Failed to load collection:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const collectionHead = useMemo(() => {
    if (!collection) return {};
    return {
      title: `${collection.name} — Bynge`,
      description: collection.overview?.slice(0, 220),
      canonical: `${SITE_ORIGIN}/collection/${id}`,
      ogType: 'website',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
            { '@type': 'ListItem', position: 2, name: 'Movies', item: `${SITE_ORIGIN}/movies` },
            { '@type': 'ListItem', position: 3, name: collection.name, item: `${SITE_ORIGIN}/collection/${id}` },
          ],
        },
      ],
    };
  }, [collection, id]);
  usePageHead(collectionHead);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (loading) return <Loader fullScreen />;

  if (!collection) {
    return (
      <PageLayout>
        <Container>
        <EmptyState
          icon={
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          }
          title="Collection not found"
          description="The movie collection you're looking for doesn't exist or has been removed."
          action={{ label: 'Browse movies', to: '/movies' }}
          secondaryAction={{ label: 'Go home', to: '/' }}
        />
        </Container>
      </PageLayout>
    );
  }

  const parts = [...(collection.parts || [])].sort((a, b) => {
    const dateA = a.release_date || '9999';
    const dateB = b.release_date || '9999';
    return dateA.localeCompare(dateB);
  });

  const backdropUrl = getTmdbBackdropUrl(collection.backdrop_path, 'w1280');
  const totalRevenue = parts.reduce((sum, m) => sum + (m.revenue || 0), 0);
  const ratedParts = parts.filter((m) => m.vote_average);
  const avgRating = ratedParts.length > 0
    ? ratedParts.reduce((sum, m) => sum + m.vote_average, 0) / ratedParts.length
    : 0;
  const years = parts.map((m) => m.release_date?.slice(0, 4)).filter(Boolean);
  const yearRange = years.length > 0
    ? (years[0] === years[years.length - 1] ? years[0] : `${years[0]}–${years[years.length - 1]}`)
    : '';
  const span = years.length > 1 ? parseInt(years[years.length - 1]) - parseInt(years[0]) : 0;

  const hero = (
      <div className="relative h-[55vh] sm:h-[65vh] min-h-[420px]">
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/85 to-bg-primary/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/70 via-transparent to-transparent" />

        <div className="absolute inset-0 flex items-end">
          <Container className="pb-12 sm:pb-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="max-w-4xl"
            >
              <p className="text-meta uppercase text-accent-peach font-semibold tracking-widest">
                Collection
                {yearRange && (
                  <>
                    <span className="text-text-muted mx-2">·</span>
                    <span className="font-mono tabular-nums">{yearRange}</span>
                  </>
                )}
              </p>
              <h1 className="mt-3 text-display-sm sm:text-display lg:text-display-lg font-extrabold tracking-tight text-white leading-[1.05]">
                {collection.name}
              </h1>
              {collection.overview && (
                <p className="mt-5 text-body sm:text-h3 text-text-secondary leading-relaxed max-w-2xl font-light">
                  {collection.overview}
                </p>
              )}
            </motion.div>
          </Container>
        </div>
      </div>
  );

  return (
    <DetailPageLayout hero={hero}>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-y border-white/[0.06] py-section my-section grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8"
        >
          <StatBlock value={parts.length} label="Films" />
          {avgRating > 0 && (
            <StatBlock
              value={avgRating.toFixed(1)}
              suffix="/10"
              label="Avg rating"
            />
          )}
          {span > 0 && (
            <StatBlock value={span} suffix="yr" label="Span" />
          )}
          {totalRevenue > 0 && (
            <StatBlock
              value={`$${(totalRevenue / 1_000_000_000).toFixed(1)}B`}
              label="Box office"
            />
          )}
        </motion.div>

        {/* Films list */}
        <section className="mb-section-lg">
          <div className="flex items-baseline gap-3 mb-section">
            <h2 className="text-h2 font-extrabold tracking-tight text-white">
              The films
            </h2>
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-caption text-text-muted font-mono tabular-nums">
              {String(parts.length).padStart(2, '0')}
            </span>
          </div>

          <div className="card-grid">
            {parts.map((movie, i) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <MovieCard movie={movie} />
              </motion.div>
            ))}
          </div>
        </section>
      </Container>
    </DetailPageLayout>
  );
}
