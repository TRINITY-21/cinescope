import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTmdbBackdropUrl, getTmdbPosterUrl } from '../../utils/imageUrl';

function MovieRecCard({ movie, index }) {
  const backdrop = getTmdbBackdropUrl(movie.backdrop_path, 'w780');
  const poster = movie.poster_path ? getTmdbPosterUrl(movie.poster_path) : null;
  const image = backdrop || poster;
  const vote = movie.vote_average ? Math.round(movie.vote_average * 10) : null;
  const year = movie.release_date?.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.3 }}
    >
      <Link to={`/movie/${movie.id}`} className="group block flex-shrink-0 w-[160px] sm:w-[200px] md:w-[240px]">
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden ring-1 ring-white/[0.06] group-hover:ring-accent-violet/30 transition-all">
          {image ? (
            <img src={image} alt={movie.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-text-muted">
                <path d="M7 4v16M17 4v16M3 8h4M17 8h4M3 12h18M3 16h4M17 16h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="mt-2.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate group-hover:text-accent-violet transition-colors">{movie.title}</p>
            {year && <p className="text-xs text-text-muted mt-0.5">{year}</p>}
          </div>
          {vote !== null && vote > 0 && (
            <span className="flex-shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-md bg-accent-gold/15 text-accent-gold">{vote}%</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function MovieRecommendations({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-gold flex-shrink-0">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <h3 className="text-base sm:text-lg font-semibold text-white">Recommended For You</h3>
        <span className="text-[10px] sm:text-xs text-text-muted">{recommendations.length} movies</span>
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto hide-scrollbar pb-2">
        {recommendations.map((movie, i) => (
          <MovieRecCard key={movie.id} movie={movie} index={i} />
        ))}
      </div>
    </div>
  );
}
