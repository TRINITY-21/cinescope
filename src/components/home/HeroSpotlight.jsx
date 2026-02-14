import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApiQuery } from '../../hooks/useApiQuery';
import { endpoints } from '../../api/endpoints';
import { getOriginalImage, getMediumImage } from '../../utils/imageUrl';
import { formatYear } from '../../utils/formatters';
import { stripHtml } from '../../utils/stripHtml';
import Badge from '../ui/Badge';
import RatingBadge from '../ui/RatingBadge';
import Button from '../ui/Button';
import { FEATURED_SHOW_IDS } from '../../utils/constants';
import { useApp } from '../../context/AppContext';

export default function HeroSpotlight() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shows, setShows] = useState([]);

  const showId = FEATURED_SHOW_IDS[currentIndex % FEATURED_SHOW_IDS.length];

  const { data: show } = useApiQuery(endpoints.show(showId, ['cast']));
  const { data: images } = useApiQuery(endpoints.showImages(showId));
  const { addToWatchlist, isInWatchlist } = useApp();

  useEffect(() => {
    if (show && !shows.find((s) => s.id === show.id)) {
      setShows((prev) => [...prev, { ...show, _images: images }]);
    }
  }, [show, images]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % FEATURED_SHOW_IDS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const backdrop = images?.find((img) => img.type === 'background');
  const backdropUrl = backdrop?.resolutions?.original?.url || getOriginalImage(show?.image);
  const inWatchlist = show ? isInWatchlist(show.id) : false;

  if (!show) {
    return (
      <div className="h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-accent-violet animate-bounce" />
      </div>
    );
  }

  const summary = stripHtml(show.summary || '');
  const cast = show._embedded?.cast?.slice(0, 4) || [];

  return (
    <div className="relative h-[75vh] sm:h-[85vh] md:h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={show.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img
            src={backdropUrl}
            alt={show.name}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 hero-gradient-overlay" />
      <div className="absolute inset-0 hero-gradient-left" />

      <div className="absolute inset-0 flex items-end">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-16 md:pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={show.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, staggerChildren: 0.1 }}
              className="max-w-2xl"
            >
              {(show.network || show.webChannel) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md text-white/80 mb-4">
                    {show.network?.name || show.webChannel?.name}
                  </span>
                </motion.div>
              )}

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight text-shadow-hero"
              >
                {show.name}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center gap-3 mt-4"
              >
                {show.rating?.average && (
                  <>
                    <span className="sm:hidden"><RatingBadge rating={show.rating.average} size="sm" /></span>
                    <span className="hidden sm:inline-flex"><RatingBadge rating={show.rating.average} size="md" /></span>
                  </>
                )}
                <span className="text-text-secondary text-sm">
                  {formatYear(show.premiered)}
                  {show.ended ? ` - ${formatYear(show.ended)}` : ''}
                </span>
                {show.genres?.map((g) => <Badge key={g}>{g}</Badge>)}
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm sm:text-base md:text-lg text-text-secondary mt-3 sm:mt-4 line-clamp-2 sm:line-clamp-3 leading-relaxed"
              >
                {summary}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center gap-3 mt-6"
              >
                <Link to={`/show/${show.id}`}>
                  <Button variant="primary" size="lg">View Details</Button>
                </Link>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!inWatchlist) addToWatchlist(show);
                  }}
                >
                  {inWatchlist ? '✓ In Watchlist' : '+ Watchlist'}
                </Button>
              </motion.div>

              {cast.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-2 mt-6"
                >
                  <div className="flex -space-x-2">
                    {cast.map(({ person }) => (
                      <img
                        key={person.id}
                        src={getMediumImage(person.image)}
                        alt={person.name}
                        className="w-8 h-8 rounded-full border-2 border-bg-primary object-cover"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-text-secondary ml-1">
                    {cast.map(({ person }) => person.name).join(', ')}
                  </span>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-6 right-6 md:right-12 flex gap-2">
            {FEATURED_SHOW_IDS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex % FEATURED_SHOW_IDS.length ? 'bg-accent-violet w-6' : 'bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
