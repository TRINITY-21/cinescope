import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Container from '../components/ui/Container';
import Loader from '../components/ui/Loader';
import MovieCard from '../components/movie/MovieCard';
import { getMovieCollection, hasTmdbKey, TMDB_IMAGE_BASE } from '../api/tmdb';
import { getTmdbBackdropUrl } from '../utils/imageUrl';
import { formatCurrency } from '../utils/formatters';

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

  useEffect(() => {
    if (collection) document.title = `${collection.name} — CineScope`;
    return () => { document.title = 'CineScope'; };
  }, [collection]);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (loading) return <Loader fullScreen />;

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass rounded-2xl p-10">
          <p className="text-text-secondary text-lg">Collection not found</p>
          <Link to="/" className="text-accent-violet hover:underline text-sm mt-3 inline-block">Go home</Link>
        </div>
      </div>
    );
  }

  const parts = [...(collection.parts || [])].sort((a, b) => {
    const dateA = a.release_date || '9999';
    const dateB = b.release_date || '9999';
    return dateA.localeCompare(dateB);
  });

  const backdropUrl = getTmdbBackdropUrl(collection.backdrop_path, 'w1280');
  const totalRevenue = parts.reduce((sum, m) => sum + (m.revenue || 0), 0);
  const avgRating = parts.length > 0
    ? parts.reduce((sum, m) => sum + (m.vote_average || 0), 0) / parts.filter((m) => m.vote_average).length
    : 0;
  const years = parts.map((m) => m.release_date?.slice(0, 4)).filter(Boolean);
  const yearRange = years.length > 0 ? `${years[0]} - ${years[years.length - 1]}` : '';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      {/* Hero */}
      <div className="relative h-[40vh] sm:h-[50vh] min-h-[280px] sm:min-h-[350px]">
        {backdropUrl && (
          <img src={backdropUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-bg-primary/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/80 to-transparent" />

        <div className="absolute inset-0 flex items-end">
          <Container className="pb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-accent-gold/20 text-accent-gold mb-3 backdrop-blur-sm">
                Collection
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">{collection.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <span className="text-sm text-text-secondary">{parts.length} movie{parts.length !== 1 ? 's' : ''}</span>
                {yearRange && <span className="text-sm text-text-secondary">{yearRange}</span>}
                {avgRating > 0 && (
                  <span className="flex items-center gap-1 text-sm text-accent-gold">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    {avgRating.toFixed(1)} avg
                  </span>
                )}
                {totalRevenue > 0 && (
                  <span className="text-sm text-text-secondary">{formatCurrency(totalRevenue)} total box office</span>
                )}
              </div>
            </motion.div>
          </Container>
        </div>
      </div>

      {/* Overview */}
      <Container>
        {collection.overview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 max-w-4xl glass-subtle rounded-xl p-6"
          >
            <p className="text-text-secondary leading-relaxed text-sm">{collection.overview}</p>
          </motion.div>
        )}

        {/* Movies grid */}
        <div className="mt-8 mb-12">
          <h2 className="text-xl font-bold text-white mb-5">All Movies</h2>
          <div className="card-grid">
            {parts.map((movie, i) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
              >
                <MovieCard movie={movie} />
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </motion.div>
  );
}
