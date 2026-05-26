import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchApi } from '../../api/tvmaze';
import { endpoints } from '../../api/endpoints';
import {
  getTopRatedMovies,
  getPopularMovies,
  hasTmdbKey,
} from '../../api/tmdb';
import { getMediumImage, getTmdbPosterUrl } from '../../utils/imageUrl';
import { formatYear } from '../../utils/formatters';
import Modal from './Modal';
import Badge from './Badge';
import RatingBadge from './RatingBadge';
import Button from './Button';

/**
 * Surprise Me — one-click random great movie OR show.
 *
 *  - Auto-picks on open (no extra click to get the first result).
 *  - Coin-flip between movie and TV series.
 *  - Source pools weighted toward quality: top_rated + popular (TMDB) for both.
 *  - Result is unified to a card shape so the modal renders consistently.
 */

async function pickRandomMovie() {
  if (!hasTmdbKey()) return null;
  // TMDB top_rated has 100s of pages — sample from the first 10 for relevance.
  const page = 1 + Math.floor(Math.random() * 10);
  const useTopRated = Math.random() < 0.6;
  const list = useTopRated ? await getTopRatedMovies(page) : await getPopularMovies(page);
  const candidates = (list || []).filter((m) => m.vote_average >= 7 && m.poster_path);
  if (!candidates.length) return null;
  const m = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    __kind: 'movie',
    id: m.id,
    name: m.title,
    image: m.poster_path,
    rating: m.vote_average,
    year: formatYear(m.release_date),
    overview: m.overview,
    genres: [],
  };
}

async function pickRandomShow() {
  // TVMaze page 0 = most popular. Sample across the top tier for variety
  // without drifting into obscure long-tail shows.
  const randomPage = Math.floor(Math.random() * 50);
  const shows = await fetchApi(endpoints.showIndex(randomPage));
  const candidates = (shows || []).filter(
    (s) => s.image && (s.rating?.average || 0) >= 7,
  );
  if (!candidates.length) return null;
  const s = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    __kind: 'show',
    id: s.id,
    name: s.name,
    image: s.image,
    rating: s.rating?.average,
    year: formatYear(s.premiered),
    network: s.network?.name,
    status: s.status,
    genres: s.genres || [],
  };
}

export default function SurpriseMePicker({ isOpen, onClose }) {
  const [pick, setPick] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const navigate = useNavigate();

  const pickRandom = useCallback(async () => {
    setSpinning(true);
    try {
      const wantMovie = Math.random() < 0.5;
      let result = wantMovie ? await pickRandomMovie() : await pickRandomShow();
      // If chosen pool failed, try the other one rather than leaving the user empty.
      if (!result) result = wantMovie ? await pickRandomShow() : await pickRandomMovie();
      if (result) setPick(result);
    } catch {
      /* swallow — user can retry */
    }
    setSpinning(false);
  }, []);

  // Auto-pick when modal opens, but only if there isn't a stale result already.
  useEffect(() => {
    if (isOpen && !pick && !spinning) {
      pickRandom();
    }
  }, [isOpen, pick, spinning, pickRandom]);

  function handleView() {
    if (!pick) return;
    if (pick.__kind === 'movie') navigate(`/movie/${pick.id}`);
    else navigate(`/show/${pick.id}`);
    onClose();
  }

  function posterSrc() {
    if (!pick) return null;
    if (pick.__kind === 'movie') return getTmdbPosterUrl(pick.image, 'w342');
    return getMediumImage(pick.image);
  }

  const kindLabel = pick
    ? pick.__kind === 'movie'
      ? 'Movie'
      : 'TV Series'
    : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-4 sm:p-8 text-center">
        <motion.div
          animate={spinning ? { rotate: 360 } : { rotate: 0 }}
          transition={spinning ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : {}}
          className="text-4xl sm:text-5xl mb-2 sm:mb-4 inline-block"
        >
          🎲
        </motion.div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Surprise Me!</h2>
        <p className="text-xs sm:text-sm text-text-secondary mb-4 sm:mb-6">
          Can&apos;t decide? We&apos;ll pick something great.
        </p>

        <AnimatePresence mode="wait">
          {pick && !spinning && (
            <motion.div
              key={`${pick.__kind}-${pick.id}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-4 sm:mb-6"
            >
              <div className="sm:hidden bg-bg-primary/50 rounded-xl overflow-hidden">
                <div className="relative">
                  <img src={posterSrc()} alt={pick.name} className="w-full h-52 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-accent-peach/90 text-white">
                      {kindLabel}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-end justify-between gap-2">
                      <div className="text-left">
                        <h3 className="text-base font-bold text-white leading-tight">{pick.name}</h3>
                        <p className="text-[11px] text-white/70 mt-0.5">
                          {pick.year}
                          {pick.network && ` · ${pick.network}`}
                        </p>
                      </div>
                      {pick.rating && <RatingBadge rating={pick.rating} size="sm" />}
                    </div>
                  </div>
                </div>
                {pick.genres?.length > 0 && (
                  <div className="px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto">
                    {pick.genres.slice(0, 3).map((g) => (
                      <Badge key={g}>{g}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden sm:flex gap-4 text-left bg-bg-primary/50 rounded-xl p-4">
                <img
                  src={posterSrc()}
                  alt={pick.name}
                  className="w-24 h-36 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent-peach/90 text-white inline-block mb-1.5">
                    {kindLabel}
                  </span>
                  <h3 className="text-lg font-bold text-white">{pick.name}</h3>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {pick.year}
                    {pick.network && ` · ${pick.network}`}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {pick.rating && <RatingBadge rating={pick.rating} size="sm" />}
                  </div>
                  {pick.overview && (
                    <p className="text-xs text-text-secondary mt-2 line-clamp-3">{pick.overview}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          {spinning && (
            <motion.div
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4 sm:mb-6 h-40 flex items-center justify-center text-text-secondary text-sm"
            >
              Finding something great…
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2.5 sm:gap-3 justify-center">
          <Button onClick={pickRandom} variant="violet" size="lg" disabled={spinning}>
            {spinning ? 'Spinning...' : pick ? 'Spin Again' : 'Pick One'}
          </Button>
          {pick && !spinning && (
            <Button onClick={handleView} variant="primary" size="lg">
              View Details
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
