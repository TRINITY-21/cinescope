import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTmdbBackdropUrl, getTmdbPosterUrl } from '../../utils/imageUrl';

function SimilarCard({ movie, index }) {
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
                <path d="M7 4v16M17 4v16M3 8h4M17 8h4M3 12h18M3 16h4M17 16h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
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
            <span className="flex-shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-md bg-accent-violet/15 text-accent-violet">{vote}%</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function SimilarMovies({ movies }) {
  if (!movies || movies.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-accent-violet flex-shrink-0">
          <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <h3 className="text-base sm:text-lg font-semibold text-white">Similar Movies</h3>
        <span className="text-[10px] sm:text-xs text-text-muted">{movies.length} movies</span>
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto hide-scrollbar pb-2">
        {movies.map((movie, i) => (
          <SimilarCard key={movie.id} movie={movie} index={i} />
        ))}
      </div>
    </div>
  );
}
