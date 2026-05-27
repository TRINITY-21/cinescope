import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { discoverByCountry, hasTmdbKey } from '../api/tmdb';
import MovieCard from '../components/movie/MovieCard';
import Container from '../components/ui/Container';
import EmptyState from '../components/ui/EmptyState';
import Loader from '../components/ui/Loader';
import PageHero from '../components/ui/PageHero';
import { findCountry } from '../data/genresAndCountries';
import { SITE_ORIGIN, usePageHead } from '../hooks/usePageHead';
import PageLayout from '../layouts/PageLayout';
import { useStaggerOnce } from '../utils/motion';
import { seoBreadcrumb } from '../utils/seoSchema';

export default function CountryPage() {
  const { code } = useParams();
  const country = findCountry(code || '');
  const stagger = useStaggerOnce();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  usePageHead({
    title: country
      ? `Movies from ${country.name} — Bynge`
      : 'Country — Bynge',
    description: country
      ? `Discover the best ${country.name} movies. Films ranked by popularity, freshly updated.`
      : 'Browse titles by country of origin on Bynge.',
    canonical: country ? `${SITE_ORIGIN}/country/${country.code}` : `${SITE_ORIGIN}/country`,
    jsonLd: country
      ? [
          seoBreadcrumb(country.name, `/country/${country.code}`, 'Country', '/country'),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${country.name} on Bynge`,
            url: `${SITE_ORIGIN}/country/${country.code}`,
          },
        ]
      : null,
  });

  useEffect(() => {
    if (!country || !hasTmdbKey()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    discoverByCountry(country.code, 'movie', 1)
      .then((data) => {
        if (!cancelled) setMovies(data?.results || []);
      })
      .catch(() => {
        if (!cancelled) setMovies([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  if (!country) {
    return (
      <PageLayout>
        <Container className="mt-section">
          <EmptyState
            title="Country not recognized"
            description="Pick a country from the list to see titles from there."
          />
          <div className="mt-6 text-center">
            <Link to="/country" className="text-accent-peach hover:underline">
              ← Back to all countries
            </Link>
          </div>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout as={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHero
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <span className="font-mono text-[11px] tracking-widest font-bold text-accent-peach bg-accent-peach/10 border border-accent-peach/25 rounded px-2 py-0.5 uppercase">
              {country.code}
            </span>
            Country
          </span>
        }
        title={`From ${country.name}.`}
        intro={`The most popular movies produced in ${country.name}, ranked by TMDB popularity.`}
      />

      <Container className="mt-section">
        {loading ? (
          <Loader />
        ) : movies.length === 0 ? (
          <EmptyState
            title="No movies found"
            description={`TMDB returned no popular films for ${country.name} right now.`}
          />
        ) : (
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {movies.map((movie) => (
              <motion.div key={movie.id} variants={stagger.item}>
                <MovieCard movie={movie} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-section text-center">
          <Link
            to="/country"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
          >
            ← Back to all countries
          </Link>
        </div>
      </Container>
    </PageLayout>
  );
}
