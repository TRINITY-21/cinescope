import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import RatingBadge from './RatingBadge';
import ByngeScoreBadge from './ByngeScoreBadge';

/**
 * Shared 2:3 poster tile used across SEO landing pages (Trending, Like,
 * Hidden Gems, Mood, Streaming, Coming Soon…). Keeps every grid consistent
 * with the look-and-feel of MovieCard but accepts a generic shape so a single
 * component handles movies, TMDB shows, and TVMaze shows.
 *
 * Required: `to`, `title`, `posterUrl`.
 * Optional: `subtitle` (year/date/extra), `rating` (0-10 TMDB), `kindLabel`
 * ('Movie' | 'TV'), `byngeScore`, `rank` (1-3 highlight).
 */
const PosterTile = memo(function PosterTile({
  to,
  title,
  posterUrl,
  subtitle,
  rating,
  kindLabel,
  byngeScore,
  rank,
}) {
  return (
    <Link to={to} className="group block">
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative aspect-[2/3] rounded-xl overflow-hidden bg-bg-elevated border border-white/[0.04] group-hover:border-accent-peach/30 shadow-elevation-2 group-hover:shadow-elevation-3 transition-all"
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
            No poster
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
        <div className="absolute inset-0 bg-accent-peach/0 group-hover:bg-accent-peach/10 transition-colors duration-300" />

        {/* Top-left: optional rank chip OR kind badge */}
        {rank != null && rank <= 3 ? (
          <div className="absolute top-2.5 left-2.5">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-accent-gold text-black tabular-nums shadow-md">
              #{rank}
            </span>
          </div>
        ) : kindLabel ? (
          <div className="absolute top-2.5 left-2.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/55 backdrop-blur text-white uppercase tracking-wider">
              {kindLabel}
            </span>
          </div>
        ) : null}

        {/* Top-right: prefer Bynge score (our IP) over TMDB rating when both present */}
        {byngeScore != null ? (
          <div className="absolute top-2.5 right-2.5">
            <ByngeScoreBadge score={byngeScore} size="sm" />
          </div>
        ) : rating > 0 ? (
          <div className="absolute top-2.5 right-2.5">
            <RatingBadge rating={rating} size="sm" />
          </div>
        ) : null}

        {/* Bottom title + subtitle, sitting on the gradient */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-white text-sm leading-tight break-words group-hover:text-accent-peach transition-colors">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-text-secondary mt-1 break-words">{subtitle}</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
});

export default PosterTile;
