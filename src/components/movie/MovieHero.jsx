import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { formatRuntime } from '../../utils/formatters';
import { getTmdbBackdropUrl, getTmdbPosterUrl } from '../../utils/imageUrl';
import { shareContent } from '../../utils/share';
import AddToCollectionDropdown from '../ui/AddToCollectionDropdown';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import RatingBadge from '../ui/RatingBadge';
import StarRating from '../ui/StarRating';

export default function MovieHero({ movie, certification, onPlayTrailer, onWatchNow }) {
  const { addMovieToWatchlist, removeMovieFromWatchlist, isMovieInWatchlist } = useApp();
  const inWatchlist = isMovieInWatchlist(movie.id);
  const backdropUrl = getTmdbBackdropUrl(movie.backdrop_path);
  const posterUrl = movie.poster_path ? getTmdbPosterUrl(movie.poster_path, 'w500') : null;
  const year = movie.release_date?.slice(0, 4);

  const [shareTooltip, setShareTooltip] = useState(null);

  async function handleShare() {
    const url = `${window.location.origin}/movie/${movie.id}`;
    const rating = movie.vote_average ? `${movie.vote_average.toFixed(1)}/10` : '';
    const text = movie.tagline || movie.overview?.slice(0, 140) || '';
    const result = await shareContent({
      title: `${movie.title}${rating ? ` (${rating})` : ''}`,
      text,
      url,
    });
    if (result === 'copied') {
      setShareTooltip('Link copied!');
      setTimeout(() => setShareTooltip(null), 2000);
    }
  }

  return (
    <div className="relative min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh]">
      <div className="absolute inset-0">
        {backdropUrl && <img src={backdropUrl} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 hero-gradient-overlay" />
        <div className="absolute inset-0 hero-gradient-left" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12 flex items-end min-h-[60vh] md:min-h-[70vh] lg:min-h-[75vh]">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start w-full">
          {posterUrl && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden md:block flex-shrink-0"
            >
              <img src={posterUrl} alt={movie.title} className="w-56 lg:w-64 rounded-xl shadow-2xl border border-white/10" />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight text-shadow-hero">
              {movie.title}
            </h1>

            {movie.tagline && (
              <p className="text-text-secondary text-lg italic mt-2">&ldquo;{movie.tagline}&rdquo;</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-4">
              {year && <span className="text-text-secondary text-sm">{year}</span>}
              {movie.runtime > 0 && (
                <>
                  <span className="text-text-muted">&middot;</span>
                  <span className="text-text-secondary text-sm">{formatRuntime(movie.runtime)}</span>
                </>
              )}
              {certification && (
                <>
                  <span className="text-text-muted">&middot;</span>
                  <span className="text-xs px-2 py-0.5 rounded border border-white/20 text-text-secondary font-mono">{certification}</span>
                </>
              )}
              <span className="text-text-muted">&middot;</span>
              <span className="text-text-secondary text-sm px-2 py-0.5 rounded-full bg-white/10">Movie</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              {movie.vote_average > 0 && (
                <div className="flex items-center gap-3">
                  <RatingBadge rating={movie.vote_average} size="lg" />
                  <StarRating rating={movie.vote_average} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {movie.genres?.map((g) => <Badge key={g.id}>{g.name}</Badge>)}
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6">
              <Button variant="primary" size="lg" onClick={onWatchNow}>
                <span className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  Watch Now
                </span>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  if (inWatchlist) removeMovieFromWatchlist(movie.id);
                  else addMovieToWatchlist(movie);
                }}
              >
                {inWatchlist ? '✓ In Watchlist' : '+ Watchlist'}
              </Button>
              <AddToCollectionDropdown
                item={{
                  id: movie.id,
                  name: movie.title,
                  image: posterUrl,
                  genres: movie.genres?.map((g) => g.name) ?? [],
                  type: 'movie',
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
              <div className="relative">
                <Button variant="ghost" onClick={handleShare}>
                  <span className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                      <polyline points="16,6 12,2 8,6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    Share
                  </span>
                </Button>
                <AnimatePresence>
                  {shareTooltip && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-bg-elevated text-text-primary px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg border border-white/10"
                    >
                      {shareTooltip}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              {movie.homepage && (
                <a href={movie.homepage} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost">Visit Official Site &rarr;</Button>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
