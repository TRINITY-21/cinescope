import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTmdbPosterUrl } from '../../utils/imageUrl';
import RatingBadge from '../ui/RatingBadge';

const MovieCard = memo(function MovieCard({ movie, className = '' }) {
  if (!movie) return null;

  const posterUrl = getTmdbPosterUrl(movie.poster_path);
  const year = movie.release_date?.slice(0, 4);

  return (
    <Link to={`/movie/${movie.id}`} className={`block flex-shrink-0 snap-start ${className}`}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative rounded-xl overflow-hidden bg-bg-elevated group cursor-pointer border border-white/[0.04] hover:border-white/[0.08] shadow-elevation-2 hover:shadow-elevation-3"
      >
        <div className="aspect-[2/3] relative">
          <img src={posterUrl} alt={movie.title} loading="lazy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-accent-violet/0 group-hover:bg-accent-violet/10 transition-colors duration-300" />

          {movie.vote_average > 0 && (
            <div className="absolute top-3 right-3">
              <RatingBadge rating={movie.vote_average} size="sm" />
            </div>
          )}

          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-accent-gold/90 text-white backdrop-blur-sm">
              Movie
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:line-clamp-none transition-all">
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              {year && <span className="text-xs text-text-secondary">{year}</span>}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
});

export default MovieCard;
