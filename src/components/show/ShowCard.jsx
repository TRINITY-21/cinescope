import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getMediumImage } from '../../utils/imageUrl';
import { formatYear } from '../../utils/formatters';
import RatingBadge from '../ui/RatingBadge';
import { useApp } from '../../context/AppContext';

const ShowCard = memo(function ShowCard({ show, className = '' }) {
  if (!show) return null;

  const { watchedEpisodes } = useApp();
  const watchedCount = (watchedEpisodes[show.id] || []).length;

  return (
    <Link to={`/show/${show.id}`} className={`block flex-shrink-0 snap-start ${className}`}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative rounded-xl overflow-hidden bg-bg-elevated group cursor-pointer border border-white/[0.04] hover:border-white/[0.08] shadow-elevation-2 hover:shadow-elevation-3"
      >
        <div className="aspect-[2/3] relative">
          <img
            src={getMediumImage(show.image)}
            alt={show.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

          <div className="absolute inset-0 bg-accent-violet/0 group-hover:bg-accent-violet/10 transition-colors duration-300" />

          {show.rating?.average && (
            <div className="absolute top-3 right-3">
              <RatingBadge rating={show.rating.average} size="sm" />
            </div>
          )}

          {watchedCount > 0 && (
            <div className="absolute top-3 left-3">
              <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-accent-violet/90 text-white backdrop-blur-sm shadow-[0_0_8px_rgba(196,131,91,0.4)]">
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {watchedCount} ep{watchedCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:line-clamp-none transition-all">
              {show.name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-text-secondary">
                {formatYear(show.premiered)}
              </span>
              {show.network && (
                <>
                  <span className="text-text-muted text-xs">·</span>
                  <span className="text-xs text-text-secondary">{show.network.name}</span>
                </>
              )}
              {!show.network && show.webChannel && (
                <>
                  <span className="text-text-muted text-xs">·</span>
                  <span className="text-xs text-text-secondary">{show.webChannel.name}</span>
                </>
              )}
            </div>

            <div className="overflow-hidden max-h-0 group-hover:max-h-20 transition-all duration-300 mt-0 group-hover:mt-2">
              <div className="flex flex-wrap gap-1">
                {show.genres?.slice(0, 2).map((genre) => (
                  <span key={genre} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-text-secondary">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
});

export default ShowCard;
