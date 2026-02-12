import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { formatRuntime, formatYear } from '../../utils/formatters';
import { getBackdropImage, getOriginalImage } from '../../utils/imageUrl';
import AddToCollectionDropdown from '../ui/AddToCollectionDropdown';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import RatingBadge from '../ui/RatingBadge';
import StarRating from '../ui/StarRating';

export default function ShowHero({ show, images, onPlayTrailer, totalEpisodes = 0, onWatchNow }) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, getShowProgress } = useApp();
  const inWatchlist = isInWatchlist(show.id);
  const progress = totalEpisodes > 0 ? getShowProgress(show.id, totalEpisodes) : null;

  const backdropUrl = getBackdropImage(images) || getOriginalImage(show.image);

  const statusColors = {
    Running: 'bg-green-500/20 text-green-400 border-green-500/30',
    Ended: 'bg-red-500/20 text-red-400 border-red-500/30',
    'To Be Determined': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'In Development': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <div className="relative min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh]">
      <div className="absolute inset-0">
        <img src={backdropUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 hero-gradient-overlay" />
        <div className="absolute inset-0 hero-gradient-left" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12 flex items-end min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh]">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden md:block flex-shrink-0"
          >
            <img
              src={getOriginalImage(show.image)}
              alt={show.name}
              className="w-56 lg:w-64 rounded-xl shadow-2xl border border-white/10"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight text-shadow-hero">
              {show.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="text-text-secondary text-sm">
                {formatYear(show.premiered)}
                {show.ended ? ` – ${formatYear(show.ended)}` : show.status === 'Running' ? ' – Present' : ''}
              </span>
              {show.runtime && (
                <>
                  <span className="text-text-muted">·</span>
                  <span className="text-text-secondary text-sm">{formatRuntime(show.runtime)}</span>
                </>
              )}
              {(show.network || show.webChannel) && (
                <>
                  <span className="text-text-muted">·</span>
                  <span className="text-text-secondary text-sm px-2 py-0.5 rounded-full bg-white/10">
                    {show.network?.name || show.webChannel?.name}
                  </span>
                </>
              )}
              {show.type && (
                <>
                  <span className="text-text-muted">·</span>
                  <span className="text-text-secondary text-sm">{show.type}</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              {show.rating?.average && (
                <div className="flex items-center gap-3">
                  <RatingBadge rating={show.rating.average} size="lg" />
                  <StarRating rating={show.rating.average} />
                </div>
              )}
              {show.status && (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColors[show.status] || 'bg-white/10 text-text-secondary border-white/10'}`}>
                  {show.status}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {show.genres?.map((g) => <Badge key={g}>{g}</Badge>)}
            </div>

            {progress && progress.watched > 0 && (
              <div className="mt-5 max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-text-secondary">
                    Your progress
                  </span>
                  <span className="text-xs font-medium text-white">
                    {progress.watched}/{progress.total} episodes ({progress.percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${progress.percentage === 100 ? 'bg-green-500' : 'bg-accent-violet'}`}
                    style={{ boxShadow: progress.percentage === 100 ? '0 0 10px rgba(34,197,94,0.4)' : '0 0 10px rgba(196,131,91,0.3)' }}
                  />
                </div>
                {progress.percentage === 100 && (
                  <p className="text-xs text-green-400 mt-1.5 font-medium">All caught up!</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6">
              {onWatchNow && (
                <Button variant="primary" onClick={onWatchNow}>
                  <span className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Watch Now
                  </span>
                </Button>
              )}
              <Button
                variant={inWatchlist ? 'secondary' : (onWatchNow ? 'secondary' : 'primary')}
                onClick={() => inWatchlist ? removeFromWatchlist(show.id) : addToWatchlist(show)}
              >
                {inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
              </Button>
              <AddToCollectionDropdown
                item={{
                  id: show.id,
                  name: show.name,
                  image: show.image,
                  genres: show.genres,
                  type: 'show',
                }}
              />
              <Button variant="ghost" onClick={onPlayTrailer}>
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Watch Trailer
                </span>
              </Button>
              {show.officialSite && (
                <a href={show.officialSite} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost">Visit Official Site →</Button>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
