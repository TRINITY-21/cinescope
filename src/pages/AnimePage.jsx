import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { discoverAnime, hasTmdbKey } from '../api/tmdb';
import MovieCard from '../components/movie/MovieCard';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import Loader from '../components/ui/Loader';
import PageHero from '../components/ui/PageHero';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import { getTmdbPosterUrl } from '../utils/imageUrl';
import PageLayout from '../layouts/PageLayout';
import { useStaggerOnce } from '../utils/motion';
import { seoBreadcrumb } from '../utils/seoSchema';

const TABS = [
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV Series' },
];

/**
 * A lightweight card for anime TV results. We don't have a /tmdb-tv/:id route
 * (the in-app /show/:id is TVMaze-keyed and TMDB→TVMaze bridging would need a
 * per-card lookup), so the card is information-only and surfaces a clear CTA
 * to /browse/Anime for the in-app TVMaze catalog.
 */
function AnimeShowCard({ show }) {
  const posterUrl = getTmdbPosterUrl(show.poster_path);
  const year = show.first_air_date?.slice(0, 4);
  return (
    <a
      href={`https://www.themoviedb.org/tv/${show.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block flex-shrink-0 snap-start"
    >
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative rounded-xl overflow-hidden bg-bg-elevated group cursor-pointer border border-white/[0.04] hover:border-white/[0.08] shadow-elevation-2 hover:shadow-elevation-3"
      >
        <div className="aspect-[2/3] relative">
          <img
            src={posterUrl}
            alt={`${show.name} poster`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-accent-peach/90 text-white backdrop-blur-sm">
              Anime TV
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-semibold text-white text-sm leading-tight line-clamp-4">
              {show.name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              {year && <span className="text-xs text-text-secondary">{year}</span>}
            </div>
          </div>
        </div>
      </motion.div>
    </a>
  );
}

export default function AnimePage() {
  const stagger = useStaggerOnce();
  const [mediaType, setMediaType] = useState('movie');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  usePageHead({
    title: 'Anime Movies & Series — Bynge',
    description:
      'The most popular anime movies and TV series — Studio Ghibli, shōnen, slice-of-life, and beyond. Updated continuously on Bynge.',
    canonical: `${SITE_ORIGIN}/anime`,
    jsonLd: [
      seoBreadcrumb('Anime', '/anime', null, '/anime'),
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Anime on Bynge',
        url: `${SITE_ORIGIN}/anime`,
      },
    ],
  });

  useEffect(() => {
    if (!hasTmdbKey()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    discoverAnime(mediaType, 1)
      .then((data) => {
        if (!cancelled) setItems(data?.results || []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mediaType]);

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow="Anime"
        title="Anime, ranked."
        intro="The most popular Japanese animation — features, series, and the moments that shaped a generation."
      />

      <Container className="mt-8">
        <div className="flex items-center gap-1 p-1 rounded-full bg-bg-elevated/80 border border-white/10 backdrop-blur-sm w-fit mx-auto">
          {TABS.map((t) => {
            const active = mediaType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setMediaType(t.id)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  active
                    ? 'bg-white text-bg-primary'
                    : 'bg-white/5 text-text-primary/80 hover:text-white hover:bg-white/10'
                }`}
                aria-pressed={active}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </Container>

      <Container className="mt-section">
        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <EmptyState
            title="No anime found"
            description="TMDB returned no popular anime right now. Try the other tab."
          />
        ) : (
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {items.map((item) =>
              mediaType === 'tv' ? (
                <motion.div key={`tv-${item.id}`} variants={stagger.item}>
                  <AnimeShowCard show={item} />
                </motion.div>
              ) : (
                <motion.div key={`movie-${item.id}`} variants={stagger.item}>
                  <MovieCard movie={item} />
                </motion.div>
              )
            )}
          </motion.div>
        )}

        {mediaType === 'tv' && !loading && items.length > 0 && (
          <div className="mt-section text-center">
            <Link
              to="/browse/Anime"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-accent-peach/30 bg-accent-peach/5 text-accent-peach text-sm font-semibold hover:bg-accent-peach/10 transition-colors"
            >
              Browse anime TV in-app (TVMaze catalog)
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        )}
      </Container>
    </PageLayout>
  );
}
