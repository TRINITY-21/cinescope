import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTmdbPosterUrl, getTmdbBackdropUrl } from '../../utils/imageUrl';

export default function MovieCollection({ collection, currentMovieId }) {
  if (!collection?.id) return null;

  const backdropUrl = getTmdbBackdropUrl(collection.backdrop_path, 'w1280');
  const parts = collection.parts
    ? [...collection.parts].sort((a, b) => {
        const dateA = a.release_date || '9999';
        const dateB = b.release_date || '9999';
        return dateA.localeCompare(dateB);
      })
    : [];

  const currentIndex = parts.findIndex((p) => p.id === Number(currentMovieId));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden"
    >
      {/* Backdrop */}
      {backdropUrl && (
        <div className="absolute inset-0">
          <img src={backdropUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/95 via-bg-primary/85 to-bg-primary/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 to-transparent" />
        </div>
      )}
      {!backdropUrl && <div className="absolute inset-0 glass" />}

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-gold">
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-white">Part of {collection.name}</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {parts.length} movie{parts.length !== 1 ? 's' : ''} in this collection
              {currentIndex >= 0 && ` · You're viewing #${currentIndex + 1}`}
            </p>
          </div>
        </div>

        {/* Scrollable movie list */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
          {parts.map((movie, i) => {
            const isCurrent = movie.id === Number(currentMovieId);
            const poster = getTmdbPosterUrl(movie.poster_path);
            const year = movie.release_date?.slice(0, 4);

            return (
              <Link
                key={movie.id}
                to={isCurrent ? '#' : `/movie/${movie.id}`}
                onClick={isCurrent ? (e) => e.preventDefault() : undefined}
                className={`flex-shrink-0 w-28 group ${isCurrent ? 'cursor-default' : ''}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  className={`relative aspect-[2/3] rounded-xl overflow-hidden ring-2 transition-all ${
                    isCurrent
                      ? 'ring-accent-gold shadow-[0_0_20px_rgba(245,197,24,0.2)]'
                      : 'ring-white/[0.06] group-hover:ring-accent-violet/40'
                  }`}
                >
                  <img src={poster} alt={movie.title} loading="lazy" className="w-full h-full object-cover" />
                  {!isCurrent && (
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors" />
                  )}
                  {isCurrent && (
                    <div className="absolute top-1.5 right-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent-gold text-black">
                        NOW
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                    <span className="text-[10px] font-mono text-text-muted">#{i + 1}</span>
                  </div>
                </motion.div>
                <p className={`text-xs mt-1.5 truncate ${isCurrent ? 'text-accent-gold font-semibold' : 'text-text-secondary group-hover:text-white transition-colors'}`}>
                  {movie.title}
                </p>
                {year && <p className="text-[10px] text-text-muted">{year}</p>}
              </Link>
            );
          })}
        </div>

        {/* View full collection link */}
        <Link
          to={`/collection/${collection.id}`}
          className="inline-flex items-center gap-2 mt-4 text-sm text-accent-gold hover:text-accent-gold/80 transition-colors font-medium"
        >
          View full collection
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
        </Link>
      </div>
    </motion.div>
  );
}
